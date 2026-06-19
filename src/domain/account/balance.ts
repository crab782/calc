import type { ExpenseRecord } from '../../types/record';
import { isZero, safeAdd, safeSubtract } from '../shared/number-format';

/**
 * 计算账户余额（从分录计算：借方总和 - 贷方总和）
 * @param account 账户对象
 * @param records 记录列表
 * @returns 账户余额
 */
export function calculateAccountBalance(account: { id: string }, records: ExpenseRecord[]): number {
  let balance = 0;

  records.forEach(record => {
    record.entries?.forEach(entry => {
      if (entry.accountId === account.id) {
        if (entry.direction === 'debit') {
          balance = safeAdd(balance, entry.amount);
        } else {
          balance = safeSubtract(balance, entry.amount);
        }
      }
    });
  });

  // 使用 isZero 修复浮点精度问题，而非 === 0
  if (isZero(balance)) {
    return 0;
  }

  return balance;
}
