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
      // Get OpenAI API key
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        console.error('OpenAI API key not found in environment');
        socket.send(JSON.stringify({
          type: "error",
          error: "OpenAI API key not configured"
        }));
        return;
      }

      console.log("Creating WebSocket connection to OpenAI...");
      
      console.log("Creating WebSocket connection to OpenAI with proper authentication...");
      
      // Use the correct authentication method for OpenAI Realtime API
      // Based on OpenAI docs, we need to use WebSocket subprotocols for authentication
      const wsUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      const protocols = [
        "realtime",
        `openai-insecure-api-key.${apiKey}`,
        "openai-beta.realtime-v1"
      ];
      
      console.log("Connecting to:", wsUrl);
      console.log("Using protocols:", protocols);
      
      openAISocket = new WebSocket(wsUrl, protocols);

      openAISocket.onopen = () => {
        console.log("Connected to OpenAI WebSocket, sending authentication...");
        
        // Send authentication immediately after connection
        const authMessage = {
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
        
        console.log("Sending session configuration...");
        openAISocket?.send(JSON.stringify(authMessage));
      };

      openAISocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received from OpenAI:", data.type);
          
          // Handle session creation
          if (data.type === "session.created" && !sessionInitialized) {
            console.log("Session created successfully!");
            sessionInitialized = true;
            
            // Now we can tell the client we're connected
            socket.send(JSON.stringify({
              type: "connection.established",
              message: "Connected to OpenAI Realtime API"
            }));
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
      
      // If we need to add authentication to outgoing messages, do it here
      const message = JSON.parse(event.data);
      
      // Add authorization header to the message if needed
      if (!message.authorization && Deno.env.get('OPENAI_API_KEY')) {
        message.authorization = `Bearer ${Deno.env.get('OPENAI_API_KEY')}`;
      }
      
      if (openAISocket && openAISocket.readyState === WebSocket.OPEN) {
        openAISocket.send(JSON.stringify(message));
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