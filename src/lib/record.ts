import type { ExpenseRecord, DataSchema, Category, Account, IncomeRule, Entry, FinancialSource, FinancialSourceType, FinancialPeriod, BudgetPlan, BudgetCalculationResult, BudgetPeriod, BudgetPeriodUnit } from '../types/record';
import { recordDAO } from './storage';

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

    // 从记录中获取实际月度数据（仅默认账户币种）
    const currency = this.getDefaultAccountCurrency();
    const filteredRecords = records.filter(r => r.currency === currency);
    const actualMonthlyData = filteredRecords.reduce((acc, record) => {
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
}

export const recordService = new RecordService();