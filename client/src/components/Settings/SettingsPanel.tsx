import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { LanguageSelector } from './LanguageSelector';
import { 
  Settings, 
  User, 
  Brain, 
  Code, 
  Palette, 
  Volume2,
  Moon,
  Sun,
  Shield,
  Database,
  Zap
} from 'lucide-react';

interface UserPreferences {
  preferredModel?: string;
  tone?: string;
  language?: string;
  thinkingMode?: boolean;
  devMode?: boolean;
  systemPrompt?: string;
  voiceEnabled?: boolean;
  darkMode?: boolean;
  autoSave?: boolean;
  dataRetention?: number;
}

export function SettingsPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [systemPrompt, setSystemPrompt] = useState('');

  // Load user preferences
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences as UserPreferences);
      setSystemPrompt(user.preferences.systemPrompt || '');
    }
  }, [user]);

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPreferences: UserPreferences) => {
      const response = await apiRequest('PATCH', '/api/user/preferences', newPreferences);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: t('success'),
        description: 'Settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: t('error'),
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferencesMutation.mutate(newPreferences);
  };

  const handleSystemPromptSave = () => {
    handlePreferenceChange('systemPrompt', systemPrompt);
  };

  const AI_MODELS = [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)', description: 'Quick responses, lower accuracy' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)', description: 'Balanced speed and quality' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B', description: 'High quality responses' },
    { value: 'mistral-saba-24b', label: 'Mistral Saba 24B', description: 'Creative and analytical' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B', description: 'Fast and efficient' },
  ];

  const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and friendly' },
    { value: 'creative', label: 'Creative', description: 'Imaginative and expressive' },
    { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
    { value: 'helpful', label: 'Helpful', description: 'Supportive and educational' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                value={user?.firstName || ''} 
                disabled 
                className="bg-slate-50" 
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={user?.lastName || ''} 
                disabled 
                className="bg-slate-50" 
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-slate-50" 
              />
            </div>
            <div className="space-y-2">
              <Label>Auth Provider</Label>
              <Badge variant="outline" className="w-fit">
                {user?.authProvider === 'replit' ? 'Replit Auth' : 'Custom Auth'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Preferred AI Model</Label>
              <Select 
                value={preferences.preferredModel || 'llama-3.3-70b-versatile'} 
                onValueChange={(value) => handlePreferenceChange('preferredModel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="space-y-1">
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-muted-foreground">{model.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Response Tone</Label>
              <Select 
                value={preferences.tone || 'helpful'} 
                onValueChange={(value) => handlePreferenceChange('tone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((tone) => (
                    <SelectItem key={tone.value} value={tone.value}>
                      <div className="space-y-1">
                        <div className="font-medium">{tone.label}</div>
                        <div className="text-xs text-muted-foreground">{tone.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Thinking Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Show AI reasoning process before responses
                </p>
              </div>
              <Switch
                checked={preferences.thinkingMode || false}
                onCheckedChange={(checked) => handlePreferenceChange('thinkingMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Developer Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable code execution and advanced debugging tools
                </p>
              </div>
              <Switch
                checked={preferences.devMode || false}
                onCheckedChange={(checked) => handlePreferenceChange('devMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Voice Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Enable text-to-speech for AI responses
                </p>
              </div>
              <Switch
                checked={preferences.voiceEnabled || false}
                onCheckedChange={(checked) => handlePreferenceChange('voiceEnabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Language & Localization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSelector />
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Custom System Prompt</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>System Instructions</Label>
            <Textarea
              placeholder="Enter custom instructions for the AI assistant..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These instructions will be included in every conversation to customize the AI's behavior.
            </p>
          </div>
          <Button onClick={handleSystemPromptSave} disabled={updatePreferencesMutation.isPending}>
            <Zap className="w-4 h-4 mr-2" />
            {updatePreferencesMutation.isPending ? 'Saving...' : 'Save System Prompt'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy & Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Privacy & Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Auto-save Conversations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save your chat history
              </p>
            </div>
            <Switch
              checked={preferences.autoSave !== false}
              onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Data Retention</Label>
            <Select 
              value={String(preferences.dataRetention || 30)} 
              onValueChange={(value) => handlePreferenceChange('dataRetention', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="-1">Forever</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How long to keep your chat history before automatic deletion
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Account Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              Export Chat History
            </Button>
            <Button variant="outline" className="justify-start">
              Download Personal Data
            </Button>
            <Button variant="outline" className="justify-start">
              Clear All Conversations
            </Button>
            <Button variant="destructive" className="justify-start">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}