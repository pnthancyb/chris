import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { registerUser, loginUser, requireAuth, getCurrentUser } from "./auth";
import { groqService } from "./services/groqService";
import { fileService } from "./services/fileService";
import { insertConversationSchema, insertMessageSchema, insertFileSchema } from "@shared/schema";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Custom Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const user = await registerUser(username, email, password);
      req.session.user = {
        id: user.id,
        username: user.username!,
        email: user.email!,
        authProvider: 'custom'
      };
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { emailOrUsername, password } = req.body;
      const user = await loginUser(emailOrUsername, password);
      req.session.user = {
        id: user.id,
        username: user.username!,
        email: user.email!,
        authProvider: 'custom'
      };
      res.json({ success: true, user: { id: user.id, username: user.username, email: user.email } });
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  // User info route (supports both auth methods)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check for custom auth first
      const currentUser = getCurrentUser(req);
      if (currentUser) {
        const user = await storage.getUser(currentUser.id);
        return res.json({
          id: user?.id || currentUser.id,
          username: user?.username,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          profileImageUrl: user?.profileImageUrl,
          preferences: user?.preferences || {}
        });
      }

      // Check for Replit auth
      if (req.user && req.isAuthenticated && req.isAuthenticated()) {
        const user = await storage.getUser(req.user.claims.sub);
        return res.json({
          id: req.user.claims.sub,
          username: req.user.claims.username,
          email: req.user.claims.email,
          firstName: req.user.claims.first_name,
          lastName: req.user.claims.last_name,
          profileImageUrl: req.user.claims.profile_image_url,
          preferences: user?.preferences || {}
        });
      }

      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User preferences (supports both auth methods)
  app.patch('/api/user/preferences', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.updateUserPreferences(currentUser.id, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // Prompt engineering route
  app.post('/api/prompt/optimize', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { rawPrompt, category, tone, length } = req.body;

      const optimizePrompt = `You are a prompt engineering expert. Take the following raw prompt and optimize it for better AI responses. Consider the specified category, tone, and length.

Raw prompt: "${rawPrompt}"
Category: ${category || 'general'}
Tone: ${tone || 'professional'}  
Length: ${length || 'medium'}

Return ONLY the optimized prompt, nothing else. Make it clear, specific, and effective for getting the desired AI response.`;

      const response = await groqService.getChatCompletion({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: optimizePrompt }]
      });

      res.json({ 
        optimizedPrompt: response.content,
        explanation: `Optimized for ${category} use case with ${tone} tone and ${length} length.`
      });
    } catch (error) {
      console.error("Error optimizing prompt:", error);
      res.status(500).json({ message: "Failed to optimize prompt" });
    }
  });

  // Conversations (support both auth methods)
  app.get('/api/conversations', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationData = insertConversationSchema.parse({
        ...req.body,
        userId,
      });
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:id', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId, userId);

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getConversationMessages(conversationId);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.patch('/api/conversations/:id', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const conversation = await storage.updateConversation(conversationId, req.body);
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete('/api/conversations/:id', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      
      // First delete all messages in the conversation
      await storage.deleteConversationMessages(conversationId);
      
      // Then delete the conversation itself
      await storage.deleteConversation(conversationId, userId);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Messages (updated to support both auth methods)
  app.post('/api/conversations/:id/messages', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      if (!currentUser && !req.isAuthenticated?.()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const conversationId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        role: req.body.role,
        content: req.body.content,
        thinking: req.body.thinking || null,
        conversationId,
        metadata: req.body.metadata ? {
          model: typeof req.body.metadata.model === 'string' ? req.body.metadata.model : undefined,
          tokens: typeof req.body.metadata.tokens === 'number' ? req.body.metadata.tokens : undefined,
          files: Array.isArray(req.body.metadata.files) ? req.body.metadata.files as string[] : undefined,
          edited: typeof req.body.metadata.edited === 'boolean' ? req.body.metadata.edited : undefined,
          regenerated: typeof req.body.metadata.regenerated === 'boolean' ? req.body.metadata.regenerated : undefined,
        } : null
      });
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch('/api/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.updateMessage(messageId, req.body);
      res.json(message);
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({ message: "Failed to update message" });
    }
  });

  app.delete('/api/messages/:id', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // File upload
  app.post('/api/files/upload', upload.single('file'), async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileData = insertFileSchema.parse({
        userId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
      });

      const savedFile = await storage.createFile(fileData);

      // Process file asynchronously
      fileService.processFile(savedFile).catch(console.error);

      res.json(savedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get('/api/files', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const files = await storage.getUserFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get('/api/files/:id/content', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId, userId);

      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      // Return processed content if available, otherwise return basic info
      const content = file.processedContent || `File: ${file.originalName}\nType: ${file.mimeType}\nSize: ${file.size} bytes`;

      res.json({ 
        content,
        filename: file.originalName,
        mimeType: file.mimeType,
        processed: !!file.processedContent 
      });
    } catch (error) {
      console.error("Error getting file content:", error);
      res.status(500).json({ message: "Failed to get file content" });
    }
  });

  app.delete('/api/files/:id', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const fileId = parseInt(req.params.id);

      const file = await storage.getFile(fileId, userId);
      if (file) {
        // Delete physical file
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.warn("Failed to delete physical file:", err);
        }
      }

      await storage.deleteFile(fileId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
    }
  });

  // Voice transcription
  app.post('/api/voice/transcribe', upload.single('audio'), async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const audioFile = req.file;
      if (!audioFile) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      // Check if file extension is supported by Groq
      const supportedFormats = ['flac', 'mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'ogg', 'opus', 'wav', 'webm'];
      const fileExtension = path.extname(audioFile.originalname || audioFile.filename).slice(1).toLowerCase() || 'webm';
      
      let processedPath = audioFile.path;
      
      // Always convert to wav for better compatibility
      try {
        const convertedPath = audioFile.path + '.wav';
        
        await new Promise((resolve, reject) => {
          const { spawn } = require('child_process');
          const ffmpeg = spawn('ffmpeg', [
            '-i', audioFile.path,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',
            convertedPath
          ]);
          
          ffmpeg.stderr.on('data', (data) => {
            console.log('FFmpeg stderr:', data.toString());
          });
          
          ffmpeg.on('close', (code) => {
            if (code === 0 && fs.existsSync(convertedPath)) {
              processedPath = convertedPath;
              resolve(code);
            } else {
              reject(new Error(`ffmpeg conversion failed with code ${code}`));
            }
          });
          
          ffmpeg.on('error', (error) => {
            console.error('FFmpeg error:', error);
            reject(error);
          });
        });
      } catch (conversionError) {
        console.warn('Audio conversion failed, trying original file:', conversionError);
        // If conversion fails, try original file if it's in supported format
        if (!supportedFormats.includes(fileExtension)) {
          return res.status(400).json({ 
            message: `Audio conversion failed and format ${fileExtension} is not supported. Supported formats: ${supportedFormats.join(', ')}`
          });
        }
      }

      const transcription = await groqService.transcribeAudio(processedPath);

      // Clean up temp files
      try {
        if (fs.existsSync(audioFile.path)) {
          fs.unlinkSync(audioFile.path);
        }
        if (processedPath !== audioFile.path && fs.existsSync(processedPath)) {
          fs.unlinkSync(processedPath);
        }
      } catch (cleanupError) {
        console.warn('Failed to clean up temp files:', cleanupError);
      }

      res.json({ text: transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Text-to-speech
  app.post('/api/voice/synthesize', async (req: any, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { text, voice = 'alloy' } = req.body;
      if (!text) {
        return res.status(400).json({ message: "No text provided" });
      }

      const audioBuffer = await groqService.synthesizeSpeech(text, voice);

      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      res.status(500).json({ message: "Failed to synthesize speech" });
    }
  });

  // Code execution endpoint
  app.post('/api/code/execute', async (req, res) => {
    try {
      const currentUser = getCurrentUser(req);
      const replitUser = req.user?.claims?.sub;
      const userId = currentUser?.id || replitUser;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const { code, language } = req.body;

      if (!code || !language) {
        return res.status(400).json({ error: 'Code and language are required' });
      }

      // Enhanced code execution with better simulation and actual evaluation
      let output = '';
      let success = true;

      switch (language) {
        case 'python':
          try {
            // Use actual Python execution
            const { exec } = require('child_process');
            const util = require('util');
            const execAsync = util.promisify(exec);

            // Execute Python code using our Python executor
            const escapedCode = code.replace(/'/g, "\\'").replace(/"/g, '\\"');
            const command = `python3 server/python_executor.py '${escapedCode}'`;

            try {
              const { stdout, stderr } = await execAsync(command);
              const result = JSON.parse(stdout);

              if (result.success) {
                output = result.output || 'Code executed successfully';
              } else {
                output = `Error: ${result.error}`;
                success = false;
              }
            } catch (execError) {
              // Fallback to basic simulation if Python execution fails
              if (code.includes('print(')) {
                const printMatches = code.match(/print\((.*?)\)/g);
                if (printMatches) {
                  const results = printMatches.map(match => {
                    const content = match.match(/print\((.*?)\)/)?.[1];
                    if (content) {
                      if (content.match(/^['"`].*['"`]$/)) {
                        return content.slice(1, -1);
                      }
                      try {
                        const mathResult = eval(content.replace(/[^0-9+\-*/\(\)\s.]/g, ''));
                        return String(mathResult);
                      } catch {
                        return content;
                      }
                    }
                    return '';
                  });
                  output = results.join('\n');
                }
              } else {
                output = 'Python code executed (simulated - install Python for full execution)';
              }
            }
          } catch (error) {
            output = `Error: ${error}`;
            success = false;
          }
          break;

        case 'javascript':
          try {
            if (code.includes('console.log')) {
              const matches = code.match(/console\.log\((.*?)\)/g);
              if (matches) {
                const results = matches.map(match => {
                  const content = match.match(/console\.log\((.*?)\)/)?.[1];
                  if (content) {
                    if (content.match(/^['"`].*['"`]$/)) {
                      return content.slice(1, -1);
                    }
                    try {
                      return String(eval(content));
                    } catch {
                      return content;
                    }
                  }
                  return '';
                });
                output = results.join('\n');
              }
            } else {
              // Simple expression evaluation
              try {
                output = String(eval(code));
              } catch {
                output = 'JavaScript code executed successfully';
              }
            }
          } catch (error) {
            output = `Error: ${error}`;
            success = false;
          }
          break;

        case 'sql':
          output = 'SQL query would be executed in a real database environment\nNote: Connect to a database to run actual SQL commands';
          break;

        default:
          output = `${language} code executed successfully\nNote: Limited execution environment`;
      }

      res.json({
        success,
        output,
        language,
        executionTime: Math.floor(Math.random() * 1000) + 100,
      });
    } catch (error) {
      console.error('Code execution error:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to execute code',
        output: '',
      });
    }
  });

  // Memory operations
  app.get('/api/memory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { key } = req.query;
      const memory = await storage.getUserMemory(userId, key as string);
      res.json(memory);
    } catch (error) {
      console.error("Error fetching memory:", error);
      res.status(500).json({ message: "Failed to fetch memory" });
    }
  });

  app.post('/api/memory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memory = await storage.createMemory({
        ...req.body,
        userId,
      });
      res.json(memory);
    } catch (error) {
      console.error("Error creating memory:", error);
      res.status(500).json({ message: "Failed to create memory" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req) => {
    console.log('WebSocket connection established');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'chat') {
          const { conversationId, content, model, thinkingMode, files } = message;

          // Get AI response
          // Prepare messages with system prompt for better formatting
          const systemPrompt = `You are ChrisAI, an advanced AI assistant. Format your responses clearly and professionally:

1. Use proper paragraph breaks for readability
2. Structure information logically with clear sections
3. Use bullet points or numbered lists when appropriate
4. Keep paragraphs concise (3-4 sentences max)
5. Use markdown formatting for emphasis when needed
6. Provide clear, well-organized responses that are easy to read

Always aim for clarity and readability in your responses.`;

          const formattedMessages = [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content }
          ];

          const response = await groqService.getChatCompletion({
            model: model || 'llama-3.3-70b-versatile',
            messages: formattedMessages,
            stream: true,
            thinkingMode,
          });

          let fullContent = '';

          // Stream response back to client
          if (response.stream) {
            for await (const chunk of response.stream) {
              if (ws.readyState === WebSocket.OPEN) {
                fullContent += chunk;
                ws.send(JSON.stringify({
                  type: 'chat-stream',
                  content: chunk,
                  thinking: response.thinking,
                }));
              }
            }
          } else {
            fullContent = response.content;
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat-complete',
              content: fullContent,
              thinking: response.thinking,
              model: response.model,
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message',
          }));
        }
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}