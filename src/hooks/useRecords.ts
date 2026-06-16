import { useState, useCallback, useMemo } from 'react';
import type { ExpenseRecord, Category, Account, IncomeRule } from '../types/record';
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

  // 派生状态：收入分类和支出分类
  const incomeCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'income');
  }, [categories]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

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

  const addRecord = useCallback((data: {
    type: 'income' | 'expense';
    amount: number;
    note: string;
    category: string;
    date: string;
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
  const addAccount = useCallback((account: Omit<Account, 'id' | 'createdAt'> & { id?: string }): Account => {
    const newAccount = recordService.addAccount(account);
    refreshAccounts();
    return newAccount;
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
    refreshAccounts,
    incomeRules,
    addIncomeRule,
    deleteIncomeRule,
    updateIncomeRule,
    refreshIncomeRules,
  };
};
