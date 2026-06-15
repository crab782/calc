import type { Statistics } from '../types';
import { getRecords, formatCurrency, formatDate, deleteRecord } from '../utils/storage';
import { TrendingUp, TrendingDown, Wallet, Trash2 } from 'lucide-react';

interface DashboardProps {
  onRecordsChange: () => void;
}

export const Dashboard = ({ onRecordsChange }: DashboardProps) => {
  const records = getRecords();
  
  const statistics: Statistics = records.reduce(
    (acc, record) => {
      if (record.type === 'income') {
        acc.totalIncome += record.amount;
      } else {
        acc.totalExpense += record.amount;
      }
      acc.balance = acc.totalIncome - acc.totalExpense;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, balance: 0 }
  );

  const sortedRecords = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const recentRecords = sortedRecords.slice(0, 10);

  const handleDelete = (id: string) => {
    deleteRecord(id);
    onRecordsChange();
  };

  const statsCards = [
    {
      title: '总收入',
      value: formatCurrency(statistics.totalIncome),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      title: '总支出',
      value: formatCurrency(statistics.totalExpense),
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      title: '结余',
      value: formatCurrency(statistics.balance),
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-6 flex-1">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">总览</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`${card.color} rounded-xl p-6 flex items-center gap-4`}
            >
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm opacity-70">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">最近交易</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRecords.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无交易记录</p>
              <p className="text-sm mt-1">点击左侧"记账"添加第一条记录</p>
            </div>
          ) : (
            recentRecords.map((record) => (
              <div
                key={record.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        record.type === 'income'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {record.type === 'income' ? '收入' : '支出'}
                    </span>
                    <span className="text-sm text-gray-500">{record.category}</span>
                  </div>
                  <p className="text-gray-800 font-medium mt-1">
                    {record.note || record.category}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDate(record.date)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`font-semibold ${
                      record.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {record.type === 'income' ? '+' : '-'}
                    {formatCurrency(record.amount)}
                  </span>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除记录"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
