import { useState, useCallback, useMemo } from 'react';
import type { ExpenseRecord, Category, Account, IncomeRule, FinancialSource } from '../types/record';
import { recordService } from '../lib/record';

export const useRecords = () => {
  const [records, setRecords] = useState<ExpenseRecord[]>(() => {
    return recordService.getAllRecords();
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    return recordService.getCategories();
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    return recordService.getAccounts();
  });

  const [incomeRules, setIncomeRules] = useState<IncomeRule[]>(() => {
    return recordService.getIncomeRules();
  });

  const [financialSources, setFinancialSources] = useState<FinancialSource[]>(() => {
    return recordService.getFinancialSources();
  });

  // 派生状态：收入分类和支出分类
  const incomeCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'income');
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  // 派生状态：按类型过滤的财务来源
  const incomeSources = useMemo(() => {
    return financialSources.filter((s) => s.type === 'income');
  }, [financialSources]);

  const expenseSources = useMemo(() => {
    return financialSources.filter((s) => s.type === 'expense');
  }, [financialSources]);

  const investmentSources = useMemo(() => {
    return financialSources.filter((s) => s.type === 'investment');
  }, [financialSources]);

  const loanSources = useMemo(() => {
    return financialSources.filter((s) => s.type === 'loan');
  }, [financialSources]);

  const refresh = useCallback(() => {
    setRecords(recordService.getAllRecords());
  }, []);

  const refreshCategories = useCallback(() => {
    setCategories(recordService.getCategories());
  }, []);

  const refreshAccounts = useCallback(() => {
    setAccounts(recordService.getAccounts());
  }, []);

  const refreshIncomeRules = useCallback(() => {
    setIncomeRules(recordService.getIncomeRules());
  }, []);

  const refreshFinancialSources = useCallback(() => {
    setFinancialSources(recordService.getFinancialSources());
  }, []);

  const addRecord = useCallback((data: {
    type: ExpenseRecord['type'];
    amount: number;
    note: string;
    category: string;
    date: string;
    currency?: string;
    entries?: ExpenseRecord['entries'];
  }) => {
    recordService.addRecord(data);
    refresh();
  }, [refresh]);

  const deleteRecord = useCallback((id: string) => {
    recordService.deleteRecord(id);
    refresh();
  }, [refresh]);

  const getRecentRecords = useCallback((limit: number = 10) => {
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }, [records]);

  // 分类管理方法
  const addCategory = useCallback((category: Omit<Category, 'id'> & { id?: string }) => {
    recordService.addCategory(category);
    refreshCategories();
  }, [refreshCategories]);

  const deleteCategory = useCallback((id: string) => {
    const result = recordService.deleteCategory(id);
    if (result.success) {
      refreshCategories();
    }
    return result;
  }, [refreshCategories]);

  const updateCategory = useCallback((category: Category) => {
    recordService.updateCategory(category);
    refreshCategories();
  }, [refreshCategories]);

  // 账户管理方法
  const addAccount = useCallback((account: { currency: string; accountType: 'cash' | 'investment' | 'loan'; name?: string }): { success: boolean; message: string; account?: Account } => {
    const result = recordService.addAccount(account);
    if (result.success) {
      refreshAccounts();
    }
    return result;
  }, [refreshAccounts]);

  const deleteAccount = useCallback((id: string): { success: boolean; message: string } => {
    const result = recordService.deleteAccount(id);
    if (result.success) {
      refreshAccounts();
    }
    return result;
  }, [refreshAccounts]);

  const updateAccount = useCallback((account: Account) => {
    recordService.updateAccount(account);
    refreshAccounts();
  }, [refreshAccounts]);

  const setDefaultAccount = useCallback((id: string) => {
    recordService.setDefaultAccount(id);
    refreshAccounts();
  }, [refreshAccounts]);

  // 收入规则管理方法
  const addIncomeRule = useCallback((incomeRule: Omit<IncomeRule, 'id' | 'createdAt'> & { id?: string }): IncomeRule => {
    const newIncomeRule = recordService.addIncomeRule(incomeRule);
    refreshIncomeRules();
    return newIncomeRule;
  }, [refreshIncomeRules]);

  const deleteIncomeRule = useCallback((id: string): { success: boolean; message: string } => {
    const result = recordService.deleteIncomeRule(id);
    if (result.success) {
      refreshIncomeRules();
    }
    return result;
  }, [refreshIncomeRules]);

  const updateIncomeRule = useCallback((incomeRule: IncomeRule) => {
    recordService.updateIncomeRule(incomeRule);
    refreshIncomeRules();
  }, [refreshIncomeRules]);

  // 财务来源管理方法
  const addFinancialSource = useCallback((source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }): FinancialSource => {
    const newSource = recordService.addFinancialSource(source);
    refreshFinancialSources();
    return newSource;
  }, [refreshFinancialSources]);

  const deleteFinancialSource = useCallback((id: string): { success: boolean; message: string } => {
    const result = recordService.deleteFinancialSource(id);
    if (result.success) {
      refreshFinancialSources();
    }
    return result;
  }, [refreshFinancialSources]);

  const updateFinancialSource = useCallback((id: string, updates: Partial<FinancialSource>) => {
    recordService.updateFinancialSource(id, updates);
    refreshFinancialSources();
  }, [refreshFinancialSources]);

  // 汇总计算方法
  const getMonthlySummary = useCallback(() => {
    return {
      income: recordService.calculateMonthlyIncome(),
      expense: recordService.calculateMonthlyExpense(),
      balance: recordService.calculateMonthlyBalance(),
      investmentReturn: recordService.calculateExpectedInvestmentReturn(),
      loanPayment: recordService.calculateMonthlyLoanPayment(),
    };
  }, []);

  const getOrCreateAccountByCurrency = useCallback((currency: string): Account[] => {
    const accounts = recordService.getOrCreateAccountByCurrency(currency);
    refreshAccounts();
    return accounts;
  }, [refreshAccounts]);

  const createCurrencyAccounts = useCallback((currency: string): Account[] => {
    const accounts = recordService.createCurrencyAccounts(currency);
    refreshAccounts();
    return accounts;
  }, [refreshAccounts]);

  const getCurrencyBalance = useCallback((currency: string): number => {
    return recordService.getCurrencyBalance(currency);
  }, []);

  const disableCurrency = useCallback((currency: string): { success: boolean; message: string } => {
    const result = recordService.disableCurrency(currency);
    if (result.success) {
      refreshAccounts();
    }
    return result;
  }, [refreshAccounts]);

  const isCurrencyEnabled = useCallback((currency: string): boolean => {
    return recordService.isCurrencyEnabled(currency);
  }, []);

  return {
    records,
    addRecord,
    deleteRecord,
    refresh,
    refreshCategories,
    getRecentRecords,
    count: records.length,
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    deleteCategory,
    updateCategory,
    accounts,
    addAccount,
    deleteAccount,
    updateAccount,
    setDefaultAccount,
    refreshAccounts,
    incomeRules,
    addIncomeRule,
    deleteIncomeRule,
    updateIncomeRule,
    refreshIncomeRules,
    financialSources,
    incomeSources,
    expenseSources,
    investmentSources,
    loanSources,
    addFinancialSource,
    deleteFinancialSource,
    updateFinancialSource,
    refreshFinancialSources,
    getMonthlySummary,
    getOrCreateAccountByCurrency,
    createCurrencyAccounts,
    getCurrencyBalance,
    disableCurrency,
    isCurrencyEnabled,
  };
};
