import type { Entry, RecordType } from '../types';
import { safeAdd, safeSubtract } from '../../shared/number-format';

/**
 * 计算分录对余额的净影响
 * 基于借贷记账法：target（借方）增加余额，source（贷方）减少余额
 * 修复：正确区分 expense/investment/loan-repay 类型，不再将所有非 income 类型错误计入支出
 */
export function calculateEntryBalance(entries: Entry[], _recordType: RecordType): number {
  if (entries.length === 0) return 0;

  let totalSource = 0;
  let totalTarget = 0;

  for (const entry of entries) {
    if (entry.role === 'source') {
      totalSource = safeAdd(totalSource, entry.amount);
    } else {
      totalTarget = safeAdd(totalTarget, entry.amount);
    }
  }

  return safeSubtract(totalTarget, totalSource);
}

/**
 * 根据记录类型判断该记录是否影响"可支配余额"
 * income: 增加可支配余额
 * expense: 减少可支配余额
 * transfer: 不改变可支配余额（账户间转移）
 * investment: 减少可支配余额（资金锁定）
 * loan-receive: 增加可支配余额
 * loan-repay: 减少可支配余额
 */
export function getRecordBalanceImpact(recordType: RecordType, amount: number): number {
  switch (recordType) {
    case 'income':
    case 'loan-receive':
      return amount;
    case 'expense':
    case 'investment':
    case 'loan-repay':
      return -amount;
    case 'transfer':
      return 0;
    default:
      return 0;
  }
}
