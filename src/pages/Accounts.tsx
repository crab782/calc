import { useState, useMemo } from 'react';
import { Wallet, Plus, X, CheckCircle, AlertCircle, Info, Pencil, Globe, Coins } from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import { useLanguage } from '../contexts/LanguageContext';
import type { Account, AccountType } from '../types/record';

// 获取翻译类型
type TranslationType = ReturnType<typeof useLanguage>['t'];

// 外币配置列表
const FOREIGN_CURRENCIES = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
];

// 账户类型选项（用于新建账户）
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: '现金' },
  { value: 'investment', label: '投资' },
  { value: 'loan', label: '贷款' },
];

// 账户类型名称映射
const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  cash: '现金',
  investment: '投资',
  loan: '贷款',
};

// 账户类型配置
const ACCOUNT_TYPE_CONFIG: Record<AccountType, { label: string; color: string; bgColor: string }> = {
  cash: { label: '现金', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  investment: { label: '投资', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  loan: { label: '贷款', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  income: { label: '收入', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  expense: { label: '支出', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
};

// AccountCard 子组件：渲染单个账户卡片
const AccountCard = ({
  account,
  balance,
  formatBalance,
  handleOpenEdit,
  setShowDeleteConfirm,
  t,
}: {
  account: Account;
  balance: number;
  formatBalance: (balance: number, currency: string) => string;
  handleOpenEdit: (account: Account) => void;
  setShowDeleteConfirm: (id: string | null) => void;
  t: TranslationType;
}) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
          <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{account.name}</h3>
            {/* 账户类型标签 */}
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              ACCOUNT_TYPE_CONFIG[account.accountType]?.bgColor || 'bg-gray-100 dark:bg-gray-900'
            } ${ACCOUNT_TYPE_CONFIG[account.accountType]?.color || 'text-gray-700 dark:text-gray-300'}`}>
              {ACCOUNT_TYPE_CONFIG[account.accountType]?.label || account.accountType}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{account.currency}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* 编辑按钮 */}
        <button
          onClick={() => handleOpenEdit(account)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
          title={t.accounts.editAccount}
        >
          <Pencil className="w-4 h-4" />
        </button>
        {/* 删除按钮 */}
        <button
          onClick={() => setShowDeleteConfirm(account.id)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
          title={t.accounts.deleteAccount}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="mt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t.accounts.balance}</p>
      <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-500 dark:text-red-400'}`}>
        {formatBalance(balance, account.currency)}
      </p>
    </div>
  </div>
);

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
  const {
    accounts,
    records,
    addAccount,
    deleteAccount,
    updateAccount,
    setDefaultAccount,
    createCurrencyAccounts,
    disableCurrency,
  } = useRecords();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [newAccountCurrency, setNewAccountCurrency] = useState('CNY');
  const [newAccountType, setNewAccountType] = useState<'cash' | 'investment' | 'loan'>('cash');
  const [newAccountName, setNewAccountName] = useState('');
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // 获取所有可用币种（去重）
  const availableCurrencies = useMemo(() => {
    const currencies = accounts.map(a => a.currency);
    return [...new Set(currencies)];
  }, [accounts]);

  // 当前默认币种
  const defaultCurrency = useMemo(() => {
    const defaultAccount = accounts.find(a => a.isDefault);
    return defaultAccount?.currency || 'CNY';
  }, [accounts]);

  // 设置默认币种
  const handleSetDefaultCurrency = (currency: string) => {
    const account = accounts.find(a => a.currency === currency && a.visible === true);
    if (account) {
      setDefaultAccount(account.id);
      showMessage('success', t.accounts.setDefaultSuccess);
    }
  };

  // 外币启用状态（检查是否存在该币种的 visible=true 账户）
  const enabledCurrencies = useMemo(() => {
    const enabled: string[] = [];
    FOREIGN_CURRENCIES.forEach(fc => {
      const currencyAccounts = accounts.filter(a => a.currency === fc.value);
      if (currencyAccounts.some(a => a.visible === true)) {
        enabled.push(fc.value);
      }
    });
    return enabled;
  }, [accounts]);

  // 处理外币启用/禁用
  const handleCurrencyToggle = (currency: string, enabled: boolean) => {
    if (enabled) {
      // 启用外币：创建该币种的5类账户
      createCurrencyAccounts(currency);
      showMessage('success', `${currency} 币种已启用`);
    } else {
      // 禁用外币：检查余额后软删除
      const result = disableCurrency(currency);
      if (result.success) {
        showMessage('success', `${currency} 币种已禁用`);
      } else {
        showMessage('error', result.message);
      }
    }
  };

  // 账户列表排序：只显示 cash, investment, loan 类型账户
  const visibleAccounts = useMemo(() => {
    return accounts.filter(acc =>
      acc.visible === true &&
      ['cash', 'investment', 'loan'].includes(acc.accountType)
    );
  }, [accounts]);

  // 按币种分组
  const accountsByCurrency = useMemo(() => {
    const grouped: Record<string, typeof visibleAccounts> = {};
    visibleAccounts.forEach(acc => {
      if (!grouped[acc.currency]) {
        grouped[acc.currency] = [];
      }
      grouped[acc.currency].push(acc);
    });

    // 对每个币种组内的账户排序：默认账户优先
    Object.keys(grouped).forEach(currency => {
      const defaultAccount = grouped[currency].find(acc => acc.isDefault);
      const otherAccounts = grouped[currency].filter(acc => !acc.isDefault);
      grouped[currency] = [
        ...(defaultAccount ? [defaultAccount] : []),
        ...otherAccounts,
      ];
    });

    // CNY 币种优先显示
    const sortedCurrencies = Object.keys(grouped).sort((a, b) => {
      if (a === 'CNY') return -1;
      if (b === 'CNY') return 1;
      return a.localeCompare(b);
    });

    return {
      currencies: sortedCurrencies,
      groups: grouped,
    };
  }, [visibleAccounts]);

  // 计算每个账户对应币种的结余（从分录中计算）
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};

    // 初始化所有账户余额为0
    accounts.forEach(acc => {
      balances[acc.id] = 0;
    });

    // 从分录计算余额
    records.forEach(record => {
      record.entries?.forEach(entry => {
        if (!balances[entry.accountId]) {
          balances[entry.accountId] = 0;
        }
        if (entry.direction === 'debit') {
          balances[entry.accountId] += entry.amount;
        } else {
          balances[entry.accountId] -= entry.amount;
        }
      });
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
    const result = addAccount({
      currency: newAccountCurrency,
      accountType: newAccountType,
      name: newAccountName.trim() || `${newAccountCurrency} ${ACCOUNT_TYPE_NAMES[newAccountType]}`,
    });

    if (result.success) {
      showMessage('success', t.accounts.addSuccess);
      setNewAccountCurrency('CNY');
      setNewAccountType('cash');
      setNewAccountName('');
      setShowAddModal(false);
    } else {
      showMessage('error', result.message);
    }
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
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t.accounts.title}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>{t.accounts.addAccount}</span>
        </button>
      </div>

      {/* 默认币种设置 */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">默认币种</span>
          <select
            value={defaultCurrency}
            onChange={(e) => handleSetDefaultCurrency(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency} ({CURRENCY_SYMBOLS[currency] || ''})
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">（影响总览和统计的币种基准）</span>
        </div>
      </div>

      {/* 支持的外币 */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Coins className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">支持的外币</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">（勾选启用，取消勾选禁用）</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FOREIGN_CURRENCIES.map((fc) => {
            const isEnabled = enabledCurrencies.includes(fc.value);
            const isDefaultCurrency = defaultCurrency === fc.value;
            return (
              <label
                key={fc.value}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isEnabled
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${isDefaultCurrency ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isEnabled}
                  disabled={isDefaultCurrency}
                  onChange={(e) => handleCurrencyToggle(fc.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500"
                />
                <span className={`text-sm font-medium ${isEnabled ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {fc.label}
                </span>
                {isDefaultCurrency && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">默认</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* 单账户提示 */}
      {accounts.length === 1 && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-400">{t.accounts.singleAccountTip}</p>
        </div>
      )}

      {/* 账户列表 */}
      {visibleAccounts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{t.accounts.noAccounts}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {accountsByCurrency.currencies.map((currency) => (
            <div key={currency}>
              <div className="flex items-center gap-2 mb-3">
                {currency === 'CNY' ? (
                  <Coins className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                ) : (
                  <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {currency === 'CNY' ? '本币账户' : `${currency} 账户`}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accountsByCurrency.groups[currency].map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    balance={accountBalances[account.id] ?? 0}
                    formatBalance={formatBalance}
                    handleOpenEdit={handleOpenEdit}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    t={t}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加账户弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.accounts.addAccount}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  账户名称
                </label>
                <input
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder={`例如：${newAccountCurrency} ${ACCOUNT_TYPE_NAMES[newAccountType]}`}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  留空则自动命名为：{newAccountCurrency} {ACCOUNT_TYPE_NAMES[newAccountType]}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  币种
                </label>
                <select
                  value={newAccountCurrency}
                  onChange={(e) => setNewAccountCurrency(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  账户类型
                </label>
                <select
                  value={newAccountType}
                  onChange={(e) => setNewAccountType(e.target.value as 'cash' | 'investment' | 'loan')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
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
                  setNewAccountCurrency('CNY');
                  setNewAccountType('cash');
                  setNewAccountName('');
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                {t.accounts.cancel}
              </button>
              <button
                onClick={handleAddAccount}
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t.accounts.editAccount}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.accounts.editAccountName}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t.accounts.editAccountNamePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.accounts.editAccountBalance}
                </label>
                <input
                  type="number"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  placeholder={t.accounts.editAccountBalancePlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.accounts.currency}
                </label>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-600 dark:text-gray-400">
                  {editingAccount.currency}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(null)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors"
              >
                {t.accounts.cancel}
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  editName.trim()
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
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
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.accounts.deleteConfirm}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t.accounts.deleteMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-lg font-medium transition-colors"
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
