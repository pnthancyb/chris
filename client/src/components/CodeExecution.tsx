import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Play, 
  Square, 
  Terminal, 
  Code, 
  FileText, 
  Download,
  Copy,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface CodeExecutionProps {
  code: string;
  language?: string;
  onResult?: (result: any) => void;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
  language: string;
}

const SUPPORTED_LANGUAGES = [
  { value: 'python', label: 'Python', icon: '🐍', extension: '.py' },
  { value: 'javascript', label: 'JavaScript', icon: '🟨', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷', extension: '.ts' },
  { value: 'bash', label: 'Bash', icon: '⚫', extension: '.sh' },
  { value: 'sql', label: 'SQL', icon: '🗄️', extension: '.sql' },
  { value: 'html', label: 'HTML', icon: '🌐', extension: '.html' },
  { value: 'css', label: 'CSS', icon: '🎨', extension: '.css' },
];

export function CodeExecution({ code, language = 'python', onResult }: CodeExecutionProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const { toast } = useToast();

  const executeCode = async () => {
    if (!code.trim()) {
      toast({
        title: 'No Code',
        description: 'Please provide code to execute',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const response = await apiRequest('POST', '/api/code/execute', {
        code: code.trim(),
        language: selectedLanguage,
      });
      
      const executionResult = await response.json();
      const executionTime = Date.now() - startTime;
      
      const result: ExecutionResult = {
        success: executionResult.success || !executionResult.error,
        output: executionResult.output || '',
        error: executionResult.error,
        executionTime,
        language: selectedLanguage,
      };

      setResult(result);
      onResult?.(result);

      if (!result.success) {
        toast({
          title: 'Execution Error',
          description: 'Code execution failed. Check the output for details.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Code Executed',
          description: `Successfully executed ${selectedLanguage} code`,
        });
      }
    } catch (error: any) {
      const result: ExecutionResult = {
        success: false,
        output: '',
        error: error.message || 'Failed to execute code',
        executionTime: Date.now() - startTime,
        language: selectedLanguage,
      };

      setResult(result);
      toast({
        title: 'Execution Failed',
        description: error.message || 'Failed to execute code',
        variant: 'destructive',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Output copied to clipboard',
    });
  };

  const downloadOutput = () => {
    if (!result) return;

    const content = result.success ? result.output : result.error;
    const blob = new Blob([content || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `output-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const selectedLangData = SUPPORTED_LANGUAGES.find(lang => lang.value === selectedLanguage);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Terminal className="w-5 h-5" />
              <span>Code Execution</span>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      <div className="flex items-center space-x-2">
                        <span>{lang.icon}</span>
                        <span>{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={executeCode} 
                disabled={isExecuting || !code.trim()}
                className="flex items-center space-x-2"
              >
                {isExecuting ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Code Preview */}
            <div className="border rounded-lg bg-slate-50 dark:bg-slate-900">
              <div className="p-3 border-b bg-slate-100 dark:bg-slate-800 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Code Preview ({selectedLangData?.label})
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {code.split('\n').length} lines
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <pre className="p-4 text-sm overflow-x-auto max-h-40">
                <code>{code}</code>
              </pre>
            </div>

            {/* Execution Status */}
            {isExecuting && (
              <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Executing {selectedLangData?.label} code...
                </span>
              </div>
            )}

            {/* Execution Result */}
            {result && (
              <div className="space-y-3">
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {result.success ? 'Execution Successful' : 'Execution Failed'}
                    </span>
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{result.executionTime}ms</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(result.success ? result.output : result.error || '')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadOutput}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Output Display */}
                <div className="border rounded-lg">
                  <div className="p-3 border-b bg-slate-50 dark:bg-slate-800 rounded-t-lg">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {result.success ? 'Output' : 'Error'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-4 font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto ${
                    result.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {result.success ? (
                      result.output || '(No output)'
                    ) : (
                      result.error || 'Unknown error occurred'
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}