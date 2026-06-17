import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatistics } from '../hooks/useStatistics';

export const IncomeChart = () => {
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
    item.isActual || i === boundaryIndex ? item.income : null
  );
  const predictedData = monthlyDataWithPrediction.map((item, i) =>
    !item.isActual || i === boundaryIndex - 1 ? item.income : null
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
        t.chart.income,
        language === 'zh' ? '预测收入' : 'Predicted Income',
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
        name: t.chart.income,
        type: 'line',
        smooth: false,
        data: actualData,
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
        name: language === 'zh' ? '预测收入' : 'Predicted Income',
        type: 'line',
        smooth: false,
        data: predictedData,
        lineStyle: {
          color: '#10b981',
          width: 2,
          type: 'dashed',
        },
        itemStyle: {
          color: '#10b981',
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
      <Card bordered={false}>
        <Empty
          description={
            <div>
              <p>{t.chart.noData}</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.chart.noDataHint}</p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card title={language === 'zh' ? '收入趋势' : 'Income Trend'} bordered={false}>
      <div style={{ height: 320 }}>
        <ReactECharts
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </Card>
  );
};
