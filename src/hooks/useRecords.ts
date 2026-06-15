import { useState, useCallback } from 'react';
import type { ExpenseRecord } from '../types/record';
import { recordService } from '../lib/record';

export const useRecords = () => {
  const [records, setRecords] = useState<ExpenseRecord[]>(() => {
    return recordService.getAllRecords();
  });

  const refresh = useCallback(() => {
    setRecords(recordService.getAllRecords());
  }, []);

  const addRecord = useCallback((data: {
    type: 'income' | 'expense';
    amount: number;
    note: string;
    category: string;
    date: string;
  }) => {
    recordService.addRecord(data);
    refresh();
  }, [refresh]);

  const deleteRecord = useCallback((id: string) => {
    recordService.deleteRecord(id);
    refresh();
  }, [refresh]);

  const getRecentRecords = useCallback((limit: number = 10) => {
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }, [records]);

  return {
    records,
    addRecord,
    deleteRecord,
    refresh,
    getRecentRecords,
    count: records.length,
  };
};
