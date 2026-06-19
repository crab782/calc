import type { ExpenseRecord, RecordType } from '../types';

export function createRecord(data: Partial<ExpenseRecord>): ExpenseRecord {
  const now = Date.now();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `${now.toString(36)}-${Math.random().toString(36).substr(2, 9)}`,
    type: (data.type ?? 'expense') as RecordType,
    amount: data.amount ?? 0,
    note: data.note ?? '',
    category: data.category ?? '其他',
    date: data.date ?? new Date().toISOString().split('T')[0],
    currency: data.currency ?? 'CNY',
    accountId: data.accountId ?? '',
    entries: data.entries ?? [],
    createdAt: now,
    investmentType: data.investmentType,
    principal: data.principal,
    interest: data.interest,
    financialSourceId: data.financialSourceId,
  };
}
