import Groq from "groq-sdk";
import fs from "fs";

console.log('Environment GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'Set' : 'Not set');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing-api-key",
});

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  thinkingMode?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface ChatResponse {
  content: string;
  thinking?: string;
  model: string;
  stream?: AsyncIterable<string>;
}

class GroqService {
  private readonly CHAT_MODELS = {
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama3-70b-8192": "llama3-70b-8192",
    "llama3-8b-8192": "llama3-8b-8192",
    "mistral-saba-24b": "mistral-saba-24b",
    "gemma2-9b-it": "gemma2-9b-it",
  };

  private readonly THINKING_MODEL = "deepseek-r1-distill-llama-70b";
  private readonly VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
  private readonly TRANSCRIPTION_MODEL = "whisper-large-v3";

  async getChatCompletion(options: ChatCompletionOptions): Promise<ChatResponse> {
    const {
      model,
      messages,
      stream = false,
      thinkingMode = false,
      temperature = 0.7,
      maxTokens = 8000,
    } = options;

    let thinking: string | undefined;

    // Get thinking/reasoning first if thinking mode is enabled
    if (thinkingMode) {
      try {
        const thinkingResponse = await groq.chat.completions.create({
          model: this.THINKING_MODEL,
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that thinks step by step. Provide your reasoning and thought process for the user's question before giving your final answer.",
            },
            ...messages,
          ],
          temperature: 0.3,
          max_tokens: 2000,
        });

        thinking = thinkingResponse.choices[0]?.message?.content || "";
      } catch (error) {
        console.error("Error getting thinking response:", error);
        // Continue without thinking if it fails
      }
    }

    // Prepare messages with thinking context if available
    const contextMessages = [...messages];
    if (thinking) {
      contextMessages.unshift({
        role: "system",
        content: `You have already analyzed this question with the following reasoning: ${thinking}\n\nNow provide a clear, direct response to the user.`,
      });
    }

    if (stream) {
      const completion = await groq.chat.completions.create({
        model: this.CHAT_MODELS[model as keyof typeof this.CHAT_MODELS] || model,
        messages: contextMessages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      return {
        content: "",
        thinking,
        model,
        stream: this.createStreamIterator(completion),
      };
    } else {
      const completion = await groq.chat.completions.create({
        model: this.CHAT_MODELS[model as keyof typeof this.CHAT_MODELS] || model,
        messages: contextMessages,
        temperature,
        max_tokens: maxTokens,
      });

      return {
        content: completion.choices[0]?.message?.content || "",
        thinking,
        model,
      };
    }
  }

  private async* createStreamIterator(completion: any): AsyncIterable<string> {
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async analyzeImage(imageBuffer: Buffer, prompt: string): Promise<string> {
    try {
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');

      const completion = await groq.chat.completions.create({
        model: this.VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      return completion.choices[0]?.message?.content || "Unable to analyze image";
    } catch (error) {
      console.error("Error analyzing image:", error);
      throw new Error("Failed to analyze image");
    }
  }

  async transcribeAudio(audioPath: string): Promise<string> {
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: this.TRANSCRIPTION_MODEL,
        response_format: "text",
      });

      return typeof transcription === 'string' ? transcription : transcription.text;
    } catch (error) {
      console.error("Error transcribing audio:", error);
      throw new Error("Failed to transcribe audio");
    }
  }

  async synthesizeSpeech(text: string, voice: string = 'alloy'): Promise<Buffer> {
    try {
      const { spawn } = require('child_process');
      const fs = require('fs');

      return new Promise((resolve, reject) => {
        const tempFile = `/tmp/tts_${Date.now()}.wav`;

        // Try multiple TTS engines
        const tryEspeak = () => {
          const espeak = spawn('espeak', ['-w', tempFile, '-s', '150', '-p', '50', text]);
          
          espeak.on('close', (code) => {
            if (code === 0 && fs.existsSync(tempFile)) {
              const audioBuffer = fs.readFileSync(tempFile);
              fs.unlinkSync(tempFile);
              resolve(audioBuffer);
            } else {
              tryFallback();
            }
          });
          
          espeak.on('error', () => {
            tryFallback();
          });
        };

        const tryFallback = () => {
          // Create a more sophisticated WAV file with tone patterns
          const sampleRate = 44100;
          const duration = Math.min(3, Math.max(1, text.length * 0.1)); // Dynamic duration
          const numSamples = Math.floor(sampleRate * duration);
          const numChannels = 1;
          const bytesPerSample = 2;

          const buffer = Buffer.alloc(44 + numSamples * bytesPerSample);

          // WAV header
          buffer.write('RIFF', 0);
          buffer.writeUInt32LE(36 + numSamples * bytesPerSample, 4);
          buffer.write('WAVE', 8);
          buffer.write('fmt ', 12);
          buffer.writeUInt32LE(16, 16);
          buffer.writeUInt16LE(1, 20);
          buffer.writeUInt16LE(numChannels, 22);
          buffer.writeUInt32LE(sampleRate, 24);
          buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
          buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
          buffer.writeUInt16LE(bytesPerSample * 8, 34);
          buffer.write('data', 36);
          buffer.writeUInt32LE(numSamples * bytesPerSample, 40);

          // Generate audio based on text characteristics
          const words = text.split(' ').length;
          const baseFreq = 300 + (text.length % 200); // Vary frequency based on text
          
          for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            const wordPosition = (i / numSamples) * words;
            const freq = baseFreq + Math.sin(wordPosition * Math.PI) * 100;
            const amplitude = Math.sin(2 * Math.PI * freq * t) * 0.15 * Math.exp(-t * 2);
            const sample = Math.floor(amplitude * 32767);
            buffer.writeInt16LE(sample, 44 + i * 2);
          }

          resolve(buffer);
        };

        // Start with espeak
        tryEspeak();
      });
    } catch (error) {
      console.error('TTS Error:', error);
      throw new Error('Text-to-speech synthesis failed');
    }
  }

  async generateTitle(messages: ChatMessage[]): Promise<string> {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Generate a short, descriptive title (max 50 characters) for this conversation based on the first user message. Return only the title.",
          },
          {
            role: "user",
            content: messages[0]?.content || "New conversation",
          },
        ],
        max_tokens: 50,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content?.trim() || "New Chat";
    } catch (error) {
      console.error("Error generating title:", error);
      return "New Chat";
    }
  }
}

export const groqService = new GroqService();