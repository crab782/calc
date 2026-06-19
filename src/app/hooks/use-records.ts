import { useState, useCallback } from 'react';
import type { ExpenseRecord } from '../../types/record';
import { recordService } from '../../data/service';

function initRecords(): ExpenseRecord[] {
  return recordService.getAllRecords();
}

export function useRecords() {
  const [records, setRecords] = useState<ExpenseRecord[]>(initRecords);
  const loading = false;

  const addRecord = useCallback((data: {
    type: ExpenseRecord['type'];
    amount: number;
    note: string;
    category: string;
    date: string;
    currency?: string;
    entries?: ExpenseRecord['entries'];
  }) => {
    recordService.addRecord(data);
    setRecords(recordService.getAllRecords());
  }, []);

  const deleteRecord = useCallback((id: string) => {
    recordService.deleteRecord(id);
    setRecords(recordService.getAllRecords());
  }, []);

  const updateRecord = useCallback((id: string, updates: Partial<ExpenseRecord>) => {
    recordService.updateRecord(id, updates);
    setRecords(recordService.getAllRecords());
  }, []);

  const refresh = useCallback(() => {
    setRecords(recordService.getAllRecords());
  }, []);

  return { records, count: records.length, loading, addRecord, updateRecord, deleteRecord, refresh };
}
