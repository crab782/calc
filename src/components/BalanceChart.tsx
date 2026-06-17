import ReactECharts from 'echarts-for-react';
import { Card, Empty } from 'antd';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatistics } from '../hooks/useStatistics';

export const BalanceChart = () => {
  const { language } = useLanguage();
  const { effectiveTheme } = useTheme();
  const { monthlyDataWithPrediction, dailyDataWithPrediction } = useStatistics();

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

  // Group daily data by month for tooltip detail
  const dailyByMonth: Record<string, typeof dailyDataWithPrediction> = {};
  dailyDataWithPrediction.forEach(day => {
    const month = day.date.substring(0, 7);
    if (!dailyByMonth[month]) dailyByMonth[month] = [];
    dailyByMonth[month].push(day);
  });

  // 构建数据系列：处理当前月的实际/预测边界
  // 过去月份：实线（actual）
  // 当前月：实线和虚线共享边界点（balanceAtBoundary = 今天的结余）
  // 未来月份：虚线（predicted）
  const actualData = monthlyDataWithPrediction.map((item) => {
    if (item.isActual || item.isPartialActual) {
      // 过去月份或当前月：显示结余
      return item.isPartialActual ? (item.balanceAtBoundary ?? item.balance) : item.balance;
    }
    return null;
  });

  const predictedData = monthlyDataWithPrediction.map((item) => {
    if (item.isPartialActual || !item.isActual) {
      // 当前月或未来月份：显示结余
      return item.isPartialActual ? (item.balanceAtBoundary ?? item.balance) : item.balance;
    }
    return null;
  });

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
      },
      formatter: (params: { axisValue: string; marker: string; seriesName: string; value: number | null; dataIndex: number }[]) => {
        const validParams = params.filter((p) => p.value !== null);
        if (validParams.length === 0) return '';
        const monthStr = monthlyDataWithPrediction[validParams[0].dataIndex]?.month;
        const monthDays = monthStr ? dailyByMonth[monthStr] : [];
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${validParams[0].axisValue}</div>`;
        validParams.forEach((item) => {
          const value = item.value ?? 0;
          result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            ${item.marker}
            <span>${item.seriesName}: ¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
          </div>`;
        });
        // Show daily breakdown for the hovered month
        if (monthDays.length > 0) {
          result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid ${tooltipBorder};">`;
          result += `<div style="font-size: 12px; color: ${textColor}; margin-bottom: 4px;">${language === 'zh' ? '每日明细' : 'Daily Detail'}</div>`;
          monthDays.forEach(day => {
            const dateLabel = day.date.substring(5); // MM-DD
            const marker = day.isActual ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#52c41a;margin-right:4px;"></span>' : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#faad14;margin-right:4px;"></span>';
            result += `<div style="font-size: 12px; margin: 2px 0;">${marker}${dateLabel}: +¥${day.income.toFixed(2)} / -¥${day.expense.toFixed(2)}</div>`;
          });
          result += '</div>';
        }
        return result;
      },
    },
    legend: {
      data: [
        language === 'zh' ? '累计结余' : 'Cumulative Balance',
        language === 'zh' ? '预测结余' : 'Predicted Balance',
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
      <Card bordered={false}>
        <Empty
          description={
            <div>
              <p>暂无数据</p>
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>添加交易记录后将显示月度趋势图表</p>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card title={language === 'zh' ? '结余趋势' : 'Balance Trend'} bordered={false}>
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
