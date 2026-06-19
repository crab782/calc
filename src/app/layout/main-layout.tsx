import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import { Layout, Button } from 'antd';
import { Sidebar } from './sidebar';

const { Content } = Layout;

export const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
      {isSidebarOpen && (
        <Sidebar onCollapse={() => setIsSidebarOpen(false)} />
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
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
