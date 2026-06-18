import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStatistics } from './useStatistics';
import * as recordModule from '../lib/record';

// Mock the recordService module
vi.mock('../lib/record', () => ({
  recordService: {
    getStatistics: vi.fn(),
    getMonthlyData: vi.fn(),
    generateMonthlyDataWithPrediction: vi.fn(),
    generateDailyDataWithPrediction: vi.fn(),
    formatCurrency: vi.fn(),
    formatDate: vi.fn(),
  },
}));

describe('useStatistics Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('statistics calculation', () => {
    it('应该正确计算总收入、总支出和结余', () => {
      const mockStats = { totalIncome: 10000, totalExpense: 4000, balance: 6000 };
      vi.mocked(recordModule.recordService.getStatistics).mockReturnValue(mockStats);

      const { result } = renderHook(() => useStatistics());

      expect(recordModule.recordService.getStatistics).toHaveBeenCalledTimes(1);
      expect(result.current.statistics).toEqual(mockStats);
      expect(result.current.statistics.totalIncome).toBe(10000);
      expect(result.current.statistics.totalExpense).toBe(4000);
      expect(result.current.statistics.balance).toBe(6000);
    });

    it('应该在记录为空时返回零值', () => {
      const mockStats = { totalIncome: 0, totalExpense: 0, balance: 0 };
      vi.mocked(recordModule.recordService.getStatistics).mockReturnValue(mockStats);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.statistics).toEqual(mockStats);
    });

    it('应该只有一条收入记录时正确计算', () => {
      const mockStats = { totalIncome: 5000, totalExpense: 0, balance: 5000 };
      vi.mocked(recordModule.recordService.getStatistics).mockReturnValue(mockStats);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.statistics.totalIncome).toBe(5000);
      expect(result.current.statistics.totalExpense).toBe(0);
      expect(result.current.statistics.balance).toBe(5000);
    });

    it('应该只有一条支出记录时正确计算', () => {
      const mockStats = { totalIncome: 0, totalExpense: 200, balance: -200 };
      vi.mocked(recordModule.recordService.getStatistics).mockReturnValue(mockStats);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.statistics.totalIncome).toBe(0);
      expect(result.current.statistics.totalExpense).toBe(200);
      expect(result.current.statistics.balance).toBe(-200);
    });

    it('应该在多条记录时正确汇总', () => {
      const mockStats = { totalIncome: 15000, totalExpense: 8500, balance: 6500 };
      vi.mocked(recordModule.recordService.getStatistics).mockReturnValue(mockStats);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.statistics.totalIncome).toBe(15000);
      expect(result.current.statistics.totalExpense).toBe(8500);
      expect(result.current.statistics.balance).toBe(6500);
    });
  });

  describe('monthlyData aggregation', () => {
    it('应该正确返回月度数据并按月份排序', () => {
      const mockMonthlyData = [
        { month: '2024-01', income: 5000, expense: 2000 },
        { month: '2024-02', income: 6000, expense: 3000 },
        { month: '2024-03', income: 5500, expense: 2500 },
      ];
      vi.mocked(recordModule.recordService.getMonthlyData).mockReturnValue(mockMonthlyData);

      const { result } = renderHook(() => useStatistics());

      expect(recordModule.recordService.getMonthlyData).toHaveBeenCalledTimes(1);
      expect(result.current.monthlyData).toEqual(mockMonthlyData);
      expect(result.current.monthlyData).toHaveLength(3);
      expect(result.current.monthlyData[0].month).toBe('2024-01');
      expect(result.current.monthlyData[1].month).toBe('2024-02');
      expect(result.current.monthlyData[2].month).toBe('2024-03');
    });

    it('应该在记录为空时返回空数组', () => {
      vi.mocked(recordModule.recordService.getMonthlyData).mockReturnValue([]);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyData).toEqual([]);
      expect(result.current.monthlyData).toHaveLength(0);
    });

    it('应该只有一条记录时正确聚合', () => {
      const mockMonthlyData = [{ month: '2024-06', income: 3000, expense: 0 }];
      vi.mocked(recordModule.recordService.getMonthlyData).mockReturnValue(mockMonthlyData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyData).toHaveLength(1);
      expect(result.current.monthlyData[0].month).toBe('2024-06');
      expect(result.current.monthlyData[0].income).toBe(3000);
      expect(result.current.monthlyData[0].expense).toBe(0);
    });

    it('应该正确返回最多12个月的数据', () => {
      const mockMonthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: `2024-${String(i + 1).padStart(2, '0')}`,
        income: 5000 + i * 100,
        expense: 3000 + i * 50,
      }));
      vi.mocked(recordModule.recordService.getMonthlyData).mockReturnValue(mockMonthlyData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyData).toHaveLength(12);
      expect(result.current.monthlyData[0].month).toBe('2024-01');
      expect(result.current.monthlyData[11].month).toBe('2024-12');
    });

    it('应该正确计算各月的收支金额', () => {
      const mockMonthlyData = [
        { month: '2024-01', income: 10000, expense: 5000 },
        { month: '2024-02', income: 12000, expense: 6000 },
      ];
      vi.mocked(recordModule.recordService.getMonthlyData).mockReturnValue(mockMonthlyData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyData[0].income).toBe(10000);
      expect(result.current.monthlyData[0].expense).toBe(5000);
      expect(result.current.monthlyData[1].income).toBe(12000);
      expect(result.current.monthlyData[1].expense).toBe(6000);
    });
  });

  describe('monthlyDataWithPrediction', () => {
    it('应该正确返回包含预测的月度数据', () => {
      const mockData: recordModule.MonthlyDataWithPrediction[] = [
        { month: '2024-01', income: 5000, expense: 2000, balance: 3000, isActual: true },
        { month: '2024-02', income: 6000, expense: 3000, balance: 3000, isActual: true },
        { month: '2024-03', income: 5500, expense: 2500, balance: 3000, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateMonthlyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(recordModule.recordService.generateMonthlyDataWithPrediction).toHaveBeenCalledTimes(1);
      expect(result.current.monthlyDataWithPrediction).toEqual(mockData);
      expect(result.current.monthlyDataWithPrediction).toHaveLength(3);
    });

    it('应该正确标记实际数据和预测数据', () => {
      const mockData: recordModule.MonthlyDataWithPrediction[] = [
        { month: '2023-12', income: 5000, expense: 2000, balance: 3000, isActual: true },
        { month: '2024-01', income: 5500, expense: 2200, balance: 3300, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateMonthlyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyDataWithPrediction[0].isActual).toBe(true);
      expect(result.current.monthlyDataWithPrediction[1].isActual).toBe(false);
    });

    it('应该在空数据时返回空数组', () => {
      vi.mocked(recordModule.recordService.generateMonthlyDataWithPrediction).mockReturnValue([]);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyDataWithPrediction).toEqual([]);
    });

    it('应该包含部分实际的当前月数据', () => {
      const mockData: recordModule.MonthlyDataWithPrediction[] = [
        {
          month: '2024-06',
          income: 3000,
          expense: 1500,
          balance: 1500,
          isActual: false,
          isPartialActual: true,
          boundaryDay: 15,
          balanceAtBoundary: 1500,
        },
      ];
      vi.mocked(recordModule.recordService.generateMonthlyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      const currentMonth = result.current.monthlyDataWithPrediction[0];
      expect(currentMonth.isPartialActual).toBe(true);
      expect(currentMonth.boundaryDay).toBe(15);
      expect(currentMonth.balanceAtBoundary).toBe(1500);
      expect(currentMonth.isActual).toBe(false);
    });

    it('应该正确返回各月的结余数据', () => {
      const mockData: recordModule.MonthlyDataWithPrediction[] = [
        { month: '2024-01', income: 5000, expense: 2000, balance: 3000, isActual: true },
        { month: '2024-02', income: 6000, expense: 2500, balance: 6500, isActual: true },
        { month: '2024-03', income: 5500, expense: 3000, balance: 9000, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateMonthlyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.monthlyDataWithPrediction[0].balance).toBe(3000);
      expect(result.current.monthlyDataWithPrediction[1].balance).toBe(6500);
      expect(result.current.monthlyDataWithPrediction[2].balance).toBe(9000);
    });
  });

  describe('dailyDataWithPrediction', () => {
    it('应该正确返回包含预测的日级数据', () => {
      const mockData: recordModule.DailyData[] = [
        { date: '2024-01-01', income: 100, expense: 50, balance: 50, isActual: true },
        { date: '2024-01-02', income: 200, expense: 100, balance: 150, isActual: true },
        { date: '2024-01-03', income: 0, expense: 0, balance: 150, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateDailyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(recordModule.recordService.generateDailyDataWithPrediction).toHaveBeenCalledTimes(1);
      expect(result.current.dailyDataWithPrediction).toEqual(mockData);
      expect(result.current.dailyDataWithPrediction).toHaveLength(3);
    });

    it('应该在空数据时返回空数组', () => {
      vi.mocked(recordModule.recordService.generateDailyDataWithPrediction).mockReturnValue([]);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.dailyDataWithPrediction).toEqual([]);
    });

    it('应该正确区分实际数据和预测数据', () => {
      const mockData: recordModule.DailyData[] = [
        { date: '2024-01-01', income: 100, expense: 50, balance: 50, isActual: true },
        { date: '2024-12-31', income: 0, expense: 0, balance: 50, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateDailyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.dailyDataWithPrediction[0].isActual).toBe(true);
      expect(result.current.dailyDataWithPrediction[1].isActual).toBe(false);
    });

    it('应该正确计算每日结余', () => {
      const mockData: recordModule.DailyData[] = [
        { date: '2024-01-01', income: 1000, expense: 200, balance: 800, isActual: true },
        { date: '2024-01-02', income: 500, expense: 300, balance: 1000, isActual: true },
        { date: '2024-01-03', income: 0, expense: 0, balance: 1000, isActual: false },
      ];
      vi.mocked(recordModule.recordService.generateDailyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      expect(result.current.dailyDataWithPrediction[0].balance).toBe(800);
      expect(result.current.dailyDataWithPrediction[1].balance).toBe(1000);
      expect(result.current.dailyDataWithPrediction[2].balance).toBe(1000);
    });

    it('应该在只有实际数据时全部标记为实际', () => {
      const mockData: recordModule.DailyData[] = [
        { date: '2024-01-01', income: 100, expense: 50, balance: 50, isActual: true },
        { date: '2024-01-02', income: 200, expense: 100, balance: 150, isActual: true },
      ];
      vi.mocked(recordModule.recordService.generateDailyDataWithPrediction).mockReturnValue(mockData);

      const { result } = renderHook(() => useStatistics());

      result.current.dailyDataWithPrediction.forEach((day) => {
        expect(day.isActual).toBe(true);
      });
    });
  });

  describe('formatCurrency', () => {
    it('应该调用 recordService.formatCurrency', () => {
      vi.mocked(recordModule.recordService.formatCurrency).mockReturnValue('¥1,000.00');

      const { result } = renderHook(() => useStatistics());
      const formatted = result.current.formatCurrency(1000);

      expect(recordModule.recordService.formatCurrency).toHaveBeenCalledWith(1000);
      expect(formatted).toBe('¥1,000.00');
    });

    it('应该格式化负数金额', () => {
      vi.mocked(recordModule.recordService.formatCurrency).mockReturnValue('-¥500.00');

      const { result } = renderHook(() => useStatistics());
      const formatted = result.current.formatCurrency(-500);

      expect(formatted).toBe('-¥500.00');
    });
  });

  describe('formatDate', () => {
    it('应该调用 recordService.formatDate', () => {
      vi.mocked(recordModule.recordService.formatDate).mockReturnValue('2024/01/15');

      const { result } = renderHook(() => useStatistics());
      const formatted = result.current.formatDate('2024-01-15');

      expect(recordModule.recordService.formatDate).toHaveBeenCalledWith('2024-01-15');
      expect(formatted).toBe('2024/01/15');
    });
  });

  describe('refresh method', () => {
    it('调用 refresh 后应该重新计算所有统计数据', async () => {
      const mockStats1 = { totalIncome: 1000, totalExpense: 500, balance: 500 };
      const mockStats2 = { totalIncome: 2000, totalExpense: 800, balance: 1200 };

      let statsCallCount = 0;
      vi.mocked(recordModule.recordService.getStatistics).mockImplementation(() => {
        statsCallCount++;
        return statsCallCount === 1 ? mockStats1 : mockStats2;
      });

      const { result } = renderHook(() => useStatistics());

      expect(result.current.statistics).toEqual(mockStats1);
      expect(statsCallCount).toBe(1);

      act(() => {
        result.current.refresh();
      });

      // Wait for the state update to propagate and useMemo to recompute
      await waitFor(() => {
        expect(result.current.statistics).toEqual(mockStats2);
      });
      expect(statsCallCount).toBe(2);
    });
  });
});
