import { SchemaManager } from './schema';
import { RecordStore } from './records';
import { CategoryStore } from './categories';
import { AccountStore } from './accounts';
import { FinancialSourceStore } from './financial-sources';
import { ExchangeRateStore } from './exchange-rates';
import type { ExpenseRecord, Category, Account, IncomeRule, FinancialSource, FinancialSourceType, BudgetPlan, ExchangeRateData, CustomCurrency } from '../../types/record';

export class RecordDAO extends SchemaManager {
  private _records = new RecordStore(this);
  private _categories = new CategoryStore(this);
  private _accounts = new AccountStore(this);
  private _financialSources = new FinancialSourceStore(this);
  private _exchangeRates = new ExchangeRateStore(this);

  findAll(): ExpenseRecord[] { return this._records.findAll(); }
  findById(id: string): ExpenseRecord | undefined { return this._records.findById(id); }
  findByMonth(month: string): ExpenseRecord[] { return this._records.findByMonth(month); }
  save(record: ExpenseRecord): void { this._records.save(record); }
  delete(id: string): void { this._records.delete(id); }
  deleteAll(): void { this._records.deleteAll(); }
  count(): number { return this._records.count(); }

  getCategories(): Category[] { return this._categories.getCategories(); }
  saveCategories(categories: Category[]): void { this._categories.saveCategories(categories); }
  addCategory(category: Category): void { this._categories.addCategory(category); }
  deleteCategory(id: string): void { this._categories.deleteCategory(id); }
  updateCategory(category: Category): void { this._categories.updateCategory(category); }

  getAccounts(): Account[] { return this._accounts.getAccounts(); }
  saveAccounts(accounts: Account[]): void { this._accounts.saveAccounts(accounts); }
  addAccount(account: Account): void { this._accounts.addAccount(account); }
  deleteAccount(id: string): void { this._accounts.deleteAccount(id); }
  updateAccount(account: Account): void { this._accounts.updateAccount(account); }
  setDefaultAccount(id: string): void { this._accounts.setDefaultAccount(id); }
  createCurrencyAccounts(currency: string): Account[] { return this._accounts.createCurrencyAccounts(currency); }
  getCurrencyBalance(currency: string): number { return this._accounts.getCurrencyBalance(currency); }
  disableCurrency(currency: string): { success: boolean; message: string } { return this._accounts.disableCurrency(currency); }
  isCurrencyEnabled(currency: string): boolean { return this._accounts.isCurrencyEnabled(currency); }

  getIncomeRules(): IncomeRule[] { return this._financialSources.getIncomeRules(); }
  saveIncomeRules(incomeRules: IncomeRule[]): void { this._financialSources.saveIncomeRules(incomeRules); }
  addIncomeRule(incomeRule: IncomeRule): void { this._financialSources.addIncomeRule(incomeRule); }
  deleteIncomeRule(id: string): void { this._financialSources.deleteIncomeRule(id); }
  updateIncomeRule(incomeRule: IncomeRule): void { this._financialSources.updateIncomeRule(incomeRule); }

  getFinancialSources(): FinancialSource[] { return this._financialSources.getFinancialSources(); }
  getFinancialSourcesByType(type: FinancialSourceType): FinancialSource[] { return this._financialSources.getFinancialSourcesByType(type); }
  addFinancialSource(source: FinancialSource): void { this._financialSources.addFinancialSource(source); }
  updateFinancialSource(id: string, updates: Partial<FinancialSource>): void { this._financialSources.updateFinancialSource(id, updates); }
  deleteFinancialSource(id: string): void { this._financialSources.deleteFinancialSource(id); }

  getBudgetPlans(): BudgetPlan[] { return this._financialSources.getBudgetPlans(); }
  addBudgetPlan(plan: BudgetPlan): void { this._financialSources.addBudgetPlan(plan); }
  deleteBudgetPlan(id: string): void { this._financialSources.deleteBudgetPlan(id); }

  getExchangeRates(): ExchangeRateData { return this._exchangeRates.getExchangeRates(); }
  updateExchangeRates(exchangeRates: ExchangeRateData): void { this._exchangeRates.updateExchangeRates(exchangeRates); }
  getCustomCurrencies(): CustomCurrency[] { return this._exchangeRates.getCustomCurrencies(); }
  addCustomCurrency(currency: CustomCurrency): void { this._exchangeRates.addCustomCurrency(currency); }
  deleteCustomCurrency(code: string): void { this._exchangeRates.deleteCustomCurrency(code); }
}

export const recordDAO = new RecordDAO();
