import type { ExpenseRecord } from '../types';
import { safeSubtract } from '../../shared/number-format';

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

/**
 * 计算指定月份的汇总数据
 * 修复：正确区分 income/expense/investment/loan 类型
 * - income / loan-receive → 收入
 * - expense / loan-repay → 支出
 * - transfer / investment → 不计入收支汇总
 */
export function calculateMonthlySummary(
  records: ExpenseRecord[],
  month: string,
  _defaultCurrency: string,
): MonthlySummary {
  const monthPrefix = month.slice(0, 7);

  const monthlyRecords = records.filter(r => r.date.slice(0, 7) === monthPrefix);

  let totalIncome = 0;
  let totalExpense = 0;

  for (const record of monthlyRecords) {
    switch (record.type) {
      case 'income':
      case 'loan-receive':
        totalIncome += record.amount;
        break;
      case 'expense':
      case 'loan-repay':
        totalExpense += record.amount;
        break;
      // transfer 和 investment 不计入收支汇总
      case 'transfer':
      case 'investment':
      default:
        break;
    }
  }

  return {
    totalIncome,
    totalExpense,
    balance: safeSubtract(totalIncome, totalExpense),
  };
}
