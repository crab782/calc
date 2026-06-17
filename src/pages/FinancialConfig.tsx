import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  PiggyBank,
  CreditCard,
  Edit2,
} from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import type {
  FinancialSourceType,
  FinancialPeriod,
  InvestmentType,
  InterestType,
  FinancialSource,
} from '../types/record';

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

// 周期选项
const PERIOD_OPTIONS: { value: FinancialPeriod; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
  { value: 'once', label: '一次性' },
];

// 周期显示映射
const PERIOD_LABELS: Record<FinancialPeriod, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
  once: '一次性',
};

// 投资类型选项
const INVESTMENT_TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: 'once', label: '一次性投资' },
  { value: 'recurring', label: '定期投资' },
];

// 贷款还款方式选项
const INTEREST_TYPE_OPTIONS: { value: InterestType; label: string }[] = [
  { value: 'equal-payment', label: '等额本息' },
  { value: 'equal-principal', label: '等额本金' },
  { value: 'interest-first', label: '先息后本' },
];

// 贷款还款方式显示映射
const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  'equal-payment': '等额本息',
  'equal-principal': '等额本金',
  'interest-first': '先息后本',
};

// 表单数据类型
interface FormData {
  name: string;
  currency: string;
  amount: string;
  period: FinancialPeriod;
  investmentType: InvestmentType;
  expectedReturn: string;
  principal: string;
  interestRate: string;
  interestType: InterestType;
}

// 初始表单数据
const INITIAL_FORM_DATA: FormData = {
  name: '',
  currency: 'CNY',
  amount: '',
  period: 'monthly',
  investmentType: 'once',
  expectedReturn: '',
  principal: '',
  interestRate: '',
  interestType: 'equal-payment',
};

export const FinancialConfig = () => {
  const {
    incomeSources,
    expenseSources,
    investmentSources,
    loanSources,
    addFinancialSource,
    deleteFinancialSource,
    updateFinancialSource,
  } = useRecords();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<FinancialSourceType>('income');
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  // 格式化金额显示
  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${CURRENCY_SYMBOLS[currency] || ''}${formatter.format(amount)}`;
  };

  // 显示消息提示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // 计算月度金额（将不同周期转换为月度）
  const calculateMonthlyAmount = (amount: number, period: FinancialPeriod): number => {
    switch (period) {
      case 'daily':
        return amount * 30;
      case 'weekly':
        return amount * 4;
      case 'monthly':
        return amount;
      case 'yearly':
        return amount / 12;
      case 'once':
        return 0; // 一次性不计入月度统计
      default:
        return amount;
    }
  };

  // 计算预期月收入
  const expectedMonthlyIncome = useMemo(() => {
    const incomeByCurrency: Record<string, number> = {};
    incomeSources.forEach((source) => {
      const monthly = calculateMonthlyAmount(source.amount, source.period);
      if (!incomeByCurrency[source.currency]) {
        incomeByCurrency[source.currency] = 0;
      }
      incomeByCurrency[source.currency] += monthly;
    });
    return incomeByCurrency;
  }, [incomeSources]);

  // 计算预期月支出
  const expectedMonthlyExpense = useMemo(() => {
    const expenseByCurrency: Record<string, number> = {};
    expenseSources.forEach((source) => {
      const monthly = calculateMonthlyAmount(source.amount, source.period);
      if (!expenseByCurrency[source.currency]) {
        expenseByCurrency[source.currency] = 0;
      }
      expenseByCurrency[source.currency] += monthly;
    });
    return expenseByCurrency;
  }, [expenseSources]);

  // 计算预期月结余
  const expectedMonthlyBalance = useMemo(() => {
    const balanceByCurrency: Record<string, number> = {};
    const allCurrencies = new Set([
      ...Object.keys(expectedMonthlyIncome),
      ...Object.keys(expectedMonthlyExpense),
    ]);
    allCurrencies.forEach((currency) => {
      balanceByCurrency[currency] =
        (expectedMonthlyIncome[currency] || 0) - (expectedMonthlyExpense[currency] || 0);
    });
    return balanceByCurrency;
  }, [expectedMonthlyIncome, expectedMonthlyExpense]);

  // 打开添加弹窗
  const openAddModal = (type: FinancialSourceType) => {
    setCurrentType(type);
    setFormData(INITIAL_FORM_DATA);
    setShowAddModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (source: FinancialSource) => {
    setEditingSource(source);
    setCurrentType(source.type);
    setFormData({
      name: source.name,
      currency: source.currency,
      amount: source.amount.toString(),
      period: source.period,
      investmentType: source.investmentType || 'once',
      expectedReturn: source.expectedReturn?.toString() || '',
      principal: source.principal?.toString() || '',
      interestRate: source.interestRate?.toString() || '',
      interestType: source.interestType || 'equal-payment',
    });
    setShowEditModal(true);
  };

  // 重置表单
  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingSource(null);
  };

  // 添加来源
  const handleAdd = () => {
    if (!formData.name.trim()) {
      showMessage('error', '请输入名称');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) < 0) {
      showMessage('error', '请输入有效金额');
      return;
    }

    const baseData = {
      type: currentType,
      name: formData.name.trim(),
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      period: formData.period,
    };

    let additionalData = {};

    if (currentType === 'investment') {
      additionalData = {
        investmentType: formData.investmentType,
        expectedReturn: formData.expectedReturn ? parseFloat(formData.expectedReturn) : undefined,
      };
    } else if (currentType === 'loan') {
      if (!formData.principal || parseFloat(formData.principal) <= 0) {
        showMessage('error', '请输入有效的本金');
        return;
      }
      if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
        showMessage('error', '请输入有效的利率');
        return;
      }
      additionalData = {
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
      };
    }

    addFinancialSource({
      ...baseData,
      ...additionalData,
    } as Omit<FinancialSource, 'id' | 'createdAt'>);

    showMessage('success', '添加成功');
    resetForm();
    setShowAddModal(false);
  };

  // 编辑来源
  const handleEdit = () => {
    if (!editingSource) return;
    if (!formData.name.trim()) {
      showMessage('error', '请输入名称');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) < 0) {
      showMessage('error', '请输入有效金额');
      return;
    }

    const baseData = {
      name: formData.name.trim(),
      currency: formData.currency,
      amount: parseFloat(formData.amount),
      period: formData.period,
    };

    let additionalData = {};

    if (currentType === 'investment') {
      additionalData = {
        investmentType: formData.investmentType,
        expectedReturn: formData.expectedReturn ? parseFloat(formData.expectedReturn) : undefined,
      };
    } else if (currentType === 'loan') {
      if (!formData.principal || parseFloat(formData.principal) <= 0) {
        showMessage('error', '请输入有效的本金');
        return;
      }
      if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
        showMessage('error', '请输入有效的利率');
        return;
      }
      additionalData = {
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        interestType: formData.interestType,
      };
    }

    updateFinancialSource(editingSource.id, {
      ...baseData,
      ...additionalData,
    });

    showMessage('success', '更新成功');
    resetForm();
    setShowEditModal(false);
  };

  // 删除来源
  const handleDelete = (id: string) => {
    const result = deleteFinancialSource(id);
    if (result.success) {
      showMessage('success', '删除成功');
    } else {
      showMessage('error', result.message);
    }
    setShowDeleteConfirm(null);
  };

  // 渲染来源卡片
  const renderSourceCard = (source: FinancialSource, icon: React.ReactNode, colorClass: string) => (
    <div
      key={source.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{source.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{source.currency}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => openEditModal(source)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-blue-500"
            title="编辑"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(source.id)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500"
            title="删除"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">金额</p>
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {formatAmount(source.amount, source.currency)}
          </p>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">周期</p>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
            {PERIOD_LABELS[source.period]}
          </p>
        </div>
        {source.type === 'investment' && source.expectedReturn !== undefined && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">预期收益率</p>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {source.expectedReturn}%
            </p>
          </div>
        )}
        {source.type === 'loan' && source.principal !== undefined && (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">本金</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {formatAmount(source.principal, source.currency)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">利率</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {source.interestRate}%
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">还款方式</p>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                {INTEREST_TYPE_LABELS[source.interestType || 'equal-payment']}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // 渲染表单
  const renderForm = (isEdit: boolean = false) => (
    <div className="space-y-4">
      {/* 名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          名称
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="请输入名称"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      {/* 币种选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          币种
        </label>
        <select
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CURRENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 金额输入 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          金额
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="请输入金额"
          min="0"
          step="0.01"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 周期选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          周期
        </label>
        <select
          value={formData.period}
          onChange={(e) => setFormData({ ...formData, period: e.target.value as FinancialPeriod })}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 投资特有字段 */}
      {currentType === 'investment' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              投资类型
            </label>
            <select
              value={formData.investmentType}
              onChange={(e) =>
                setFormData({ ...formData, investmentType: e.target.value as InvestmentType })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INVESTMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              预期收益率 (%)
            </label>
            <input
              type="number"
              value={formData.expectedReturn}
              onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
              placeholder="请输入预期收益率"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}

      {/* 贷款特有字段 */}
      {currentType === 'loan' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              本金
            </label>
            <input
              type="number"
              value={formData.principal}
              onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
              placeholder="请输入本金"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              年利率 (%)
            </label>
            <input
              type="number"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              placeholder="请输入年利率"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              还款方式
            </label>
            <select
              value={formData.interestType}
              onChange={(e) =>
                setFormData({ ...formData, interestType: e.target.value as InterestType })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {INTEREST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => {
            if (isEdit) {
              setShowEditModal(false);
            } else {
              setShowAddModal(false);
            }
            resetForm();
          }}
          className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
        >
          取消
        </button>
        <button
          onClick={isEdit ? handleEdit : handleAdd}
          disabled={!formData.name.trim() || !formData.amount || parseFloat(formData.amount) < 0}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            formData.name.trim() && formData.amount && parseFloat(formData.amount) >= 0
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isEdit ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 flex-1 overflow-auto">
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

      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">财务配置</h1>

      {/* 财务总览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* 预期月收入 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">预期月收入</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">按币种统计</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.keys(expectedMonthlyIncome).length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">暂无数据</p>
            ) : (
              Object.entries(expectedMonthlyIncome).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{currency}</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatAmount(amount, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 预期月支出 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">预期月支出</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">按币种统计</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.keys(expectedMonthlyExpense).length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">暂无数据</p>
            ) : (
              Object.entries(expectedMonthlyExpense).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{currency}</span>
                  <span className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatAmount(amount, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 预期月结余 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">预期月结余</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">按币种统计</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.keys(expectedMonthlyBalance).length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-sm">暂无数据</p>
            ) : (
              Object.entries(expectedMonthlyBalance).map(([currency, amount]) => (
                <div key={currency} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{currency}</span>
                  <span
                    className={`text-lg font-bold ${
                      amount >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatAmount(amount, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 收入配置 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            收入配置
          </h2>
          <button
            onClick={() => openAddModal('income')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
        {incomeSources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <TrendingUp className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无收入配置，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incomeSources.map((source) =>
              renderSourceCard(
                source,
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
                'bg-green-100 dark:bg-green-900/20'
              )
            )}
          </div>
        )}
      </div>

      {/* 支出配置 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            支出配置
          </h2>
          <button
            onClick={() => openAddModal('expense')}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
        {expenseSources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <TrendingDown className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无支出配置，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expenseSources.map((source) =>
              renderSourceCard(
                source,
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />,
                'bg-red-100 dark:bg-red-900/20'
              )
            )}
          </div>
        )}
      </div>

      {/* 投资配置 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            投资配置
          </h2>
          <button
            onClick={() => openAddModal('investment')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
        {investmentSources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <PiggyBank className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无投资配置，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {investmentSources.map((source) =>
              renderSourceCard(
                source,
                <PiggyBank className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
                'bg-purple-100 dark:bg-purple-900/20'
              )
            )}
          </div>
        )}
      </div>

      {/* 贷款配置 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            贷款配置
          </h2>
          <button
            onClick={() => openAddModal('loan')}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>添加</span>
          </button>
        </div>
        {loanSources.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">暂无贷款配置，点击上方按钮添加</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loanSources.map((source) =>
              renderSourceCard(
                source,
                <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
                'bg-orange-100 dark:bg-orange-900/20'
              )
            )}
          </div>
        )}
      </div>

      {/* 添加弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              添加{currentType === 'income' ? '收入' : currentType === 'expense' ? '支出' : currentType === 'investment' ? '投资' : '贷款'}
            </h3>
            {renderForm(false)}
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              编辑{currentType === 'income' ? '收入' : currentType === 'expense' ? '支出' : currentType === 'investment' ? '投资' : '贷款'}
            </h3>
            {renderForm(true)}
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">确认删除</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">确定要删除这条记录吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};