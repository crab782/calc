import type { DataSchema, ExpenseRecord, Entry, Account } from '../../types/record';
import { CURRENT_VERSION, INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_INCOME_RULE, DEFAULT_EXCHANGE_RATES } from '../../types/record';
import { registerMigration, runMigrations } from './registry';

// ========== 辅助函数 ==========

/**
 * 创建默认账户列表
 */
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

/**
 * 为旧记录生成分录
 */
function generateEntriesForOldRecord(record: ExpenseRecord, currency: string = 'CNY'): Entry[] {
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

// ========== 注册迁移规则 ==========

registerMigration({
  from: '0.1.0',
  to: '1.0.0',
  migrate: (s: DataSchema) => {
    s.version = '1.0.0';
    if (!s.categories) {
      s.categories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
    }
    return s;
  },
});

registerMigration({
  from: '1.0.0',
  to: '1.1.0',
  migrate: (s: DataSchema) => {
    s.version = '1.1.0';
    if (!s.accounts) {
      s.accounts = createDefaultAccounts();
    }
    return s;
  },
});

registerMigration({
  from: '1.1.0',
  to: '1.2.0',
  migrate: (s: DataSchema) => {
    s.version = '1.2.0';
    if (!s.incomeRules) {
      s.incomeRules = [DEFAULT_INCOME_RULE];
    }
    return s;
  },
});

registerMigration({
  from: '1.2.0',
  to: '1.3.0',
  migrate: (s: DataSchema) => {
    s.version = '1.3.0';
    s.accounts = createDefaultAccounts();
    return s;
  },
});

registerMigration({
  from: '1.3.0',
  to: '1.4.0',
  migrate: (s: DataSchema) => {
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
          r.entries = generateEntriesForOldRecord(r, 'CNY');
        }
      });
    }
    return s;
  },
});

registerMigration({
  from: '1.4.0',
  to: '1.5.0',
  migrate: (s: DataSchema) => {
    s.version = '1.5.0';
    s.accounts = createDefaultAccounts('CNY');
    if (s.records && s.records.length > 0) {
      s.records.forEach((r) => {
        r.entries = generateEntriesForOldRecord(r, 'CNY');
      });
    }
    return s;
  },
});

registerMigration({
  from: '1.5.0',
  to: '1.6.0',
  migrate: (s: DataSchema) => {
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
    return s;
  },
});

registerMigration({
  from: '1.6.0',
  to: '1.7.0',
  migrate: (s: DataSchema) => {
    s.version = '1.7.0';
    if (!s.budgetPlans) {
      s.budgetPlans = [];
    }
    return s;
  },
});

registerMigration({
  from: '1.7.0',
  to: '1.8.0',
  migrate: (s: DataSchema) => {
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
    return s;
  },
});

// ========== 导出迁移入口函数 ==========

/**
 * 解析 JSON 字符串并执行数据迁移
 * 返回迁移后的 DataSchema
 */
export function migrateData(rawData: string): DataSchema {
  let parsed: any;

  try {
    parsed = JSON.parse(rawData);
  } catch {
    return createEmptySchema();
  }

  // 执行迁移
  const migrated = runMigrations(parsed);

  // 如果版本仍然不是最新版本（未知版本），重置为当前版本
  if (migrated.version !== CURRENT_VERSION) {
    migrated.version = CURRENT_VERSION;
    migrated.incomeRules = [DEFAULT_INCOME_RULE];
    migrated.accounts = createDefaultAccounts();
  }

  return migrated as DataSchema;
}

/**
 * 创建空的数据结构
 */
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
