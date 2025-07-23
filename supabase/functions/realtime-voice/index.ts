import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Basic event types shared with the frontend
interface SessionUpdateEvent {
  type: 'session.update';
  session: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    console.log(`🌐 ${req.method} ${req.url}`);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log("✅ Handling CORS preflight request");
      return new Response(null, { headers: corsHeaders });
    }

    // Check for OpenAI API key first
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY environment variable is not set");
      return new Response(JSON.stringify({
        error: "OpenAI API key not configured",
        message: "Please add OPENAI_API_KEY to your Supabase Edge Functions secrets",
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("✅ OpenAI API key found");

    // Handle health check requests - both GET and POST with action: 'health'
    let isHealthCheck = false;
    
    if (req.method === 'GET' && (req.url.includes('/health') || req.url.endsWith('realtime-voice'))) {
      isHealthCheck = true;
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body && body.action === 'health') {
          isHealthCheck = true;
        }
      } catch (e) {
        // Not JSON or no action field, continue with WebSocket logic
        console.log("📝 POST request without valid JSON body, checking for WebSocket upgrade");
      }
    }

    if (isHealthCheck) {
      console.log("💚 Health check requested");
      return new Response(JSON.stringify({
        status: "healthy",
        message: "Realtime voice edge function is running",
        timestamp: new Date().toISOString(),
        hasOpenAIKey: !!apiKey
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check for WebSocket upgrade
    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";
    
    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.log("❌ Not a WebSocket upgrade request");
      return new Response("Expected WebSocket connection", { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log("🔌 Upgrading to WebSocket connection");
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;
    let isConnected = false;
    let sessionConfigured = false;
    let keepAliveInterval: number | null = null;
    let connectionTimeout: number | null = null;
    let heartbeatInterval: number | null = null;

    // Prevent immediate shutdown with keep-alive mechanism
    const startKeepAlive = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
      keepAliveInterval = setInterval(() => {
        console.log("💓 Keep-alive heartbeat");
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            }));
          } catch (error) {
            console.error("❌ Keep-alive send error:", error);
          }
        }
      }, 30000); // 30 second heartbeat
    };

    const startHeartbeat = () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      heartbeatInterval = setInterval(() => {
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          try {
            openAISocket.send(JSON.stringify({ type: 'ping' }));
          } catch (error) {
            console.error("❌ Heartbeat send error:", error);
          }
        }
      }, 20000); // 20 second OpenAI heartbeat
    };

    const cleanup = () => {
      console.log("🧹 Cleaning up connections");
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        keepAliveInterval = null;
      }
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
      openAISocket = null;
      isConnected = false;
      sessionConfigured = false;
    };

    socket.onopen = async () => {
      try {
        console.log("🟢 Client WebSocket connection opened");
        startKeepAlive();
        
        // Add connection timeout to prevent hanging
        connectionTimeout = setTimeout(() => {
          console.error("⏰ Connection timeout - closing after 60 seconds");
          cleanup();
          if (socket.readyState === WebSocket.OPEN) {
            socket.close(1000, "Connection timeout");
          }
        }, 60000);
        
        // Connect to OpenAI Realtime API
        const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
        console.log("🔗 Connecting to OpenAI Realtime API...");
        
        openAISocket = new WebSocket(openAIUrl, [], {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openAISocket.onopen = () => {
          console.log("✅ Connected to OpenAI Realtime API");
          isConnected = true;
          startHeartbeat();
          
          // Send connection established event to client
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'connection.established',
              timestamp: new Date().toISOString()
            }));
          }
        };

        openAISocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log(`📨 OpenAI -> Edge: ${data.type}`);

            // Handle session.created to send our optimized configuration
            if (data.type === 'session.created') {
              console.log("⚙️ Received session.created, sending session configuration");
              
              const sessionConfig: SessionUpdateEvent = {
                type: 'session.update',
                session: {
                  modalities: ["text", "audio"],
                  instructions: `You are Sharpen, an advanced AI roleplay coach that helps people practice important conversations through voice interaction.

CRITICAL BEHAVIOR RULES:
1. When a roleplay scenario starts, YOU must speak first immediately after receiving the scenario setup
2. Be proactive, engaging, and speak naturally like a real person would in that role
3. Always maintain your assigned character throughout the scenario
4. Provide natural, realistic responses that help the user practice effectively
5. If the user seems stuck, gently guide them forward in the conversation
6. Speak clearly and at a natural pace - you are having a real conversation

RESPONSE STYLE:
- Speak naturally and conversationally
- Use appropriate tone for the scenario context
- Be authentic to your character role
- Keep responses focused and realistic
- Help create an immersive practice experience

Remember: You are not just an AI assistant - you are playing a specific role to help the user practice. Stay in character and make the conversation feel real.`,
                  voice: "alloy",
                  input_audio_format: "pcm16",
                  output_audio_format: "pcm16",
                  input_audio_transcription: {
                    model: "whisper-1"
                  },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 1200
                  },
                  temperature: 0.8,
                  max_response_output_tokens: "inf"
                }
              };

              console.log("📤 Sending session configuration to OpenAI");
              openAISocket.send(JSON.stringify(sessionConfig));
            }

            // Handle session.updated response from OpenAI - CRITICAL FIX
            if (data.type === 'session.updated') {
              console.log("🎯 Session updated by OpenAI - marking as configured");
              sessionConfigured = true;
              
              // Send explicit session ready event to client
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                  type: 'session.ready',
                  timestamp: new Date().toISOString(),
                  message: 'Session is configured and ready for scenario start'
                }));
                console.log("📤 Sent session.ready to client");
              }
            }

            // Forward ALL events to client with enhanced logging
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
              console.log(`📤 Forwarded to client: ${data.type}`);
            } else {
              console.warn(`⚠️ Cannot forward ${data.type} - client socket not open`);
            }

            // Handle pong responses
            if (data.type === 'pong') {
              console.log("🏓 Received pong from OpenAI");
            }
            
          } catch (error) {
            console.error("❌ Error processing OpenAI message:", error);
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ 
                type: 'error', 
                error: 'Invalid JSON from OpenAI',
                timestamp: new Date().toISOString()
              }));
            }
          }
        };

        openAISocket.onerror = (error) => {
          console.error("❌ OpenAI WebSocket error:", error);
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'error',
              error: 'OpenAI connection failed',
              timestamp: new Date().toISOString()
            }));
          }
        };

        openAISocket.onclose = (event) => {
          console.log(`🔴 OpenAI WebSocket closed: ${event.code} ${event.reason}`);
          isConnected = false;
          sessionConfigured = false;
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
              type: 'connection.closed',
              code: event.code,
              reason: event.reason,
              timestamp: new Date().toISOString()
            }));
          }
        };

      } catch (error) {
        console.error("❌ Error in socket.onopen:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: `Connection setup failed: ${error.message}`,
            timestamp: new Date().toISOString()
          }));
        }
      }
    };

    socket.onmessage = (event) => {
      try {
        if (!isConnected || !openAISocket || openAISocket.readyState !== WebSocket.OPEN) {
          console.warn("⚠️ Received message but OpenAI not connected");
          return;
        }

        const data = JSON.parse(event.data);
        console.log(`📨 Client -> OpenAI: ${data.type}`);

        // Handle heartbeat from client
        if (data.type === 'heartbeat') {
          console.log("💓 Received heartbeat from client");
          return;
        }

        // Forward client messages to OpenAI
        openAISocket.send(event.data);

      } catch (error) {
        console.error("❌ Error processing client message:", error);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format',
            timestamp: new Date().toISOString()
          }));
        }
      }
    };

    socket.onerror = (error) => {
      console.error("❌ Client WebSocket error:", error);
      cleanup();
    };

    socket.onclose = (event) => {
      console.log(`🔴 Client WebSocket closed: ${event.code} ${event.reason}`);
      cleanup();
    };

    return response;

  } catch (error) {
    console.error("❌ Error in serve function:", error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
