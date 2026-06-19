import type { BudgetPlan, BudgetCalculationResult, BudgetPeriod, BudgetPeriodUnit, ExpenseRecord } from '../types/record';
import type { RecordDAO } from './storage/index';
import { getAccountBalance } from './accounts';

export function generateBudgetPlanId(): string {
  return 'budget-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function saveBudgetPlan(
  dao: RecordDAO,
  plan: Omit<BudgetPlan, 'id' | 'createdAt'>
): BudgetPlan {
  const budgetPlan: BudgetPlan = {
    ...plan,
    id: generateBudgetPlanId(),
    createdAt: Date.now(),
  };
  dao.addBudgetPlan(budgetPlan);
  return budgetPlan;
}

export function getBudgetPlans(dao: RecordDAO): BudgetPlan[] {
  return dao.getBudgetPlans();
}

export function deleteBudgetPlan(dao: RecordDAO, id: string): void {
  dao.deleteBudgetPlan(id);
}

function calculateAccountMonthlyChange(accountId: string, records: ExpenseRecord[]): number {
  const accountRecords = records.filter(r =>
    r.entries?.some(e => e.accountId === accountId)
  );

  if (accountRecords.length === 0) {
    return 0;
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let minDate = '';
  let maxDate = '';

  accountRecords.forEach(record => {
    record.entries?.forEach(entry => {
      if (entry.accountId === accountId) {
        if (entry.direction === 'debit') {
          totalDebit += entry.amount;
        } else {
          totalCredit += entry.amount;
        }
      }
    });
    if (!minDate || record.date < minDate) minDate = record.date;
    if (!maxDate || record.date > maxDate) maxDate = record.date;
  });

  let monthSpan = 1;
  if (minDate && maxDate) {
    const [minYear, minMonth] = minDate.split('-').map(Number);
    const [maxYear, maxMonth] = maxDate.split('-').map(Number);
    monthSpan = (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1;
    if (monthSpan < 1) monthSpan = 1;
  }

  const netChange = totalDebit - totalCredit;
  return parseFloat((netChange / monthSpan).toFixed(2));
}

export function calculateBudget(
  dao: RecordDAO,
  accountIds: string[],
  periodUnit: BudgetPeriodUnit,
  periodCount: number
): BudgetCalculationResult[] {
  const accounts = dao.getAccounts().filter(a => accountIds.includes(a.id));
  const allRecords = dao.findAll();
  const results: BudgetCalculationResult[] = [];

  for (const account of accounts) {
    const currentBalance = getAccountBalance(dao, account.id);

    const monthlyChange = calculateAccountMonthlyChange(account.id, allRecords);

    const periods: BudgetPeriod[] = [];
    let runningBalance = currentBalance;

    for (let i = 0; i < periodCount; i++) {
      let change: number;
      let label: string;

      if (periodUnit === 'month') {
        change = monthlyChange;
        label = `第${i + 1}月`;
      } else {
        change = monthlyChange * 12;
        label = `第${i + 1}年`;
      }

      runningBalance += change;

      periods.push({
        index: i + 1,
        label,
        estimatedAmount: parseFloat(runningBalance.toFixed(2)),
      });
    }

    results.push({
      accountId: account.id,
      accountName: account.name,
      currency: account.currency,
      periods,
    });
  }

  return results;
}

export function exportBudgetToCSV(results: BudgetCalculationResult[]): string {
  const headers = ['账户名称', '币种', '周期', '预计金额'];
  let csv = headers.join(',') + '\n';

  for (const result of results) {
    for (const period of result.periods) {
      const row = [
        `"${result.accountName}"`,
        result.currency,
        `"${period.label}"`,
        period.estimatedAmount,
      ];
      csv += row.join(',') + '\n';
    }
  }

  return csv;
}
