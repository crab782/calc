import type { ExpenseRecord, RecordType } from '../types';

export interface FilterOptions {
  type?: RecordType;
  startDate?: string;
  endDate?: string;
  category?: string;
}

export function filterRecords(records: ExpenseRecord[], options: FilterOptions): ExpenseRecord[] {
  return records.filter(record => {
    if (options.type !== undefined && record.type !== options.type) {
      return false;
    }
    if (options.startDate !== undefined && record.date < options.startDate) {
      return false;
    }
    if (options.endDate !== undefined && record.date > options.endDate) {
      return false;
    }
    if (options.category !== undefined && record.category !== options.category) {
      return false;
    }
    return true;
  });
}

export function getRecordsByMonth(records: ExpenseRecord[], month: string): ExpenseRecord[] {
  const monthPrefix = month.slice(0, 7);
  return records.filter(record => record.date.slice(0, 7) === monthPrefix);
}

export function sortRecordsByDate(records: ExpenseRecord[]): ExpenseRecord[] {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}
