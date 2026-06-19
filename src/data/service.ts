import { storageAdapter } from './storage/adapter';
import { cacheStore } from './cache/store';
import { migrateData } from './migrations';
import type {
  DataSchema,
  ExpenseRecord,
  Account,
  FinancialSource,
  BudgetPlan,
  Category,
  ExchangeRateData,
  CustomCurrency,
  BudgetCalculationResult,
  Entry,
} from '../types/record';
import {
  CURRENT_VERSION,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  DEFAULT_INCOME_RULE,
  DEFAULT_EXCHANGE_RATES,
  EXCHANGE_RATE_APIS,
} from '../types/record';

// ========== 内部工具函数 ==========

function createEmptySchema(): DataSchema {
  return {
    version: CURRENT_VERSION,
    records: [],
    categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
    accounts: createDefaultAccounts(),
    incomeRules: [DEFAULT_INCOME_RULE],
    financialSources: [],
    budgetPlans: [],
    customCurrencies: [],
    exchangeRates: {
      rates: { ...DEFAULT_EXCHANGE_RATES },
      baseCurrency: 'CNY',
      lastUpdatedAt: Date.now(),
      source: 'default',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createDefaultAccounts(currency: string = 'CNY'): Account[] {
  const now = Date.now();
  return [
    { id: `${currency}-cash`, name: '现金', currency, accountType: 'cash', balance: 0, createdAt: now, isDefault: currency === 'CNY', visible: true },
    { id: `${currency}-investment`, name: '投资', currency, accountType: 'investment', balance: 0, createdAt: now, isDefault: false, visible: true },
    { id: `${currency}-loan`, name: '贷款', currency, accountType: 'loan', balance: 0, createdAt: now, isDefault: false, visible: true },
    { id: `${currency}-expense`, name: '支出', currency, accountType: 'expense', balance: 0, createdAt: now, isDefault: false, visible: false },
    { id: `${currency}-income`, name: '收入', currency, accountType: 'income', balance: 0, createdAt: now, isDefault: false, visible: false },
  ];
}

// 获取完整数据
function getData(): DataSchema {
  const cached = cacheStore.get();
  if (cached) return cached;

  const raw = storageAdapter.read();
  if (!raw) {
    const empty = createEmptySchema();
    cacheStore.set(empty);
    return empty;
  }

  const data = migrateData(raw);
  cacheStore.set(data);
  return data;
}

function saveData(data: DataSchema): void {
  data.updatedAt = Date.now();
  storageAdapter.write(JSON.stringify(data));
  cacheStore.set(data);
}

// ========== 记录操作 ==========

export function getAllRecords(): ExpenseRecord[] {
  return getData().records || [];
}

export function addRecord(data: {
  type: ExpenseRecord['type'];
  amount: number;
  note: string;
  category: string;
  date: string;
  currency?: string;
  entries?: ExpenseRecord['entries'];
}): ExpenseRecord {
  const record: ExpenseRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    amount: data.amount,
    note: data.note,
    category: data.category,
    date: data.date,
    currency: data.currency || 'CNY',
    createdAt: Date.now(),
    entries: data.entries || generateEntries(data.type, data.amount),
  };
  const schema = getData();
  schema.records = [...(schema.records || []), record];
  saveData(schema);
  return record;
}

export function updateRecord(id: string, updates: Partial<ExpenseRecord>): void {
  const data = getData();
  data.records = (data.records || []).map(r => r.id === id ? { ...r, ...updates } : r);
  saveData(data);
}

export function deleteRecord(id: string): void {
  const data = getData();
  data.records = (data.records || []).filter(r => r.id !== id);
  saveData(data);
}

// ========== 账户操作 ==========

export function getAccounts(): Account[] {
  return getData().accounts || [];
}

export function addAccount(account: {
  currency: string;
  accountType: 'cash' | 'investment' | 'loan';
  name?: string;
}): { success: boolean; account?: Account; error?: string } {
  const data = getData();
  const accounts = data.accounts || [];

  // 检查是否有重复 ID
  const newId = `${account.currency}-${account.name || account.accountType}-${Date.now()}`;
  if (accounts.some(a => a.id === newId)) {
    return { success: false, error: '账户已存在' };
  }

  const newAccount: Account = {
    id: newId,
    name: account.name || account.accountType,
    currency: account.currency,
    accountType: account.accountType,
    balance: 0,
    createdAt: Date.now(),
    isDefault: false,
    visible: true,
  };

  data.accounts = [...accounts, newAccount];
  saveData(data);
  return { success: true, account: newAccount };
}

export function updateAccount(account: Account): void {
  const data = getData();
  data.accounts = (data.accounts || []).map(a => a.id === account.id ? account : a);
  saveData(data);
}

export function deleteAccount(id: string): { success: boolean; error?: string } {
  const data = getData();
  const account = (data.accounts || []).find(a => a.id === id);
  if (!account) {
    return { success: false, error: '账户不存在' };
  }
  if (account.isDefault) {
    return { success: false, error: '不能删除默认账户' };
  }
  data.accounts = (data.accounts || []).filter(a => a.id !== id);
  saveData(data);
  return { success: true };
}

// ========== 分类操作 ==========

export function getCategories(): Category[] {
  return getData().categories || [];
}

export function addCategory(category: Omit<Category, 'id'> & { id?: string }): Category {
  const data = getData();
  const newCategory: Category = {
    id: category.id || `cat-${Date.now()}`,
    ...category,
  };
  data.categories = [...(data.categories || []), newCategory];
  saveData(data);
  return newCategory;
}

export function updateCategory(category: Category): void {
  const data = getData();
  data.categories = (data.categories || []).map(c => c.id === category.id ? category : c);
  saveData(data);
}

export function deleteCategory(id: string): { success: boolean; error?: string } {
  const data = getData();
  const categories = data.categories || [];
  // 不允许删除默认分类
  const defaultIds = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c => c.id);
  if (defaultIds.includes(id)) {
    return { success: false, error: '不能删除默认分类' };
  }
  data.categories = categories.filter(c => c.id !== id);
  saveData(data);
  return { success: true };
}

// ========== 财务来源操作 ==========

export function getFinancialSources(): FinancialSource[] {
  return getData().financialSources || [];
}

export function addFinancialSource(source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }): FinancialSource {
  const data = getData();
  const newSource: FinancialSource = {
    id: source.id || `fs-${Date.now()}`,
    ...source,
    createdAt: Date.now(),
  };
  data.financialSources = [...(data.financialSources || []), newSource];
  saveData(data);
  return newSource;
}

export function updateFinancialSource(id: string, updates: Partial<FinancialSource>): void {
  const data = getData();
  data.financialSources = (data.financialSources || []).map(s => s.id === id ? { ...s, ...updates } : s);
  saveData(data);
}

export function deleteFinancialSource(id: string): void {
  const data = getData();
  data.financialSources = (data.financialSources || []).filter(s => s.id !== id);
  saveData(data);
}

// ========== 预算操作 ==========

export function getBudgetPlans(): BudgetPlan[] {
  return getData().budgetPlans || [];
}

export function saveBudgetPlan(plan: Omit<BudgetPlan, 'id' | 'createdAt'>): BudgetPlan {
  const data = getData();
  const newPlan: BudgetPlan = {
    id: `bp-${Date.now()}`,
    ...plan,
    createdAt: Date.now(),
  };
  data.budgetPlans = [...(data.budgetPlans || []), newPlan];
  saveData(data);
  return newPlan;
}

export function deleteBudgetPlan(id: string): void {
  const data = getData();
  data.budgetPlans = (data.budgetPlans || []).filter(p => p.id !== id);
  saveData(data);
}

// ========== 汇率操作 ==========

export function getExchangeRates(): ExchangeRateData {
  return getData().exchangeRates || {
    rates: { ...DEFAULT_EXCHANGE_RATES },
    baseCurrency: 'CNY',
    lastUpdatedAt: Date.now(),
    source: 'default',
  };
}

export function updateExchangeRates(rates: ExchangeRateData): void {
  const data = getData();
  data.exchangeRates = rates;
  saveData(data);
}

export async function fetchExchangeRatesFromAPI(baseCurrency: string): Promise<{ success: boolean; message: string }> {
  const canFetch = canFetchRatesFromAPI();
  if (!canFetch.allowed) {
    return { success: false, message: `请等待 ${Math.ceil(canFetch.remainingHours)} 小时后再次获取` };
  }

  // 检查是否有可用的 API
  if (EXCHANGE_RATE_APIS.length === 0) {
    return { success: false, message: '没有可用的汇率 API' };
  }

  let lastError = '';
  for (const api of EXCHANGE_RATE_APIS) {
    try {
      const response = await fetch(api.url);
      if (!response.ok) continue;
      const data = await response.json();
      const rates = api.parser(data, baseCurrency);

      if (Object.keys(rates).length > 0) {
        updateExchangeRates({
          rates,
          baseCurrency,
          lastUpdatedAt: Date.now(),
          source: 'api',
          apiSource: api.name,
        });
        return { success: true, message: '汇率获取成功' };
      }
    } catch (e) {
      lastError = (e as Error).message;
      continue;
    }
  }

  return { success: false, message: `所有 API 均失败: ${lastError}` };
}

export function canFetchRatesFromAPI(): { allowed: boolean; remainingHours: number } {
  const data = getData();
  const exchangeRates = data.exchangeRates;

  // 如果是 API 获取的，检查冷却时间（24小时）
  if (exchangeRates?.source === 'api' && exchangeRates?.lastUpdatedAt) {
    const elapsed = Date.now() - exchangeRates.lastUpdatedAt;
    const cooldownMs = 24 * 60 * 60 * 1000; // 24小时
    if (elapsed < cooldownMs) {
      const remainingMs = cooldownMs - elapsed;
      return { allowed: false, remainingHours: remainingMs / (60 * 60 * 1000) };
    }
  }

  return { allowed: true, remainingHours: 0 };
}

// ========== 自定义币种操作 ==========

export function getCustomCurrencies(): CustomCurrency[] {
  return getData().customCurrencies || [];
}

export function addCustomCurrency(currency: CustomCurrency): void {
  const data = getData();
  const currencies = data.customCurrencies || [];
  // 检查是否已存在
  if (currencies.some(c => c.code === currency.code)) {
    return;
  }
  data.customCurrencies = [...currencies, currency];
  saveData(data);
}

export function deleteCustomCurrency(code: string): void {
  const data = getData();
  data.customCurrencies = (data.customCurrencies || []).filter(c => c.code !== code);
  saveData(data);
}

// ========== 预算计算 ==========

export function calculateBudget(
  _profileType: string,
  _records: ExpenseRecord[],
  _sources: FinancialSource[],
  _periodCount: number,
  currency: string,
  accountId: string,
): BudgetCalculationResult {
  // 这个函数实际上由 domain 层的 calculateBudget 实现
  // 这里只是占位，实际调用应该在 hooks 中直接使用 domain 层的函数
  return {
    accountId,
    accountName: '',
    currency,
    periods: [],
  };
}

export function exportBudgetToCSV(results: BudgetCalculationResult[]): string {
  let csv = '账户,周期,预计金额\n';
  for (const result of results) {
    for (const period of result.periods) {
      csv += `${result.accountName},${period.label},${period.estimatedAmount.toFixed(2)}\n`;
    }
  }
  return csv;
}

// ========== 导入/导出 ==========

export function exportData(): string {
  const data = getData();
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): { success: boolean; error?: string } {
  try {
    JSON.parse(jsonString);
    const migrated = migrateData(jsonString);
    saveData(migrated);
    return { success: true };
  } catch {
    return { success: false, error: '数据格式无效' };
  }
}

export function deleteAllRecords(): void {
  const data = getData();
  data.records = [];
  saveData(data);
}

// ========== 工具函数 ==========

export function getDefaultAccountCurrency(): string {
  const accounts = getAccounts();
  const defaultAccount = accounts.find(a => a.isDefault);
  return defaultAccount?.currency || 'CNY';
}

// ========== generateEntries 工具函数 ==========

/**
 * 根据交易类型生成分录
 * @param type 交易类型
 * @param amount 总金额
 * @param principal 本金（仅 investment-mature / loan-repay 使用）
 * @param interest 利息（仅 investment-mature / loan-repay 使用）
 */
export function generateEntries(
  type: ExpenseRecord['type'],
  amount: number,
  principal?: number,
  interest?: number,
): Entry[] {
  const entries: Entry[] = [];

  if (type === 'income') {
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'debit',
      amount,
    });
    entries.push({
      accountId: 'CNY-income',
      accountName: '收入',
      direction: 'credit',
      amount,
    });
  } else if (type === 'expense') {
    entries.push({
      accountId: 'CNY-expense',
      accountName: '支出',
      direction: 'debit',
      amount,
    });
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'credit',
      amount,
    });
  } else if (type === 'investment') {
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'credit',
      amount,
    });
    entries.push({
      accountId: 'CNY-investment',
      accountName: '投资',
      direction: 'debit',
      amount,
    });
  } else if (type === 'investment-mature') {
    const p = principal ?? amount;
    const i = interest ?? 0;
    entries.push({
      accountId: 'CNY-investment',
      accountName: '投资',
      direction: 'credit',
      amount: p,
    });
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'debit',
      amount: p + i,
    });
    if (i > 0) {
      entries.push({
        accountId: 'CNY-income',
        accountName: '收入',
        direction: 'credit',
        amount: i,
      });
    }
  } else if (type === 'loan-receive') {
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'debit',
      amount,
    });
    entries.push({
      accountId: 'CNY-loan',
      accountName: '贷款',
      direction: 'credit',
      amount,
    });
  } else if (type === 'loan-repay') {
    const p = principal ?? amount;
    const i = interest ?? 0;
    entries.push({
      accountId: 'CNY-loan',
      accountName: '贷款',
      direction: 'debit',
      amount: p,
    });
    if (i > 0) {
      entries.push({
        accountId: 'CNY-expense',
        accountName: '支出',
        direction: 'debit',
        amount: i,
      });
    }
    entries.push({
      accountId: 'CNY-cash',
      accountName: '现金',
      direction: 'credit',
      amount: p + i,
    });
  }

  return entries;
}

// ========== 单例对象（替代旧的 recordService） ==========

export const recordService = {
  // 记录
  getAllRecords,
  addRecord,
  updateRecord,
  deleteRecord,

  // 账户
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,

  // 分类
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,

  // 财务来源
  getFinancialSources,
  addFinancialSource,
  updateFinancialSource,
  deleteFinancialSource,

  // 预算
  getBudgetPlans,
  saveBudgetPlan,
  deleteBudgetPlan,

  // 汇率
  getExchangeRates,
  updateExchangeRates,
  fetchExchangeRatesFromAPI,
  canFetchRatesFromAPI,

  // 自定义币种
  getCustomCurrencies,
  addCustomCurrency,
  deleteCustomCurrency,

  // 预算计算
  calculateBudget,
  exportBudgetToCSV,

  // 导入/导出
  exportData,
  importData,
  deleteAllRecords,

  // 工具
  getDefaultAccountCurrency,
};
