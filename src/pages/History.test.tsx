import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { History } from './History';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../hooks/useRecords');
vi.mock('../hooks/useStatistics');

describe('History', () => {
  const mockFormatCurrency = vi.fn((amount: number) => `¥${amount.toFixed(2)}`);
  const mockFormatDate = vi.fn((date: string) => date);

  const defaultLanguageMock = {
    language: 'zh' as const,
    t: {
      history: {
        title: '历史记录',
        noRecords: '暂无交易记录',
        addFirstRecord: '点击左侧"记账"添加第一条记录',
        time: '时间',
        category: '分类',
        amount: '金额',
        type: '类型',
        description: '描述',
        income: '收入',
        expense: '支出',
        incomeType: '收入',
        expenseType: '支出',
      },
    },
    toggleLanguage: vi.fn(),
  };

  const defaultRecordsMock = {
    records: [],
  };

  const defaultStatisticsMock = {
    statistics: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    },
    monthlyData: [],
    monthlyDataWithPrediction: [],
    refresh: vi.fn(),
    formatCurrency: mockFormatCurrency,
    formatDate: mockFormatDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLanguage).mockReturnValue(defaultLanguageMock as any);
    vi.mocked(useRecords).mockReturnValue(defaultRecordsMock as any);
    vi.mocked(useStatistics).mockReturnValue(defaultStatisticsMock as any);
  });

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', () => {
      render(<History />);
      expect(screen.getByText('历史记录')).toBeInTheDocument();
    });

    it('应该渲染历史图标', () => {
      render(<History />);
      // 检查是否有 SVG 图标（通过查找包含特定类名的元素）
      const historyIcon = document.querySelector('.lucide-history');
      expect(historyIcon).toBeInTheDocument();
    });
  });

  describe('空状态显示', () => {
    it('当没有记录时应该显示空状态提示', () => {
      render(<History />);
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
      expect(screen.getByText('点击左侧"记账"添加第一条记录')).toBeInTheDocument();
    });
  });

  describe('记录列表显示', () => {
    it('应该显示记录列表', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 应该显示分类
      expect(screen.getByText('工资')).toBeInTheDocument();
      expect(screen.getByText('餐饮')).toBeInTheDocument();
      
      // 应该显示备注
      expect(screen.getByText('月薪')).toBeInTheDocument();
      expect(screen.getByText('午餐')).toBeInTheDocument();
    });

    it('应该显示收入和支出类型标签', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 应该显示收入和支出类型标签
      expect(screen.getByText('收入')).toBeInTheDocument();
      expect(screen.getByText('支出')).toBeInTheDocument();
    });

    it('应该调用 formatCurrency 格式化金额', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      expect(mockFormatCurrency).toHaveBeenCalledWith(5000);
    });

    it('应该调用 formatDate 格式化日期', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      expect(mockFormatDate).toHaveBeenCalledWith('2024-01-15');
    });

    it('当没有备注时应该显示 "-"', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('按月分组显示', () => {
    it('应该按月份分组显示记录', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
        {
          id: '3',
          type: 'expense' as const,
          amount: 200,
          category: '交通',
          note: '打车',
          date: '2024-02-01',
          createdAt: 1706745600000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 应该显示月份标题
      expect(screen.getByText('2024年1月')).toBeInTheDocument();
      expect(screen.getByText('2024年2月')).toBeInTheDocument();
    });

    it('应该显示每月的收入和支出统计', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 应该显示收入和支出统计
      expect(screen.getByText('收入:')).toBeInTheDocument();
      expect(screen.getByText('支出:')).toBeInTheDocument();
      
      // 应该调用 formatCurrency 格式化月度统计
      expect(mockFormatCurrency).toHaveBeenCalledWith(5000);
      expect(mockFormatCurrency).toHaveBeenCalledWith(100);
    });

    it('应该按时间从新到旧排序显示月份', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
        {
          id: '2',
          type: 'expense' as const,
          amount: 200,
          category: '交通',
          note: '打车',
          date: '2024-02-01',
          createdAt: 1706745600000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 获取所有月份标题
      const monthHeaders = screen.getAllByText(/年\d+月/);
      
      // 2024年2月应该在前面（更近的月份）
      expect(monthHeaders[0].textContent).toBe('2024年2月');
      expect(monthHeaders[1].textContent).toBe('2024年1月');
    });
  });

  describe('表格结构', () => {
    it('应该显示表格标题', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: '2024-01-15',
          createdAt: 1705276800000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        records: mockRecords,
      } as any);

      render(<History />);
      
      // 应该显示表格列标题
      expect(screen.getByText('时间')).toBeInTheDocument();
      expect(screen.getByText('分类')).toBeInTheDocument();
      expect(screen.getByText('金额')).toBeInTheDocument();
      expect(screen.getByText('类型')).toBeInTheDocument();
      expect(screen.getByText('描述')).toBeInTheDocument();
    });
  });
});