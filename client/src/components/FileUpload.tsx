import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  X, 
  File, 
  Image, 
  FileText, 
  Music,
  Video,
  Archive
} from 'lucide-react';

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string;
  maxFileSize?: number;
  multiple?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function FileUpload({
  isOpen,
  onClose,
  onFilesSelected,
  acceptedTypes = '.pdf,.doc,.docx,.txt,.jpg,.png,.gif,.mp3,.wav,.mp4',
  maxFileSize = 50 * 1024 * 1024, // 50MB
  multiple = true
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-6 h-6" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-6 h-6" />;
    if (mimeType.startsWith('video/')) return <Video className="w-6 h-6" />;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="w-6 h-6" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-6 h-6" />;
    return <File className="w-6 h-6" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File "${file.name}" is too large. Max size: ${formatFileSize(maxFileSize)}`;
    }
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (acceptedTypes && !acceptedTypes.includes(fileExtension)) {
      return `File type "${fileExtension}" is not supported`;
    }
    
    return null;
  }, [maxFileSize, acceptedTypes]);

  const uploadFile = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Simulate progress updates
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        
        setUploadingFiles(prev => 
          prev.map(uf => 
            uf.file === file ? { ...uf, progress } : uf
          )
        );
      }, 200);

      await response.json();
    } catch (error: any) {
      setUploadingFiles(prev => 
        prev.map(uf => 
          uf.file === file 
            ? { ...uf, error: error.message, progress: 0 }
            : uf
        )
      );
    }
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Validate files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    setErrors(newErrors);

    if (validFiles.length === 0) return;

    // Initialize uploading state
    const uploadingFiles = validFiles.map(file => ({
      file,
      progress: 0,
    }));
    setUploadingFiles(uploadingFiles);

    // Upload files
    await Promise.all(validFiles.map(uploadFile));

    // Call callback with valid files
    onFilesSelected(validFiles);

    // Clear uploading state after a delay
    setTimeout(() => {
      setUploadingFiles([]);
      onClose();
    }, 1000);
  }, [validateFile, onFilesSelected, onClose]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeUploadingFile = (fileToRemove: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== fileToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <p className="text-sm text-slate-600">
            Upload files to process and analyze with the AI assistant
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-4">
              <Upload className={`w-12 h-12 ${isDragOver ? 'text-blue-500' : 'text-slate-400'}`} />
              
              <div>
                <p className="text-lg font-medium text-slate-900">
                  Drop files here or{' '}
                  <button 
                    className="text-blue-600 hover:text-blue-700 underline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    browse
                  </button>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Supports: {acceptedTypes.replace(/\./g, '').toUpperCase()} (Max: {formatFileSize(maxFileSize)})
                </p>
              </div>
            </div>
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptedTypes}
            multiple={multiple}
            onChange={handleFileInputChange}
          />

          {/* Errors */}
          <AnimatePresence>
            {errors.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <h4 className="font-medium text-red-800 mb-2">Upload Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Uploading Files */}
          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <h4 className="font-medium">Uploading Files:</h4>
                {uploadingFiles.map((uploadingFile, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="text-slate-500">
                      {getFileIcon(uploadingFile.file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                      {uploadingFile.error ? (
                        <p className="text-xs text-red-600 mt-1">
                          {uploadingFile.error}
                        </p>
                      ) : (
                        <div className="mt-2">
                          <Progress value={uploadingFile.progress} className="h-1" />
                          <p className="text-xs text-slate-500 mt-1">
                            {Math.round(uploadingFile.progress)}% complete
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(uploadingFile.file)}
                      className="p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
