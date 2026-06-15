import { useState, useRef } from 'react';
import { exportData, importData, clearAllData, getRecords } from '../utils/storage';
import { Download, Upload, Trash2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  onDataChange: () => void;
}

export const Settings = ({ onDataChange }: SettingsProps) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordsCount = getRecords().length;

  const handleExport = () => {
    const jsonData = exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: '数据导出成功！' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (recordsCount > 0) {
      if (!confirm(`当前有 ${recordsCount} 条记录，导入将覆盖现有数据，确定继续？`)) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const importResult = importData(result);
      
      if (importResult.success) {
        setMessage({ type: 'success', text: importResult.message });
        onDataChange();
      } else {
        setMessage({ type: 'error', text: importResult.message });
      }
      
      setTimeout(() => setMessage(null), 3000);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearData = () => {
    clearAllData();
    onDataChange();
    setMessage({ type: 'success', text: '所有数据已清除' });
    setShowConfirmClear(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 flex-1">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">设置</h1>
      
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : message.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : message.type === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">数据管理</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">当前记录数</p>
                <p className="text-xl font-bold text-gray-800">{recordsCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>导出数据</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>导入数据</span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">清除所有数据</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-medium text-blue-800 mb-2">导入导出说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 导出的数据为 JSON 格式，可以用记事本或任何文本编辑器打开</li>
            <li>• 导入数据会覆盖当前所有记录，请谨慎操作</li>
            <li>• 建议定期导出数据备份，防止数据丢失</li>
            <li>• 导入时会自动验证数据格式，无效记录将被跳过</li>
          </ul>
        </div>
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">确认清除数据</h3>
            <p className="text-gray-600 mb-4">此操作将清除所有记账记录，且无法恢复。确定继续？</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
