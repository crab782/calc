import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AddRecord } from './pages/AddRecord';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Accounts } from './pages/Accounts';
import type { PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onCollapse={() => setIsSidebarOpen(false)}
        />
      )}
      <main className="flex-1 overflow-auto">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title="展开侧边栏"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'add-record' && <AddRecord />}
        {currentPage === 'history' && <History />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'accounts' && <Accounts />}
      </main>
    </div>
  );
}

export default App;
