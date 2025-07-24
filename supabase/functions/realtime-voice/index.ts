import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    // Handle WebSocket upgrade requests
    const upgradeHeader = req.headers.get("upgrade")?.toLowerCase();
    if (upgradeHeader === "websocket") {
      console.log("🔄 Handling WebSocket upgrade request");
      return handleWebSocketConnection(req);
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

    // Handle health check requests
    if (req.method === 'GET' && req.url.includes('/health')) {
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

    // Handle POST requests for health check
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body && body.action === 'health') {
          console.log("💚 Health check requested via POST");
          return new Response(JSON.stringify({
            status: "healthy",
            message: "Realtime voice edge function is running",
            timestamp: new Date().toISOString(),
            hasOpenAIKey: !!apiKey
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.log("📝 POST request without valid JSON body");
      }
    }

    // Invalid request
    console.log("❌ Invalid request format");
    return new Response(JSON.stringify({
      error: "Invalid request",
      message: "Expected WebSocket upgrade or health check",
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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

// WebSocket connection handler
async function handleWebSocketConnection(req: Request) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let openAISocket: WebSocket | null = null;
  let connectionId: string | null = null;

  socket.onopen = () => {
    console.log("✅ Client WebSocket connected");
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`📨 Client -> Edge: ${data.action}`);

      if (data.action === 'connect') {
        console.log("🔗 Connecting to OpenAI Realtime API...");
        connectionId = crypto.randomUUID();
        
        const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
        openAISocket = new WebSocket(openAIUrl, [], {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openAISocket.onopen = () => {
          console.log("✅ Connected to OpenAI Realtime API");
          socket.send(JSON.stringify({
            type: 'connection.established',
            connectionId: connectionId,
            timestamp: new Date().toISOString()
          }));
        };

        openAISocket.onmessage = (event) => {
          try {
            const openAIData = JSON.parse(event.data);
            console.log(`📨 OpenAI -> Edge: ${openAIData.type}`);

            // Handle session.created to send configuration
            if (openAIData.type === 'session.created') {
              console.log("⚙️ Sending session configuration");
              const sessionConfig = {
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
              openAISocket!.send(JSON.stringify(sessionConfig));
            }

            // Send session.ready after session.updated
            if (openAIData.type === 'session.updated') {
              socket.send(JSON.stringify({
                type: 'session.ready',
                timestamp: new Date().toISOString(),
                message: 'Session configured and ready'
              }));
            }

            // Forward all OpenAI messages to client
            socket.send(JSON.stringify(openAIData));
            
          } catch (error) {
            console.error("❌ Error processing OpenAI message:", error);
          }
        };

        openAISocket.onerror = (error) => {
          console.error("❌ OpenAI WebSocket error:", error);
          socket.send(JSON.stringify({
            type: 'error',
            error: 'OpenAI connection failed'
          }));
        };

        openAISocket.onclose = () => {
          console.log("🔴 OpenAI WebSocket closed");
          socket.send(JSON.stringify({
            type: 'connection.closed',
            timestamp: new Date().toISOString()
          }));
        };
      }

      else if (data.action === 'startScenario') {
        console.log(`📤 Starting scenario: ${data.scenarioId}`);
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          // Send opening message as conversation item
          const conversationItem = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{
                type: 'input_text',
                text: data.openingMessage
              }]
            }
          };
          
          openAISocket.send(JSON.stringify(conversationItem));
          openAISocket.send(JSON.stringify({ type: 'response.create' }));
          console.log("📤 Sent scenario opening message to OpenAI");
        }
      }

      else if (data.action === 'audioChunk') {
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          // Forward audio chunk to OpenAI
          const audioEvent = {
            type: 'input_audio_buffer.append',
            audio: data.data
          };
          openAISocket.send(JSON.stringify(audioEvent));
        }
      }

      else if (data.action === 'textMessage') {
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          const conversationItem = {
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{
                type: 'input_text',
                text: data.message
              }]
            }
          };
          
          openAISocket.send(JSON.stringify(conversationItem));
          openAISocket.send(JSON.stringify({ type: 'response.create' }));
        }
      }

    } catch (error) {
      console.error("❌ Error processing client message:", error);
    }
  };

  socket.onclose = () => {
    console.log("🔴 Client WebSocket disconnected");
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("❌ Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
}