import type { LoanSource } from './types';
import { isSourceActiveOnDay } from './schedule';

/**
 * 计算指定日期该贷款来源应产生的还款/到账金额
 * @param source 贷款来源
 * @param date 目标日期
 * @returns 当天的贷款金额（repay 为还款金额，receive 为到账金额），若不触发则返回 0
 */
export function calculateLoanPayment(source: LoanSource, date: Date): number {
  if (!source.enabled) {
    return 0;
  }

  if (isSourceActiveOnDay(source, date)) {
    // 还款时返回本金 + 利息，到账时只返回本金
    if (source.loanType === 'repay') {
      return source.principal + source.interest;
    }
    return source.principal;
  }

  return 0;
}
