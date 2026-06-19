import type { InvestmentSource } from './types';
import { isSourceActiveOnDay } from './schedule';

/**
 * 计算指定日期该投资来源应产生的收益金额
 * @param source 投资来源
 * @param date 目标日期
 * @returns 当天的投资收益金额，若不触发则返回 0
 */
export function calculateInvestmentReturn(source: InvestmentSource, date: Date): number {
  if (!source.enabled) {
    return 0;
  }

  if (isSourceActiveOnDay(source, date)) {
    // 投资到期时返回本金 + 利息
    return source.principal + source.interest;
  }

  return 0;
}
