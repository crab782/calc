/**
 * 简单的线性回归预测
 * @param data 历史数据数组
 * @param periods 需要预测的期数
 * @returns 预测值数组
 */
export function predictBudgetTrend(data: number[], periods: number): number[] {
  const n = data.length;
  if (n < 2) {
    return Array(periods).fill(data[0] ?? 0);
  }

  // 线性回归: y = a * x + b
  // x = 0, 1, 2, ... n-1
  const sumX = ((n - 1) * n) / 2;
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = data.reduce((acc, val, idx) => acc + idx * val, 0);
  const sumX2 = ((n - 1) * n * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 预测未来 periods 个值
  const predictions: number[] = [];
  for (let i = 0; i < periods; i++) {
    const x = n + i;
    predictions.push(parseFloat((slope * x + intercept).toFixed(2)));
  }

  return predictions;
}
