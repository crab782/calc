import type { FinancialSource } from './types';
import { isSourceActiveOnDay } from './schedule';

/**
 * 计算指定日期该来源应产生的收入金额
 * @param source 财务来源（type='income'）
 * @param date 目标日期
 * @returns 当天的收入金额，若不触发则返回 0
 */
export function calculateIncomeAmount(source: FinancialSource, date: Date): number {
  if (source.type !== 'income' || !source.enabled) {
    return 0;
  }

  if (isSourceActiveOnDay(source, date)) {
    return source.amount;
  }

  return 0;
}
