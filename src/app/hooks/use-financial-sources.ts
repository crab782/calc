import { useState, useCallback } from 'react';
import type { FinancialSource } from '../../types/record';
import { recordService } from '../../data/service';

export function useFinancialSources() {
  const [sources, setSources] = useState<FinancialSource[]>(
    () => recordService.getFinancialSources(),
  );

  const addSource = useCallback((source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }) => {
    const created = recordService.addFinancialSource(source);
    setSources(recordService.getFinancialSources());
    return created;
  }, []);

  const updateSource = useCallback((id: string, updates: Partial<FinancialSource>) => {
    recordService.updateFinancialSource(id, updates);
    setSources(recordService.getFinancialSources());
  }, []);

  const deleteSource = useCallback((id: string) => {
    recordService.deleteFinancialSource(id);
    setSources(recordService.getFinancialSources());
  }, []);

  const refresh = useCallback(() => {
    setSources(recordService.getFinancialSources());
  }, []);

  const incomeSources = sources.filter(s => s.type === 'income');
  const expenseSources = sources.filter(s => s.type === 'expense');
  const investmentSources = sources.filter(s => s.type === 'investment');
  const loanSources = sources.filter(s => s.type === 'loan');

  return {
    sources,
    incomeSources,
    expenseSources,
    investmentSources,
    loanSources,
    addSource,
    updateSource,
    deleteSource,
    refresh,
  };
}
