import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  History,
  X,
  Wallet,
  Settings2,
  Target,
} from 'lucide-react';
import { Layout, Menu, Button } from 'antd';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageType } from '../types';

const { Sider } = Layout;

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onCollapse: () => void;
}

export const Sidebar = ({ currentPage, onPageChange, onCollapse }: SidebarProps) => {
  const { t } = useLanguage();

  const menuItems = [
    { key: 'dashboard', label: t.sidebar.dashboard, icon: <LayoutDashboard className="w-[16px] h-[16px]" /> },
    { key: 'history', label: t.sidebar.history, icon: <History className="w-[16px] h-[16px]" /> },
    { key: 'accounts', label: t.sidebar.accounts, icon: <Wallet className="w-[16px] h-[16px]" /> },
    { key: 'financial-config', label: t.sidebar.financialConfig, icon: <Settings2 className="w-[16px] h-[16px]" /> },
    { key: 'budget-plan', label: t.sidebar.budgetPlan, icon: <Target className="w-[16px] h-[16px]" /> },
    { key: 'add-record', label: t.sidebar.addRecord, icon: <PlusCircle className="w-[16px] h-[16px]" /> },
    { key: 'settings', label: t.sidebar.settings, icon: <Settings className="w-[16px] h-[16px]" /> },
  ];

  return (
    <Sider
      width={240}
      trigger={null}
      collapsible={false}
      theme="light"
      style={{
        borderRight: '1px solid var(--ant-color-border, #d9d9d9)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflow: 'auto',
      }}
    >
      <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--ant-color-text, #000)' }}>
          {t.sidebar.title}
        </div>
        <Button
          type="text"
          size="small"
          icon={<X className="w-4 h-4" />}
          onClick={onCollapse}
          title={t.sidebar.collapse || '折叠侧边栏'}
        />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentPage]}
        items={menuItems as any}
        onClick={({ key }) => onPageChange(key as PageType)}
        style={{ borderRight: 'none' }}
      />
    </Sider>
  );
};
