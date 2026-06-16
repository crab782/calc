import type { ExpenseRecord, DataSchema, Category, Account, IncomeRule } from '../types/record';
import { recordDAO } from './storage';

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface MonthlyDataWithPrediction {
  month: string;
  income: number;
  expense: number;
  balance: number;
  isActual: boolean; // true = 用户实际输入, false = 未来预测
}

export class RecordService {
  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount);
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
    return recordDAO.findAll();
  }

  getRecordById(id: string): ExpenseRecord | undefined {
    return recordDAO.findById(id);
  }

  addRecord(data: {
    type: 'income' | 'expense';
    amount: number;
    note: string;
    category: string;
    date: string;
    currency?: string;
  }): void {
    const currency = data.currency || 'CNY';
    const record: ExpenseRecord = {
      id: this.generateId(),
      type: data.type,
      amount: data.amount,
      note: data.note,
      category: data.category,
      date: data.date,
      currency,
      createdAt: Date.now(),
    };
    recordDAO.save(record);
    this.getOrCreateAccountByCurrency(currency);
  }

  updateRecord(id: string, data: Partial<ExpenseRecord>): void {
    const existing = recordDAO.findById(id);
    if (existing) {
      const updated: ExpenseRecord = { ...existing, ...data };
      recordDAO.save(updated);
    }
  }

  deleteRecord(id: string): void {
    recordDAO.delete(id);
  }

  deleteAllRecords(): void {
    recordDAO.deleteAll();
  }

  getRecordCount(): number {
    return recordDAO.count();
  }

  getStatistics(): Statistics {
    const records = recordDAO.findAll();
    
    return records.reduce(
      (acc, record) => {
        if (record.type === 'income') {
          acc.totalIncome += record.amount;
        } else {
          acc.totalExpense += record.amount;
        }
        acc.balance = acc.totalIncome - acc.totalExpense;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0 }
    );
  }

  getMonthlyData(): MonthlyData[] {
    const records = recordDAO.findAll();
    
    const monthlyData = records.reduce((acc, record) => {
      const month = record.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        acc[month].income += record.amount;
      } else {
        acc[month].expense += record.amount;
      }
      return acc;
    }, {} as Record<string, MonthlyData>);

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }

  generateMonthlyDataWithPrediction(): MonthlyDataWithPrediction[] {
    const records = recordDAO.findAll();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // 生成过去6个月 + 未来6个月（共12个月）的月份列表
    const generateMonthList = (): string[] => {
      const months: string[] = [];
      for (let i = -6; i <= 5; i++) {
        const date = new Date(currentYear, currentMonth + i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
      }
      return months;
    };

    const monthList = generateMonthList();

    // 从记录中获取实际月度数据
    const actualMonthlyData = records.reduce((acc, record) => {
      const month = record.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        acc[month].income += record.amount;
      } else {
        acc[month].expense += record.amount;
      }
      return acc;
    }, {} as Record<string, MonthlyData>);

    // 找到最近有数据的月份并计算累计结余
    const sortedActualMonths = Object.keys(actualMonthlyData).sort((a, b) => a.localeCompare(b));
    
    // 计算到最近实际月份的累计结余
    let lastActualBalance = 0;
    for (const month of sortedActualMonths) {
      lastActualBalance += actualMonthlyData[month].income - actualMonthlyData[month].expense;
    }

    // 当前月份
    const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

    // 生成结果数据
    const result: MonthlyDataWithPrediction[] = [];

    for (const month of monthList) {
      const isFuture = month > currentMonthStr;
      const hasActualData = actualMonthlyData[month] !== undefined;

      let income: number;
      let expense: number;
      let balance: number;
      // 过去月份（无论是否有数据）都属于记账历史，使用实线
      // 只有未来月份才使用虚线样式
      const isActual = !isFuture;

      if (hasActualData) {
        // 有实际数据，使用实际值
        income = actualMonthlyData[month].income;
        expense = actualMonthlyData[month].expense;
      } else if (isFuture) {
        // 未来月份：收入=0，支出=0，结余保持最近实际月份的值
        income = 0;
        expense = 0;
        balance = lastActualBalance;
        result.push({ month, income, expense, balance, isActual });
        continue;
      } else {
        // 过去无数据月份：填充为0（属于记账历史的一部分）
        income = 0;
        expense = 0;
      }

      // 计算累计结余
      const monthIndex = monthList.indexOf(month);
      const previousBalance = monthIndex > 0 ? result[monthIndex - 1].balance : 0;
      balance = previousBalance + income - expense;

      result.push({ month, income, expense, balance, isActual });
    }

    return result;
  }

  getRecentRecords(limit: number = 10): ExpenseRecord[] {
    const records = recordDAO.findAll();
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  exportData(): string {
    const data = recordDAO.exportData();
    return JSON.stringify(data, null, 2);
  }

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString) as DataSchema;
      return recordDAO.importData(data);
    } catch {
      return { success: false, message: 'JSON 解析错误' };
    }
  }

  // 分类管理方法
  getCategories(): Category[] {
    return recordDAO.getCategories();
  }

  getIncomeCategories(): Category[] {
    return recordDAO.getCategories().filter((c) => c.type === 'income');
  }

  getExpenseCategories(): Category[] {
    return recordDAO.getCategories().filter((c) => c.type === 'expense');
  }

  generateCategoryId(type: 'income' | 'expense'): string {
    const prefix = type === 'income' ? 'inc' : 'exp';
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    return `${prefix}-${id}`;
  }

  addCategory(category: Omit<Category, 'id'> & { id?: string }): Category {
    const newCategory: Category = {
      ...category,
      id: category.id || this.generateCategoryId(category.type),
    };
    recordDAO.addCategory(newCategory);
    return newCategory;
  }

  deleteCategory(id: string): { success: boolean; message: string } {
    // 检查是否有记录使用该分类
    const records = recordDAO.findAll();
    const categoryInUse = records.some((r) => r.category === id);
    
    if (categoryInUse) {
      return { success: false, message: '该分类正在被使用，无法删除' };
    }
    
    recordDAO.deleteCategory(id);
    return { success: true, message: '分类删除成功' };
  }

  updateCategory(category: Category): void {
    recordDAO.updateCategory(category);
  }

  // 账户管理方法
  getAccounts(): Account[] {
    return recordDAO.getAccounts();
  }

  generateAccountId(): string {
    return 'acc-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  addAccount(account: Omit<Account, 'id' | 'createdAt'> & { id?: string }): Account {
    const newAccount: Account = {
      ...account,
      id: account.id || this.generateAccountId(),
      createdAt: Date.now(),
    };
    recordDAO.addAccount(newAccount);
    return newAccount;
  }

  deleteAccount(id: string): { success: boolean; message: string } {
    // 检查是否只有一个账户（至少保留一个账户）
    const accounts = recordDAO.getAccounts();
    if (accounts.length <= 1) {
      return { success: false, message: '至少需要保留一个账户' };
    }
    
    recordDAO.deleteAccount(id);
    return { success: true, message: '账户删除成功' };
  }

  updateAccount(account: Account): void {
    recordDAO.updateAccount(account);
  }

  // 收入规则管理方法
  getIncomeRules(): IncomeRule[] {
    return recordDAO.getIncomeRules();
  }

  generateIncomeRuleId(): string {
    return 'income-rule-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  addIncomeRule(incomeRule: Omit<IncomeRule, 'id' | 'createdAt'> & { id?: string }): IncomeRule {
    const newIncomeRule: IncomeRule = {
      ...incomeRule,
      id: incomeRule.id || this.generateIncomeRuleId(),
      createdAt: Date.now(),
    };
    recordDAO.addIncomeRule(newIncomeRule);
    return newIncomeRule;
  }

  deleteIncomeRule(id: string): { success: boolean; message: string } {
    // 检查是否只有一个收入规则（至少保留一个规则）
    const incomeRules = recordDAO.getIncomeRules();
    if (incomeRules.length <= 1) {
      return { success: false, message: '至少需要保留一个收入规则' };
    }

    recordDAO.deleteIncomeRule(id);
    return { success: true, message: '收入规则删除成功' };
  }

  updateIncomeRule(incomeRule: IncomeRule): void {
    recordDAO.updateIncomeRule(incomeRule);
  }

  // 按币种查找/创建账户
  getOrCreateAccountByCurrency(currency: string): Account {
    const accounts = recordDAO.getAccounts();
    const existing = accounts.find(a => a.currency === currency);
    if (existing) {
      return existing;
    }
    
    const newAccount: Account = {
      id: this.generateAccountId(),
      name: `${currency}账户`,
      currency: currency,
      balance: 0,
      createdAt: Date.now(),
    };
    recordDAO.addAccount(newAccount);
    return newAccount;
  }
}

export const recordService = new RecordService();