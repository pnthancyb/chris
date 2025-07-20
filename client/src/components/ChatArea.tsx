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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Chat with ChrisAI</h2>
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Online</span>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            {/* Thinking Mode Toggle */}
            <Button
              variant={thinkingMode ? "default" : "outline"}
              size="sm"
              onClick={onThinkingToggle}
              className={thinkingMode ? "bg-amber-100 text-amber-800 border-amber-300" : ""}
            >
              <Brain className="w-4 h-4 mr-2" />
              Think
            </Button>
            
            {/* Developer Mode */}
            <Button
              variant={devMode ? "default" : "outline"}
              size="sm"
              onClick={onDevModeToggle}
            >
              <Code className="w-4 h-4 mr-2" />
              Dev Mode
            </Button>
            
            {/* Clear Chat */}
            <Button variant="ghost" size="sm" onClick={onClearChat}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6" id="chatArea">
        <AnimatePresence>
          {messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to ChrisAI</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                I'm your advanced AI assistant powered by multiple models. I can help with coding, 
                analysis, creative tasks, and much more. How can I assist you today?
              </p>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                <Button variant="outline" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Write code
                </Button>
                <Button variant="outline" size="sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze data
                </Button>
                <Button variant="outline" size="sm">
                  <Code className="w-4 h-4 mr-2" />
                  Debug issue
                </Button>
              </div>
            </motion.div>
          )}

          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Show thinking for AI messages when thinking mode is on */}
              {message.role === 'assistant' && message.thinking && thinkingMode && (
                <ThinkingDisplay content={message.thinking} />
              )}
              
              <MessageBubble
                message={message}
                onEdit={onMessageEdit}
                onDelete={onMessageDelete}
                onRegenerate={onMessageRegenerate}
                onSpeak={onMessageSpeak}
              />
            </motion.div>
          ))}

          {/* Streaming message */}
          {isLoading && (streamingMessage || thinkingContent) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Show thinking content when available */}
              {thinkingContent && thinkingMode && (
                <ThinkingDisplay content={thinkingContent} isStreaming />
              )}
              
              {/* Streaming AI response */}
              {streamingMessage && (
                <MessageBubble
                  message={{
                    id: -1,
                    role: 'assistant',
                    content: streamingMessage,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming
                />
              )}
            </motion.div>
          )}

          {/* Loading indicator */}
          {isLoading && !streamingMessage && !thinkingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-4"
            >
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
