import ReactECharts from 'echarts-for-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStatistics } from '../hooks/useStatistics';

export const BalanceChart = () => {
  const { language } = useLanguage();
  const { monthlyDataWithPrediction } = useStatistics();

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const monthNum = parseInt(m);
    if (language === 'zh') {
      return `${year}年${monthNum}月`;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[monthNum - 1]} ${year}`;
  };

  const boundaryIndex = monthlyDataWithPrediction.findIndex((item) => !item.isActual);

  const actualData = monthlyDataWithPrediction.map((item, i) =>
    item.isActual || i === boundaryIndex ? item.balance : null
  );
  const predictedData = monthlyDataWithPrediction.map((item, i) =>
    !item.isActual || i === boundaryIndex - 1 ? item.balance : null
  );

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number | null }[]) => {
        const validParams = params.filter((p) => p.value !== null);
        if (validParams.length === 0) return '';
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${validParams[0].axisValue}</div>`;
        validParams.forEach((item) => {
          const value = item.value ?? 0;
          result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            ${item.marker}
            <span>${item.seriesName}: ¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>`;
        });
        return result;
      },
    },
    legend: {
      data: [
        language === 'zh' ? '累计结余' : 'Cumulative Balance',
        language === 'zh' ? '预测结余' : 'Predicted Balance',
      ],
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
      data: monthlyDataWithPrediction.map((item) => formatMonth(item.month)),
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
        name: language === 'zh' ? '累计结余' : 'Cumulative Balance',
        type: 'line',
        smooth: false,
        data: actualData,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
        },
        itemStyle: {
          color: '#3b82f6',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
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
        name: language === 'zh' ? '预测结余' : 'Predicted Balance',
        type: 'line',
        smooth: false,
        data: predictedData,
        lineStyle: {
          color: '#3b82f6',
          width: 2,
          type: 'dashed',
        },
        itemStyle: {
          color: '#3b82f6',
          opacity: 0.6,
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          scale: 1.5,
        },
      },
    ],
  };

  if (monthlyDataWithPrediction.length === 0) {
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
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        {language === 'zh' ? '结余趋势' : 'Balance Trend'}
      </h2>
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
