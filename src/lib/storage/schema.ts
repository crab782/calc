import type { ExpenseRecord, DataSchema, Account, Entry, IncomeRule, FinancialSource } from '../../types/record';
import { CURRENT_VERSION, INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_INCOME_RULE, DEFAULT_EXCHANGE_RATES } from '../../types/record';

export const STORAGE_KEY = 'expense_tracker_data';

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

export { createDefaultAccounts };

export class SchemaManager {
  getSchema(): DataSchema {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return this.createEmptySchema();
    }

    try {
      const parsed = JSON.parse(data) as DataSchema;
      return this.migrateSchema(parsed);
    } catch {
      return this.createEmptySchema();
    }
  }

  createEmptySchema(): DataSchema {
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

  saveSchema(schema: DataSchema): void {
    schema.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  }

  migrateSchema(schema: DataSchema): DataSchema {
    const migrations: Record<string, (schema: DataSchema) => void> = {
      '0.1.0': (s) => {
        s.version = '1.0.0';
        if (!s.categories) {
          s.categories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
        }
      },
      '1.0.0': (s) => {
        s.version = '1.1.0';
        if (!s.accounts) {
          s.accounts = createDefaultAccounts();
        }
      },
      '1.1.0': (s) => {
        s.version = '1.2.0';
        if (!s.incomeRules) {
          s.incomeRules = [DEFAULT_INCOME_RULE];
        }
      },
      '1.2.0': (s) => {
        s.version = '1.3.0';
        s.accounts = createDefaultAccounts();
      },
      '1.3.0': (s) => {
        s.version = '1.4.0';
        if (s.accounts && s.accounts.length > 0) {
          s.accounts.forEach((a) => {
            if (a.visible === undefined) {
              a.visible = true;
            }
          });
        }
        if (s.records && s.records.length > 0) {
          s.records.forEach((r) => {
            if (!r.entries || r.entries.length === 0) {
              r.entries = this.generateEntriesForOldRecord(r, 'CNY');
            }
          });
        }
      },
      '1.4.0': (s) => {
        s.version = '1.5.0';
        s.accounts = createDefaultAccounts('CNY');
        if (s.records && s.records.length > 0) {
          s.records.forEach((r) => {
            r.entries = this.generateEntriesForOldRecord(r, 'CNY');
          });
        }
      },
      '1.5.0': (s) => {
        s.version = '1.6.0';
        if (!s.financialSources) {
          s.financialSources = [];
        }
        if (s.incomeRules && s.incomeRules.length > 0) {
          s.incomeRules.forEach((rule) => {
            if (rule.id === 'default-income-rule') {
              return;
            }
            s.financialSources.push({
              id: rule.id,
              type: 'income',
              name: rule.name,
              currency: rule.currency,
              amount: rule.amount,
              period: rule.period,
              createdAt: rule.createdAt,
            });
          });
        }
      },
      '1.6.0': (s) => {
        s.version = '1.7.0';
        if (!s.budgetPlans) {
          s.budgetPlans = [];
        }
      },
      '1.7.0': (s) => {
        s.version = '1.8.0';
        if (!s.customCurrencies) {
          s.customCurrencies = [];
        }
        if (!s.exchangeRates) {
          s.exchangeRates = {
            rates: { ...DEFAULT_EXCHANGE_RATES },
            baseCurrency: 'CNY',
            lastUpdatedAt: Date.now(),
            source: 'default',
          };
        }
      },
    };

    while (schema.version !== CURRENT_VERSION) {
      if (!migrations[schema.version]) {
        schema.version = CURRENT_VERSION;
        schema.incomeRules = [DEFAULT_INCOME_RULE];
        schema.accounts = createDefaultAccounts();
        break;
      }
      migrations[schema.version](schema);
    }

    return schema;
  }

  generateEntriesForOldRecord(record: ExpenseRecord, currency: string = 'CNY'): Entry[] {
    const entries: Entry[] = [];

    if (record.type === 'income') {
      entries.push({
        accountId: `${currency}-cash`,
        accountName: '现金',
        direction: 'debit',
        amount: record.amount,
      });
      entries.push({
        accountId: `${currency}-income`,
        accountName: '收入',
        direction: 'credit',
        amount: record.amount,
      });
    } else if (record.type === 'expense') {
      entries.push({
        accountId: `${currency}-expense`,
        accountName: '支出',
        direction: 'debit',
        amount: record.amount,
      });
      entries.push({
        accountId: `${currency}-cash`,
        accountName: '现金',
        direction: 'credit',
        amount: record.amount,
      });
    }

    return entries;
  }

  validateSchema(data: unknown): data is DataSchema {
    if (typeof data !== 'object' || data === null) return false;

    const schema = data as DataSchema;

    if (typeof schema.version !== 'string') return false;
    if (!Array.isArray(schema.records)) return false;
    if (!Array.isArray(schema.categories)) return false;
    if (typeof schema.createdAt !== 'number') return false;
    if (typeof schema.updatedAt !== 'number') return false;

    for (const record of schema.records) {
      if (!this.validateRecord(record)) {
        return false;
      }
    }

    if (schema.accounts !== undefined && !Array.isArray(schema.accounts)) {
      return false;
    }

    for (const account of schema.accounts || []) {
      if (!this.validateAccount(account)) {
        return false;
      }
    }

    if (schema.incomeRules !== undefined && !Array.isArray(schema.incomeRules)) {
      return false;
    }

    for (const incomeRule of schema.incomeRules || []) {
      if (!this.validateIncomeRule(incomeRule)) {
        return false;
      }
    }

    if (schema.financialSources !== undefined && !Array.isArray(schema.financialSources)) {
      return false;
    }

    for (const financialSource of schema.financialSources || []) {
      if (!this.validateFinancialSource(financialSource)) {
        return false;
      }
    }

    return true;
  }

  validateRecord(record: unknown): record is ExpenseRecord {
    if (typeof record !== 'object' || record === null) return false;

    const r = record as ExpenseRecord;

    const validTypes = ['income', 'expense', 'investment', 'investment-mature', 'loan-receive', 'loan-repay'];

    return (
      typeof r.id === 'string' &&
      validTypes.includes(r.type) &&
      typeof r.amount === 'number' && r.amount > 0 &&
      typeof r.note === 'string' &&
      typeof r.category === 'string' &&
      typeof r.date === 'string' &&
      typeof r.createdAt === 'number'
    );
  }

  validateAccount(account: unknown): account is Account {
    if (typeof account !== 'object' || account === null) return false;

    const a = account as Account;

    return (
      typeof a.id === 'string' &&
      typeof a.name === 'string' &&
      typeof a.currency === 'string' &&
      typeof a.balance === 'number' &&
      typeof a.createdAt === 'number' &&
      (a.visible === undefined || typeof a.visible === 'boolean')
    );
  }

  validateIncomeRule(incomeRule: unknown): incomeRule is IncomeRule {
    if (typeof incomeRule !== 'object' || incomeRule === null) return false;

    const r = incomeRule as IncomeRule;

    return (
      typeof r.id === 'string' &&
      typeof r.name === 'string' &&
      typeof r.currency === 'string' &&
      typeof r.amount === 'number' &&
      (r.period === 'daily' || r.period === 'weekly' || r.period === 'monthly' || r.period === 'yearly') &&
      typeof r.createdAt === 'number'
    );
  }

  validateFinancialSource(source: unknown): source is FinancialSource {
    if (typeof source !== 'object' || source === null) return false;

    const s = source as FinancialSource;

    const validTypes = ['income', 'expense', 'investment', 'loan'];
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly', 'once'];
    const validInvestmentTypes = ['once', 'recurring'];
    const validInterestTypes = ['equal-payment', 'equal-principal', 'interest-first'];

    if (
      typeof s.id !== 'string' ||
      !validTypes.includes(s.type) ||
      typeof s.name !== 'string' ||
      typeof s.currency !== 'string' ||
      typeof s.amount !== 'number' ||
      !validPeriods.includes(s.period) ||
      typeof s.createdAt !== 'number'
    ) {
      return false;
    }

    if (s.investmentType !== undefined && !validInvestmentTypes.includes(s.investmentType)) {
      return false;
    }
    if (s.expectedReturn !== undefined && typeof s.expectedReturn !== 'number') {
      return false;
    }

    if (s.principal !== undefined && typeof s.principal !== 'number') {
      return false;
    }
    if (s.interestRate !== undefined && typeof s.interestRate !== 'number') {
      return false;
    }
    if (s.interestType !== undefined && !validInterestTypes.includes(s.interestType)) {
      return false;
    }

    return true;
  }

  exportData(): DataSchema {
    return this.getSchema();
  }

  importData(data: DataSchema): { success: boolean; message: string } {
    try {
      if (!this.validateSchema(data)) {
        return { success: false, message: '数据格式验证失败' };
      }

      data.records = data.records.map(record => ({
        ...record,
        currency: record.currency || 'CNY',
      }));

      const migrated = this.migrateSchema(data);
      this.saveSchema(migrated);

      return {
        success: true,
        message: `成功导入 ${migrated.records.length} 条记录`,
      };
    } catch (error) {
      return { success: false, message: '导入失败: ' + (error as Error).message };
    }
  }
}
