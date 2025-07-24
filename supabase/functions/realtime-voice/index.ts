import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active connections
const activeConnections = new Map<string, {
  openAISocket: WebSocket | null;
  clientWriter: WritableStreamDefaultWriter | null;
  connectionId: string;
}>();

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

    // Extract path from URL
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle health check requests
    if (path === 'health' && req.method === 'GET') {
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

    // Handle streaming connection requests
    if (path === 'stream' && req.method === 'POST') {
      console.log("🌊 Starting HTTP stream connection");
      return handleStreamConnection(req, apiKey);
    }

    // Handle action requests (audio chunks, text messages, scenario starts)
    if (path === 'action' && req.method === 'POST') {
      console.log("📝 Handling action request");
      return handleActionRequest(req, apiKey);
    }

    // Invalid request
    console.log("❌ Invalid request format");
    return new Response(JSON.stringify({
      error: "Invalid request",
      message: "Expected /health, /stream, or /action endpoint",
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

// Handle streaming connection establishment
async function handleStreamConnection(req: Request, apiKey: string) {
  try {
    const body = await req.json();
    
    if (body.action !== 'connect') {
      return new Response('Invalid action for stream endpoint', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    const connectionId = crypto.randomUUID();
    console.log(`🔗 Creating new stream connection: ${connectionId}`);

    // Create a TransformStream for server-sent events
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Store connection info
    activeConnections.set(connectionId, {
      openAISocket: null,
      clientWriter: writer,
      connectionId
    });

    // Establish OpenAI connection
    await establishOpenAIConnection(connectionId, apiKey, writer);

    // Set up SSE headers
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    console.log(`✅ Stream connection established: ${connectionId}`);
    return new Response(readable, { headers });

  } catch (error) {
    console.error("❌ Error in stream connection:", error);
    return new Response(JSON.stringify({
      error: "Failed to establish stream connection",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle action requests (audio, text, scenario)
async function handleActionRequest(req: Request, apiKey: string) {
  try {
    const body = await req.json();
    const { action, connectionId } = body;

    if (!connectionId) {
      return new Response(JSON.stringify({
        error: "Connection ID required"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const connection = activeConnections.get(connectionId);
    if (!connection || !connection.openAISocket) {
      return new Response(JSON.stringify({
        error: "Connection not found or not ready"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📤 Processing action: ${action} for connection: ${connectionId}`);

    switch (action) {
      case 'startScenario':
        await handleStartScenario(connection.openAISocket, body);
        break;
      
      case 'audioChunk':
        await handleAudioChunk(connection.openAISocket, body);
        break;
      
      case 'textMessage':
        await handleTextMessage(connection.openAISocket, body);
        break;
      
      default:
        console.log(`❓ Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("❌ Error in action request:", error);
    return new Response(JSON.stringify({
      error: "Action processing failed",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Establish OpenAI WebSocket connection
async function establishOpenAIConnection(connectionId: string, apiKey: string, writer: WritableStreamDefaultWriter) {
  try {
    console.log(`🔗 Connecting to OpenAI for connection: ${connectionId}`);
    
    const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    const openAISocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    // Update connection with OpenAI socket
    const connection = activeConnections.get(connectionId);
    if (connection) {
      connection.openAISocket = openAISocket;
    }

    openAISocket.onopen = async () => {
      console.log(`✅ OpenAI connected for ${connectionId}`);
      await writeSSEMessage(writer, {
        type: 'connection.established',
        connectionId: connectionId,
        timestamp: new Date().toISOString()
      });
    };

    openAISocket.onmessage = async (event) => {
      try {
        const openAIData = JSON.parse(event.data);
        console.log(`📨 OpenAI -> Stream: ${openAIData.type} for ${connectionId}`);

        // Handle session.created to send configuration
        if (openAIData.type === 'session.created') {
          console.log(`⚙️ Sending session configuration for ${connectionId}`);
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
          openAISocket.send(JSON.stringify(sessionConfig));
        }

        // Send session.ready after session.updated
        if (openAIData.type === 'session.updated') {
          await writeSSEMessage(writer, {
            type: 'session.ready',
            timestamp: new Date().toISOString(),
            message: 'Session configured and ready'
          });
        }

        // Forward all OpenAI messages to client via SSE
        await writeSSEMessage(writer, openAIData);
        
      } catch (error) {
        console.error(`❌ Error processing OpenAI message for ${connectionId}:`, error);
      }
    };

    openAISocket.onerror = async (error) => {
      console.error(`❌ OpenAI WebSocket error for ${connectionId}:`, error);
      await writeSSEMessage(writer, {
        type: 'error',
        error: 'OpenAI connection failed'
      });
    };

    openAISocket.onclose = async () => {
      console.log(`🔴 OpenAI WebSocket closed for ${connectionId}`);
      await writeSSEMessage(writer, {
        type: 'connection.closed',
        timestamp: new Date().toISOString()
      });
      
      // Clean up connection
      activeConnections.delete(connectionId);
      try {
        await writer.close();
      } catch (e) {
        console.log(`Connection writer already closed for ${connectionId}`);
      }
    };

  } catch (error) {
    console.error(`❌ Error establishing OpenAI connection for ${connectionId}:`, error);
    await writeSSEMessage(writer, {
      type: 'error',
      error: 'Failed to establish OpenAI connection'
    });
  }
}

// Helper function to write SSE messages
async function writeSSEMessage(writer: WritableStreamDefaultWriter, data: any) {
  try {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    await writer.write(new TextEncoder().encode(message));
  } catch (error) {
    console.error("❌ Error writing SSE message:", error);
  }
}

// Handle scenario start
async function handleStartScenario(openAISocket: WebSocket, body: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    console.log(`📤 Starting scenario: ${body.scenarioId}`);
    
    // Send opening message as conversation item
    const conversationItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: body.openingMessage
        }]
      }
    };
    
    openAISocket.send(JSON.stringify(conversationItem));
    openAISocket.send(JSON.stringify({ type: 'response.create' }));
    console.log("📤 Sent scenario opening message to OpenAI");
  }
}

// Handle audio chunk
async function handleAudioChunk(openAISocket: WebSocket, body: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    // Forward audio chunk to OpenAI
    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: body.data
    };
    openAISocket.send(JSON.stringify(audioEvent));
  }
}

// Handle text message
async function handleTextMessage(openAISocket: WebSocket, body: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    const conversationItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: body.message
        }]
      }
    };
    
    openAISocket.send(JSON.stringify(conversationItem));
    openAISocket.send(JSON.stringify({ type: 'response.create' }));
  }
}