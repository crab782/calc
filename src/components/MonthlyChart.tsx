import ReactECharts from 'echarts-for-react';
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

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number }[]) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`;
        params.forEach((item) => {
          result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            ${item.marker}
            <span>${item.seriesName}: ¥${item.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: ['收入', '支出'],
      textStyle: {
        color: '#6b7280',
      },
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sortedData.map((item) => formatMonth(item.month)),
      axisLine: {
        lineStyle: {
          color: '#d1d5db',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 12,
        formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: '收入',
        type: 'line',
        smooth: true,
        data: sortedData.map((item) => item.income),
        lineStyle: {
          color: '#10b981',
          width: 2,
        },
        itemStyle: {
          color: '#10b981',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          scale: 1.5,
        },
      },
      {
        name: '支出',
        type: 'line',
        smooth: true,
        data: sortedData.map((item) => item.expense),
        lineStyle: {
          color: '#ef4444',
          width: 2,
        },
        itemStyle: {
          color: '#ef4444',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          scale: 1.5,
        },
      },
    ],
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
        <ReactECharts
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
};
