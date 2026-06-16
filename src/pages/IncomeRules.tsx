import { useState } from 'react';
import { TrendingUp, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useRecords } from '../hooks/useRecords';
import type { IncomePeriod } from '../types/record';

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
const PERIOD_OPTIONS: { value: IncomePeriod; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
];

// 周期显示映射
const PERIOD_LABELS: Record<IncomePeriod, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
  yearly: '每年',
};

export const IncomeRules = () => {
  const { incomeRules, addIncomeRule, deleteIncomeRule } = useRecords();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // 添加表单状态
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCurrency, setNewRuleCurrency] = useState('CNY');
  const [newRuleAmount, setNewRuleAmount] = useState('');
  const [newRulePeriod, setNewRulePeriod] = useState<IncomePeriod>('monthly');

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

  // 添加规则
  const handleAddRule = () => {
    if (!newRuleName.trim()) return;
    if (!newRuleAmount || parseFloat(newRuleAmount) < 0) return;

    addIncomeRule({
      name: newRuleName.trim(),
      currency: newRuleCurrency,
      amount: parseFloat(newRuleAmount),
      period: newRulePeriod,
    });

    showMessage('success', '收入规则添加成功');
    resetAddForm();
    setShowAddModal(false);
  };

  // 重置添加表单
  const resetAddForm = () => {
    setNewRuleName('');
    setNewRuleCurrency('CNY');
    setNewRuleAmount('');
    setNewRulePeriod('monthly');
  };

  // 删除规则
  const handleDeleteRule = (id: string) => {
    const result = deleteIncomeRule(id);
    if (result.success) {
      showMessage('success', '收入规则删除成功');
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">收入规则</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>添加规则</span>
        </button>
      </div>

      {/* 规则列表 */}
      {incomeRules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">暂无收入规则，点击上方按钮添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeRules.map((rule) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{rule.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{rule.currency}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(rule.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500"
                  title="删除规则"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">金额</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {formatAmount(rule.amount, rule.currency)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">周期</p>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {PERIOD_LABELS[rule.period]}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加规则弹窗 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">添加收入规则</h3>
            
            <div className="space-y-4">
              {/* 规则名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  规则名称
                </label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="请输入规则名称"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRule();
                    }
                  }}
                />
              </div>

              {/* 币种选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  币种
                </label>
                <select
                  value={newRuleCurrency}
                  onChange={(e) => setNewRuleCurrency(e.target.value)}
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
                  value={newRuleAmount}
                  onChange={(e) => setNewRuleAmount(e.target.value)}
                  placeholder="请输入金额"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRule();
                    }
                  }}
                />
              </div>

              {/* 周期选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  周期
                </label>
                <select
                  value={newRulePeriod}
                  onChange={(e) => setNewRulePeriod(e.target.value as IncomePeriod)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PERIOD_OPTIONS.map((option) => (
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
                  resetAddForm();
                }}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddRule}
                disabled={!newRuleName.trim() || !newRuleAmount || parseFloat(newRuleAmount) < 0}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  newRuleName.trim() && newRuleAmount && parseFloat(newRuleAmount) >= 0
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除规则确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">删除收入规则</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">确定要删除这个收入规则吗？此操作无法撤销。</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200 rounded-lg font-medium transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteRule(showDeleteConfirm)}
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
