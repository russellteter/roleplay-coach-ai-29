import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  let openAISocket: WebSocket | null = null;
  let sessionInitialized = false;

  socket.onopen = async () => {
    console.log("Client connected to realtime chat");
    
    try {
      // Connect to OpenAI Realtime API
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        console.error('OpenAI API key not found in environment');
        socket.send(JSON.stringify({
          type: "error",
          error: "OpenAI API key not configured"
        }));
        return;
      }

      console.log("Connecting to OpenAI with API key:", apiKey.substring(0, 7) + "...");
      
      // Use the correct OpenAI Realtime API endpoint
      const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      console.log("Connecting to OpenAI at:", openAIUrl);
      
      openAISocket = new WebSocket(openAIUrl, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "OpenAI-Beta": "realtime=v1"
        }
      });

      openAISocket.onopen = () => {
        console.log("Successfully connected to OpenAI Realtime API");
        socket.send(JSON.stringify({
          type: "connection.established",
          message: "Connected to OpenAI"
        }));
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received from OpenAI:", data.type);
          
          // Configure session after receiving session.created
          if (data.type === "session.created" && !sessionInitialized) {
            console.log("Session created, sending configuration...");
            sessionInitialized = true;
            
            const sessionConfig = {
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                instructions: "You are EchoCoach, an AI voice coaching assistant. Help users practice conversations, provide feedback on communication skills, and coach them through difficult scenarios. Be supportive, constructive, and professional. Keep responses concise but helpful.",
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
                  silence_duration_ms: 1000
                },
                temperature: 0.8,
                max_response_output_tokens: 4096
              }
            };
            
            console.log("Sending session config:", sessionConfig);
            openAISocket?.send(JSON.stringify(sessionConfig));
          }
          
          // Forward all messages from OpenAI to client
          socket.send(event.data);
        } catch (error) {
          console.error("Error processing OpenAI message:", error);
        }
      };

      openAISocket.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        socket.send(JSON.stringify({
          type: "error",
          error: "Connection to OpenAI failed: " + error.toString()
        }));
      };

      openAISocket.onclose = (event) => {
        console.log("OpenAI connection closed:", event.code, event.reason);
        socket.send(JSON.stringify({
          type: "connection.closed",
          message: "OpenAI connection closed"
        }));
        socket.close();
      };

    } catch (error) {
      console.error("Error connecting to OpenAI:", error);
      socket.send(JSON.stringify({
        type: "error",
        error: "Failed to connect to OpenAI Realtime API: " + error.message
      }));
    }
  };

  socket.onmessage = (event) => {
    try {
      console.log("Received from client:", event.data);
      // Forward all messages from client to OpenAI
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(event.data);
      } else {
        console.warn("OpenAI socket not ready, message dropped");
      }
    } catch (error) {
      console.error("Error forwarding client message:", error);
    }
  };

  socket.onclose = (event) => {
    console.log("Client disconnected:", event.code, event.reason);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    if (openAISocket) {
      openAISocket.close();
    }
  };

  return response;
});