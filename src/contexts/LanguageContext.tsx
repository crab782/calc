import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import zh from '../i18n/locales/zh';
import en from '../i18n/locales/en';

type Language = 'zh' | 'en';
type TranslationType = typeof zh;

interface LanguageContextType {
  language: Language;
  t: TranslationType;
  toggleLanguage: () => void;
}

const translations: Record<Language, TranslationType> = { zh, en };
const STORAGE_KEY = 'expense_tracker_language';

const LanguageContext = createContext<LanguageContextType | null>(null);

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en') return 'en';
  return 'zh';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
