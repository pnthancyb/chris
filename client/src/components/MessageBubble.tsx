import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { 
  Copy, 
  Edit3, 
  Trash2, 
  RotateCcw,
  Volume2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Brain
} from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  metadata?: any;
  createdAt: string;
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (messageId: number, newContent: string) => void;
  onDelete?: (messageId: number) => void;
  onRegenerate?: (messageId: number) => void;
  onSpeak?: (content: string) => void;
}

export function MessageBubble({ 
  message, 
  isStreaming, 
  onEdit, 
  onDelete, 
  onRegenerate, 
  onSpeak 
}: MessageBubbleProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<{ [key: number]: boolean }>({});
  
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEdit = () => {
    if (isEditing && onEdit) {
      onEdit(message.id, editContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setTimeout(() => editTextareaRef.current?.focus(), 0);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleCopy = async (text: string, key: string = 'message') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const toggleCodeBlock = (index: number) => {
    setCollapsedBlocks(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderContent = (content: string) => {
    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/);
    let codeBlockIndex = 0;

    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/^```(\w+)?\n?([\s\S]*?)\n?```$/);
        if (match) {
          const [, language = '', code] = match;
          const blockIndex = codeBlockIndex++;
          const isCollapsed = collapsedBlocks[blockIndex];
          const shouldCollapse = code.split('\n').length > 10;

          return (
            <div key={index} className="my-4 rounded-lg overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2">
                <span className="text-sm font-medium">{language || 'Code'}</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(code, `code-${blockIndex}`)}
                    className="h-6 px-2 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    {copiedStates[`code-${blockIndex}`] ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                  {shouldCollapse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCodeBlock(blockIndex)}
                      className="h-6 px-2 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
              <div className={`overflow-hidden transition-all ${isCollapsed ? 'max-h-24' : 'max-h-none'}`}>
                <SyntaxHighlighter
                  language={language}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    fontSize: '14px',
                  }}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
              {isCollapsed && (
                <div className="bg-slate-900 text-slate-400 text-center py-2 text-sm">
                  ... {code.split('\n').length - 3} more lines
                </div>
              )}
            </div>
          );
        }
      }

      // Handle inline formatting
      return (
        <div key={index} className="prose prose-sm max-w-none">
          {part.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((segment, i) => {
            if (segment.startsWith('**') && segment.endsWith('**')) {
              return <strong key={i}>{segment.slice(2, -2)}</strong>;
            }
            if (segment.startsWith('*') && segment.endsWith('*')) {
              return <em key={i}>{segment.slice(1, -1)}</em>;
            }
            if (segment.startsWith('`') && segment.endsWith('`')) {
              return <code key={i} className="bg-slate-100 px-1 py-0.5 rounded text-sm">{segment.slice(1, -1)}</code>;
            }
            return <span key={i}>{segment}</span>;
          })}
        </div>
      );
    });
  };

  const isUser = message.role === 'user';
  const timestamp = new Date(message.createdAt).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`flex items-start space-x-3 ${isStreaming ? 'animate-pulse' : ''}`}>
      {/* Avatar */}
      {isUser ? (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={user?.profileImageUrl || ''} alt={user?.firstName || 'User'} />
          <AvatarFallback>
            {(user?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className={`rounded-2xl px-4 py-3 relative group ${
          isUser 
            ? 'bg-slate-100 rounded-tl-md' 
            : 'bg-white border border-slate-200 rounded-tl-md'
        }`}>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                ref={editTextareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-20 resize-none"
              />
              <div className="flex items-center space-x-2">
                <Button size="sm" onClick={handleEdit}>
                  <Check className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {isStreaming ? (
                <span className="typing-animation">{message.content}</span>
              ) : (
                renderContent(message.content)
              )}
            </div>
          )}

          {/* Message Actions */}
          {!isEditing && !isStreaming && (
            <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                {!isUser && onSpeak && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSpeak(message.content)}
                    className="h-6 w-6 p-0 hover:bg-slate-100"
                  >
                    <Volume2 className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(message.content)}
                  className="h-6 w-6 p-0 hover:bg-slate-100"
                >
                  {copiedStates.message ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="h-6 w-6 p-0 hover:bg-slate-100"
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                )}
                {onRegenerate && !isUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerate(message.id)}
                    className="h-6 w-6 p-0 hover:bg-slate-100"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(message.id)}
                    className="h-6 w-6 p-0 hover:bg-slate-100 text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Message Info */}
        <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
          <span>{timestamp}</span>
          {!isUser && message.metadata?.model && (
            <div className="flex items-center space-x-2">
              <span>{message.metadata.model}</span>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
