import { recordDAO } from './storage/index';
import type { RecordDAO } from './storage/index';
import { generateEntries } from './entries';
import type { ExpenseRecord, Entry } from '../types/record';
import {
  getStatistics,
  getMonthlyData,
  generateDailyDataWithPrediction,
  aggregateDailyToMonthly,
  generateMonthlyDataWithPrediction,
} from './statistics';
import type { Statistics, MonthlyData, MonthlyDataWithPrediction, DailyData } from './statistics';
import {
  getCategories,
  getIncomeCategories,
  getExpenseCategories,
  generateCategoryId,
  addCategory as addCategoryFn,
  deleteCategory as deleteCategoryFn,
  updateCategory as updateCategoryFn,
} from './categories';
import type { Category } from '../types/record';
import {
  getAccounts,
  getAccountBalance,
  generateAccountId,
  addAccount as addAccountFn,
  deleteAccount as deleteAccountFn,
  updateAccount as updateAccountFn,
  getOrCreateAccountByCurrency,
  createCurrencyAccounts,
  getCurrencyBalance,
  disableCurrency,
  isCurrencyEnabled,
} from './accounts';
import type { Account } from '../types/record';
import {
  getIncomeRules,
  generateIncomeRuleId,
  addIncomeRule as addIncomeRuleFn,
  deleteIncomeRule as deleteIncomeRuleFn,
  updateIncomeRule as updateIncomeRuleFn,
  getFinancialSources,
  getFinancialSourcesByType,
  generateFinancialSourceId,
  addFinancialSource as addFinancialSourceFn,
  updateFinancialSource as updateFinancialSourceFn,
  deleteFinancialSource as deleteFinancialSourceFn,
  calculateMonthlyIncome,
  calculateMonthlyExpense,
  calculateMonthlyBalance,
  calculateExpectedInvestmentReturn,
  calculateMonthlyLoanPayment,
} from './financial-sources';
import type { IncomeRule, FinancialSource, FinancialSourceType } from '../types/record';
import {
  saveBudgetPlan as saveBudgetPlanFn,
  getBudgetPlans,
  deleteBudgetPlan as deleteBudgetPlanFn,
  calculateBudget as calculateBudgetFn,
  exportBudgetToCSV,
} from './budget';
import type { BudgetPlan, BudgetPeriodUnit, BudgetCalculationResult } from '../types/record';
import {
  getExchangeRates,
  updateExchangeRates,
  getCustomCurrencies,
  addCustomCurrency,
  deleteCustomCurrency,
  canFetchRatesFromAPI,
  fetchExchangeRatesFromAPI,
} from './exchange-rates';
import type { ExchangeRateData, CustomCurrency } from '../types/record';

export { generateEntries };
export type { Statistics, MonthlyData, MonthlyDataWithPrediction, DailyData };

export class RecordService {
  private dao: RecordDAO = recordDAO;

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatCurrency(amount: number, currency?: string): string {
    const targetCurrency = currency || this.getDefaultAccountCurrency();
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  getDefaultAccountCurrency(): string {
    const accounts = this.dao.getAccounts();
    const firstAccount = accounts.find(a => a.visible);
    return firstAccount ? firstAccount.currency : (accounts.length > 0 ? accounts[0].currency : 'CNY');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  getAllRecords(): ExpenseRecord[] {
    return this.dao.findAll();
  }

  getRecordById(id: string): ExpenseRecord | undefined {
    return this.dao.findById(id);
  }

  addRecord(data: {
    type: ExpenseRecord['type'];
    amount: number;
    note: string;
    category: string;
    date: string;
    currency?: string;
    principal?: number;
    interest?: number;
    entries?: Entry[];
  }): void {
    const currency = data.currency || 'CNY';
    const entries = data.entries || generateEntries(
      data.type,
      data.amount,
      data.principal,
      data.interest,
      currency
    );
    const record: ExpenseRecord = {
      id: this.generateId(),
      type: data.type,
      amount: data.amount,
      note: data.note,
      category: data.category,
      date: data.date,
      currency,
      createdAt: Date.now(),
      entries,
    };
    this.dao.save(record);
    this.dao.createCurrencyAccounts(currency);
  }

  updateRecord(id: string, data: Partial<ExpenseRecord>): void {
    const existing = this.dao.findById(id);
    if (existing) {
      const updated: ExpenseRecord = { ...existing, ...data };
      this.dao.save(updated);
    }
  }

  deleteRecord(id: string): void {
    this.dao.delete(id);
  }

  deleteAllRecords(): void {
    this.dao.deleteAll();
  }

  getRecordCount(): number {
    return this.dao.count();
  }

  getStatistics(): Statistics {
    return getStatistics(this.dao);
  }

  getMonthlyData(): MonthlyData[] {
    return getMonthlyData(this.dao);
  }

  generateDailyDataWithPrediction(): DailyData[] {
    return generateDailyDataWithPrediction(this.dao);
  }

  aggregateDailyToMonthly(dailyData: DailyData[]): MonthlyDataWithPrediction[] {
    return aggregateDailyToMonthly(dailyData);
  }

  generateMonthlyDataWithPrediction(): MonthlyDataWithPrediction[] {
    return generateMonthlyDataWithPrediction(this.dao);
  }

  getRecentRecords(limit: number = 10): ExpenseRecord[] {
    const records = this.dao.findAll();
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  exportData(): string {
    const data = this.dao.exportData();
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString) as import('../types/record').DataSchema;
      return this.dao.importData(data);
    } catch {
      return { success: false, message: 'JSON 解析错误' };
    }
  }

  getCategories(): Category[] { return getCategories(this.dao); }
  getIncomeCategories(): Category[] { return getIncomeCategories(this.dao); }
  getExpenseCategories(): Category[] { return getExpenseCategories(this.dao); }
  generateCategoryId(type: 'income' | 'expense'): string { return generateCategoryId(type); }
  addCategory(category: Omit<Category, 'id'> & { id?: string }): Category { return addCategoryFn(this.dao, category); }
  deleteCategory(id: string): { success: boolean; message: string } { return deleteCategoryFn(this.dao, id); }
  updateCategory(category: Category): void { updateCategoryFn(this.dao, category); }

  getAccounts(): Account[] { return getAccounts(this.dao); }
  generateAccountId(): string { return generateAccountId(); }
  addAccount(account: { currency: string; accountType: 'cash' | 'investment' | 'loan'; name?: string }): { success: boolean; message: string; account?: Account } {
    return addAccountFn(this.dao, account);
  }
  getAccountBalance(accountId: string): number { return getAccountBalance(this.dao, accountId); }
  deleteAccount(id: string): { success: boolean; message: string } { return deleteAccountFn(this.dao, id); }
  updateAccount(account: Account): void { updateAccountFn(this.dao, account); }
  getOrCreateAccountByCurrency(currency: string): Account[] { return getOrCreateAccountByCurrency(this.dao, currency); }
  createCurrencyAccounts(currency: string): Account[] { return createCurrencyAccounts(this.dao, currency); }
  getCurrencyBalance(currency: string): number { return getCurrencyBalance(this.dao, currency); }
  disableCurrency(currency: string): { success: boolean; message: string } { return disableCurrency(this.dao, currency); }
  isCurrencyEnabled(currency: string): boolean { return isCurrencyEnabled(this.dao, currency); }

  getShowIncomeExpenseAccounts(): boolean { return this.dao.getShowIncomeExpenseAccounts(); }
  setShowIncomeExpenseAccounts(value: boolean): void { this.dao.setShowIncomeExpenseAccounts(value); }

  getIncomeRules(): IncomeRule[] { return getIncomeRules(this.dao); }
  generateIncomeRuleId(): string { return generateIncomeRuleId(); }
  addIncomeRule(incomeRule: Omit<IncomeRule, 'id' | 'createdAt'> & { id?: string }): IncomeRule { return addIncomeRuleFn(this.dao, incomeRule); }
  deleteIncomeRule(id: string): { success: boolean; message: string } { return deleteIncomeRuleFn(this.dao, id); }
  updateIncomeRule(incomeRule: IncomeRule): void { updateIncomeRuleFn(this.dao, incomeRule); }

  getFinancialSources(): FinancialSource[] { return getFinancialSources(this.dao); }
  getFinancialSourcesByType(type: FinancialSourceType): FinancialSource[] { return getFinancialSourcesByType(this.dao, type); }
  generateFinancialSourceId(): string { return generateFinancialSourceId(); }
  addFinancialSource(source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }): FinancialSource { return addFinancialSourceFn(this.dao, source); }
  updateFinancialSource(id: string, updates: Partial<FinancialSource>): void { updateFinancialSourceFn(this.dao, id, updates); }
  deleteFinancialSource(id: string): { success: boolean; message: string } { return deleteFinancialSourceFn(this.dao, id); }

  calculateMonthlyIncome(): number { return calculateMonthlyIncome(this.dao); }
  calculateMonthlyExpense(): number { return calculateMonthlyExpense(this.dao); }
  calculateMonthlyBalance(): number { return calculateMonthlyBalance(this.dao); }
  calculateExpectedInvestmentReturn(): number { return calculateExpectedInvestmentReturn(this.dao); }
  calculateMonthlyLoanPayment(): number { return calculateMonthlyLoanPayment(this.dao); }

  saveBudgetPlan(plan: Omit<BudgetPlan, 'id' | 'createdAt'>): BudgetPlan { return saveBudgetPlanFn(this.dao, plan); }
  getBudgetPlans(): BudgetPlan[] { return getBudgetPlans(this.dao); }
  deleteBudgetPlan(id: string): void { deleteBudgetPlanFn(this.dao, id); }
  calculateBudget(accountIds: string[], periodUnit: BudgetPeriodUnit, periodCount: number): BudgetCalculationResult[] {
    return calculateBudgetFn(this.dao, accountIds, periodUnit, periodCount);
  }
  exportBudgetToCSV(results: BudgetCalculationResult[]): string { return exportBudgetToCSV(results); }

  getExchangeRates(): ExchangeRateData { return getExchangeRates(this.dao); }
  updateExchangeRates(exchangeRates: ExchangeRateData): void { updateExchangeRates(this.dao, exchangeRates); }
  getCustomCurrencies(): CustomCurrency[] { return getCustomCurrencies(this.dao); }
  addCustomCurrency(currency: CustomCurrency): void { addCustomCurrency(this.dao, currency); }
  deleteCustomCurrency(code: string): void { deleteCustomCurrency(this.dao, code); }
  canFetchRatesFromAPI(): { allowed: boolean; remainingHours: number } { return canFetchRatesFromAPI(this.dao); }
  fetchExchangeRatesFromAPI(baseCurrency: string = 'CNY'): Promise<{ success: boolean; message: string; rates?: Record<string, number> }> {
    return fetchExchangeRatesFromAPI(this.dao, baseCurrency);
  }
}

export const recordService = new RecordService();
