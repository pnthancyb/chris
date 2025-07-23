import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { getLanguagePromptPrefix } from '@/lib/languages';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';
import { DeveloperPanel } from '@/components/DeveloperPanel';
import { PromptEngineeringTab } from '@/components/PromptEngineering/PromptEngineeringTab';
import { SettingsPanel } from '@/components/Settings/SettingsPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  metadata?: any;
  createdAt: string;
}

interface Conversation {
  id: number;
  title: string;
  model: string;
  messages?: Message[];
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // WebSocket connection
  const { isConnected, sendMessage, onMessage, offMessage } = useWebSocket();

  // Local state
  const [currentConversationId, setCurrentConversationId] = useState<number | undefined>();
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Local messages state for real-time updates
  const [messages, setMessages] = useState<Message[]>([]);

  // Current conversation data
  const { data: currentConversation } = useQuery<Conversation>({
    queryKey: ['/api/conversations', currentConversationId],
    enabled: !!currentConversationId,
    retry: false,
  });

  // Sync messages with conversation data
  useEffect(() => {
    if (currentConversation?.messages) {
      setMessages(currentConversation.messages);
    } else if (!currentConversationId) {
      setMessages([]);
    }
  }, [currentConversation?.messages, currentConversationId]);

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { title: string; model: string }) => {
      const response = await apiRequest('POST', '/api/conversations', data);
      return response.json();
    },
    onSuccess: (conversation) => {
      setCurrentConversationId(conversation.id);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Add message to conversation
  const addMessageMutation = useMutation({
    mutationFn: async (data: { conversationId: number; role: string; content: string; thinking?: string; metadata?: any }) => {
      const response = await apiRequest('POST', `/api/conversations/${data.conversationId}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', currentConversationId] });
    },
  });

  // Update message
  const updateMessageMutation = useMutation({
    mutationFn: async (data: { messageId: number; content: string }) => {
      const response = await apiRequest('PATCH', `/api/messages/${data.messageId}`, { content: data.content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', currentConversationId] });
    },
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest('DELETE', `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', currentConversationId] });
    },
  });

  // WebSocket message handlers
  useEffect(() => {
    const handleChatStream = (data: any) => {
      if (data.content) {
        setStreamingMessage(prev => prev + data.content);
      }
      if (data.thinking) {
        setThinkingContent(data.thinking);
      }
    };

    const handleChatComplete = async (data: any) => {
      console.log('Chat complete received:', data);
      setIsLoading(false);

      const finalContent = data.content || streamingMessage;
      setStreamingMessage('');
      setThinkingContent('');

      if (currentConversationId && finalContent) {
        try {
          // Save AI response
          await addMessageMutation.mutateAsync({
            conversationId: currentConversationId,
            role: 'assistant',
            content: finalContent,
            thinking: data.thinking,
            metadata: { model: data.model },
          });
          console.log('AI message saved successfully');
        } catch (error) {
          console.error('Failed to save AI message:', error);
        }
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setStreamingMessage('');
      setThinkingContent('');
      toast({
        title: "Error",
        description: "Failed to get AI response",
        variant: "destructive",
      });
    };

    onMessage('chat-stream', handleChatStream);
    onMessage('chat-complete', handleChatComplete);
    onMessage('error', handleError);

    return () => {
      offMessage('chat-stream');
      offMessage('chat-complete');
      offMessage('error');
    };
  }, [currentConversationId, addMessageMutation, onMessage, offMessage, toast]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string, files?: File[]) => {
    if (!content.trim() || isLoading) return;

    try {
      let conversationId = currentConversationId;

      // Create new conversation if needed
      if (!conversationId) {
        const newConversation = await createConversationMutation.mutateAsync({
          title: content.slice(0, 50),
          model: selectedModel,
        });
        conversationId = newConversation.id;
      }

      if (!conversationId) return;

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content,
        metadata: files ? { files: files.map(f => f.name) } : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, userMessage]);

      // Save user message to database
      await addMessageMutation.mutateAsync({
        conversationId,
        role: 'user',
        content,
        metadata: files ? { files: files.map(f => f.name) } : undefined,
      });

      // Send to WebSocket for AI response
      setIsLoading(true);
      setStreamingMessage('');
      setThinkingContent('');

      console.log('Sending WebSocket message:', {
        type: 'chat',
        conversationId,
        content,
        model: selectedModel,
        thinkingMode,
      });

      sendMessage({
        type: 'chat',
        conversationId,
        content,
        model: selectedModel,
        thinkingMode,
        files: files?.map(f => f.name),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  }, [
    currentConversationId,
    selectedModel,
    thinkingMode,
    isLoading,
    createConversationMutation,
    addMessageMutation,
    sendMessage,
    toast
  ]);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: number) => {
    setCurrentConversationId(conversationId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    // Clear current conversation data immediately
    setCurrentConversationId(undefined);
    setMessages([]);
    setStreamingMessage('');
    setThinkingContent('');
    setIsLoading(false);

    if (isMobile) {
      setSidebarOpen(false);
    }

    // Create a new conversation for better UX
    createConversationMutation.mutate(
      { title: 'New Conversation' },
      {
        onSuccess: (conversation) => {
          setCurrentConversationId(conversation.id);
        },
        onError: (error) => {
          console.error('Failed to create new conversation:', error);
          toast({
            title: 'Error',
            description: 'Failed to create new conversation',
            variant: 'destructive',
          });
        },
      }
    );
  }, [isMobile, createConversationMutation, toast]);

  // Handle message editing
  const handleMessageEdit = useCallback(async (messageId: number, newContent: string) => {
    try {
      await updateMessageMutation.mutateAsync({ messageId, content: newContent });
      toast({
        title: "Success",
        description: "Message updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message",
        variant: "destructive",
      });
    }
  }, [updateMessageMutation, toast]);

  // Handle message deletion
  const handleMessageDelete = useCallback(async (messageId: number) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessageMutation.mutateAsync(messageId);
      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  }, [deleteMessageMutation, toast]);

  // Handle message regeneration
  const handleMessageRegenerate = useCallback(async (messageId: number) => {
    const message = messages.find((m: Message) => m.id === messageId);
    if (!message || !currentConversationId) return;

    // Find the previous user message
    const messageIndex = messages.findIndex((m: Message) => m.id === messageId);
    const userMessage = messages.slice(0, messageIndex).reverse().find((m: Message) => m.role === 'user');

    if (!userMessage) return;

    // Delete current message and regenerate
    try {
      await deleteMessageMutation.mutateAsync(messageId);

      setIsLoading(true);
      setStreamingMessage('');
      setThinkingContent('');

      sendMessage({
        type: 'chat',
        conversationId: currentConversationId,
        content: userMessage.content,
        model: selectedModel,
        thinkingMode,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate message",
        variant: "destructive",
      });
    }
  }, [messages, currentConversationId, deleteMessageMutation, selectedModel, thinkingMode, sendMessage, toast]);

  // Handle text-to-speech
  const handleMessageSpeak = useCallback(async (content: string) => {
    try {
      const response = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
        credentials: 'include',
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to play audio",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Handle clear chat
  const handleClearChat = useCallback(() => {
    if (!confirm('Are you sure you want to clear this chat?')) return;
    handleNewChat();
  }, [handleNewChat]);

  // Handle code execution in dev mode
  const handleCodeExecution = useCallback(async (code: string) => {
    // This would integrate with a code execution service
    console.log('Executing code:', code);
    return Promise.resolve();
  }, []);

  // Extract current code from messages for dev mode
  const currentCode = messages
    .filter((m: Message) => m.role === 'assistant')
    .map((m: Message) => m.content)
    .join('\n')
    .match(/```[\s\S]*?```/g)
    ?.map((block: string) => block.replace(/```\w*\n?/, '').replace(/```$/, ''))
    .join('\n') || '';

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          x: isMobile ? (sidebarOpen ? 0 : '-100%') : 0 
        }}
        className={`${isMobile ? 'fixed z-50' : 'relative'} h-full`}
      >
        <ChatSidebar
          currentConversationId={currentConversationId}
          onConversationSelect={handleConversationSelect}
          onNewChat={handleNewChat}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          onOpenSettings={() => setShowSettings(true)}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b border-slate-200 px-4 py-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center space-x-2 text-slate-600"
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
              </div>
              <span className="font-medium">ChrisAI</span>
            </button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 bg-white">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-10">
                <TabsTrigger value="chat" className="text-sm font-medium">{t('chat')}</TabsTrigger>
                <TabsTrigger value="prompt" className="text-sm font-medium">Prompts</TabsTrigger>
                <TabsTrigger value="files" className="text-sm font-medium">Files</TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-slate-500">
                  {isConnected ? (
                    <span className="text-green-600">●Connected</span>
                  ) : (
                    <span className="text-red-600">●Connecting...</span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            <ChatArea
              messages={messages}
              isLoading={isLoading}
              streamingMessage={streamingMessage}
              thinkingContent={thinkingContent}
              thinkingMode={thinkingMode}
              devMode={devMode}
              onThinkingToggle={() => setThinkingMode(!thinkingMode)}
              onDevModeToggle={() => setDevMode(!devMode)}
              onClearChat={handleClearChat}
              onMessageEdit={handleMessageEdit}
              onMessageDelete={handleMessageDelete}
              onMessageRegenerate={handleMessageRegenerate}
              onMessageSpeak={handleMessageSpeak}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={!isConnected}
            />
          </TabsContent>

          <TabsContent value="prompt" className="flex-1 m-0">
            <PromptEngineeringTab 
              onSendToChat={(prompt: string) => {
                setActiveTab('chat');
                // Send optimized prompt to chat
                handleSendMessage(prompt);
              }}
            />
          </TabsContent>

          <TabsContent value="files" className="flex-1 p-6 m-0">
            <div className="text-center text-muted-foreground">
              <p>File upload and management coming soon...</p>
            </div>
          </TabsContent>


        </Tabs>
      </div>

      {/* Developer Panel */}
      <DeveloperPanel
        isOpen={devMode}
        onClose={() => setDevMode(false)}
        currentCode={currentCode}
        onCodeExecution={handleCodeExecution}
      />

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </DialogTitle>
          </DialogHeader>
          <SettingsPanel 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
        </DialogContent>
      </Dialog>

      {/* Connection Status */}
      <AnimatePresence>
        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-800 px-4 py-2 rounded-lg shadow-sm"
          >
            Reconnecting...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}