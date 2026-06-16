import ReactECharts from 'echarts-for-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatistics } from '../hooks/useStatistics';

export const ExpenseChart = () => {
  const { t, language } = useLanguage();
  const { effectiveTheme } = useTheme();
  const { monthlyDataWithPrediction } = useStatistics();

  const isDark = effectiveTheme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const axisLineColor = isDark ? '#4b5563' : '#d1d5db';
  const splitLineColor = isDark ? '#374151' : '#f3f4f6';
  const tooltipBg = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipText = isDark ? '#e5e7eb' : '#374151';

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
    item.isActual || i === boundaryIndex ? item.expense : null
  );
  const predictedData = monthlyDataWithPrediction.map((item, i) =>
    !item.isActual || i === boundaryIndex - 1 ? item.expense : null
  );

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
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
        t.chart.expense,
        language === 'zh' ? '预测支出' : 'Predicted Expense',
      ],
      textStyle: {
        color: textColor,
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
          color: axisLineColor,
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: textColor,
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
        color: textColor,
        fontSize: 12,
        formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`,
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: t.chart.expense,
        type: 'line',
        smooth: false,
        data: actualData,
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
      {
        name: language === 'zh' ? '预测支出' : 'Predicted Expense',
        type: 'line',
        smooth: false,
        data: predictedData,
        lineStyle: {
          color: '#ef4444',
          width: 2,
          type: 'dashed',
        },
        itemStyle: {
          color: '#ef4444',
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>{t.chart.noData}</p>
          <p className="text-sm mt-1">{t.chart.noDataHint}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {language === 'zh' ? '支出趋势' : 'Expense Trend'}
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
