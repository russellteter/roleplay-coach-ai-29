
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge function started, processing request...");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    console.log("Non-WebSocket request received");
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  try {
    console.log("Attempting to upgrade to WebSocket...");
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    let openAISocket: WebSocket | null = null;
    let sessionConfigured = false;

    socket.onopen = async () => {
      console.log("Client WebSocket connected successfully");
      
      try {
        // Get OpenAI API key
        const apiKey = Deno.env.get('OPENAI_API_KEY');
        if (!apiKey) {
          console.error('OPENAI_API_KEY environment variable not found');
          socket.send(JSON.stringify({
            type: "error",
            error: "OpenAI API key not configured. Please check your environment variables."
          }));
          return;
        }

        console.log("OpenAI API key found, creating connection...");
        
        // Connect to OpenAI Realtime API with updated authentication
        const wsUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
        
        console.log("Connecting to OpenAI Realtime API:", wsUrl);
        
        // Use the new authentication method with Authorization header
        openAISocket = new WebSocket(wsUrl, {
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "OpenAI-Beta": "realtime=v1"
          }
        });

        openAISocket.onopen = () => {
          console.log("Successfully connected to OpenAI Realtime API");
          // Wait for session.created before configuring
        };

        openAISocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("Received from OpenAI:", data.type);
            
            // Handle session creation - configure the session
            if (data.type === "session.created" && !sessionConfigured) {
              console.log("Session created, sending configuration...");
              sessionConfigured = true;
              
              // Send session configuration
              const sessionConfig = {
                type: "session.update",
                session: {
                  modalities: ["text", "audio"],
                  instructions: "You are an AI roleplay partner for professional communication training. When you receive roleplay scenarios, you must immediately introduce the scenario and begin the roleplay without asking setup questions. Always start roleplay sessions by explaining what scenario you're practicing, what roles each person will play, and then immediately begin the scenario. Never ask 'How can I help you?' or 'What would you like to practice?' - instead, take the lead and guide the conversation. Maintain character throughout and provide realistic responses.",
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
              console.log("Session configured successfully!");
              
              // Tell the client we're ready
              socket.send(JSON.stringify({
                type: "connection.established",
                message: "Connected to OpenAI Realtime API"
              }));
            }
            
            // Forward all messages from OpenAI to client
            socket.send(event.data);
          } catch (error) {
            console.error("Error processing OpenAI message:", error);
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to process OpenAI response: " + error.message
            }));
          }
        };

        openAISocket.onerror = (error) => {
          console.error("OpenAI WebSocket error:", error);
          socket.send(JSON.stringify({
            type: "error",
            error: "OpenAI connection error. Please try again."
          }));
        };

        openAISocket.onclose = (event) => {
          console.log("OpenAI connection closed:", event.code, event.reason);
          socket.send(JSON.stringify({
            type: "connection.closed",
            message: "OpenAI connection closed: " + (event.reason || "Unknown reason")
          }));
          socket.close();
        };

      } catch (error) {
        console.error("Error setting up OpenAI connection:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: "Failed to setup OpenAI connection: " + error.message
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        console.log("Forwarding message from client to OpenAI");
        
        if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
          openAISocket.send(event.data);
        } else {
          console.warn("OpenAI socket not ready, readyState:", openAISocket?.readyState);
          socket.send(JSON.stringify({
            type: "error",
            error: "OpenAI connection not ready. Please wait or reconnect."
          }));
        }
      } catch (error) {
        console.error("Error forwarding client message:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: "Failed to forward message: " + error.message
        }));
      }
    };

    socket.onclose = (event) => {
      console.log("Client disconnected:", event.code, event.reason);
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    socket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.close();
      }
    };

    console.log("WebSocket setup complete, returning response");
    return response;

  } catch (error) {
    console.error("Fatal error in edge function:", error);
    return new Response(JSON.stringify({
      error: "Internal server error: " + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
