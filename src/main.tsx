import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { LanguageProvider, useLanguage } from './contexts/LanguageContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import './index.css'
import App from './App.tsx'

function AntdConfig({ children }: { children: React.ReactNode }) {
  const { effectiveTheme } = useTheme();
  const { language } = useLanguage();

  const isDark = effectiveTheme === 'dark';
  const locale = language === 'zh' ? zhCN : enUS;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontSize: 14,
        },
        algorithm: isDark ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
        components: {
          Layout: {
            bodyBg: isDark ? '#141414' : '#f5f5f5',
            headerBg: isDark ? '#1f1f1f' : '#ffffff',
            siderBg: isDark ? '#1f1f1f' : '#ffffff',
            triggerBg: isDark ? '#1f1f1f' : '#ffffff',
          },
          Card: {
            colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          },
          Menu: {
            colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          },
          Table: {
            colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
      locale={locale}
    >
      {children}
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <AntdConfig>
          <App />
        </AntdConfig>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)
