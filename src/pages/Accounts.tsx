import { useState, useMemo } from 'react';
import { Wallet, Plus, X, CheckCircle, AlertCircle, Info, Star, Pencil } from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import { useLanguage } from '../contexts/LanguageContext';
import type { Account } from '../types/record';

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
  const { accounts, records, addAccount, deleteAccount, updateAccount, setDefaultAccount } = useRecords();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurrency, setNewAccountCurrency] = useState('CNY');
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // 账户列表：保持原有顺序，不按 isDefault 调整
  const sortedAccounts = accounts;

  // 计算每个账户对应币种的结余（从记录中计算）
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => {
      const balance = records
        .filter(r => r.currency === acc.currency)
        .reduce((sum, r) => sum + (r.type === 'income' ? r.amount : -r.amount), 0);
      balances[acc.id] = balance;
    });
    return balances;
  }, [accounts, records]);

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

  // 设置默认账户
  const handleSetDefault = (id: string) => {
    setDefaultAccount(id);
    showMessage('success', t.accounts.setDefaultSuccess);
  };

  // 打开编辑弹窗
  const handleOpenEdit = (account: Account) => {
    setEditName(account.name);
    setEditBalance(account.balance.toString());
    setShowEditModal(account.id);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editName.trim() || !showEditModal) return;

    const account = accounts.find(a => a.id === showEditModal);
    if (!account) return;

    const balance = parseFloat(editBalance);
    if (isNaN(balance)) {
      showMessage('error', t.accounts.invalidBalance);
      return;
    }

    updateAccount({
      ...account,
      name: editName.trim(),
      balance,
    });

    showMessage('success', t.accounts.editSuccess);
    setShowEditModal(null);
  };

  const editingAccount = accounts.find(a => a.id === showEditModal);

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

      {/* 单账户提示 */}
      {accounts.length === 1 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-700">{t.accounts.singleAccountTip}</p>
        </div>
      )}

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
              className={`bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow ${
                account.isDefault ? 'border-yellow-400' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    account.isDefault ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <Wallet className={`w-5 h-5 ${
                      account.isDefault ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.currency}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {/* 设为默认按钮 */}
                  <button
                    onClick={() => handleSetDefault(account.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      account.isDefault
                        ? 'text-yellow-500 hover:bg-yellow-50'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'
                    }`}
                    title={account.isDefault ? t.accounts.isDefaultAccount : t.accounts.setDefaultAccount}
                  >
                    <Star className="w-4 h-4" fill={account.isDefault ? 'currentColor' : 'none'} />
                  </button>
                  {/* 编辑按钮 */}
                  <button
                    onClick={() => handleOpenEdit(account)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-blue-500"
                    title={t.accounts.editAccount}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {/* 删除按钮 */}
                  <button
                    onClick={() => setShowDeleteConfirm(account.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                    title={t.accounts.deleteAccount}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">{t.accounts.balance}</p>
                <p className={`text-2xl font-bold ${accountBalances[account.id] >= 0 ? 'text-gray-800' : 'text-red-500'}`}>
                  {formatBalance(accountBalances[account.id], account.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
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

      {/* 编辑账户弹窗 */}
      {showEditModal && editingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.accounts.editAccount}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.accounts.editAccountName}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t.accounts.editAccountNamePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.accounts.editAccountBalance}
                </label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  placeholder={t.accounts.editAccountBalancePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.accounts.currency}
                </label>
                <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                  {editingAccount.currency}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(null)}
                className="flex-1 py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                {t.accounts.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  editName.trim()
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
                {t.accounts.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
