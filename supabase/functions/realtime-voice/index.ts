
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("🚀 Edge function started, method:", req.method, "URL:", req.url);
  
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      console.log("✅ Handling CORS preflight request");
      return new Response(null, { headers: corsHeaders });
    }

    // Check for OpenAI API key first
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY environment variable not found");
      return new Response(JSON.stringify({
        error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase Edge Functions secrets.",
        instructions: "Go to Supabase Dashboard → Project Settings → Edge Functions → Add secret: OPENAI_API_KEY"
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
      console.log("ℹ️ Non-WebSocket request received");
      return new Response(JSON.stringify({
        error: "This endpoint requires WebSocket connection",
        upgrade: "websocket"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("🔄 Attempting to upgrade to WebSocket...");
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;
    let sessionConfigured = false;
    let connectionTimeout: number | null = null;

    socket.onopen = async () => {
      console.log("🟢 Client WebSocket connected successfully");
      
      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        console.error("⏰ OpenAI connection timeout after 15 seconds");
        try {
          socket.send(JSON.stringify({
            type: "error",
            error: "Connection to OpenAI timed out. Please try again."
          }));
          socket.close();
        } catch (e) {
          console.error("Error sending timeout message:", e);
        }
      }, 15000);

      try {
        console.log("🔗 Creating connection to OpenAI Realtime API...");
        
        // Use the correct OpenAI Realtime API endpoint
        const wsUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        console.log("📡 Connecting to OpenAI:", wsUrl);
        
        openAISocket = new WebSocket(wsUrl, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openAISocket.onopen = () => {
          console.log("🟢 Successfully connected to OpenAI Realtime API");
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
        };

        openAISocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("📨 Received from OpenAI:", data.type);
            
            // Handle session creation and configuration
            if (data.type === "session.created" && !sessionConfigured) {
              console.log("⚙️ Session created, sending configuration...");
              sessionConfigured = true;
              
              const sessionConfig = {
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: "You are an AI roleplay partner for professional communication training. When you receive roleplay scenarios, immediately introduce the scenario and begin the roleplay without asking setup questions. Always start roleplay sessions by explaining what scenario you're practicing, what roles each person will play, and then immediately begin the scenario. Never ask 'How can I help you?' or 'What would you like to practice?' - instead, take the lead and guide the conversation. Maintain character throughout and provide realistic responses.",
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
                    silence_duration_ms: 800
                  },
                  temperature: 0.8,
                  max_response_output_tokens: 4096
                }
              };
              
              openAISocket?.send(JSON.stringify(sessionConfig));
            }
            
            // Handle session update confirmation
            if (data.type === "session.updated") {
              console.log("✅ Session configured successfully!");
              
              // Tell the client we're ready
              socket.send(JSON.stringify({
                type: "connection.established",
                message: "Connected to OpenAI Realtime API"
              }));
            }
            
            // Forward all messages from OpenAI to client
            socket.send(event.data);
          } catch (error) {
            console.error("❌ Error processing OpenAI message:", error);
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to process OpenAI response: " + error.message
            }));
          }
        };

        openAISocket.onerror = (error) => {
          console.error("❌ OpenAI WebSocket error:", error);
          socket.send(JSON.stringify({
            type: "error",
            error: "OpenAI connection error. Please check your API key and try again."
          }));
        };

        openAISocket.onclose = (event) => {
          console.log("🔴 OpenAI connection closed:", event.code, event.reason);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
          }
          socket.send(JSON.stringify({
            type: "connection.closed",
            message: "OpenAI connection closed: " + (event.reason || "Unknown reason")
          }));
          socket.close();
        };

      } catch (error) {
        console.error("❌ Error setting up OpenAI connection:", error);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        socket.send(JSON.stringify({
          type: "error",
          error: "Failed to setup OpenAI connection: " + error.message
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        console.log("📤 Forwarding message from client to OpenAI");
        
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
        } else {
          console.warn("⚠️ OpenAI socket not ready, readyState:", openAISocket?.readyState);
          socket.send(JSON.stringify({
            type: "error",
            error: "OpenAI connection not ready. Please wait or reconnect."
          }));
        }
      } catch (error) {
        console.error("❌ Error forwarding client message:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: "Failed to forward message: " + error.message
        }));
      }
    };

    socket.onclose = (event) => {
      console.log("🔴 Client disconnected:", event.code, event.reason);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error("❌ Client WebSocket error:", error);
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    console.log("✅ WebSocket setup complete, returning response");
    return response;

  } catch (error) {
    console.error("💥 Fatal error in edge function:", error);
    return new Response(JSON.stringify({
      error: "Internal server error: " + error.message,
      timestamp: new Date().toISOString(),
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
