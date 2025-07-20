import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AuthModal } from '@/components/Auth/AuthModal';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSelector } from '@/components/Settings/LanguageSelector';
import { 
  Brain, 
  Zap, 
  MessageSquare, 
  Mic, 
  Upload, 
  Code2,
  Sparkles,
  Shield,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: <Brain className="w-6 h-6" />,
    title: "Multiple AI Models",
    description: "Access powerful models like Llama 3.3 70B, Mistral, and Gemma for different tasks"
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Thinking Mode",
    description: "See AI reasoning process with detailed step-by-step explanations"
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Interface",
    description: "Speak naturally with voice input and text-to-speech responses"
  },
  {
    icon: <Upload className="w-6 h-6" />,
    title: "File Processing",
    description: "Upload and analyze PDFs, images, documents, and audio files"
  },
  {
    icon: <Code2 className="w-6 h-6" />,
    title: "Developer Tools",
    description: "Interactive coding support with syntax highlighting and debugging"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Secure & Private",
    description: "Your conversations and data are protected with enterprise-grade security"
  }
];

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { t } = useLanguage();

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    window.location.reload(); // Refresh to show authenticated state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">ChrisAI</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Advanced AI Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-48">
                <LanguageSelector />
              </div>
              <Button 
                onClick={() => setAuthModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('login')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl flex items-center justify-center">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.8, 0.5]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-3xl -z-10"
                  />
                </div>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
                Meet{' '}
                <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  ChrisAI
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
                The most advanced AI assistant with multi-model intelligence, 
                voice capabilities, and deep personalization
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/api/login'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Chatting
                </Button>
                
                <Button 
                  size="lg"
                  variant="outline"
                  className="px-8 py-3 text-lg border-slate-300 hover:bg-slate-50"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Learn More
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Powerful Features for Every Task
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              ChrisAI combines cutting-edge AI models with intuitive tools to help you work smarter and faster
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center text-blue-600">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Multiple AI Models at Your Fingertips
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Choose from the best open-source models, each optimized for specific tasks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Llama 3.3 70B", desc: "Most versatile and capable", speed: "Medium", icon: "🦙" },
              { name: "Llama 3.1 8B", desc: "Lightning fast responses", speed: "Fast", icon: "⚡" },
              { name: "Mistral Saba 24B", desc: "Advanced reasoning", speed: "Medium", icon: "🌬️" },
              { name: "Gemma 2 9B", desc: "Efficient and accurate", speed: "Fast", icon: "💎" },
              { name: "DeepSeek R1", desc: "Deep thinking mode", speed: "Slow", icon: "🧠" },
              { name: "Whisper Large", desc: "Voice transcription", speed: "Fast", icon: "🎤" }
            ].map((model, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{model.icon}</span>
                      <div>
                        <h4 className="font-semibold text-slate-900">{model.name}</h4>
                        <p className="text-sm text-slate-600">{model.desc}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        model.speed === 'Fast' ? 'bg-green-100 text-green-700' :
                        model.speed === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {model.speed}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Experience the Future of AI?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are already using ChrisAI to boost their productivity 
              and unlock new possibilities with AI
            </p>
            
            <Button 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              className="bg-white text-blue-600 hover:bg-slate-50 px-8 py-3 text-lg font-semibold"
            >
              <Zap className="w-5 h-5 mr-2" />
              Get Started for Free
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">ChrisAI</h3>
                <p className="text-sm text-slate-400">Advanced AI Assistant</p>
              </div>
            </div>
            
            <div className="text-sm text-slate-400">
              © 2024 ChrisAI. Powered by cutting-edge AI technology.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
