import { type ReactNode } from 'react';
import { LanguageProvider } from './language-provider';
import { ThemeProvider } from './theme-provider';

export const AppProvider = ({ children }: { children: ReactNode }) => (
  <LanguageProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </LanguageProvider>
);
