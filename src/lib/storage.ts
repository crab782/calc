import type { ExpenseRecord, DataSchema, Category, Account, IncomeRule } from '../types/record';
import { CURRENT_VERSION, INCOME_CATEGORIES, EXPENSE_CATEGORIES, DEFAULT_ACCOUNT, DEFAULT_INCOME_RULE } from '../types/record';

const STORAGE_KEY = 'expense_tracker_data';

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
      accounts: [DEFAULT_ACCOUNT],
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
          s.accounts = [DEFAULT_ACCOUNT];
        }
      },
      '1.1.0': (s) => {
        s.version = '1.2.0';
        if (!s.incomeRules) {
          s.incomeRules = [DEFAULT_INCOME_RULE];
        }
      },
    };

    // 连续迁移，直到达到当前版本
    while (schema.version !== CURRENT_VERSION) {
      if (!migrations[schema.version]) {
        // 未知版本，重置为当前版本
        schema.version = CURRENT_VERSION;
        schema.incomeRules = [DEFAULT_INCOME_RULE];
        schema.accounts = schema.accounts || [DEFAULT_ACCOUNT];
        break;
      }
      migrations[schema.version](schema);
    }

    return schema;
  }

  findAll(): ExpenseRecord[] {
    const schema = this.getSchema();
    return [...schema.records];
  }

  findById(id: string): ExpenseRecord | undefined {
    const schema = this.getSchema();
    return schema.records.find((r) => r.id === id);
  }

  findByMonth(month: string): ExpenseRecord[] {
    const schema = this.getSchema();
    return schema.records.filter((r) => r.date.startsWith(month));
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
    schema.accounts = schema.accounts.filter((a) => a.id !== id);
    this.saveSchema(schema);
  }

  updateAccount(account: Account): void {
    const schema = this.getSchema();
    const index = schema.accounts.findIndex((a) => a.id === account.id);
    if (index >= 0) {
      schema.accounts[index] = account;
      this.saveSchema(schema);
    }
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
    
    return (
      typeof r.id === 'string' &&
      (r.type === 'income' || r.type === 'expense') &&
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
      typeof a.createdAt === 'number'
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