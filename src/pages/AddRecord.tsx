import { useState } from 'react';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export const AddRecord = () => {
  const { t } = useLanguage();
  const { addRecord, incomeCategories, expenseCategories } = useRecords();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('CNY');
  const [saved, setSaved] = useState(false);

  const categories = type === 'income' 
    ? incomeCategories.map(c => c.name) 
    : expenseCategories.map(c => c.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0 || !category) {
      return;
    }

    addRecord({
      type,
      amount: parseFloat(amount),
      category,
      note,
      date,
      currency,
    });

    setAmount('');
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
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setType('income');
                  setCategory('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  type === 'income'
                    ? 'border-green-500 bg-green-50 text-green-600'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <span className="font-medium">{t.addRecord.income}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('expense');
                  setCategory('');
                }}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  type === 'expense'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-red-300'
                }`}
              >
                <span className="font-medium">{t.addRecord.expense}</span>
              </button>
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
            disabled={!amount || parseFloat(amount) <= 0 || !category}
            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-500 text-white'
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
