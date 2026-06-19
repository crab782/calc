import type { ExpenseRecord } from '../../types/record';
import type { FinancialSource } from '../../types/record';
import type { DailyData } from './daily';
import type { MonthlyData } from './monthly';

export interface PredictionData {
  date: string;
  predicted: number;
  actual?: number;
}

// ========== 日级预测 ==========

export interface DailyDataWithPrediction {
  dailyData: DailyData[];
  predictions: PredictionData[];
}

export function generateDailyDataWithPrediction(
  records: ExpenseRecord[],
  financialSources: FinancialSource[],
  days: number,
  currency: string
): DailyDataWithPrediction {
  const filtered = records.filter((r) => r.currency === currency);
  const now = new Date();

  // 计算日期范围：过去 (days - 未来天数) 天到今天，加上未来天数
  const futureDays = Math.max(30, Math.floor(days / 4));
  const pastDays = days - futureDays;
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - pastDays);
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + futureDays);

  const dates: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(formatDateISO(current));
    current.setDate(current.getDate() + 1);
  }

  // 按日聚合实际记录
  const actualDailyMap: Record<string, { income: number; expense: number }> = {};
  filtered.forEach((record) => {
    const day = record.date;
    if (!actualDailyMap[day]) {
      actualDailyMap[day] = { income: 0, expense: 0 };
    }
    if (record.type === 'income') {
      actualDailyMap[day].income += record.amount;
    } else if (record.type === 'expense') {
      actualDailyMap[day].expense += record.amount;
    }
  });

  // 筛选财务来源
  const incomeSources = financialSources.filter(
    (s) => s.type === 'income' && s.currency === currency
  );
  const expenseSources = financialSources.filter(
    (s) => s.type === 'expense' && s.currency === currency
  );

  // 生成结果
  const dailyData: DailyData[] = [];
  const predictions: PredictionData[] = [];
  const todayStr = formatDateISO(now);

  for (const date of dates) {
    const isFuture = date > todayStr;
    const actualData = actualDailyMap[date];
    let income = 0;
    let expense = 0;

    if (actualData) {
      income = actualData.income;
      expense = actualData.expense;
    } else if (isFuture) {
      const d = parseDateISO(date);
      const dayOfWeek = d.getDay();

      incomeSources.forEach((source) => {
        if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          income += source.amount;
        }
      });

      expenseSources.forEach((source) => {
        if (isSourceActiveOnDay(source, d, dayOfWeek)) {
          expense += source.amount;
        }
      });
    }

    const net = income - expense;
    dailyData.push({
      date,
      income,
      expense,
    });

    if (isFuture) {
      predictions.push({
        date,
        predicted: net,
        actual: actualData ? actualData.income - actualData.expense : undefined,
      });
    } else if (actualData) {
      predictions.push({
        date,
        predicted: net,
        actual: actualData.income - actualData.expense,
      });
    }
  }

  return { dailyData, predictions };
}

// ========== 月级预测 ==========

export interface MonthlyDataWithPrediction {
  monthlyData: MonthlyData[];
  predictions: PredictionData[];
}

export function generateMonthlyDataWithPrediction(
  records: ExpenseRecord[],
  financialSources: FinancialSource[],
  months: number,
  currency: string
): MonthlyDataWithPrediction {
  // 先生成日级数据
  const totalDays = months * 31;
  const { dailyData } = generateDailyDataWithPrediction(
    records,
    financialSources,
    totalDays,
    currency
  );

  // 聚合为月级数据
  const monthlyMap: Record<string, MonthlyData> = {};
  dailyData.forEach((day) => {
    const month = day.date.substring(0, 7);
    if (!monthlyMap[month]) {
      monthlyMap[month] = { month, income: 0, expense: 0 };
    }
    monthlyMap[month].income += day.income;
    monthlyMap[month].expense += day.expense;
  });

  const monthlyData = Object.values(monthlyMap).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  // 生成月度预测
  const now = new Date();
  const currentMonth = formatDateISO(now).substring(0, 7);
  const predictions: PredictionData[] = monthlyData.map((m) => ({
    date: m.month,
    predicted: m.income - m.expense,
    actual: m.month < currentMonth ? m.income - m.expense : undefined,
  }));

  return { monthlyData, predictions };
}

// ========== 内部工具函数 ==========

/**
 * 判断财务来源是否在指定日期触发
 */
function isSourceActiveOnDay(
  source: FinancialSource,
  date: Date,
  dayOfWeek: number
): boolean {
  switch (source.period) {
    case 'daily':
      return true;
    case 'weekly':
      return source.dayOfWeek !== undefined && dayOfWeek === source.dayOfWeek;
    case 'monthly':
      if (source.dayOfMonth === undefined) return false;
      if (source.dayOfMonth === -1) {
        return date.getDate() === getLastDayOfMonth(
          date.getFullYear(),
          date.getMonth()
        );
      }
      return date.getDate() === source.dayOfMonth;
    case 'yearly':
      if (source.dayOfMonth === undefined) return false;
      return date.getDate() === source.dayOfMonth && date.getMonth() === 0;
    case 'once':
      return false;
    default:
      return false;
  }
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
