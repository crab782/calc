import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './app/providers/app-provider';
import { AppRouter } from './app/router';
import { ErrorBoundary } from './app/shared/components/error-boundary';
import { useTheme } from './app/providers/theme-provider';

function AppContent() {
  const { effectiveTheme } = useTheme();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontSize: 14,
        },
        algorithm: effectiveTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        components: {
          Layout: {
            bodyBg: effectiveTheme === 'dark' ? '#141414' : '#f5f5f5',
            headerBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            siderBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
            triggerBg: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Card: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Menu: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Table: {
            colorBgContainer: effectiveTheme === 'dark' ? '#1f1f1f' : '#ffffff',
          },
        },
      }}
    >
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </ConfigProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
