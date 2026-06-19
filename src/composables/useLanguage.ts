import { ref, computed, provide, inject, type Ref } from 'vue'
import zh from '../i18n/locales/zh'
import en from '../i18n/locales/en'

type Language = 'zh' | 'en'
type TranslationType = typeof zh

interface LanguageContextType {
  language: Ref<Language>
  t: TranslationType
  toggleLanguage: () => void
}

const translations: Record<Language, TranslationType> = { zh, en }
const STORAGE_KEY = 'expense_tracker_language'

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en') return 'en'
  return 'zh'
}

const LanguageSymbol = Symbol('LanguageContext')

export function createI18n() {
  const language = ref<Language>(getInitialLanguage())
  
  const t = computed(() => translations[language.value])
  
  const toggleLanguage = () => {
    const next = language.value === 'zh' ? 'en' : 'zh'
    language.value = next
    localStorage.setItem(STORAGE_KEY, next)
  }
  
  const context: LanguageContextType = { language, t, toggleLanguage }
  provide(LanguageSymbol, context)
  return context
}

export function useLanguage(): LanguageContextType {
  const context = inject(LanguageSymbol)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
