import type { ExpenseRecord } from '../../types/record';
import { safeAdd } from '../shared/number-format';

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/**
 * 计算统计数据（总收入、总支出、结余）
 * 正确区分 income/expense：仅 type === 'income' 计入收入，type === 'expense' 计入支出
 * investment、loan-receive 等不计入支出
 */
export function calculateStatistics(
  records: ExpenseRecord[],
  currency: string
): Statistics {
  const filtered = records.filter((r) => r.currency === currency);

  return filtered.reduce(
    (acc, record) => {
      if (record.type === 'income') {
        acc.totalIncome = safeAdd(acc.totalIncome, record.amount);
      } else if (record.type === 'expense') {
        acc.totalExpense = safeAdd(acc.totalExpense, record.amount);
      }
      acc.balance = acc.totalIncome - acc.totalExpense;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, balance: 0 }
  );
}

/**
 * 按月聚合数据，返回最近 months 个月的数据
 * 仅统计 type === 'income' 和 type === 'expense'
 */
export function calculateMonthlyData(
  records: ExpenseRecord[],
  months: number,
  currency: string
): MonthlyData[] {
  const filtered = records.filter((r) => r.currency === currency);

  const monthlyMap = filtered.reduce((acc, record) => {
    const month = record.date.substring(0, 7);
    if (!acc[month]) {
      acc[month] = { month, income: 0, expense: 0 };
    }
    if (record.type === 'income') {
      acc[month].income = safeAdd(acc[month].income, record.amount);
    } else if (record.type === 'expense') {
      acc[month].expense = safeAdd(acc[month].expense, record.amount);
    }
    return acc;
  }, {} as Record<string, MonthlyData>);

  return Object.values(monthlyMap)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-months);
}
