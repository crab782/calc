import { LayoutDashboard, PlusCircle, Settings, History, X, Wallet, Settings2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageType } from '../types';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  onCollapse: () => void;
}

export const Sidebar = ({ currentPage, onPageChange, onCollapse }: SidebarProps) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard' as PageType, label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: 'history' as PageType, label: t.sidebar.history, icon: History },
    { id: 'accounts' as PageType, label: t.sidebar.accounts, icon: Wallet },
    { id: 'financial-config' as PageType, label: t.sidebar.financialConfig, icon: Settings2 },
    { id: 'add-record' as PageType, label: t.sidebar.addRecord, icon: PlusCircle },
    { id: 'settings' as PageType, label: t.sidebar.settings, icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen p-4 relative">
      <button
        onClick={onCollapse}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        title={t.sidebar.collapse || '折叠侧边栏'}
      >
        <X className="w-4 h-4" />
      </button>
      <div className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-8 pr-8">{t.sidebar.title}</div>
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
