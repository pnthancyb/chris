import { motion } from 'framer-motion';
import { Brain, Lightbulb } from 'lucide-react';

interface ThinkingDisplayProps {
  content: string;
  isStreaming?: boolean;
}

export function ThinkingDisplay({ content, isStreaming }: ThinkingDisplayProps) {
  if (!content) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-3"
    >
      <div className="flex items-center space-x-2 mb-2">
        <div className="relative">
          <Brain className="w-4 h-4 text-amber-600" />
          {isStreaming && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
            </motion.div>
          )}
        </div>
        <span className="text-sm font-medium text-amber-800">
          AI Reasoning {isStreaming && <span className="animate-pulse">...</span>}
        </span>
      </div>
      
      <div className="text-sm text-amber-700 prose prose-sm prose-amber max-w-none">
        {content.split('\n').map((line, index) => {
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={index} className="flex items-start space-x-2 my-1">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{line.replace(/^[•\-]\s*/, '')}</span>
              </div>
            );
          }
          
          if (line.trim() === '') {
            return <br key={index} />;
          }
          
          return (
            <p key={index} className="mb-2 last:mb-0">
              {isStreaming && index === content.split('\n').length - 1 ? (
                <span className="typing-animation">{line}</span>
              ) : (
                line
              )}
            </p>
          );
        })}
      </div>
    </motion.div>
  );
}
