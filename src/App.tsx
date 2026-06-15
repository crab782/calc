import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AddRecord } from './pages/AddRecord';
import type { PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [recordsChanged, setRecordsChanged] = useState(false);

  const handleRecordsChange = () => {
    setRecordsChanged(!recordsChanged);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && (
          <Dashboard key={recordsChanged.toString()} onRecordsChange={handleRecordsChange} />
        )}
        {currentPage === 'add-record' && (
          <AddRecord onSave={handleRecordsChange} />
        )}
      </main>
    </div>
  );
}

export default App;
