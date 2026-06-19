import { Tabs, Button, Typography } from 'antd';
import { Sun, Tag, Coins, Database, Globe } from 'lucide-react';
import { useLanguage } from '../../providers';
import { ThemeTab } from './tabs/theme-tab';
import { CategoryTab } from './tabs/category-tab';
import { CurrencyTab } from './tabs/currency-tab';
import { DataTab } from './tabs/data-tab';

const { Title } = Typography;

export const SettingsPage = () => {
  const { t, language, toggleLanguage } = useLanguage();

  const items = [
    { key: 'theme', label: t.settings.appearance, icon: <Sun className="w-4 h-4" />, children: <ThemeTab /> },
    { key: 'category', label: t.settings.categoryManagement, icon: <Tag className="w-4 h-4" />, children: <CategoryTab /> },
    { key: 'currency', label: t.settings.currencyManagement, icon: <Coins className="w-4 h-4" />, children: <CurrencyTab /> },
    { key: 'data', label: t.settings.dataManagement, icon: <Database className="w-4 h-4" />, children: <DataTab /> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t.settings.title}</Title>
        <Button size="small" onClick={toggleLanguage} icon={<Globe className="w-4 h-4" />}>
          {language === 'zh' ? 'EN' : '中文'}
        </Button>
      </div>
      <Tabs items={items} tabPosition="left" />
    </div>
  );
};
