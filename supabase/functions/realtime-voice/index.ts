import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active sessions
const activeSessions = new Map<string, {
  openAISocket: WebSocket | null;
  clientWriter: WritableStreamDefaultWriter | null;
  sessionId: string;
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

    // Handle streaming AI audio - GET /realtime-voice
    if (req.method === 'GET' && (path === 'realtime-voice' || url.pathname.endsWith('/realtime-voice'))) {
      console.log("🌊 Starting AI audio stream");
      return handleAudioStream(url, apiKey);
    }

    // Handle user input - POST /realtime-audio
    if (req.method === 'POST' && (path === 'realtime-audio' || url.pathname.endsWith('/realtime-audio'))) {
      console.log("📝 Handling user input");
      return handleUserInput(req, apiKey);
    }

    // Invalid request
    console.log("❌ Invalid request format");
    return new Response(JSON.stringify({
      error: "Invalid request",
      message: "Expected GET /realtime-voice or POST /realtime-audio",
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

// Handle AI audio streaming - GET /realtime-voice?scenarioId=xxx
async function handleAudioStream(url: URL, apiKey: string) {
  try {
    const scenarioId = url.searchParams.get('scenarioId');
    if (!scenarioId) {
      return new Response(JSON.stringify({
        error: "scenarioId query parameter required"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const sessionId = crypto.randomUUID();
    console.log(`🔗 Creating new audio stream session: ${sessionId} for scenario: ${scenarioId}`);

    // Create a TransformStream for newline-delimited JSON
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Store session info
    activeSessions.set(sessionId, {
      openAISocket: null,
      clientWriter: writer,
      sessionId
    });

    // Establish OpenAI connection
    await establishOpenAIConnection(sessionId, apiKey, writer);

    // Set up streaming headers
    const headers = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    console.log(`✅ Audio stream established: ${sessionId}`);
    return new Response(readable, { headers });

  } catch (error) {
    console.error("❌ Error in audio stream:", error);
    return new Response(JSON.stringify({
      error: "Failed to establish audio stream",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle user input - POST /realtime-audio
async function handleUserInput(req: Request, apiKey: string) {
  try {
    const body = await req.json();
    const { sessionId, action, payload } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({
        error: "sessionId required"
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const session = activeSessions.get(sessionId);
    if (!session || !session.openAISocket) {
      return new Response(JSON.stringify({
        error: "Session not found or not ready"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`📤 Processing action: ${action} for session: ${sessionId}`);

    switch (action) {
      case 'startScenario':
        await handleStartScenario(session.openAISocket, payload);
        break;
      
      case 'audioChunk':
        await handleAudioChunk(session.openAISocket, payload);
        break;
      
      case 'textMessage':
        await handleTextMessage(session.openAISocket, payload);
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
    console.error("❌ Error in user input:", error);
    return new Response(JSON.stringify({
      error: "User input processing failed",
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Establish OpenAI WebSocket connection
async function establishOpenAIConnection(sessionId: string, apiKey: string, writer: WritableStreamDefaultWriter) {
  try {
    console.log(`🔗 Connecting to OpenAI for session: ${sessionId}`);
    
    const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
    const openAISocket = new WebSocket(openAIUrl, [], {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    // Update session with OpenAI socket
    const session = activeSessions.get(sessionId);
    if (session) {
      session.openAISocket = openAISocket;
    }

    openAISocket.onopen = async () => {
      console.log(`✅ OpenAI connected for ${sessionId}`);
      await writeJSONMessage(writer, {
        type: 'connection.established',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      });
    };

    openAISocket.onmessage = async (event) => {
      try {
        const openAIData = JSON.parse(event.data);
        console.log(`📨 OpenAI -> Stream: ${openAIData.type} for ${sessionId}`);

        // Handle session.created to send configuration
        if (openAIData.type === 'session.created') {
          console.log(`⚙️ Sending session configuration for ${sessionId}`);
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
          await writeJSONMessage(writer, {
            type: 'session.ready',
            timestamp: new Date().toISOString(),
            message: 'Session configured and ready'
          });
        }

        // Forward AI audio events as simplified JSON
        if (openAIData.type === 'response.audio.delta') {
          await writeJSONMessage(writer, {
            type: 'audio.delta',
            data: openAIData.delta
          });
        } else if (openAIData.type === 'response.audio.done') {
          await writeJSONMessage(writer, {
            type: 'audio.done'
          });
        } else {
          // Forward other events as-is
          await writeJSONMessage(writer, openAIData);
        }
        
      } catch (error) {
        console.error(`❌ Error processing OpenAI message for ${sessionId}:`, error);
      }
    };

    openAISocket.onerror = async (error) => {
      console.error(`❌ OpenAI WebSocket error for ${sessionId}:`, error);
      await writeJSONMessage(writer, {
        type: 'error',
        error: 'OpenAI connection failed'
      });
    };

    openAISocket.onclose = async () => {
      console.log(`🔴 OpenAI WebSocket closed for ${sessionId}`);
      await writeJSONMessage(writer, {
        type: 'connection.closed',
        timestamp: new Date().toISOString()
      });
      
      // Clean up session
      activeSessions.delete(sessionId);
      try {
        await writer.close();
      } catch (e) {
        console.log(`Session writer already closed for ${sessionId}`);
      }
    };

  } catch (error) {
    console.error(`❌ Error establishing OpenAI connection for ${sessionId}:`, error);
    await writeJSONMessage(writer, {
      type: 'error',
      error: 'Failed to establish OpenAI connection'
    });
  }
}

// Helper function to write newline-delimited JSON messages
async function writeJSONMessage(writer: WritableStreamDefaultWriter, data: any) {
  try {
    const message = JSON.stringify(data) + '\n';
    await writer.write(new TextEncoder().encode(message));
  } catch (error) {
    console.error("❌ Error writing JSON message:", error);
  }
}

// Handle scenario start
async function handleStartScenario(openAISocket: WebSocket, payload: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    console.log(`📤 Starting scenario with opening message`);
    
    // Send opening message as conversation item
    const conversationItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: payload
        }]
      }
    };
    
    openAISocket.send(JSON.stringify(conversationItem));
    openAISocket.send(JSON.stringify({ type: 'response.create' }));
    console.log("📤 Sent scenario opening message to OpenAI");
  }
}

// Handle audio chunk
async function handleAudioChunk(openAISocket: WebSocket, payload: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    // Forward audio chunk to OpenAI
    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: payload
    };
    openAISocket.send(JSON.stringify(audioEvent));
  }
}

// Handle text message
async function handleTextMessage(openAISocket: WebSocket, payload: any) {
  if (openAISocket.readyState === WebSocket.OPEN) {
    const conversationItem = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: payload
        }]
      }
    };
    
    openAISocket.send(JSON.stringify(conversationItem));
    openAISocket.send(JSON.stringify({ type: 'response.create' }));
  }
}