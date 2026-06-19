import { useState, useCallback } from 'react';
import type { BudgetPlan, BudgetCalculationResult, ExpenseRecord, FinancialSource, Account } from '../../types/record';
import { calculateBudget } from '../../domain/budget/calculator/engine';
import { recordService } from '../../data/service';

export function useBudget(records: ExpenseRecord[], sources: FinancialSource[]) {
  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(
    () => recordService.getBudgetPlans(),
  );

  const saveBudgetPlan = useCallback((plan: Omit<BudgetPlan, 'id' | 'createdAt'>) => {
    const saved = recordService.saveBudgetPlan(plan);
    setBudgetPlans(recordService.getBudgetPlans());
    return saved;
  }, []);

  const deleteBudgetPlan = useCallback((id: string) => {
    recordService.deleteBudgetPlan(id);
    setBudgetPlans(recordService.getBudgetPlans());
  }, []);

  const calculate = useCallback(
    (accountIds: string[], _periodUnit: string, periodCount: number): BudgetCalculationResult[] => {
      const accounts = recordService.getAccounts().filter((a: Account) => accountIds.includes(a.id));
      const currency = recordService.getDefaultAccountCurrency();
      return accounts.map((account: Account) => {
        const result = calculateBudget('balance', records, sources, periodCount, currency, account.id);
        return {
          accountId: account.id,
          accountName: account.name,
          currency,
          periods: result.data.map((value, index) => ({
            index,
            label: result.labels[index] || `第${index + 1}期`,
            estimatedAmount: value,
          })),
        };
      });
    },
    [records, sources],
  );

  const exportToCSV = useCallback((results: BudgetCalculationResult[]) => {
    return recordService.exportBudgetToCSV(results);
  }, []);

  return { budgetPlans, saveBudgetPlan, deleteBudgetPlan, calculate, exportToCSV };
}
