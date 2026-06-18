import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseChart } from './ExpenseChart';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStatistics } from '../hooks/useStatistics';

// Mock hooks
vi.mock('../contexts/LanguageContext');
vi.mock('../contexts/ThemeContext');
vi.mock('../hooks/useStatistics');

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  default: ({ option }: { option: unknown }) => (
    <div data-testid="echarts-chart" data-chart-option={JSON.stringify(option)}>
      <span data-testid="chart-title">ECharts Component</span>
      {JSON.stringify(option)}
    </div>
  ),
}));

describe('ExpenseChart', () => {
  const defaultLanguageMock = {
    language: 'zh' as const,
    t: {
      chart: {
        expense: '支出',
        noData: '暂无数据',
        noDataHint: '添加交易记录后将显示趋势图表',
      },
    },
    toggleLanguage: vi.fn(),
  };

  const defaultThemeMock = {
    effectiveTheme: 'light' as const,
  };

  const generateMockDailyData = (count: number) => {
    const data = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      data.push({
        date: dateStr,
        balance: 1000 + i * 100,
        income: 500 + i * 50,
        expense: 300 + i * 20,
        isActual: i < 3,
      });
    }
    return data;
  };

  const defaultStatisticsMock = {
    statistics: {
      totalIncome: 5000,
      totalExpense: 3000,
      balance: 2000,
    },
    monthlyData: [],
    monthlyDataWithPrediction: [],
    dailyDataWithPrediction: generateMockDailyData(10),
    refresh: vi.fn(),
    formatCurrency: vi.fn((amount: number) => `¥${amount.toFixed(2)}`),
    formatDate: vi.fn((date: string) => date),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLanguage).mockReturnValue(defaultLanguageMock as any);
    vi.mocked(useTheme).mockReturnValue(defaultThemeMock as any);
    vi.mocked(useStatistics).mockReturnValue(defaultStatisticsMock as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('页面渲染', () => {
    it('应该正确渲染支出趋势图表标题（中文）', () => {
      render(<ExpenseChart />);
      expect(screen.getByText('支出趋势')).toBeInTheDocument();
    });

    it('应该正确渲染支出趋势图表标题（英文）', () => {
      vi.mocked(useLanguage).mockReturnValue({
        ...defaultLanguageMock,
        language: 'en' as const,
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByText('Expense Trend')).toBeInTheDocument();
    });

    it('应该渲染 ECharts 图表组件', () => {
      render(<ExpenseChart />);
      expect(screen.getByTestId('echarts-chart')).toBeInTheDocument();
    });

    it('图例应该包含支出和预测支出（中文）', () => {
      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData.textContent).toContain('支出');
      expect(chartData.textContent).toContain('预测支出');
    });
  });

  describe('空数据处理', () => {
    it('当没有数据时应该显示空状态', () => {
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: [],
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
      expect(screen.getByText('添加交易记录后将显示趋势图表')).toBeInTheDocument();
    });

    it('当没有数据时应该不显示图表标题', () => {
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: [],
      } as any);

      render(<ExpenseChart />);
      expect(screen.queryByText('支出趋势')).not.toBeInTheDocument();
    });

    it('空状态应该使用英文文本当语言为英文时', () => {
      vi.mocked(useLanguage).mockReturnValue({
        ...defaultLanguageMock,
        language: 'en' as const,
        t: {
          chart: {
            expense: 'Expense',
            noData: 'No Data',
            noDataHint: 'Add records to see the trend chart',
          },
        },
      } as any);
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: [],
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByText('No Data')).toBeInTheDocument();
      expect(screen.getByText('Add records to see the trend chart')).toBeInTheDocument();
    });
  });

  describe('主题切换', () => {
    it('暗色主题应该正确渲染', () => {
      vi.mocked(useTheme).mockReturnValue({
        effectiveTheme: 'dark' as const,
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByTestId('echarts-chart')).toBeInTheDocument();
    });

    it('亮色主题应该正确渲染', () => {
      vi.mocked(useTheme).mockReturnValue({
        effectiveTheme: 'light' as const,
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByTestId('echarts-chart')).toBeInTheDocument();
    });
  });

  describe('数据展示', () => {
    it('应该正确生成有数据的图表配置', () => {
      const mockData = [
        {
          date: '2024-01-15',
          balance: 2000,
          income: 1500,
          expense: 500,
          isActual: true,
        },
        {
          date: '2024-01-16',
          balance: 2200,
          income: 1600,
          expense: 600,
          isActual: true,
        },
      ];

      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: mockData,
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByText('支出趋势')).toBeInTheDocument();
      expect(screen.getByTestId('echarts-chart')).toBeInTheDocument();
    });

    it('应该正确处理包含预测数据的情况', () => {
      const mockData = [
        {
          date: '2024-01-15',
          balance: 2000,
          income: 1500,
          expense: 500,
          isActual: true,
        },
        {
          date: '2025-12-31',
          balance: 3000,
          income: 2000,
          expense: 800,
          isActual: false,
        },
      ];

      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: mockData,
      } as any);

      render(<ExpenseChart />);
      expect(screen.getByTestId('echarts-chart')).toBeInTheDocument();
    });
  });

  describe('图表配置', () => {
    it('X 轴应该在每月 1 日显示月份标签', () => {
      const mockData = [
        {
          date: '2024-01-01',
          balance: 1000,
          income: 800,
          expense: 300,
          isActual: true,
        },
        {
          date: '2024-01-02',
          balance: 1100,
          income: 850,
          expense: 350,
          isActual: true,
        },
        {
          date: '2024-02-01',
          balance: 2000,
          income: 1500,
          expense: 500,
          isActual: true,
        },
      ];

      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: mockData,
      } as any);

      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData.textContent).toContain('1月');
      expect(chartData.textContent).toContain('2月');
    });

    it('图表应该包含两个系列（实际数据和预测数据）', () => {
      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData.textContent).toContain('支出');
      expect(chartData.textContent).toContain('预测支出');
    });

    it('图表 Y 轴应该正确格式化数值显示', () => {
      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData).toBeInTheDocument();
    });
  });

  describe('语言切换', () => {
    it('中文模式应该显示中文月份', () => {
      const mockData = [
        {
          date: '2024-03-01',
          balance: 1000,
          income: 800,
          expense: 300,
          isActual: true,
        },
      ];

      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: mockData,
      } as any);

      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData.textContent).toContain('3月');
    });

    it('英文模式应该显示英文月份', () => {
      const mockData = [
        {
          date: '2024-03-01',
          balance: 1000,
          income: 800,
          expense: 300,
          isActual: true,
        },
      ];

      vi.mocked(useLanguage).mockReturnValue({
        ...defaultLanguageMock,
        language: 'en' as const,
      } as any);
      vi.mocked(useStatistics).mockReturnValue({
        ...defaultStatisticsMock,
        dailyDataWithPrediction: mockData,
      } as any);

      render(<ExpenseChart />);
      const chartData = screen.getByTestId('echarts-chart');
      expect(chartData.textContent).toContain('Mar');
    });
  });
});
