import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Code2, 
  Terminal, 
  Bug, 
  FileCode,
  Play,
  Square
} from 'lucide-react';

interface DeveloperPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCode?: string;
  onCodeExecution?: (code: string) => void;
}

export function DeveloperPanel({ 
  isOpen, 
  onClose, 
  currentCode, 
  onCodeExecution 
}: DeveloperPanelProps) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);

  const handleCodeExecution = async () => {
    if (!currentCode || !onCodeExecution) return;
    
    setIsExecuting(true);
    try {
      setExecutionOutput('Executing code...\n');
      await onCodeExecution(currentCode);
    } catch (error: any) {
      setExecutionOutput(`Error: ${error.message}\n`);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Developer Mode</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
                <TabsTrigger value="analysis">
                  <Bug className="w-4 h-4 mr-1" />
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="execution">
                  <Terminal className="w-4 h-4 mr-1" />
                  Execute
                </TabsTrigger>
                <TabsTrigger value="preview">
                  <FileCode className="w-4 h-4 mr-1" />
                  Preview
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 p-4">
                <TabsContent value="analysis" className="h-full mt-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2 flex items-center">
                          <Bug className="w-4 h-4 mr-1" />
                          Code Analysis
                        </h4>
                        {currentCode ? (
                          <div className="text-sm text-slate-600 space-y-2">
                            <div>Language: JavaScript/TypeScript</div>
                            <div>Lines: {currentCode.split('\n').length}</div>
                            <div>Characters: {currentCode.length}</div>
                            <div className="mt-3">
                              <strong>Detected Patterns:</strong>
                              <ul className="list-disc list-inside mt-1 text-xs">
                                {currentCode.includes('import') && <li>ES6 Imports</li>}
                                {currentCode.includes('function') && <li>Function Declarations</li>}
                                {currentCode.includes('const') && <li>Modern Variable Declarations</li>}
                                {currentCode.includes('=>') && <li>Arrow Functions</li>}
                                {currentCode.includes('async') && <li>Async/Await Pattern</li>}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            No code detected in the current conversation.
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="font-medium text-sm mb-2">Suggestions</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          <div>• Add error handling with try-catch blocks</div>
                          <div>• Consider using TypeScript for better type safety</div>
                          <div>• Add input validation for user data</div>
                          <div>• Include unit tests for better reliability</div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="execution" className="h-full mt-0 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Code Execution</h4>
                    <Button
                      size="sm"
                      onClick={handleCodeExecution}
                      disabled={!currentCode || isExecuting}
                      className="flex items-center space-x-1"
                    >
                      {isExecuting ? (
                        <>
                          <Square className="w-3 h-3" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>Run</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-3 font-mono text-sm overflow-hidden">
                    <ScrollArea className="h-full">
                      {executionOutput || (
                        <div className="text-slate-500">
                          Output will appear here when code is executed...
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="h-full mt-0">
                  <div className="bg-slate-50 rounded-lg p-3 h-full">
                    <h4 className="font-medium text-sm mb-2">Live Preview</h4>
                    <div className="bg-white border rounded p-3 h-5/6 overflow-auto">
                      {currentCode ? (
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <style>
                                  body { font-family: system-ui, sans-serif; margin: 20px; }
                                </style>
                              </head>
                              <body>
                                <div id="root">Preview will appear here</div>
                                <script>
                                  try {
                                    ${currentCode}
                                  } catch (error) {
                                    document.getElementById('root').innerHTML = 
                                      '<div style="color: red;">Error: ' + error.message + '</div>';
                                  }
                                </script>
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts"
                        />
                      ) : (
                        <div className="text-slate-500 text-sm">
                          No code to preview. Share some HTML, CSS, or JavaScript code to see it rendered here.
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
