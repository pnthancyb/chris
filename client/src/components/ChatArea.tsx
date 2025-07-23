import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { MessageBubble } from './MessageBubble';
import { ThinkingDisplay } from './ThinkingDisplay';
import { Brain, Code, Trash2, Zap } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  metadata?: any;
  createdAt: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  streamingMessage: string;
  thinkingContent: string;
  thinkingMode: boolean;
  devMode: boolean;
  onThinkingToggle: () => void;
  onDevModeToggle: () => void;
  onClearChat: () => void;
  onMessageEdit: (messageId: number, newContent: string) => void;
  onMessageDelete: (messageId: number) => void;
  onMessageRegenerate: (messageId: number) => void;
  onMessageSpeak: (content: string) => void;
}

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

export function ChatArea({
  messages,
  isLoading,
  streamingMessage,
  thinkingContent,
  thinkingMode,
  devMode,
  onThinkingToggle,
  onDevModeToggle,
  onClearChat,
  onMessageEdit,
  onMessageDelete,
  onMessageRegenerate,
  onMessageSpeak,
}: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingMessage]);

  const allMessages = [...messages];
  if (streamingMessage) {
    allMessages.push({
      id: -1,
      role: 'assistant' as const,
      content: streamingMessage,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Chat</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant={thinkingMode ? "default" : "outline"}
              size="sm"
              onClick={onThinkingToggle}
              className="flex items-center space-x-2"
            >
              <Brain className="w-4 h-4" />
              <span>Thinking</span>
            </Button>
            <Button
              variant={devMode ? "default" : "outline"}
              size="sm"
              onClick={onDevModeToggle}
              className="flex items-center space-x-2"
            >
              <Code className="w-4 h-4" />
              <span>Dev Mode</span>
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          className="flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear</span>
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="p-4">
            <div className="space-y-6 max-w-4xl mx-auto min-h-full">
              {allMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Welcome to ChrisAI
                  </h3>
                  <p className="text-slate-600 max-w-md mx-auto">
                    I'm your advanced AI assistant. Ask me anything, and I'll help you with detailed, 
                    thoughtful responses. I can analyze documents, generate code, and much more.
                  </p>
                </div>
              ) : (
                <>
                  {/* Thinking Display */}
                  <AnimatePresence>
                    {thinkingContent && (
                      <ThinkingDisplay 
                        content={thinkingContent} 
                        isVisible={thinkingMode} 
                        isStreaming={isLoading}
                        thinkingTime={5}
                      />
                    )}
                  </AnimatePresence>

                  {allMessages.map((message, index) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isStreaming={message.id === -1}
                      onEdit={onMessageEdit}
                      onDelete={onMessageDelete}
                      onRegenerate={onMessageRegenerate}
                      onSpeak={onMessageSpeak}
                    />
                  ))}

                  {isLoading && !streamingMessage && (
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}