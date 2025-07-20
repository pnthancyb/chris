import { useState, useEffect, createContext, useContext } from 'react';
import { LanguageCode, translations } from '@/lib/languages';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export function useLanguageProvider() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(() => {
    // Get language from localStorage or default to English
    const stored = localStorage.getItem('chrisai-language');
    return (stored as LanguageCode) || 'en';
  });

  const setLanguage = (language: LanguageCode) => {
    setCurrentLanguage(language);
    localStorage.setItem('chrisai-language', language);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Fallback to English if translation not found
    if (value === undefined && currentLanguage !== 'en') {
      value = translations.en;
      for (const k of keys) {
        value = value?.[k];
      }
    }
    
    return value || key;
  };

  return {
    currentLanguage,
    setLanguage,
    t
  };
}