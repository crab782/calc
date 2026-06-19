import { Card, Empty } from 'antd';
import { useTheme } from '../../providers/theme-provider';
import { useLanguage } from '../../../providers';
import { useRecords, useFinancialSources, useStatistics } from '../../../hooks';
import { BaseChart } from './base-chart';

export function BalanceChart() {
  const { language } = useLanguage();
  const { effectiveTheme } = useTheme();
  const { records } = useRecords();
  const { sources: financialSources } = useFinancialSources();
  const { dailyPredictionData } = useStatistics(records, financialSources);

  const isDark = effectiveTheme === 'dark';
  const textColor = isDark ? '#9ca3af' : '#6b7280';
  const axisLineColor = isDark ? '#4b5563' : '#d1d5db';
  const splitLineColor = isDark ? '#374151' : '#f3f4f6';
  const tooltipBg = isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Build flat daily data with balance
  const flatDays = dailyPredictionData.dailyData.map((day: { date: string; income: number; expense: number }) => {
    const pred = dailyPredictionData.predictions.find((p: { date: string }) => p.date === day.date);
    const balance = pred ? (pred.actual ?? pred.predicted) : 0;
    return {
      ...day,
      balance,
      isActual: !!pred?.actual,
    };
  });

  const xAxisLabels = flatDays.map((day: { date: string }) => {
    const dayNum = parseInt(day.date.substring(8, 10));
    if (dayNum === 1) {
      const month = parseInt(day.date.substring(5, 7));
      return language === 'zh' ? `${month}月` : monthNames[month - 1];
    }
    return '';
  });

  const actualData = flatDays.map((day: { date: string; balance: number }) =>
    day.date <= todayStr ? day.balance : null
  );

  const predictedData = flatDays.map((day: { date: string; balance: number }) =>
    day.date >= todayStr ? day.balance : null
  );

  const option = {
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: { color: isDark ? '#e5e7eb' : '#374151' },
      formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number | null; dataIndex: number }[]) => {
        const validParams = params.filter((p) => p.value !== null);
        if (validParams.length === 0) return '';
        const dayData = flatDays[validParams[0].dataIndex];
        if (!dayData) return '';

        const dateParts = dayData.date.split('-');
        const dateLabel = language === 'zh'
          ? `${dateParts[0]}年${parseInt(dateParts[1])}月${parseInt(dateParts[2])}日`
          : `${monthNames[parseInt(dateParts[1]) - 1]} ${parseInt(dateParts[2])}, ${dateParts[0]}`;

        const statusLabel = dayData.isActual
          ? (language === 'zh' ? '实际数据' : 'Actual')
          : (language === 'zh' ? '预测数据' : 'Predicted');

        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${dateLabel}</div>`;
        result += `<div style="font-size: 12px; color: ${textColor}; margin-bottom: 4px;">${statusLabel}</div>`;

        validParams.forEach((item) => {
          const value = item.value ?? 0;
          result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            ${item.marker}
            <span>${item.seriesName}: ¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>`;
        });

        result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${tooltipBorder};">`;
        result += `<div style="font-size: 12px;">${language === 'zh' ? '当日收支' : 'Daily Flow'}</div>`;
        result += `<div style="font-size: 12px; margin: 2px 0;">+¥${dayData.income.toFixed(2)} / -¥${dayData.expense.toFixed(2)}</div>`;
        result += '</div>';

        return result;
      },
    },
    legend: {
      data: [
        language === 'zh' ? '累计结余' : 'Cumulative Balance',
        language === 'zh' ? '预测结余' : 'Predicted Balance',
      ],
      textStyle: { color: textColor },
      bottom: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: xAxisLabels,
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 12, interval: 0 },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: textColor, fontSize: 12, formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k` },
      splitLine: { lineStyle: { color: splitLineColor, type: 'dashed' as const } },
    },
    series: [
      {
        name: language === 'zh' ? '累计结余' : 'Cumulative Balance',
        type: 'line' as const,
        smooth: false,
        data: actualData,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
        emphasis: { scale: 1.5 },
        showSymbol: false,
      },
      {
        name: language === 'zh' ? '预测结余' : 'Predicted Balance',
        type: 'line' as const,
        smooth: false,
        data: predictedData,
        lineStyle: { color: '#3b82f6', width: 2, type: 'dashed' as const },
        itemStyle: { color: '#3b82f6', opacity: 0.6 },
        symbol: 'circle',
        symbolSize: 4,
        emphasis: { scale: 1.5 },
        showSymbol: false,
      },
    ],
  };

  if (flatDays.length === 0) {
    return (
      <Card bordered={false}>
        <Empty
          description={
            <div>
              <p>{language === 'zh' ? '暂无数据' : 'No Data'}</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                {language === 'zh' ? '添加交易记录后将显示趋势图表' : 'Add records to see the trend chart'}
              </p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card title={language === 'zh' ? '结余趋势' : 'Balance Trend'} bordered={false}>
      <div style={{ height: 320 }}>
        <BaseChart option={option} style={{ width: '100%', height: '100%' }} />
      </div>
    </Card>
  );
}
