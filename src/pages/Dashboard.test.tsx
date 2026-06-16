import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../hooks/useRecords');
vi.mock('../hooks/useStatistics');

// Mock chart components
vi.mock('../components/BalanceChart', () => ({
  BalanceChart: () => <div data-testid="balance-chart">Balance Chart</div>,
}));

vi.mock('../components/ExpenseChart', () => ({
  ExpenseChart: () => <div data-testid="expense-chart">Expense Chart</div>,
}));

vi.mock('../components/IncomeChart', () => ({
  IncomeChart: () => <div data-testid="income-chart">Income Chart</div>,
}));

describe('Dashboard', () => {
  const mockToggleLanguage = vi.fn();
  const mockDeleteRecord = vi.fn();
  const mockFormatCurrency = vi.fn((amount: number) => `¥${amount.toFixed(2)}`);
  const mockFormatDate = vi.fn((date: string) => date);

  const defaultLanguageMock = {
    language: 'zh' as const,
    t: {
      dashboard: {
        title: '总览',
        totalIncome: '总收入',
        totalExpense: '总支出',
        balance: '结余',
        recentTransactions: '最近交易',
        noRecords: '暂无交易记录',
        addFirstRecord: '点击左侧"记账"添加第一条记录',
        income: '收入',
        expense: '支出',
        deleteRecord: '删除记录',
      },
    },
    toggleLanguage: mockToggleLanguage,
  };

  const defaultRecordsMock = {
    records: [],
    getRecentRecords: vi.fn(() => []),
    deleteRecord: mockDeleteRecord,
    count: 0,
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
    vi.mocked(useLanguage).mockReturnValue(defaultLanguageMock);
    vi.mocked(useRecords).mockReturnValue(defaultRecordsMock as any);
    vi.mocked(useStatistics).mockReturnValue(defaultStatisticsMock as any);
  });

  describe('页面渲染', () => {
    it('应该正确渲染页面标题', () => {
      render(<Dashboard />);
      expect(screen.getByText('总览')).toBeInTheDocument();
    });

    it('应该渲染语言切换按钮', () => {
      render(<Dashboard />);
      const langButton = screen.getByRole('button', { name: /en/i });
      expect(langButton).toBeInTheDocument();
    });

    it('点击语言切换按钮应该调用 toggleLanguage', () => {
      render(<Dashboard />);
      const langButton = screen.getByRole('button', { name: /en/i });
      fireEvent.click(langButton);
      expect(mockToggleLanguage).toHaveBeenCalledTimes(1);
    });
  });

  describe('统计卡片显示', () => {
    it('应该显示总收入卡片', () => {
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        statistics: {
          totalIncome: 1000,
          totalExpense: 500,
          balance: 500,
        },
      } as any);

      render(<Dashboard />);
      expect(screen.getByText('总收入')).toBeInTheDocument();
      expect(mockFormatCurrency).toHaveBeenCalledWith(1000);
    });

    it('应该显示总支出卡片', () => {
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        statistics: {
          totalIncome: 1000,
          totalExpense: 500,
          balance: 500,
        },
      } as any);

      render(<Dashboard />);
      expect(screen.getByText('总支出')).toBeInTheDocument();
      expect(mockFormatCurrency).toHaveBeenCalledWith(500);
    });

    it('应该显示结余卡片', () => {
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        statistics: {
          totalIncome: 1000,
          totalExpense: 500,
          balance: 500,
        },
      } as any);

      render(<Dashboard />);
      expect(screen.getByText('结余')).toBeInTheDocument();
      expect(mockFormatCurrency).toHaveBeenCalledWith(500);
    });
  });

  describe('图表组件渲染', () => {
    it('应该渲染余额图表', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('balance-chart')).toBeInTheDocument();
    });

    it('应该渲染支出图表', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('expense-chart')).toBeInTheDocument();
    });

    it('应该渲染收入图表', () => {
      render(<Dashboard />);
      expect(screen.getByTestId('income-chart')).toBeInTheDocument();
    });
  });

  describe('最近交易列表', () => {
    it('当没有记录时应该显示空状态', () => {
      render(<Dashboard />);
      expect(screen.getByText('暂无交易记录')).toBeInTheDocument();
      expect(screen.getByText('点击左侧"记账"添加第一条记录')).toBeInTheDocument();
    });

    it('应该显示最近交易记录', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 1000,
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
        ...defaultRecordsMock,
        records: mockRecords,
        getRecentRecords: vi.fn(() => mockRecords),
      } as any);

      render(<Dashboard />);
      expect(screen.getByText('工资')).toBeInTheDocument();
      expect(screen.getByText('餐饮')).toBeInTheDocument();
      expect(screen.getByText('月薪')).toBeInTheDocument();
      expect(screen.getByText('午餐')).toBeInTheDocument();
    });

    it('应该显示收入和支出标签', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'income' as const,
          amount: 1000,
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
        ...defaultRecordsMock,
        records: mockRecords,
        getRecentRecords: vi.fn(() => mockRecords),
      } as any);

      render(<Dashboard />);
      expect(screen.getByText('收入')).toBeInTheDocument();
      expect(screen.getByText('支出')).toBeInTheDocument();
    });

    it('点击删除按钮应该调用 deleteRecord', () => {
      const mockRecords = [
        {
          id: '1',
          type: 'expense' as const,
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: '2024-01-16',
          createdAt: 1705363200000,
        },
      ];

      vi.mocked(useRecords).mockReturnValue({
        ...defaultRecordsMock,
        records: mockRecords,
        getRecentRecords: vi.fn(() => mockRecords),
      } as any);

      render(<Dashboard />);
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg.lucide-trash-2'));
      
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(mockDeleteRecord).toHaveBeenCalledWith('1');
      }
    });
  });
});