import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getRecords } from '../utils/storage';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export const MonthlyChart = () => {
  const records = getRecords();
  
  const monthlyData = records.reduce((acc, record) => {
    const month = record.date.substring(0, 7);
    if (!acc[month]) {
      acc[month] = { month, income: 0, expense: 0 };
    }
    if (record.type === 'income') {
      acc[month].income += record.amount;
    } else {
      acc[month].expense += record.amount;
    }
    return acc;
  }, {} as { [key: string]: MonthlyData });

  const sortedData: MonthlyData[] = Object.values(monthlyData)
    .sort((a: MonthlyData, b: MonthlyData) => a.month.localeCompare(b.month))
    .slice(-12);

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    return `${year}年${parseInt(m)}月`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; color: string; payload: MonthlyData }[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <p className="font-medium mb-2">{formatMonth(data.month)}</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>收入: ¥{data.income.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>支出: ¥{data.expense.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (sortedData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <p>暂无数据</p>
          <p className="text-sm mt-1">添加交易记录后将显示月度趋势图表</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">月度收支趋势</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickFormatter={formatMonth}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
              axisLine={{ stroke: '#d1d5db' }}
              tickLine={{ stroke: '#d1d5db' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="circle"
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              name="收入"
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expense" 
              name="支出"
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
