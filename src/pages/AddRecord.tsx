import { useState } from 'react';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { generateEntries } from '../lib/record';
import type { ExpenseRecord } from '../types/record';

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

// 交易类型配置
const TRANSACTION_TYPES = [
  { value: 'income', label: '收入', color: 'green' },
  { value: 'expense', label: '支出', color: 'red' },
  { value: 'investment', label: '投资', color: 'blue' },
  { value: 'investment-mature', label: '投资到期', color: 'purple' },
  { value: 'loan-receive', label: '贷款到账', color: 'orange' },
  { value: 'loan-repay', label: '还贷', color: 'yellow' },
] as const;

export const AddRecord = () => {
  const { t } = useLanguage();
  const { addRecord, incomeCategories, expenseCategories } = useRecords();
  const [type, setType] = useState<ExpenseRecord['type']>('expense');
  const [amount, setAmount] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('CNY');
  const [saved, setSaved] = useState(false);

  // 判断是否需要本金/利息输入
  const needsPrincipalInterest = type === 'investment-mature' || type === 'loan-repay';

  // 根据类型获取分类列表
  const categories = type === 'income' || type === 'investment-mature'
    ? incomeCategories.map(c => c.name) 
    : expenseCategories.map(c => c.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证逻辑
    if (needsPrincipalInterest) {
      // 投资到期和还贷类型需要验证本金和利息
      if (!principal || parseFloat(principal) <= 0 || !interest || parseFloat(interest) <= 0 || !category) {
        return;
      }
    } else {
      // 其他类型验证金额
      if (!amount || parseFloat(amount) <= 0 || !category) {
        return;
      }
    }

    // 计算总金额
    const totalAmount = needsPrincipalInterest
      ? parseFloat(principal) + parseFloat(interest)
      : parseFloat(amount);

    // 生成分录
    const entries = needsPrincipalInterest
      ? generateEntries(type, totalAmount, parseFloat(principal), parseFloat(interest))
      : generateEntries(type, totalAmount);

    addRecord({
      type,
      amount: totalAmount,
      category,
      note,
      date,
      currency,
      entries,
    });

    // 重置表单
    setAmount('');
    setPrincipal('');
    setInterest('');
    setCategory('');
    setNote('');
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="p-6 flex-1">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.addRecord.title}</h1>
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.type}</label>
            <div className="grid grid-cols-3 gap-3">
              {TRANSACTION_TYPES.map((typeOption) => {
                const colorClasses: Record<string, string> = {
                  green: type === typeOption.value ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 hover:border-green-300',
                  red: type === typeOption.value ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 hover:border-red-300',
                  blue: type === typeOption.value ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-blue-300',
                  purple: type === typeOption.value ? 'border-purple-500 bg-purple-50 text-purple-600' : 'border-gray-200 hover:border-purple-300',
                  orange: type === typeOption.value ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-orange-300',
                  yellow: type === typeOption.value ? 'border-yellow-500 bg-yellow-50 text-yellow-600' : 'border-gray-200 hover:border-yellow-300',
                };
                
                return (
                  <button
                    key={typeOption.value}
                    type="button"
                    onClick={() => {
                      setType(typeOption.value);
                      setCategory('');
                      setAmount('');
                      setPrincipal('');
                      setInterest('');
                    }}
                    className={`py-3 px-4 rounded-lg border-2 transition-colors ${colorClasses[typeOption.color]}`}
                  >
                    <span className="font-medium text-sm">{typeOption.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.currency}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {CURRENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {needsPrincipalInterest ? (
            // 投资到期和还贷：显示本金和利息两个输入框
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">本金</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {CURRENCY_OPTIONS.find(o => o.value === currency)?.label.match(/\(.+\)/)?.[1] || '¥'}
                  </span>
                  <input
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">利息</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {CURRENCY_OPTIONS.find(o => o.value === currency)?.label.match(/\(.+\)/)?.[1] || '¥'}
                  </span>
                  <input
                    type="number"
                    value={interest}
                    onChange={(e) => setInterest(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            </>
          ) : (
            // 其他类型：显示单个金额输入框
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.amount}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {CURRENCY_OPTIONS.find(o => o.value === currency)?.label.match(/\(.+\)/)?.[1] || '¥'}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.category}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">{t.addRecord.selectCategory}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t.addRecord.note}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.addRecord.notePlaceholder}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <button
            type="submit"
            disabled={
              needsPrincipalInterest
                ? !principal || parseFloat(principal) <= 0 || !interest || parseFloat(interest) <= 0 || !category
                : !amount || parseFloat(amount) <= 0 || !category
            }
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-500 text-white'
                : needsPrincipalInterest
                ? principal && parseFloat(principal) > 0 && interest && parseFloat(interest) > 0 && category
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : amount && parseFloat(amount) > 0 && category
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>{t.addRecord.saved}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>{t.addRecord.addRecord}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
