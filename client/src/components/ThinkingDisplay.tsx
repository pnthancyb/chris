import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThinkingDisplayProps {
  content?: string;
  isVisible?: boolean;
  isStreaming?: boolean;
  thinkingTime?: number;
}

export function ThinkingDisplay({ 
  content, 
  isVisible = true, 
  isStreaming = false,
  thinkingTime = 0
}: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !content) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="mx-4 mb-4">
      <Button
        variant="outline"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800"
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span className="text-sm font-medium">
            {isStreaming ? 'AI is thinking...' : 'View AI Reasoning'}
          </span>
          {isStreaming && <Loader2 className="w-4 h-4 animate-spin" />}
          {!isStreaming && thinkingTime > 0 && (
            <div className="flex items-center space-x-1 text-xs text-blue-600">
              <Clock className="w-3 h-3" />
              <span>{formatTime(thinkingTime)}</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-50 border border-blue-200 border-t-0 rounded-b-lg p-4 overflow-hidden"
          >
            <div className="text-sm text-blue-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}