import { useState } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { Layout, Button } from 'antd';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AddRecord } from './pages/AddRecord';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Accounts } from './pages/Accounts';
import { FinancialConfig } from './pages/FinancialConfig';
import type { PageType } from './types';

const { Content } = Layout;

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
      {isSidebarOpen && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      )}
      <Layout style={{ flex: 1 }}>
        <Content style={{ overflow: 'auto' }}>
          {!isSidebarOpen && (
            <Button
              type="primary"
              onClick={() => setIsSidebarOpen(true)}
              style={{ position: 'fixed', top: 16, left: 16, zIndex: 1050 }}
              icon={<MenuIcon className="w-4 h-4" />}
            />
          )}
          <div style={{ padding: '24px' }}>
            {currentPage === 'dashboard' && <Dashboard />}
            {currentPage === 'add-record' && <AddRecord />}
            {currentPage === 'history' && <History />}
            {currentPage === 'settings' && <Settings />}
            {currentPage === 'accounts' && <Accounts />}
            {currentPage === 'financial-config' && <FinancialConfig />}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
