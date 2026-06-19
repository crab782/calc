import { useMemo } from 'react';
import type { ExpenseRecord, FinancialSource } from '../../types/record';
import { calculateStatistics, calculateMonthlyData } from '../../domain/statistics/monthly';
import { generateMonthlyDataWithPrediction, generateDailyDataWithPrediction } from '../../domain/statistics/prediction';

export function useStatistics(
  records: ExpenseRecord[],
  financialSources: FinancialSource[],
) {
  const defaultCurrency = records.length > 0 ? records[0].currency || 'CNY' : 'CNY';

  const statistics = useMemo(
    () => calculateStatistics(records, defaultCurrency),
    [records, defaultCurrency],
  );

  const monthlyData = useMemo(
    () => calculateMonthlyData(records, 12, defaultCurrency),
    [records, defaultCurrency],
  );

  const predictionData = useMemo(
    () => generateMonthlyDataWithPrediction(records, financialSources, 12, defaultCurrency),
    [records, financialSources, defaultCurrency],
  );

  const dailyPredictionData = useMemo(
    () => generateDailyDataWithPrediction(records, financialSources, 365, defaultCurrency),
    [records, financialSources, defaultCurrency],
  );

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return { statistics, monthlyData, predictionData, dailyPredictionData, formatCurrency, formatDate };
}
