import { useCallback } from 'react';
import { Button, Card, Typography } from 'antd';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, useLanguage } from '../../../providers';

const { Text } = Typography;

export const ThemeTab = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  }, [setTheme]);

  const themeOptions = [
    { key: 'light' as const, icon: <Sun className="w-6 h-6" style={{ color: '#eab308' }} />, label: t.settings.lightMode },
    { key: 'dark' as const, icon: <Moon className="w-6 h-6" style={{ color: '#6366f1' }} />, label: t.settings.darkMode },
    { key: 'system' as const, icon: <Monitor className="w-6 h-6" style={{ color: '#6b7280' }} />, label: t.settings.systemMode },
  ];

  return (
    <Card title={t.settings.appearance} bordered={false}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
        {themeOptions.map((option) => (
          <Button
            key={option.key}
            type={theme === option.key ? 'primary' : 'default'}
            onClick={() => handleThemeChange(option.key)}
            style={{
              height: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {option.icon}
            <Text>{option.label}</Text>
          </Button>
        ))}
      </div>
    </Card>
  );
};
