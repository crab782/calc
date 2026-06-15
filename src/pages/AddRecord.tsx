import { useState } from 'react';
import { saveRecord, generateId } from '../utils/storage';
import { PlusCircle, CheckCircle } from 'lucide-react';

interface AddRecordProps {
  onSave: () => void;
}

const incomeCategories = ['工资', '奖金', '投资收益', '兼职', '其他收入'];
const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '医疗', '教育', '房租', '水电费', '其他支出'];

export const AddRecord = ({ onSave }: AddRecordProps) => {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saved, setSaved] = useState(false);

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0 || !category) {
      return;
    }

    saveRecord({
      id: generateId(),
      type,
      amount: parseFloat(amount),
      category,
      note,
      date,
    });

    setAmount('');
    setCategory('');
    setNote('');
    setSaved(true);
    onSave();

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <div className="p-6 flex-1">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">添加记账记录</h1>
      
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">类型</label>
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
                <span className="font-medium">收入</span>
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
                <span className="font-medium">支出</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">金额</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">¥</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">请选择分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="添加备注（可选）"
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
                <span>保存成功</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>添加记录</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
