import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import { Layout, Button } from 'antd';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AddRecord } from './pages/AddRecord';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { ExchangeRate } from './pages/ExchangeRate';
import { Accounts } from './pages/Accounts';
import { FinancialConfig } from './pages/FinancialConfig';
import { BudgetPlan } from './pages/BudgetPlan';
import { BudgetCalculator } from './pages/BudgetCalculator';

const { Content } = Layout;

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <BrowserRouter basename="/calc">
      <Layout style={{ minHeight: '100vh', flexDirection: 'row' }}>
        {isSidebarOpen && (
          <Sidebar
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
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add-record" element={<AddRecord />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/exchange-rate" element={<ExchangeRate />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/financial-config" element={<FinancialConfig />} />
                <Route path="/budget-plan" element={<BudgetPlan />} />
                <Route path="/budget-calculator" element={<BudgetCalculator />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
