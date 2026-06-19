import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  History,
  X,
  Wallet,
  Settings2,
  Target,
  Banknote,
} from 'lucide-react';
import { Layout, Menu, Button } from 'antd';
import { useLanguage } from '../providers';
import { useAccounts } from '../hooks/use-accounts';
import { useRecords } from '../hooks/use-records';
import { ROUTES } from '../router/routes';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

interface SidebarProps {
  onCollapse: () => void;
}

export const Sidebar = ({ onCollapse }: SidebarProps) => {
  const { t } = useLanguage();
  const { records } = useRecords();
  const { accounts } = useAccounts(records);
  const navigate = useNavigate();
  const location = useLocation();

  // 获取默认币种
  const defaultCurrency = accounts.find(a => a.isDefault)?.currency || 'CNY';

  // 检查是否启用了多币种（有非默认币种且可见的账户）
  const hasMultiCurrency = accounts.some(a => a.currency !== defaultCurrency && a.visible);

  const menuItems = [
    { key: ROUTES.DASHBOARD, label: t.sidebar.dashboard, icon: <LayoutDashboard className="w-[16px] h-[16px]" /> },
    { key: ROUTES.RECORDS_HISTORY, label: t.sidebar.history, icon: <History className="w-[16px] h-[16px]" /> },
    { key: ROUTES.ACCOUNTS, label: t.sidebar.accounts, icon: <Wallet className="w-[16px] h-[16px]" /> },
    ...(hasMultiCurrency ? [{ key: ROUTES.EXCHANGE_RATE, label: t.sidebar.exchangeRate, icon: <Banknote className="w-[16px] h-[16px]" /> }] : []),
    { key: ROUTES.FINANCIAL_CONFIG, label: t.sidebar.financialConfig, icon: <Settings2 className="w-[16px] h-[16px]" /> },
    { key: ROUTES.BUDGET_PLAN, label: t.sidebar.budgetPlan, icon: <Target className="w-[16px] h-[16px]" /> },
    { key: ROUTES.RECORDS_ADD, label: t.sidebar.addRecord, icon: <PlusCircle className="w-[16px] h-[16px]" /> },
    { key: ROUTES.SETTINGS, label: t.sidebar.settings, icon: <Settings className="w-[16px] h-[16px]" /> },
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
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 'none' }}
      />
    </Sider>
  );
};
