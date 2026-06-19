import type { ExpenseRecord } from '../types';

export function updateRecord(record: ExpenseRecord, updates: Partial<ExpenseRecord>): ExpenseRecord {
  return { ...record, ...updates };
}
