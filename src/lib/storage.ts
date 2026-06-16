import type { ExpenseRecord, DataSchema, Category, Account, IncomeRule, Entry } from '../types/record';
import { CURRENT_VERSION, INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_INCOME_RULE } from '../types/record';

const STORAGE_KEY = 'expense_tracker_data';

/**
 * 创建默认账户列表
 * 包含5个默认账户：现金、投资、贷款、收入、支出
 * @param currency 账户币种，默认为 'CNY'
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

export class RecordDAO {
  private getSchema(): DataSchema {
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

  private createEmptySchema(): DataSchema {
    return {
      version: CURRENT_VERSION,
      records: [],
      categories: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
      accounts: createDefaultAccounts(),
      incomeRules: [DEFAULT_INCOME_RULE],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private saveSchema(schema: DataSchema): void {
    schema.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(schema));
  }

  private migrateSchema(schema: DataSchema): DataSchema {
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
        // 将旧账户迁移到新的5个默认账户结构
        s.accounts = createDefaultAccounts();
      },
      '1.3.0': (s) => {
        s.version = '1.4.0';
        // 为 accounts 添加 visible 字段
        if (s.accounts && s.accounts.length > 0) {
          s.accounts.forEach((a) => {
            if (a.visible === undefined) {
              a.visible = true;
            }
          });
        }
        // 为旧记录生成 entries 字段
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
        // 强制删除旧账户（无 accountType 字段的账户），创建新的固定5类账户
        s.accounts = createDefaultAccounts('CNY');
        // 为旧记录重新生成分录（使用新的账户ID格式）
        if (s.records && s.records.length > 0) {
          s.records.forEach((r) => {
            r.entries = this.generateEntriesForOldRecord(r, 'CNY');
          });
        }
      },
    };

    // 连续迁移，直到达到当前版本
    while (schema.version !== CURRENT_VERSION) {
      if (!migrations[schema.version]) {
        // 未知版本，重置为当前版本
        schema.version = CURRENT_VERSION;
        schema.incomeRules = [DEFAULT_INCOME_RULE];
        schema.accounts = createDefaultAccounts();
        break;
      }
      migrations[schema.version](schema);
    }

    return schema;
  }

  /**
   * 为旧记录生成分录
   * 收入记录：借:现金, 贷:收入
   * 支出记录：借:支出, 贷:现金
   * @param record 记录
   * @param currency 币种，默认为 'CNY'
   */
  private generateEntriesForOldRecord(record: ExpenseRecord, currency: string = 'CNY'): Entry[] {
    const entries: Entry[] = [];
    
    if (record.type === 'income') {
      // 收入：借:现金, 贷:收入
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
      // 支出：借:支出, 贷:现金
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

  findAll(): ExpenseRecord[] {
    const schema = this.getSchema();
    // 为旧记录补全缺失的 currency 字段
    return schema.records.map(record => ({
      ...record,
      currency: record.currency || 'CNY',
    }));
  }

  findById(id: string): ExpenseRecord | undefined {
    const schema = this.getSchema();
    const record = schema.records.find((r) => r.id === id);
    if (!record) return undefined;
    return { ...record, currency: record.currency || 'CNY' };
  }

  findByMonth(month: string): ExpenseRecord[] {
    const schema = this.getSchema();
    return schema.records
      .filter((r) => r.date.startsWith(month))
      .map(record => ({ ...record, currency: record.currency || 'CNY' }));
  }

  save(record: ExpenseRecord): void {
    const schema = this.getSchema();
    const index = schema.records.findIndex((r) => r.id === record.id);
    
    if (index >= 0) {
      schema.records[index] = record;
    } else {
      schema.records.push(record);
    }
    
    this.saveSchema(schema);
  }

  delete(id: string): void {
    const schema = this.getSchema();
    schema.records = schema.records.filter((r) => r.id !== id);
    this.saveSchema(schema);
  }

  deleteAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  count(): number {
    const schema = this.getSchema();
    return schema.records.length;
  }

  // 分类管理方法
  getCategories(): Category[] {
    const schema = this.getSchema();
    return [...schema.categories];
  }

  saveCategories(categories: Category[]): void {
    const schema = this.getSchema();
    schema.categories = categories;
    this.saveSchema(schema);
  }

  addCategory(category: Category): void {
    const schema = this.getSchema();
    schema.categories.push(category);
    this.saveSchema(schema);
  }

  deleteCategory(id: string): void {
    const schema = this.getSchema();
    schema.categories = schema.categories.filter((c) => c.id !== id);
    this.saveSchema(schema);
  }

  updateCategory(category: Category): void {
    const schema = this.getSchema();
    const index = schema.categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      schema.categories[index] = category;
      this.saveSchema(schema);
    }
  }

  // 账户管理方法
  getAccounts(): Account[] {
    const schema = this.getSchema();
    return [...schema.accounts];
  }

  saveAccounts(accounts: Account[]): void {
    const schema = this.getSchema();
    schema.accounts = accounts;
    this.saveSchema(schema);
  }

  addAccount(account: Account): void {
    const schema = this.getSchema();
    schema.accounts.push(account);
    this.saveSchema(schema);
  }

  deleteAccount(id: string): void {
    const schema = this.getSchema();
    // 软删除：设置 visible=false 而不是真正删除
    const account = schema.accounts.find(a => a.id === id);
    if (account) {
      account.visible = false;
      this.saveSchema(schema);
    }
  }

  updateAccount(account: Account): void {
    const schema = this.getSchema();
    const index = schema.accounts.findIndex((a) => a.id === account.id);
    if (index >= 0) {
      schema.accounts[index] = account;
      this.saveSchema(schema);
    }
  }

  setDefaultAccount(id: string): void {
    const schema = this.getSchema();
    schema.accounts.forEach(a => {
      a.isDefault = a.id === id;
    });
    this.saveSchema(schema);
  }

  /**
   * 创建指定币种的5类账户
   * @param currency 币种代码（如 USD、EUR、GBP、JPY）
   * @returns 创建的账户列表
   */
  createCurrencyAccounts(currency: string): Account[] {
    const schema = this.getSchema();
    const now = Date.now();
    
    // 检查是否已存在该币种的账户
    const existingAccounts = schema.accounts.filter(a => a.currency === currency);
    if (existingAccounts.length > 0) {
      // 如果已存在但被隐藏，则恢复显示
      existingAccounts.forEach(a => {
        a.visible = true;
      });
      this.saveSchema(schema);
      return existingAccounts;
    }
    
    // 创建新的5类账户
    const newAccounts: Account[] = [
      { id: `${currency}-cash`, name: '现金', currency, accountType: 'cash', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-investment`, name: '投资', currency, accountType: 'investment', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-loan`, name: '贷款', currency, accountType: 'loan', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-expense`, name: '支出', currency, accountType: 'expense', balance: 0, createdAt: now, isDefault: false, visible: false },
      { id: `${currency}-income`, name: '收入', currency, accountType: 'income', balance: 0, createdAt: now, isDefault: false, visible: false },
    ];
    
    schema.accounts.push(...newAccounts);
    this.saveSchema(schema);
    return newAccounts;
  }

  /**
   * 获取指定币种所有账户的总余额（从分录计算）
   * @param currency 币种代码
   * @returns 该币种所有账户的总余额
   */
  getCurrencyBalance(currency: string): number {
    const schema = this.getSchema();
    const currencyAccounts = schema.accounts.filter(a => a.currency === currency);
    
    if (currencyAccounts.length === 0) {
      return 0;
    }
    
    // 计算每个账户的余额
    const balances: Record<string, number> = {};
    currencyAccounts.forEach(acc => {
      balances[acc.id] = 0;
    });
    
    // 从分录计算余额
    schema.records.forEach(record => {
      record.entries?.forEach(entry => {
        if (balances[entry.accountId] !== undefined) {
          if (entry.direction === 'debit') {
            balances[entry.accountId] += entry.amount;
          } else {
            balances[entry.accountId] -= entry.amount;
          }
        }
      });
    });
    
    // 计算总余额（只计算 visible=true 的账户）
    return currencyAccounts
      .filter(a => a.visible === true)
      .reduce((sum, acc) => sum + balances[acc.id], 0);
  }

  /**
   * 禁用指定币种（软删除所有账户）
   * @param currency 币种代码
   * @returns 操作结果
   */
  disableCurrency(currency: string): { success: boolean; message: string } {
    const schema = this.getSchema();
    
    // 不能禁用默认币种
    const defaultAccount = schema.accounts.find(a => a.isDefault);
    if (defaultAccount && defaultAccount.currency === currency) {
      return { success: false, message: '无法禁用默认币种' };
    }
    
    // 检查余额是否为0
    const balance = this.getCurrencyBalance(currency);
    if (balance !== 0) {
      return { success: false, message: '该币种账户有余额，无法禁用' };
    }
    
    // 软删除（设置 visible=false）
    schema.accounts.forEach(a => {
      if (a.currency === currency) {
        a.visible = false;
      }
    });
    
    this.saveSchema(schema);
    return { success: true, message: '币种已禁用' };
  }

  /**
   * 检查币种是否启用
   * @param currency 币种代码
   * @returns 是否启用
   */
  isCurrencyEnabled(currency: string): boolean {
    const schema = this.getSchema();
    const currencyAccounts = schema.accounts.filter(a => a.currency === currency);
    return currencyAccounts.some(a => a.visible === true);
  }

  // 收入规则管理方法
  getIncomeRules(): IncomeRule[] {
    const schema = this.getSchema();
    return [...schema.incomeRules];
  }

  saveIncomeRules(incomeRules: IncomeRule[]): void {
    const schema = this.getSchema();
    schema.incomeRules = incomeRules;
    this.saveSchema(schema);
  }

  addIncomeRule(incomeRule: IncomeRule): void {
    const schema = this.getSchema();
    schema.incomeRules.push(incomeRule);
    this.saveSchema(schema);
  }

  deleteIncomeRule(id: string): void {
    const schema = this.getSchema();
    schema.incomeRules = schema.incomeRules.filter((r) => r.id !== id);
    this.saveSchema(schema);
  }

  updateIncomeRule(incomeRule: IncomeRule): void {
    const schema = this.getSchema();
    const index = schema.incomeRules.findIndex((r) => r.id === incomeRule.id);
    if (index >= 0) {
      schema.incomeRules[index] = incomeRule;
      this.saveSchema(schema);
    }
  }

  exportData(): DataSchema {
    return this.getSchema();
  }

  importData(data: DataSchema): { success: boolean; message: string } {
    try {
      if (!this.validateSchema(data)) {
        return { success: false, message: '数据格式验证失败' };
      }

      // 补全旧记录的 currency 字段
      data.records = data.records.map(record => ({
        ...record,
        currency: record.currency || 'CNY',
      }));

      const migrated = this.migrateSchema(data);
      this.saveSchema(migrated);
      
      return { 
        success: true, 
        message: `成功导入 ${migrated.records.length} 条记录` 
      };
    } catch (error) {
      return { success: false, message: '导入失败: ' + (error as Error).message };
    }
  }

  private validateSchema(data: unknown): data is DataSchema {
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

    // 验证 accounts 字段（可选，用于兼容旧版本数据）
    if (schema.accounts !== undefined && !Array.isArray(schema.accounts)) {
      return false;
    }

    for (const account of schema.accounts || []) {
      if (!this.validateAccount(account)) {
        return false;
      }
    }

    // 验证 incomeRules 字段（可选，用于兼容旧版本数据）
    if (schema.incomeRules !== undefined && !Array.isArray(schema.incomeRules)) {
      return false;
    }

    for (const incomeRule of schema.incomeRules || []) {
      if (!this.validateIncomeRule(incomeRule)) {
        return false;
      }
    }

    return true;
  }

  private validateRecord(record: unknown): record is ExpenseRecord {
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

  private validateAccount(account: unknown): account is Account {
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

  private validateIncomeRule(incomeRule: unknown): incomeRule is IncomeRule {
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
}

export const recordDAO = new RecordDAO();