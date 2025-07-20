import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Send, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';

interface PromptEngineeringTabProps {
  onSendToChat?: (prompt: string) => void;
}

export function PromptEngineeringTab({ onSendToChat }: PromptEngineeringTabProps) {
  const [rawPrompt, setRawPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [category, setCategory] = useState('general');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [explanation, setExplanation] = useState('');
  
  const { toast } = useToast();
  const { t } = useLanguage();

  const categories = [
    { value: 'general', label: t('general') },
    { value: 'code', label: t('code') },
    { value: 'creative', label: t('creative') },
    { value: 'technical', label: t('technical') },
    { value: 'imageGeneration', label: t('imageGeneration') },
  ];

  const tones = [
    { value: 'professional', label: t('professional') },
    { value: 'casual', label: t('casual') },
    { value: 'friendly', label: t('friendly') },
    { value: 'formal', label: t('formal') },
  ];

  const lengths = [
    { value: 'short', label: t('short') },
    { value: 'medium', label: t('medium') },
    { value: 'long', label: t('long') },
    { value: 'detailed', label: t('detailed') },
  ];

  const optimizePrompt = async () => {
    if (!rawPrompt.trim()) {
      toast({
        title: t('error'),
        description: 'Please enter a prompt to optimize',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await apiRequest('POST', '/api/prompt/optimize', {
        rawPrompt,
        category,
        tone,
        length,
      });

      const data = await response.json();
      setOptimizedPrompt(data.optimizedPrompt);
      setExplanation(data.explanation);
      
      toast({
        title: t('success'),
        description: 'Prompt optimized successfully',
      });
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || 'Failed to optimize prompt',
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('success'),
        description: 'Copied to clipboard',
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const sendToChat = () => {
    if (optimizedPrompt && onSendToChat) {
      onSendToChat(optimizedPrompt);
      toast({
        title: t('success'),
        description: 'Sent optimized prompt to chat',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">{t('promptEngineering')}</h2>
          <p className="text-muted-foreground">
            Transform your ideas into optimized prompts for better AI responses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{t('category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('tone')}</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('length')}</Label>
            <Select value={length} onValueChange={setLength}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lengths.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{t('rawPrompt')}</span>
              <Badge variant="outline">Input</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your raw idea or prompt here..."
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              className="min-h-[200px]"
            />
            
            <Button 
              onClick={optimizePrompt} 
              disabled={isOptimizing || !rawPrompt.trim()}
              className="w-full"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {isOptimizing ? t('loading') : t('optimizePrompt')}
            </Button>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{t('optimizedPrompt')}</span>
                <Badge variant="default">Output</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {optimizedPrompt ? (
                <>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{optimizedPrompt}</p>
                  </div>
                  
                  {explanation && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Optimization:</strong> {explanation}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => copyToClipboard(optimizedPrompt)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {t('copyPrompt')}
                    </Button>
                    
                    {onSendToChat && (
                      <Button 
                        onClick={sendToChat}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {t('sendToChat')}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  <p>Your optimized prompt will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}