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

  // Conversations
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.patch('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.updateConversation(conversationId, req.body);
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const conversationId = parseInt(req.params.id);
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
      const metadata = req.body.metadata ? {
        model: typeof req.body.metadata.model === 'string' ? req.body.metadata.model : undefined,
        tokens: typeof req.body.metadata.tokens === 'number' ? req.body.metadata.tokens : undefined,
        files: Array.isArray(req.body.metadata.files) ? req.body.metadata.files.filter((f: any) => typeof f === 'string') as string[] : undefined,
        edited: typeof req.body.metadata.edited === 'boolean' ? req.body.metadata.edited : undefined,
        regenerated: typeof req.body.metadata.regenerated === 'boolean' ? req.body.metadata.regenerated : undefined,
      } : null;
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        conversationId,
        metadata
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

  app.delete('/api/messages/:id', isAuthenticated, async (req: any, res) => {
    try {
      const messageId = parseInt(req.params.id);
      await storage.deleteMessage(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // File upload
  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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

  app.get('/api/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const files = await storage.getUserFiles(userId);
      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.delete('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
  app.post('/api/voice/transcribe', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const audioFile = req.file;
      if (!audioFile) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const transcription = await groqService.transcribeAudio(audioFile.path);
      
      // Clean up temp file
      fs.unlinkSync(audioFile.path);

      res.json({ text: transcription });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Text-to-speech
  app.post('/api/voice/synthesize', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "No text provided" });
      }

      const audioBuffer = await groqService.synthesizeSpeech(text);
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
      });
      res.send(audioBuffer);
    } catch (error) {
      console.error("Error synthesizing speech:", error);
      res.status(500).json({ message: "Failed to synthesize speech" });
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
          const response = await groqService.getChatCompletion({
            model: model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content }],
            stream: true,
            thinkingMode,
          });

          // Stream response back to client
          if (response.stream) {
            for await (const chunk of response.stream) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'chat-stream',
                  content: chunk,
                  thinking: response.thinking,
                }));
              }
            }
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'chat-complete',
              content: response.content,
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
