import { LayoutDashboard, PlusCircle, Settings, History, Menu, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import type { PageType } from '../types';

interface SidebarProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ currentPage, onPageChange, isOpen, onToggle }: SidebarProps) => {
  const { t } = useLanguage();

  const menuItems = [
    { id: 'dashboard' as PageType, label: t.sidebar.dashboard, icon: LayoutDashboard },
    { id: 'history' as PageType, label: t.sidebar.history, icon: History },
    { id: 'add-record' as PageType, label: t.sidebar.addRecord, icon: PlusCircle },
    { id: 'settings' as PageType, label: t.sidebar.settings, icon: Settings },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        title={isOpen ? '关闭侧边栏' : '打开侧边栏'}
      >
        {isOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 min-h-screen p-4 transition-all duration-300 ${
          isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'
        }`}
      >
        <div className="text-xl font-bold text-gray-800 mb-8 pl-12">{t.sidebar.title}</div>
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
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      </aside>
    </>
  );
};
