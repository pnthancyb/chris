export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  tr: {
    code: 'tr', 
    name: 'Turkish',
    nativeName: 'Türkçe'
  },
  ku: {
    code: 'ku',
    name: 'Kurdish',
    nativeName: 'Kurdî'
  },
  es: {
    code: 'es',
    name: 'Spanish', 
    nativeName: 'Español'
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語'
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी'
  }
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export const translations = {
  en: {
    // Navigation
    chat: "Chat",
    promptEngineering: "Prompt Engineering",
    files: "File Upload",
    settings: "Settings",
    
    // Authentication
    login: "Log In",
    register: "Register",
    logout: "Log Out",
    loginWithReplit: "Continue with Replit",
    username: "Username",
    email: "Email", 
    password: "Password",
    createAccount: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    dontHaveAccount: "Don't have an account?",
    
    // Chat Interface
    typeMessage: "Type your message...",
    send: "Send",
    thinking: "Thinking...",
    newChat: "New Chat",
    editMessage: "Edit message",
    deleteMessage: "Delete message",
    regenerateResponse: "Regenerate response",
    copyMessage: "Copy message",
    
    // Settings
    language: "Language",
    aiModel: "AI Model",
    thinkingMode: "Thinking Mode",
    developerMode: "Developer Mode",
    systemPrompt: "System Prompt",
    systemPromptPlaceholder: "Enter custom instructions for the AI...",
    
    // Prompt Engineering
    rawPrompt: "Raw Prompt",
    optimizedPrompt: "Optimized Prompt",
    category: "Category",
    tone: "Tone",
    length: "Length",
    optimizePrompt: "Optimize Prompt",
    copyPrompt: "Copy Prompt",
    sendToChat: "Send to Chat",
    
    // Categories
    general: "General",
    code: "Code",
    creative: "Creative Writing",
    technical: "Technical Explanation",
    imageGeneration: "Image Generation",
    
    // Tones
    professional: "Professional",
    casual: "Casual",
    friendly: "Friendly",
    formal: "Formal",
    
    // Lengths
    short: "Short",
    medium: "Medium",
    long: "Long",
    detailed: "Detailed",
    
    // Voice
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    
    // Files
    uploadFile: "Upload File",
    dragDropFiles: "Drag and drop files here",
    
    // General
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  },
  
  tr: {
    // Navigation
    chat: "Sohbet",
    promptEngineering: "Prompt Mühendisliği",
    files: "Dosya Yükleme",
    settings: "Ayarlar",
    
    // Authentication
    login: "Giriş Yap",
    register: "Kayıt Ol",
    logout: "Çıkış Yap",
    loginWithReplit: "Replit ile Devam Et",
    username: "Kullanıcı Adı",
    email: "E-posta",
    password: "Şifre",
    createAccount: "Hesap Oluştur",
    alreadyHaveAccount: "Zaten hesabınız var mı?",
    dontHaveAccount: "Hesabınız yok mu?",
    
    // Chat Interface
    typeMessage: "Mesajınızı yazın...",
    send: "Gönder",
    thinking: "Düşünüyor...",
    newChat: "Yeni Sohbet",
    editMessage: "Mesajı düzenle",
    deleteMessage: "Mesajı sil",
    regenerateResponse: "Yanıtı yeniden oluştur",
    copyMessage: "Mesajı kopyala",
    
    // Settings
    language: "Dil",
    aiModel: "AI Modeli",
    thinkingMode: "Düşünme Modu",
    developerMode: "Geliştirici Modu",
    systemPrompt: "Sistem Promptu",
    systemPromptPlaceholder: "AI için özel talimatlar girin...",
    
    // Other translations would be added here...
    general: "Genel",
    save: "Kaydet",
    cancel: "İptal",
    loading: "Yükleniyor...",
    error: "Hata",
    success: "Başarılı"
  },
  
  ku: {
    // Navigation  
    chat: "Gotûbêj",
    promptEngineering: "Endezyariya Prompt",
    files: "Barkirina Pelan",
    settings: "Mîheng",
    
    // Authentication
    login: "Têketin",
    register: "Tomar bikin",
    logout: "Derkeve",
    loginWithReplit: "Bi Replit re bidomînin",
    username: "Navê bikarhêner",
    email: "E-name",
    password: "Şîfre",
    
    // Basic translations
    general: "Giştî",
    save: "Tomar bike",
    cancel: "Betal bike",
    loading: "Tê barkirin...",
    error: "Çewtî",
    success: "Serkeftî"
  },
  
  es: {
    // Navigation
    chat: "Chat",
    promptEngineering: "Ingeniería de Prompts",
    files: "Subir Archivos",
    settings: "Configuración",
    
    // Authentication
    login: "Iniciar Sesión",
    register: "Registrarse",
    logout: "Cerrar Sesión",
    loginWithReplit: "Continuar con Replit",
    username: "Nombre de Usuario",
    email: "Correo Electrónico",
    password: "Contraseña",
    
    // Basic translations
    general: "General",
    save: "Guardar",
    cancel: "Cancelar",
    loading: "Cargando...",
    error: "Error",
    success: "Éxito"
  },
  
  ja: {
    // Navigation
    chat: "チャット",
    promptEngineering: "プロンプトエンジニアリング",
    files: "ファイルアップロード",
    settings: "設定",
    
    // Authentication
    login: "ログイン",
    register: "登録",
    logout: "ログアウト",
    loginWithReplit: "Replitで続行",
    username: "ユーザー名",
    email: "メールアドレス",
    password: "パスワード",
    
    // Basic translations
    general: "一般",
    save: "保存",
    cancel: "キャンセル",
    loading: "読み込み中...",
    error: "エラー",
    success: "成功"
  },
  
  hi: {
    // Navigation
    chat: "चैट",
    promptEngineering: "प्रॉम्प्ट इंजीनियरिंग",
    files: "फ़ाइल अपलोड",
    settings: "सेटिंग्स",
    
    // Authentication
    login: "लॉग इन",
    register: "पंजीकरण",
    logout: "लॉग आउट",
    loginWithReplit: "Replit के साथ जारी रखें",
    username: "उपयोगकर्ता नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    
    // Basic translations
    general: "सामान्य",
    save: "सेव करें",
    cancel: "रद्द करें",
    loading: "लोड हो रहा है...",
    error: "त्रुटि",
    success: "सफलता"
  }
} as const;

export const getLanguagePromptPrefix = (languageCode: LanguageCode): string => {
  const languageNames = {
    en: "English",
    tr: "Turkish", 
    ku: "Kurdish (Kurmanji)",
    es: "Spanish",
    ja: "Japanese",
    hi: "Hindi"
  };
  
  return `Please respond only in ${languageNames[languageCode]}, never use another language unless explicitly asked to translate.`;
};