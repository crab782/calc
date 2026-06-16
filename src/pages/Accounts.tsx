import { useState } from 'react';
import { Wallet, Plus, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import { useLanguage } from '../contexts/LanguageContext';

// 币种选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

// 币种符号映射
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export const Accounts = () => {
  const { t } = useLanguage();
  const { accounts, addAccount, deleteAccount } = useRecords();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('CNY');

  const isSingleAccount = accounts.length === 1;

  // 账户排序：总账户/默认CNY账户始终在第一位，其余按创建时间排序
  const sortedAccounts = [...accounts].sort((a, b) => {
    // 默认总账户（CNY且名为"总账户"或"Master Account"）排在最前
    const isDefaultA = a.currency === 'CNY' && (a.name === '总账户' || a.name === 'Master Account');
    const isDefaultB = b.currency === 'CNY' && (b.name === '总账户' || b.name === 'Master Account');
    if (isDefaultA && !isDefaultB) return -1;
    if (isDefaultB && !isDefaultA) return 1;
    return a.createdAt - b.createdAt;
  });

  // 格式化余额显示
  const formatBalance = (balance: number, currency: string) => {
    const formatter = new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${CURRENCY_SYMBOLS[currency] || ''}${formatter.format(balance)}`;
  };

  // 显示消息提示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 添加账户
  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;

    addAccount({
      name: newAccountName.trim(),
      currency: newAccountCurrency,
      balance: 0,
    });

    showMessage('success', t.accounts.addSuccess);
    setNewAccountName('');
    setNewAccountCurrency('CNY');
    setShowAddModal(false);
  };

  // 删除账户
  const handleDeleteAccount = (id: string) => {
    const result = deleteAccount(id);
    if (result.success) {
      showMessage('success', t.accounts.deleteSuccess);
    } else {
      showMessage('error', result.message);
    }
    setShowDeleteConfirm(null);
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

      {/* 页面标题和添加按钮 */}
      {!isSingleAccount && (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t.accounts.title}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>{t.accounts.addAccount}</span>
          </button>
        </div>
      )}

      {/* 单账户简化提示 */}
      {isSingleAccount ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {accounts[0]?.name || t.accounts.defaultAccountName}
              </h3>
              <p className="text-gray-500 mb-6">{t.accounts.singleAccountTip}</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t.accounts.addAccount}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* 账户列表 */}
          {accounts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t.accounts.noAccounts}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.currency}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(account.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      title={t.accounts.deleteAccount}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">{t.accounts.balance}</p>
                    <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                      {formatBalance(account.balance, account.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 添加账户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.accounts.addAccount}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.accounts.accountName}
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder={t.accounts.accountNamePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAccount();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.accounts.currency}
                </label>
                <select
                  value={newAccountCurrency}
                  onChange={(e) => setNewAccountCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAccountName('');
                  setNewAccountCurrency('CNY');
                }}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                {t.accounts.cancel}
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccountName.trim()}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  newAccountName.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t.accounts.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除账户确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.accounts.deleteConfirm}</h3>
            <p className="text-gray-600 mb-4">{t.accounts.deleteMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                {t.accounts.cancel}
              </button>
              <button
                onClick={() => handleDeleteAccount(showDeleteConfirm)}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                {t.accounts.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};