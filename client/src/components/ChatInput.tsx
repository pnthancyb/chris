import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAudioRecording } from '@/hooks/useAudioRecording';
import { FileUpload } from './FileUpload';
import { VoiceRecorderButton } from './VoiceRecorderButton';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Square,
  Bold,
  Italic,
  Code
} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

interface AttachedFile {
  file: File;
  id: string;
}

export function ChatInput({ onSendMessage, isLoading, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showFormatToolbar, setShowFormatToolbar] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isRecording, isProcessing, recordAndTranscribe } = useAudioRecording();

  const handleSubmit = useCallback(() => {
    if ((!message.trim() && attachedFiles.length === 0) || isLoading || disabled) return;
    
    onSendMessage(message.trim(), attachedFiles.map(af => af.file));
    setMessage('');
    setAttachedFiles([]);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, attachedFiles, onSendMessage, isLoading, disabled]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
  };

  const handleVoiceRecording = async () => {
    try {
      const transcription = await recordAndTranscribe();
      if (transcription) {
        setMessage(prev => prev + (prev ? ' ' : '') + transcription);
      }
    } catch (error) {
      console.error('Voice recording failed:', error);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const newFiles = files.map(file => ({
      file,
      id: crypto.randomUUID(),
    }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    setShowFileUpload(false);
  };

  const removeAttachedFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(af => af.id !== id));
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'code') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);

    let formattedText: string;
    let cursorOffset: number;

    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = selectedText ? 0 : 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorOffset = selectedText ? 0 : 1;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        cursorOffset = selectedText ? 0 : 1;
        break;
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    setMessage(newMessage);

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + formattedText.length - cursorOffset,
        start + formattedText.length - cursorOffset
      );
    }, 0);
  };

  const characterCount = message.length;
  const maxCharacters = 8000;
  const isAtLimit = characterCount >= maxCharacters;

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
      <div className="max-w-4xl mx-auto">
        {/* File Upload Preview */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3"
            >
              <div className="flex flex-wrap gap-2">
                {attachedFiles.map((attachedFile) => (
                  <div
                    key={attachedFile.id}
                    className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border"
                  >
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-700 truncate max-w-32">
                      {attachedFile.file.name}
                    </span>
                    <button
                      onClick={() => removeAttachedFile(attachedFile.id)}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                    >
                      <Square className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Row */}
        <div className="flex items-end space-x-3 relative">
          {/* File Upload Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFileUpload(true)}
            disabled={disabled}
            className="text-slate-500 hover:text-slate-700"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Voice Recording Button */}
          <VoiceRecorderButton 
            onTranscription={(text) => {
              setMessage(prev => prev + (prev ? ' ' : '') + text);
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
            }}
            isLoading={disabled}
          />

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyPress}
              onFocus={() => setShowFormatToolbar(true)}
              onBlur={() => setTimeout(() => setShowFormatToolbar(false), 200)}
              placeholder="Ask ChrisAI anything..."
              className="min-h-[48px] max-h-32 resize-none pr-4"
              disabled={disabled}
              maxLength={maxCharacters}
            />

            {/* Format Toolbar */}
            <AnimatePresence>
              {showFormatToolbar && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-4 -top-10 bg-white border border-slate-200 rounded-lg px-3 py-1 shadow-sm z-10"
                >
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => insertFormatting('bold')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => insertFormatting('italic')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => insertFormatting('code')}
                      className="p-1 hover:bg-slate-100 rounded text-slate-600"
                      title="Code"
                    >
                      <Code className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSubmit}
            disabled={(!message.trim() && attachedFiles.length === 0) || isLoading || disabled || isAtLimit}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Input Help Text */}
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <div className="flex items-center space-x-4">
            <span>Press <kbd className="px-1 py-0.5 bg-slate-100 rounded font-mono">⌘</kbd> + <kbd className="px-1 py-0.5 bg-slate-100 rounded font-mono">Enter</kbd> to send</span>
            <span>•</span>
            <span>Use <kbd className="px-1 py-0.5 bg-slate-100 rounded font-mono">**bold**</kbd> and <kbd className="px-1 py-0.5 bg-slate-100 rounded font-mono">`code`</kbd></span>
          </div>
          <div className={`flex items-center space-x-2 ${isAtLimit ? 'text-red-500' : ''}`}>
            <span>{characterCount} / {maxCharacters}</span>
          </div>
        </div>

        {/* File Upload Modal */}
        <FileUpload
          isOpen={showFileUpload}
          onClose={() => setShowFileUpload(false)}
          onFilesSelected={handleFilesSelected}
        />
      </div>
    </div>
  );
}
