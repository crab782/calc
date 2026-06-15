import { useState, useCallback, useMemo } from 'react';
import { recordService } from '../lib/record';
import type { Statistics, MonthlyData } from '../lib/record';

export const useStatistics = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const statistics: Statistics = useMemo(() => {
    return recordService.getStatistics();
  }, [refreshKey]);

  const monthlyData: MonthlyData[] = useMemo(() => {
    return recordService.getMonthlyData();
  }, [refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return recordService.formatCurrency(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return recordService.formatDate(dateString);
  }, []);

  return {
    statistics,
    monthlyData,
    refresh,
    formatCurrency,
    formatDate,
  };
};
