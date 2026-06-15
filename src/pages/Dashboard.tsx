import { TrendingUp, TrendingDown, Wallet, Trash2, Globe } from 'lucide-react';
import { MonthlyChart } from '../components/MonthlyChart';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';

export const Dashboard = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { getRecentRecords, deleteRecord } = useRecords();
  const { statistics, formatCurrency, formatDate } = useStatistics();

  const recentRecords = getRecentRecords(10);

  const statsCards = [
    {
      title: t.dashboard.totalIncome,
      value: formatCurrency(statistics.totalIncome),
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      title: t.dashboard.totalExpense,
      value: formatCurrency(statistics.totalExpense),
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      title: t.dashboard.balance,
      value: formatCurrency(statistics.balance),
      icon: Wallet,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-6 flex-1">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t.dashboard.title}</h1>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          <Globe className="w-4 h-4" />
          <span>{language === 'zh' ? 'EN' : '中文'}</span>
        </button>
      </div>
      
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

      <div className="mb-8">
        <MonthlyChart />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">{t.dashboard.recentTransactions}</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRecords.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.dashboard.noRecords}</p>
              <p className="text-sm mt-1">{t.dashboard.addFirstRecord}</p>
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
                      {record.type === 'income' ? t.dashboard.income : t.dashboard.expense}
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
                    onClick={() => deleteRecord(record.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title={t.dashboard.deleteRecord}
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
