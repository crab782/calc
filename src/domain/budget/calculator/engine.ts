import type { ExpenseRecord, FinancialSource } from '../../../types/record';
import type { BudgetProfileType, BudgetResult } from '../types';
import { predictBudgetTrend } from './prediction';

/**
 * 将周期金额转换为月度金额
 */
function convertToMonthlyAmount(amount: number, period: FinancialSource['period']): number {
  switch (period) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    case 'once':
      return 0;
    default:
      return 0;
  }
}

/**
 * 计算指定账户的历史月均收支变化
 */
function calculateAccountMonthlyChange(accountId: string, records: ExpenseRecord[]): number {
  const accountRecords = records.filter(r =>
    r.entries?.some(e => e.accountId === accountId)
  );

  if (accountRecords.length === 0) {
    return 0;
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let minDate = '';
  let maxDate = '';

  accountRecords.forEach(record => {
    record.entries?.forEach(entry => {
      if (entry.accountId === accountId) {
        if (entry.direction === 'debit') {
          totalDebit += entry.amount;
        } else {
          totalCredit += entry.amount;
        }
      }
    });
    if (!minDate || record.date < minDate) minDate = record.date;
    if (!maxDate || record.date > maxDate) maxDate = record.date;
  });

  let monthSpan = 1;
  if (minDate && maxDate) {
    const [minYear, minMonth] = minDate.split('-').map(Number);
    const [maxYear, maxMonth] = maxDate.split('-').map(Number);
    monthSpan = (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1;
    if (monthSpan < 1) monthSpan = 1;
  }

  const netChange = totalDebit - totalCredit;
  return parseFloat((netChange / monthSpan).toFixed(2));
}

/**
 * 计算账户余额
 */
function getAccountBalance(accountId: string, records: ExpenseRecord[]): number {
  let balance = 0;
  records.forEach(record => {
    record.entries?.forEach(entry => {
      if (entry.accountId === accountId) {
        if (entry.direction === 'debit') {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
      }
    });
  });
  return balance;
}

/**
 * 计算月度总收入（从财务来源）
 */
function calculateMonthlyIncome(sources: FinancialSource[]): number {
  return sources
    .filter(s => s.type === 'income')
    .reduce((total, source) => total + convertToMonthlyAmount(source.amount, source.period), 0);
}

/**
 * 计算月度总支出（从财务来源）
 */
function calculateMonthlyExpense(sources: FinancialSource[]): number {
  return sources
    .filter(s => s.type === 'expense')
    .reduce((total, source) => total + convertToMonthlyAmount(source.amount, source.period), 0);
}

/**
 * 预算计算主入口
 */
export function calculateBudget(
  profileType: BudgetProfileType,
  records: ExpenseRecord[],
  sources: FinancialSource[],
  months: number,
  currency: string,
  accountId?: string
): BudgetResult {
  const labels: string[] = [];
  const data: number[] = [];

  if (profileType === 'balance' && accountId) {
    // 余额预测：基于账户历史月均变化推算未来余额
    const currentBalance = getAccountBalance(accountId, records);
    const monthlyChange = calculateAccountMonthlyChange(accountId, records);

    let runningBalance = currentBalance;
    for (let i = 0; i < months; i++) {
      labels.push(`第${i + 1}月`);
      runningBalance += monthlyChange;
      data.push(parseFloat(runningBalance.toFixed(2)));
    }
  } else if (profileType === 'income') {
    // 收入预测：基于财务来源计算月度收入
    const monthlyIncome = calculateMonthlyIncome(sources.filter(s => s.currency === currency));

    for (let i = 0; i < months; i++) {
      labels.push(`第${i + 1}月`);
      data.push(parseFloat(monthlyIncome.toFixed(2)));
    }
  } else if (profileType === 'expense') {
    // 支出预测：基于财务来源计算月度支出
    const monthlyExpense = calculateMonthlyExpense(sources.filter(s => s.currency === currency));

    for (let i = 0; i < months; i++) {
      labels.push(`第${i + 1}月`);
      data.push(parseFloat(monthlyExpense.toFixed(2)));
    }
  }

  const total = data.reduce((sum, val) => sum + val, 0);

  // 生成预测趋势（额外预测未来 3 期）
  const prediction = predictBudgetTrend(data, 3);

  return {
    profileType,
    data,
    labels,
    total: parseFloat(total.toFixed(2)),
    prediction,
  };
}
