import type { BudgetResult } from '../types';

/**
 * 将 BudgetResult 转换为图表所需的数据格式
 * 兼容 ECharts 等图表库的数据格式
 */
export function prepareChartData(result: BudgetResult): { series: any[]; categories: string[] } {
  const categories = [...result.labels];
  const seriesData = [...result.data];

  // 如果有预测数据，添加到图表中
  if (result.prediction && result.prediction.length > 0) {
    const predictionLabels = result.prediction.map((_, i) => `预测+${i + 1}`);
    categories.push(...predictionLabels);
    // 预测数据单独一个系列，历史数据填充 null
    seriesData.push(...Array(result.prediction.length).fill(null));
  }

  const series: any[] = [
    {
      name: result.profileType === 'balance' ? '余额' : result.profileType === 'income' ? '收入' : '支出',
      type: 'line',
      data: [...result.data],
      smooth: true,
      itemStyle: {
        color: result.profileType === 'balance' ? '#1677ff' : result.profileType === 'income' ? '#52c41a' : '#fa8c16',
      },
      lineStyle: { width: 2 },
    },
  ];

  // 添加预测系列
  if (result.prediction && result.prediction.length > 0) {
    const predictionSeriesData: (number | null)[] = [
      ...Array(result.data.length - 1).fill(null),
      result.data[result.data.length - 1], // 最后一个实际值作为连接点
      ...result.prediction,
    ];

    series.push({
      name: '预测',
      type: 'line',
      data: predictionSeriesData,
      smooth: true,
      lineStyle: { type: 'dashed', width: 2 },
      itemStyle: { color: '#999' },
    });
  }

  return { series, categories };
}
