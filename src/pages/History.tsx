import { useMemo } from 'react';
import { History as HistoryIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';
import type { ExpenseRecord } from '../types/record';

interface GroupedRecords {
  [key: string]: {
    records: ExpenseRecord[];
    totalIncome: number;
    totalExpense: number;
  };
}

export const History = () => {
  const { t } = useLanguage();
  const { records } = useRecords();
  const { formatCurrency, formatDate } = useStatistics();

  // 按月份分组并计算统计
  const groupedRecords = useMemo(() => {
    const grouped: GroupedRecords = {};

    // 按实际日期从新到旧排序
    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    sortedRecords.forEach((record) => {
      const monthKey = record.date.substring(0, 7); // YYYY-MM

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          records: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }

      grouped[monthKey].records.push(record);

      if (record.type === 'income') {
        grouped[monthKey].totalIncome += record.amount;
      } else {
        grouped[monthKey].totalExpense += record.amount;
      }
    });

    return grouped;
  }, [records]);

  // 格式化月份显示
  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  // 获取排序后的月份列表（从新到旧）
  const sortedMonths = useMemo(() => {
    return Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
  }, [groupedRecords]);

  return (
    <div className="p-6 flex-1 overflow-auto">
      <div className="flex items-center gap-3 mb-6">
        <HistoryIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{t.history.title}</h1>
      </div>

      {sortedMonths.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <HistoryIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t.history.noRecords}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t.history.addFirstRecord}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((month) => {
            const monthData = groupedRecords[month];

            return (
              <div key={month} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* 月份标题栏 */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {formatMonth(month)}
                    </h2>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t.history.income}:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          +{formatCurrency(monthData.totalIncome)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t.history.expense}:</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          -{formatCurrency(monthData.totalExpense)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 交易记录表格 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t.history.time}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t.history.category}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t.history.amount}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t.history.type}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t.history.description}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {monthData.records.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                            {record.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            <span className={record.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {record.type === 'income' ? '+' : '-'}
                              {formatCurrency(record.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                record.type === 'income'
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {record.type === 'income' ? t.history.incomeType : t.history.expenseType}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {record.note || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
