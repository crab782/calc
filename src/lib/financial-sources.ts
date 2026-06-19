import type { IncomeRule, FinancialSource, FinancialSourceType, FinancialPeriod } from '../types/record';
import type { RecordDAO } from './storage/index';

export function getIncomeRules(dao: RecordDAO): IncomeRule[] {
  return dao.getIncomeRules();
}

export function generateIncomeRuleId(): string {
  return 'income-rule-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function addIncomeRule(
  dao: RecordDAO,
  incomeRule: Omit<IncomeRule, 'id' | 'createdAt'> & { id?: string }
): IncomeRule {
  const newIncomeRule: IncomeRule = {
    ...incomeRule,
    id: incomeRule.id || generateIncomeRuleId(),
    createdAt: Date.now(),
  };
  dao.addIncomeRule(newIncomeRule);
  return newIncomeRule;
}

export function deleteIncomeRule(dao: RecordDAO, id: string): { success: boolean; message: string } {
  const incomeRules = dao.getIncomeRules();
  if (incomeRules.length <= 1) {
    return { success: false, message: '至少需要保留一个收入规则' };
  }

  dao.deleteIncomeRule(id);
  return { success: true, message: '收入规则删除成功' };
}

export function updateIncomeRule(dao: RecordDAO, incomeRule: IncomeRule): void {
  dao.updateIncomeRule(incomeRule);
}

export function getFinancialSources(dao: RecordDAO): FinancialSource[] {
  return dao.getFinancialSources();
}

export function getFinancialSourcesByType(dao: RecordDAO, type: FinancialSourceType): FinancialSource[] {
  return dao.getFinancialSourcesByType(type);
}

export function generateFinancialSourceId(): string {
  return 'fs-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function addFinancialSource(
  dao: RecordDAO,
  source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }
): FinancialSource {
  const newSource: FinancialSource = {
    ...source,
    id: source.id || generateFinancialSourceId(),
    createdAt: Date.now(),
  };
  dao.addFinancialSource(newSource);
  return newSource;
}

export function updateFinancialSource(dao: RecordDAO, id: string, updates: Partial<FinancialSource>): void {
  dao.updateFinancialSource(id, updates);
}

export function deleteFinancialSource(dao: RecordDAO, id: string): { success: boolean; message: string } {
  dao.deleteFinancialSource(id);
  return { success: true, message: '财务来源删除成功' };
}

function convertToMonthlyAmount(amount: number, period: FinancialPeriod): number {
  switch (period) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4;
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
    case 'once':
      return 0;
    default:
      return 0;
  }
}

export function calculateMonthlyIncome(dao: RecordDAO): number {
  const incomeSources = dao.getFinancialSourcesByType('income');
  return incomeSources.reduce((total, source) => {
    return total + convertToMonthlyAmount(source.amount, source.period);
  }, 0);
}

export function calculateMonthlyExpense(dao: RecordDAO): number {
  const expenseSources = dao.getFinancialSourcesByType('expense');
  return expenseSources.reduce((total, source) => {
    return total + convertToMonthlyAmount(source.amount, source.period);
  }, 0);
}

export function calculateMonthlyBalance(dao: RecordDAO): number {
  return calculateMonthlyIncome(dao) - calculateMonthlyExpense(dao);
}

export function calculateExpectedInvestmentReturn(dao: RecordDAO): number {
  const investmentSources = dao.getFinancialSourcesByType('investment');
  return investmentSources.reduce((total, source) => {
    const expectedReturn = source.expectedReturn || 0;
    if (expectedReturn === 0) {
      return total;
    }
    if (source.investmentType === 'once') {
      return total;
    }
    const monthlyAmount = convertToMonthlyAmount(source.amount, source.period);
    const monthlyReturnRate = expectedReturn / 100 / 12;
    return total + (monthlyAmount * monthlyReturnRate);
  }, 0);
}

function getLoanMonths(period: FinancialPeriod): number {
  switch (period) {
    case 'daily':
      return 1 / 30;
    case 'weekly':
      return 1 / 4;
    case 'monthly':
      return 1;
    case 'yearly':
      return 12;
    case 'once':
      return 0;
    default:
      return 0;
  }
}

export function calculateMonthlyLoanPayment(dao: RecordDAO): number {
  const loanSources = dao.getFinancialSourcesByType('loan');
  return loanSources.reduce((total, source) => {
    const principal = source.principal || source.amount;
    const interestRate = source.interestRate || 0;
    const interestType = source.interestType || 'equal-payment';

    if (interestRate === 0) {
      return total + convertToMonthlyAmount(principal, source.period);
    }

    const monthlyRate = interestRate / 100 / 12;

    switch (interestType) {
      case 'equal-payment': {
        const months = getLoanMonths(source.period);
        if (months <= 0) return total;
        const temp = Math.pow(1 + monthlyRate, months);
        return total + (principal * monthlyRate * temp) / (temp - 1);
      }
      case 'equal-principal': {
        const months = getLoanMonths(source.period);
        if (months <= 0) return total;
        const monthlyPrincipal = principal / months;
        return total + monthlyPrincipal + (principal * monthlyRate);
      }
      case 'interest-first': {
        return total + (principal * monthlyRate);
      }
      default:
        return total;
    }
  }, 0);
}
