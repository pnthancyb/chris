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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Zap,
  Cpu,
  Terminal,
  FileCode,
  Mic
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
  codeExecution?: boolean;
  pythonEnabled?: boolean;
  jsEnabled?: boolean;
  autoVoice?: boolean;
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences as UserPreferences);
      setSystemPrompt(user.preferences.systemPrompt || '');
      setIsDarkMode((user.preferences as any)?.darkMode || false);
    }
    
    // Check current theme
    const currentTheme = document.documentElement.classList.contains('dark');
    setIsDarkMode(currentTheme);
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
        title: 'Success',
        description: 'Settings updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    },
  });

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferencesMutation.mutate(newPreferences);
    
    // Handle dark mode toggle immediately
    if (key === 'darkMode') {
      setIsDarkMode(value);
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSystemPromptSave = () => {
    handlePreferenceChange('systemPrompt', systemPrompt);
  };

  const AI_MODELS = [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Fast)', description: 'Quick responses, lower accuracy', icon: '⚡' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Versatile)', description: 'Balanced speed and quality', icon: '🌟' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B', description: 'High quality responses', icon: '🦙' },
    { value: 'mistral-saba-24b', label: 'Mistral Saba 24B', description: 'Creative and analytical', icon: '🌬️' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B', description: 'Fast and efficient', icon: '💎' },
    { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 Instruct', description: 'Advanced reasoning model', icon: '🌙' },
  ];

  const TONE_OPTIONS = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and friendly' },
    { value: 'creative', label: 'Creative', description: 'Imaginative and expressive' },
    { value: 'technical', label: 'Technical', description: 'Detailed and precise' },
    { value: 'helpful', label: 'Helpful', description: 'Supportive and educational' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <span className="text-xl">ChrisAI Settings</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile & Account</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input 
                    value={user?.firstName || ''} 
                    disabled 
                    className="bg-slate-50 dark:bg-slate-800" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input 
                    value={user?.lastName || ''} 
                    disabled 
                    className="bg-slate-50 dark:bg-slate-800" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-slate-50 dark:bg-slate-800" 
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
                <span>AI Configuration</span>
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
                          <div className="flex items-center space-x-2">
                            <span>{model.icon}</span>
                            <div className="space-y-1">
                              <div className="font-medium">{model.label}</div>
                              <div className="text-xs text-muted-foreground">{model.description}</div>
                            </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center space-x-2">
                    <Cpu className="w-4 h-4" />
                    <span>Core Features</span>
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Thinking Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Show AI reasoning process
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
                        Enable advanced development tools
                      </p>
                    </div>
                    <Switch
                      checked={preferences.devMode || false}
                      onCheckedChange={(checked) => handlePreferenceChange('devMode', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium flex items-center space-x-2">
                    <Volume2 className="w-4 h-4" />
                    <span>Voice & Audio</span>
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Voice Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable text-to-speech
                      </p>
                    </div>
                    <Switch
                      checked={preferences.voiceEnabled || false}
                      onCheckedChange={(checked) => handlePreferenceChange('voiceEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto Voice Recording</Label>
                      <p className="text-sm text-muted-foreground">
                        Auto-enable voice input
                      </p>
                    </div>
                    <Switch
                      checked={preferences.autoVoice || false}
                      onCheckedChange={(checked) => handlePreferenceChange('autoVoice', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chris Functions - Code Execution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Chris Functions & Code Execution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Python Execution</Label>
                      <p className="text-sm text-muted-foreground">
                        Run Python code directly in chat
                      </p>
                    </div>
                    <Switch
                      checked={preferences.pythonEnabled !== false}
                      onCheckedChange={(checked) => handlePreferenceChange('pythonEnabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>JavaScript Execution</Label>
                      <p className="text-sm text-muted-foreground">
                        Run JavaScript/Node.js code
                      </p>
                    </div>
                    <Switch
                      checked={preferences.jsEnabled !== false}
                      onCheckedChange={(checked) => handlePreferenceChange('jsEnabled', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Code Auto-Execution</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically run code blocks
                      </p>
                    </div>
                    <Switch
                      checked={preferences.codeExecution || false}
                      onCheckedChange={(checked) => handlePreferenceChange('codeExecution', checked)}
                    />
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-700 dark:text-blue-300">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm font-medium">Supported Languages</span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Python, JavaScript, HTML/CSS, Shell, SQL, and more
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Appearance & Interface</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-orange-500" />
                  <Switch
                    checked={isDarkMode}
                    onCheckedChange={(checked) => handlePreferenceChange('darkMode', checked)}
                  />
                  <Moon className="w-4 h-4 text-blue-500" />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Language & Localization</Label>
                <LanguageSelector />
              </div>
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCode className="w-5 h-5" />
                <span>Custom System Prompt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>System Instructions</Label>
                <Textarea
                  placeholder="Enter custom instructions for ChrisAI..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  These instructions will be included in every conversation to customize ChrisAI's behavior.
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
                <span>Privacy & Data Management</span>
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
                <Label>Data Retention Period</Label>
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

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}