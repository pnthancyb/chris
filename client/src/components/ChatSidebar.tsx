import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { isUnauthorizedError } from '@/lib/authUtils';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, 
  MessageSquare, 
  Settings, 
  X, 
  Brain,
  Sparkles
} from 'lucide-react';

interface Conversation {
  id: number;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  currentConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
  onNewChat: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onOpenSettings: () => void;
}

const AI_MODELS = [
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)', icon: '⚡' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)', icon: '🌟' },
  { value: 'llama3-70b-8192', label: 'Llama 3 70B', icon: '🦙' },
  { value: 'mistral-saba-24b', label: 'Mistral Saba 24B', icon: '🌬️' },
  { value: 'gemma2-9b-it', label: 'Gemma 2 9B', icon: '💎' },
  { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 Instruct', icon: '🌙' },
];

export function ChatSidebar({ 
  currentConversationId, 
  onConversationSelect, 
  onNewChat,
  selectedModel,
  onModelChange,
  onOpenSettings
}: ChatSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    retry: false,
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest('DELETE', `/api/conversations/${conversationId}`);
    },
    onSuccess: () => {
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
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversationMutation.mutate(conversationId);
      if (currentConversationId === conversationId) {
        onNewChat();
      }
    }
  };

  if (!user) return null;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">ChrisAI</h1>
            <p className="text-xs text-slate-500">Advanced Assistant</p>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-b border-slate-200">
        <Button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Conversations */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <AnimatePresence>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-10 bg-slate-200 rounded-lg"></div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm rounded-lg transition-colors group ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-slate-100'
                }`}
                onClick={() => onConversationSelect(conversation.id)}
              >
                <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate flex-1">{conversation.title}</span>
                <div
                  onClick={(e) => handleDeleteConversation(e, conversation.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </div>
              </motion.button>
            ))
          )}
        </AnimatePresence>
      </nav>

      {/* Model Selection */}
      <div className="p-4 border-t border-slate-200">
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          AI Model
        </label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex items-center space-x-2">
                  <span>{model.icon}</span>
                  <span className="text-sm">{model.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Profile - Moved to bottom */}
      <div className="p-4 border-t border-slate-200 mt-auto">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || 'User'} />
            <AvatarFallback>
              {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={onOpenSettings}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
