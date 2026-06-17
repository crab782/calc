import type { ExpenseRecord, DataSchema, Category, Account, IncomeRule, Entry, FinancialSource, FinancialSourceType, FinancialPeriod, BudgetPlan, BudgetCalculationResult, BudgetPeriod, BudgetPeriodUnit, ExchangeRateData, CustomCurrency } from '../types/record';
import { recordDAO } from './storage';
import { EXCHANGE_RATE_APIS } from '../types/record';

/**
 * 根据交易类型生成分录
 * @param type 交易类型
 * @param amount 金额（用于收入、支出、投资、贷款到账）
 * @param principal 本金（用于投资到期、还贷）
 * @param interest 利息（用于投资到期、还贷）
 * @param currency 币种（用于生成账户ID）
 * @returns 分录数组
 */
export function generateEntries(
  type: ExpenseRecord['type'],
  amount: number,
  principal?: number,
  interest?: number,
  currency: string = 'CNY'
): Entry[] {
  switch (type) {
    case 'income':
      // 借：现金账户
      // 贷：收入账户
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount },
        { accountId: `${currency}-income`, accountName: '收入', direction: 'credit', amount },
      ];

    case 'expense':
      // 借：支出账户
      // 贷：现金账户
      return [
        { accountId: `${currency}-expense`, accountName: '支出', direction: 'debit', amount },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount },
      ];

    case 'investment':
      // 借：投资账户
      // 贷：现金账户
      return [
        { accountId: `${currency}-investment`, accountName: '投资', direction: 'debit', amount },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount },
      ];

    case 'investment-mature': {
      // 投资到期：需要本金和利息
      // 借：现金账户（本金）
      // 贷：投资账户（本金）
      // 借：现金账户（利息）
      // 贷：收入账户（利息）
      const invPrincipal = principal ?? 0;
      const invInterest = interest ?? 0;
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount: invPrincipal },
        { accountId: `${currency}-investment`, accountName: '投资', direction: 'credit', amount: invPrincipal },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount: invInterest },
        { accountId: `${currency}-income`, accountName: '收入', direction: 'credit', amount: invInterest },
      ];
    }

    case 'loan-receive':
      // 借：现金账户
      // 贷：贷款账户
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount },
        { accountId: `${currency}-loan`, accountName: '贷款', direction: 'credit', amount },
      ];

    case 'loan-repay': {
      // 还贷：需要本金和利息
      // 借：贷款账户（本金）
      // 贷：现金账户（本金）
      // 借：支出账户（利息）
      // 贷：现金账户（利息）
      const loanPrincipal = principal ?? 0;
      const loanInterest = interest ?? 0;
      return [
        { accountId: `${currency}-loan`, accountName: '贷款', direction: 'debit', amount: loanPrincipal },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount: loanPrincipal },
        { accountId: `${currency}-expense`, accountName: '支出', direction: 'debit', amount: loanInterest },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount: loanInterest },
      ];
    }

    default:
      return [];
  }
}

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
  isPartialActual?: boolean; // 当前月：部分实际部分预测
  boundaryDay?: number; // 当前月的边界日（今天是几号）
  balanceAtBoundary?: number; // 边界日的结余（用于图表过渡点）
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
  balance: number;
  isActual: boolean;
}

export class RecordService {
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

  // 获取默认账户币种（isDefault 为 true 的账户的币种）
  getDefaultAccountCurrency(): string {
    const accounts = recordDAO.getAccounts();
    const defaultAccount = accounts.find(a => a.isDefault);
    return defaultAccount ? defaultAccount.currency : (accounts.length > 0 ? accounts[0].currency : 'CNY');
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
    // 生成分录，传递 currency 参数
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
    const currency = this.getDefaultAccountCurrency();
    const records = recordDAO.findAll().filter(r => r.currency === currency);
    
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
    const currency = this.getDefaultAccountCurrency();
    const records = recordDAO.findAll().filter(r => r.currency === currency);
    
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

  /**
   * 生成日级预测数据（过去6个月第一天 + 未来6个月最后一天）
   * 底层按日粒度计算，前端可按需聚合为月级展示
   * 覆盖约13个月，约400天
   */
  generateDailyDataWithPrediction(): DailyData[] {
    const records = recordDAO.findAll();
    const now = new Date();
    const currency = this.getDefaultAccountCurrency();

    // 计算日期范围：过去6个月的第一天到未来6个月的最后一天
    const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 7, 0); // +7月第0天 = +6月最后一天

    const dates: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(this._formatDateISO(current));
      current.setDate(current.getDate() + 1);
    }

    // 按日聚合实际记录数据
    const actualDailyData: Record<string, { income: number; expense: number }> = {};
    const filteredRecords = records.filter(r => r.currency === currency);
    filteredRecords.forEach(record => {
      const day = record.date;
      if (!actualDailyData[day]) {
        actualDailyData[day] = { income: 0, expense: 0 };
      }
      if (record.type === 'income') {
        actualDailyData[day].income += record.amount;
      } else {
        actualDailyData[day].expense += record.amount;
      }
    });

    // 获取财务来源（仅收入/支出，默认币种）
    const incomeSources = this.getFinancialSourcesByType('income').filter(s => s.currency === currency);
    const expenseSources = this.getFinancialSourcesByType('expense').filter(s => s.currency === currency);

    // 生成结果
    const result: DailyData[] = [];
    let runningBalance = 0;

    // 计算范围之前所有天的实际结余作为起点
    const sortedActualDays = Object.keys(actualDailyData).filter(day => day < dates[0]).sort();
    for (const day of sortedActualDays) {
      runningBalance += actualDailyData[day].income - actualDailyData[day].expense;
    }

    const todayStr = this._formatDateISO(now);

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const isFuture = date > todayStr;
      const hasActualData = actualDailyData[date] !== undefined;

      let income = 0;
      let expense = 0;

      if (hasActualData) {
        // 有实际记录，使用实际值
        income = actualDailyData[date].income;
        expense = actualDailyData[date].expense;
      } else if (isFuture) {
        // 未来日期：根据财务来源计算预期
        const d = this._parseDateISO(date);
        const dayOfWeek = d.getDay(); // 0=周日, 1=周一, ..., 6=周六

        // 计算当天的预期收入
        incomeSources.forEach(source => {
          if (this._isSourceActiveOnDay(source, d, dayOfWeek)) {
            income += source.amount;
          }
        });

        // 计算当天的预期支出
        expenseSources.forEach(source => {
          if (this._isSourceActiveOnDay(source, d, dayOfWeek)) {
            expense += source.amount;
          }
        });
      }

      runningBalance += income - expense;
      result.push({ date, income, expense, balance: runningBalance, isActual: !isFuture });
    }

    return result;
  }

  /**
   * 判断财务来源是否在指定日期触发
   */
  private _isSourceActiveOnDay(source: FinancialSource, date: Date, dayOfWeek: number): boolean {
    switch (source.period) {
      case 'daily':
        return true;
      case 'weekly':
        return source.dayOfWeek !== undefined && dayOfWeek === source.dayOfWeek;
      case 'monthly':
        if (source.dayOfMonth === undefined) return false;
        if (source.dayOfMonth === -1) {
          // 每月最后一天
          return date.getDate() === this._getLastDayOfMonth(date.getFullYear(), date.getMonth());
        }
        return date.getDate() === source.dayOfMonth;
      case 'yearly':
        // 每年按配置日期触发
        if (source.dayOfMonth === undefined) return false;
        return date.getDate() === source.dayOfMonth && date.getMonth() === 0; // 每年1月
      case 'once':
        return false; // 一次性不触发
      default:
        return false;
    }
  }

  /**
   * 获取指定年月的最后一天
   */
  private _getLastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * 格式化日期为 ISO 字符串 YYYY-MM-DD
   */
  private _formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 解析 YYYY-MM-DD 为 Date 对象（使用本地时区）
   */
  private _parseDateISO(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * 将日级数据聚合为月级数据
   * 用于前端图表按月展示
   * 支持当前月的实际/预测边界（以今天为分界）
   */
  aggregateDailyToMonthly(dailyData: DailyData[]): MonthlyDataWithPrediction[] {
    const now = new Date();
    const currentMonth = this._formatDateISO(now).substring(0, 7);
    const todayStr = this._formatDateISO(now);
    const boundaryDay = now.getDate(); // 今天是几号（如17）

    const monthlyMap: Record<string, {
      month: string;
      income: number;
      expense: number;
      balance: number;
      isActual: boolean;
      isPartialActual?: boolean;
      boundaryDay?: number;
      balanceAtBoundary?: number;
    }> = {};

    dailyData.forEach(day => {
      const month = day.date.substring(0, 7);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, income: 0, expense: 0, balance: 0, isActual: true };
      }
      monthlyMap[month].income += day.income;
      monthlyMap[month].expense += day.expense;
      monthlyMap[month].balance = day.balance;

      if (month === currentMonth) {
        // 当前月：标记为部分实际部分预测
        monthlyMap[month].isActual = false; // 整体标记为预测月
        monthlyMap[month].isPartialActual = true;
        monthlyMap[month].boundaryDay = boundaryDay;
        // 记录边界日（今天）的结余
        if (day.date === todayStr) {
          monthlyMap[month].balanceAtBoundary = day.balance;
        }
      } else if (day.date <= todayStr) {
        // 过去日期：保持实际
      } else {
        // 未来日期：标记为非实际
        if (month !== currentMonth) {
          monthlyMap[month].isActual = false;
        }
      }
    });

    return Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
  }

  generateMonthlyDataWithPrediction(): MonthlyDataWithPrediction[] {
    const dailyData = this.generateDailyDataWithPrediction();
    return this.aggregateDailyToMonthly(dailyData);
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

  // 账户类型名称映射
  private ACCOUNT_TYPE_NAMES: Record<string, string> = {
    cash: '现金',
    investment: '投资',
    loan: '贷款',
  };

  generateAccountId(): string {
    return 'acc-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  addAccount(account: { currency: string; accountType: 'cash' | 'investment' | 'loan'; name?: string }): { success: boolean; message: string; account?: Account } {
    const { currency, accountType, name: customName } = account;
    
    // 自定义账户使用唯一ID，允许多个同币种同类型账户
    const id = this.generateAccountId();
    const name = customName || `${currency} ${this.ACCOUNT_TYPE_NAMES[accountType]}`;

    const newAccount: Account = {
      id,
      name,
      currency,
      accountType,
      balance: 0,
      createdAt: Date.now(),
      isDefault: false,
      visible: true,
    };
    recordDAO.addAccount(newAccount);
    return { success: true, message: '账户创建成功', account: newAccount };
  }

  /**
   * 计算账户余额（从分录计算：借方总和 - 贷方总和）
   * @param accountId 账户ID
   * @returns 账户余额
   */
  getAccountBalance(accountId: string): number {
    const records = recordDAO.findAll();
    let balance = 0;
    records.forEach(record => {
      record.entries?.forEach(entry => {
        if (entry.accountId === accountId) {
          if (entry.direction === 'debit') {
            balance += entry.amount;
          } else {
            balance -= entry.amount;
          }
        }
      });
    });
    return balance;
  }

  deleteAccount(id: string): { success: boolean; message: string } {
    // 检查是否只有一个账户（至少保留一个账户）
    const accounts = recordDAO.getAccounts();
    if (accounts.length <= 1) {
      return { success: false, message: '至少需要保留一个账户' };
    }

    // 检查账户余额是否为0
    const balance = this.getAccountBalance(id);
    if (balance !== 0) {
      return { success: false, message: '账户有余额，无法删除' };
    }

    // 软删除：设置 visible=false 而不是真正删除
    const account = accounts.find(a => a.id === id);
    if (account) {
      account.visible = false;
      recordDAO.updateAccount(account);
    }
    return { success: true, message: '账户删除成功' };
  }

  updateAccount(account: Account): void {
    recordDAO.updateAccount(account);
  }

  setDefaultAccount(id: string): void {
    recordDAO.setDefaultAccount(id);
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

  // 按币种查找/创建账户（创建所有类型的账户）
  getOrCreateAccountByCurrency(currency: string): Account[] {
    return recordDAO.createCurrencyAccounts(currency);
  }

  // 创建指定币种的账户
  createCurrencyAccounts(currency: string): Account[] {
    return recordDAO.createCurrencyAccounts(currency);
  }

  // 获取指定币种的总余额
  getCurrencyBalance(currency: string): number {
    return recordDAO.getCurrencyBalance(currency);
  }

  // 禁用指定币种
  disableCurrency(currency: string): { success: boolean; message: string } {
    return recordDAO.disableCurrency(currency);
  }

  // 检查币种是否启用
  isCurrencyEnabled(currency: string): boolean {
    return recordDAO.isCurrencyEnabled(currency);
  }

  // ========== 财务来源管理方法 ==========

  /**
   * 获取所有财务来源
   */
  getFinancialSources(): FinancialSource[] {
    return recordDAO.getFinancialSources();
  }

  /**
   * 按类型获取财务来源
   */
  getFinancialSourcesByType(type: FinancialSourceType): FinancialSource[] {
    return recordDAO.getFinancialSourcesByType(type);
  }

  /**
   * 生成财务来源ID
   */
  generateFinancialSourceId(): string {
    return 'fs-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 添加财务来源
   */
  addFinancialSource(source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }): FinancialSource {
    const newSource: FinancialSource = {
      ...source,
      id: source.id || this.generateFinancialSourceId(),
      createdAt: Date.now(),
    };
    recordDAO.addFinancialSource(newSource);
    return newSource;
  }

  /**
   * 更新财务来源
   */
  updateFinancialSource(id: string, updates: Partial<FinancialSource>): void {
    recordDAO.updateFinancialSource(id, updates);
  }

  /**
   * 删除财务来源
   */
  deleteFinancialSource(id: string): { success: boolean; message: string } {
    recordDAO.deleteFinancialSource(id);
    return { success: true, message: '财务来源删除成功' };
  }

  // ========== 汇总计算方法 ==========

  /**
   * 将周期金额转换为月度金额
   * @param amount 金额
   * @param period 周期
   * @returns 月度金额
   */
  private convertToMonthlyAmount(amount: number, period: FinancialPeriod): number {
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
        return 0; // 一次性不计入月度
      default:
        return 0;
    }
  }

  /**
   * 计算预期月收入
   * 将所有收入类型的财务来源按周期转换为月度金额
   */
  calculateMonthlyIncome(): number {
    const incomeSources = this.getFinancialSourcesByType('income');
    return incomeSources.reduce((total, source) => {
      return total + this.convertToMonthlyAmount(source.amount, source.period);
    }, 0);
  }

  /**
   * 计算预期月支出
   * 将所有支出类型的财务来源按周期转换为月度金额
   */
  calculateMonthlyExpense(): number {
    const expenseSources = this.getFinancialSourcesByType('expense');
    return expenseSources.reduce((total, source) => {
      return total + this.convertToMonthlyAmount(source.amount, source.period);
    }, 0);
  }

  /**
   * 计算预期月结余
   * 收入 - 支出
   */
  calculateMonthlyBalance(): number {
    return this.calculateMonthlyIncome() - this.calculateMonthlyExpense();
  }

  // ========== 投资收益计算方法 ==========

  /**
   * 计算预期投资收益
   * 对于一次性投资：预期收益 = 金额 * 预期收益率
   * 对于定投：预期月收益 = 月投入金额 * 预期月收益率
   */
  calculateExpectedInvestmentReturn(): number {
    const investmentSources = this.getFinancialSourcesByType('investment');
    return investmentSources.reduce((total, source) => {
      const expectedReturn = source.expectedReturn || 0;
      if (expectedReturn === 0) {
        return total;
      }

      // 一次性投资：计算总收益（不计入月度）
      if (source.investmentType === 'once') {
        return total; // 一次性投资收益不计入月度收益
      }

      // 定投：计算月收益
      const monthlyAmount = this.convertToMonthlyAmount(source.amount, source.period);
      // 预期收益率是年化收益率，转换为月收益率
      const monthlyReturnRate = expectedReturn / 100 / 12;
      return total + (monthlyAmount * monthlyReturnRate);
    }, 0);
  }

  // ========== 贷款还款计算方法 ==========

  /**
   * 计算月还款金额
   * 根据还款方式计算月还款金额
   */
  calculateMonthlyLoanPayment(): number {
    const loanSources = this.getFinancialSourcesByType('loan');
    return loanSources.reduce((total, source) => {
      const principal = source.principal || source.amount;
      const interestRate = source.interestRate || 0;
      const interestType = source.interestType || 'equal-payment';

      if (interestRate === 0) {
        // 无息贷款，按周期平摊本金
        return total + this.convertToMonthlyAmount(principal, source.period);
      }

      // 年利率转换为月利率
      const monthlyRate = interestRate / 100 / 12;

      // 根据还款方式计算月还款金额
      switch (interestType) {
        case 'equal-payment': {
          // 等额本息：月还款 = 本金 * 月利率 * (1+月利率)^还款月数 / ((1+月利率)^还款月数 - 1)
          // 假设还款周期为月，还款月数为 1（简化计算）
          // 实际应该有还款期限，这里简化处理
          const months = this.getLoanMonths(source.period);
          if (months <= 0) return total;
          const temp = Math.pow(1 + monthlyRate, months);
          return total + (principal * monthlyRate * temp) / (temp - 1);
        }
        case 'equal-principal': {
          // 等额本金：月还款 = 本金/还款月数 + (本金-已还本金)*月利率
          // 简化计算：首月还款
          const months = this.getLoanMonths(source.period);
          if (months <= 0) return total;
          const monthlyPrincipal = principal / months;
          return total + monthlyPrincipal + (principal * monthlyRate);
        }
        case 'interest-first': {
          // 先息后本：月还款 = 本金 * 月利率（只还利息）
          return total + (principal * monthlyRate);
        }
        default:
          return total;
      }
    }, 0);
  }

  /**
   * 根据周期获取还款月数
   */
  private getLoanMonths(period: FinancialPeriod): number {
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

  // ========== 预算计划相关方法 ==========

  /**
   * 生成预算计划唯一ID
   */
  generateBudgetPlanId(): string {
    return 'budget-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  /**
   * 保存预算计划
   */
  saveBudgetPlan(plan: Omit<BudgetPlan, 'id' | 'createdAt'>): BudgetPlan {
    const budgetPlan: BudgetPlan = {
      ...plan,
      id: this.generateBudgetPlanId(),
      createdAt: Date.now(),
    };
    recordDAO.addBudgetPlan(budgetPlan);
    return budgetPlan;
  }

  /**
   * 获取所有预算计划
   */
  getBudgetPlans(): BudgetPlan[] {
    return recordDAO.getBudgetPlans();
  }

  /**
   * 删除预算计划
   */
  deleteBudgetPlan(id: string): void {
    recordDAO.deleteBudgetPlan(id);
  }

  /**
   * 计算预算
   * 基于账户当前余额和历史记录的平均月收支变化，预测未来各周期的余额
   * @param accountIds 选择的账户ID列表
   * @param periodUnit 周期单位（month/year）
   * @param periodCount 周期数
   */
  calculateBudget(accountIds: string[], periodUnit: BudgetPeriodUnit, periodCount: number): BudgetCalculationResult[] {
    const accounts = recordDAO.getAccounts().filter(a => accountIds.includes(a.id));
    const allRecords = recordDAO.findAll();
    const results: BudgetCalculationResult[] = [];

    for (const account of accounts) {
      // 获取该账户的当前余额
      const currentBalance = this.getAccountBalance(account.id);

      // 计算该账户的历史月均收支变化
      const monthlyChange = this._calculateAccountMonthlyChange(account.id, allRecords);

      // 生成各周期的预算数据
      const periods: BudgetPeriod[] = [];
      let runningBalance = currentBalance;

      for (let i = 0; i < periodCount; i++) {
        let change: number;
        let label: string;

        if (periodUnit === 'month') {
          change = monthlyChange;
          label = `第${i + 1}月`;
        } else {
          // 年周期：月均变化 * 12
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

  /**
   * 计算指定账户的历史月均收支变化
   * 基于该账户所有相关记录的总收入和总支出，计算平均每月净变化
   */
  private _calculateAccountMonthlyChange(accountId: string, records: ExpenseRecord[]): number {
    const accountRecords = records.filter(r =>
      r.entries?.some(e => e.accountId === accountId)
    );

    if (accountRecords.length === 0) {
      return 0;
    }

    // 计算总借方和总贷方
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

    // 计算月份跨度
    let monthSpan = 1;
    if (minDate && maxDate) {
      const [minYear, minMonth] = minDate.split('-').map(Number);
      const [maxYear, maxMonth] = maxDate.split('-').map(Number);
      monthSpan = (maxYear - minYear) * 12 + (maxMonth - minMonth) + 1;
      if (monthSpan < 1) monthSpan = 1;
    }

    // 净变化 = 总借方 - 总贷方
    const netChange = totalDebit - totalCredit;
    return parseFloat((netChange / monthSpan).toFixed(2));
  }

  /**
   * 将预算计算结果导出为 CSV 格式
   */
  exportBudgetToCSV(results: BudgetCalculationResult[]): string {
    // CSV header
    const headers = ['账户名称', '币种', '周期', '预计金额'];
    let csv = headers.join(',') + '\n';

    // CSV body
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

  // ========== 汇率和自定义货币管理方法 ==========

  /**
   * 获取当前汇率数据
   */
  getExchangeRates(): ExchangeRateData {
    return recordDAO.getExchangeRates();
  }

  /**
   * 更新汇率数据
   */
  updateExchangeRates(exchangeRates: ExchangeRateData): void {
    recordDAO.updateExchangeRates(exchangeRates);
  }

  /**
   * 获取自定义货币列表
   */
  getCustomCurrencies(): CustomCurrency[] {
    return recordDAO.getCustomCurrencies();
  }

  /**
   * 添加自定义货币
   */
  addCustomCurrency(currency: CustomCurrency): void {
    recordDAO.addCustomCurrency(currency);
  }

  /**
   * 删除自定义货币
   */
  deleteCustomCurrency(code: string): void {
    recordDAO.deleteCustomCurrency(code);
  }

  /**
   * 检查是否可以从API获取汇率（24小时频率限制）
   */
  canFetchRatesFromAPI(): { allowed: boolean; remainingHours: number } {
    const rates = this.getExchangeRates();
    if (rates.source === 'api' && rates.lastUpdatedAt) {
      const hoursSinceLastUpdate = (Date.now() - rates.lastUpdatedAt) / (1000 * 60 * 60);
      if (hoursSinceLastUpdate < 24) {
        return { allowed: false, remainingHours: Math.ceil(24 - hoursSinceLastUpdate) };
      }
    }
    return { allowed: true, remainingHours: 0 };
  }

  /**
   * 从API获取汇率数据（按顺序尝试多个API）
   * @returns 汇率数据或错误信息
   */
  async fetchExchangeRatesFromAPI(baseCurrency: string = 'CNY'): Promise<{ success: boolean; message: string; rates?: Record<string, number> }> {
    // 检查频率限制
    const rateLimit = this.canFetchRatesFromAPI();
    if (!rateLimit.allowed) {
      return { success: false, message: `请等待 ${rateLimit.remainingHours} 小时后再次获取` };
    }

    for (const api of EXCHANGE_RATE_APIS) {
      try {
        const response = await fetch(api.url, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) {
          console.warn(`汇率API ${api.name} 返回错误: ${response.status}`);
          continue;
        }
        const data = await response.json();
        const rates = api.parser(data, baseCurrency);
        if (Object.keys(rates).length > 0) {
          // 更新汇率数据
          this.updateExchangeRates({
            rates,
            baseCurrency,
            lastUpdatedAt: Date.now(),
            source: 'api',
            apiSource: api.name,
          });
          return { success: true, message: `成功从 ${api.name} 获取汇率`, rates };
        }
      } catch (e) {
        console.warn(`汇率API ${api.name} 请求失败:`, e);
        continue;
      }
    }

    return { success: false, message: '所有汇率API均不可用，请检查网络连接' };
  }
}

export const recordService = new RecordService();