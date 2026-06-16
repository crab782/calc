import { useState, useRef } from 'react';
import { Download, Upload, Trash2, CheckCircle, AlertCircle, Plus, X, Sun, Moon, Monitor } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../hooks/useRecords';
import { recordService } from '../lib/record';

export const Settings = () => {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { count, refresh, incomeCategories, expenseCategories, addCategory, deleteCategory } = useRecords();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState<'income' | 'expense' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonData = recordService.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-book.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setMessage({ type: 'success', text: t.settings.exportSuccess });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (count > 0) {
      const confirmText = t.settings.importConfirm.replace('{count}', String(count));
      if (!confirm(confirmText)) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const importResult = recordService.importData(result);
      
      if (importResult.success) {
        setMessage({ type: 'success', text: t.settings.importSuccess });
        refresh();
      } else {
        setMessage({ type: 'error', text: t.settings.importError });
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
    recordService.deleteAllRecords();
    refresh();
    setMessage({ type: 'success', text: t.settings.clearSuccess });
    setShowConfirmClear(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !showAddCategory) return;
    
    addCategory({
      name: newCategoryName.trim(),
      type: showAddCategory,
      icon: 'tag',
    });
    
    setMessage({ type: 'success', text: t.settings.addCategorySuccess });
    setNewCategoryName('');
    setShowAddCategory(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteCategory = (id: string) => {
    const result = deleteCategory(id);
    if (result.success) {
      setMessage({ type: 'success', text: t.settings.deleteCategorySuccess });
    } else {
      setMessage({ type: 'error', text: t.settings.categoryInUse });
    }
    setShowDeleteConfirm(null);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="p-6 flex-1">
      {/* Toast 消息提示 */}
      {message && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">{t.settings.title}</h1>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-6">
        {/* 外观（主题）区块 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.settings.appearance}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 浅色模式 */}
            <button
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border-2 transition-all ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <Sun className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.lightMode}</p>
            </button>

            {/* 深色模式 */}
            <button
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border-2 transition-all ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <Moon className="w-6 h-6 mx-auto mb-2 text-indigo-500" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.darkMode}</p>
            </button>

            {/* 跟随系统 */}
            <button
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border-2 transition-all ${
                theme === 'system'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:border-gray-300'
              }`}
            >
              <Monitor className="w-6 h-6 mx-auto mb-2 text-gray-500 dark:text-gray-400" />
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.settings.systemMode}</p>
            </button>
          </div>
        </div>

        {/* 分类管理区块 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.settings.categoryManagement}</h2>
          
          <div className="space-y-6">
            {/* 收入分类 */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t.settings.incomeCategories}</h3>
              <div className="flex flex-wrap gap-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <span>{category.name}</span>
                    <button
                      onClick={() => setShowDeleteConfirm(category.id)}
                      className="hover:bg-green-100 dark:hover:bg-green-900/40 rounded-full p-0.5 transition-colors"
                      title={t.settings.deleteCategory}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddCategory('income')}
                  className="flex items-center gap-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">{t.settings.addIncomeCategory}</span>
                </button>
              </div>
            </div>

            {/* 支出分类 */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">{t.settings.expenseCategories}</h3>
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <span>{category.name}</span>
                    <button
                      onClick={() => setShowDeleteConfirm(category.id)}
                      className="hover:bg-red-100 dark:hover:bg-red-900/40 rounded-full p-0.5 transition-colors"
                      title={t.settings.deleteCategory}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setShowAddCategory('expense')}
                  className="flex items-center gap-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">{t.settings.addExpenseCategory}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 数据管理区块 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.settings.dataManagement}</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.currentRecords}</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{count}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>{t.settings.exportData}</span>
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-5 h-5" />
                <span>{t.settings.importData}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">{t.settings.clearData}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">{t.settings.importExportInfo}</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• {t.settings.info1}</li>
            <li>• {t.settings.info2}</li>
            <li>• {t.settings.info3}</li>
            <li>• {t.settings.info4}</li>
          </ul>
        </div>
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.settings.clearConfirm}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.settings.clearMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.settings.cancel}
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                {t.settings.confirmClear}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加分类弹窗 */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              {showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory}
            </h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={t.settings.categoryNamePlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddCategory();
                }
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddCategory(null);
                  setNewCategoryName('');
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.settings.cancel}
              </button>
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  newCategoryName.trim()
                    ? showAddCategory === 'income'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除分类确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.settings.deleteCategory}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.settings.deleteCategoryConfirm}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                {t.settings.cancel}
              </button>
              <button
                onClick={() => handleDeleteCategory(showDeleteConfirm)}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                {t.settings.confirmClear}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
