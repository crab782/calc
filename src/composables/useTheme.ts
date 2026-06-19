import { ref, computed, watchEffect, provide, inject, type Ref, type ComputedRef } from 'vue'

type Theme = 'light' | 'dark' | 'system'
type EffectiveTheme = 'light' | 'dark'

interface ThemeContextType {
  theme: Ref<Theme>
  effectiveTheme: ComputedRef<EffectiveTheme>
  setTheme: (theme: Theme) => void
}

const THEME_STORAGE_KEY = 'expense_tracker_theme'
const ThemeSymbol = Symbol('ThemeContext')

const getSystemTheme = (): EffectiveTheme =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export function createTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  const theme = ref<Theme>(saved || 'system')
  const systemTheme = ref<EffectiveTheme>(getSystemTheme())
  
  const effectiveTheme = computed<EffectiveTheme>(
    () => (theme.value === 'system' ? systemTheme.value : theme.value)
  )
  
  watchEffect(() => {
    const root = document.documentElement
    if (effectiveTheme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  })
  
  // Track system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      systemTheme.value = e.matches ? 'dark' : 'light'
    })
  }
  
  const setTheme = (newTheme: Theme) => {
    theme.value = newTheme
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }
  
  const context: ThemeContextType = { theme, effectiveTheme, setTheme }
  provide(ThemeSymbol, context)
  return context
}

export function useTheme(): ThemeContextType {
  const context = inject(ThemeSymbol)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
