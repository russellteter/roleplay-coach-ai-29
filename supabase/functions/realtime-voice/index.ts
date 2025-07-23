
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

        // Handle streaming connection request
        if (body && body.action === 'connect') {
          console.log("🔗 Starting streaming connection to OpenAI");
          
          // Create a readable stream for the response
          const stream = new ReadableStream({
            start(controller) {
              // Connect to OpenAI Realtime API
              const openAIUrl = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
              console.log("🔗 Connecting to OpenAI Realtime API...");
              
              const openAISocket = new WebSocket(openAIUrl, [], {
                headers: {
                  "Authorization": `Bearer ${apiKey}`,
                  "OpenAI-Beta": "realtime=v1"
                }
              });

              openAISocket.onopen = () => {
                console.log("✅ Connected to OpenAI Realtime API");
                
                // Send connection established event
                const event = {
                  type: 'connection.established',
                  timestamp: new Date().toISOString()
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`));
              };

              openAISocket.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  console.log(`📨 OpenAI -> Edge: ${data.type}`);

                  // Handle session.created to send our optimized configuration
                  if (data.type === 'session.created') {
                    console.log("⚙️ Received session.created, sending session configuration");
                    
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

                    console.log("📤 Sending session configuration to OpenAI");
                    openAISocket.send(JSON.stringify(sessionConfig));
                  }

                  // Handle session.updated response from OpenAI
                  if (data.type === 'session.updated') {
                    console.log("🎯 Session updated by OpenAI - marking as configured");
                    
                    // Send explicit session ready event to client
                    const readyEvent = {
                      type: 'session.ready',
                      timestamp: new Date().toISOString(),
                      message: 'Session is configured and ready for scenario start'
                    };
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(readyEvent)}\n\n`));
                    console.log("📤 Sent session.ready to client");
                  }

                  // Forward ALL events to client
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
                  console.log(`📤 Forwarded to client: ${data.type}`);
                  
                } catch (error) {
                  console.error("❌ Error processing OpenAI message:", error);
                  const errorEvent = {
                    type: 'error',
                    error: 'Invalid JSON from OpenAI',
                    timestamp: new Date().toISOString()
                  };
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
                }
              };

              openAISocket.onerror = (error) => {
                console.error("❌ OpenAI WebSocket error:", error);
                const errorEvent = {
                  type: 'error',
                  error: 'OpenAI connection failed',
                  timestamp: new Date().toISOString()
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
              };

              openAISocket.onclose = (event) => {
                console.log(`🔴 OpenAI WebSocket closed: ${event.code} ${event.reason}`);
                const closeEvent = {
                  type: 'connection.closed',
                  code: event.code,
                  reason: event.reason,
                  timestamp: new Date().toISOString()
                };
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(closeEvent)}\n\n`));
                controller.close();
              };

              // Store the socket for cleanup
              (controller as any).openAISocket = openAISocket;
            },
            cancel() {
              console.log("🧹 Cleaning up streaming connection");
              if ((this as any).openAISocket) {
                (this as any).openAISocket.close();
              }
            }
          });

          return new Response(stream, {
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            }
          });
        }

        // Handle message sending
        if (body && body.action === 'send_message') {
          console.log("📤 Received message to send to OpenAI");
          // For now, return success - we'll implement message routing later
          return new Response(JSON.stringify({
            status: 'success',
            message: 'Message queued for sending'
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
      message: "Expected valid POST request with action",
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
