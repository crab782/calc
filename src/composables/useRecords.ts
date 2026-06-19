import { ref, computed } from 'vue'
import type { ExpenseRecord, Category, Account, IncomeRule, FinancialSource, BudgetPlan, BudgetPeriodUnit, BudgetCalculationResult, CustomCurrency } from '../types/record'
import { recordService } from '../lib/record'

export const useRecords = () => {
  const records = ref<ExpenseRecord[]>(recordService.getAllRecords())

  const categories = ref<Category[]>(recordService.getCategories())

  const accounts = ref<Account[]>(recordService.getAccounts())

  const incomeRules = ref<IncomeRule[]>(recordService.getIncomeRules())

  const financialSources = ref<FinancialSource[]>(recordService.getFinancialSources())

  // Derived state: income and expense categories
  const incomeCategories = computed(() => {
    return categories.value.filter((c) => c.type === 'income')
  })

  const expenseCategories = computed(() => {
    return categories.value.filter((c) => c.type === 'expense')
  })

  // Derived state: filtered financial sources by type
  const incomeSources = computed(() => {
    return financialSources.value.filter((s) => s.type === 'income')
  })

  const expenseSources = computed(() => {
    return financialSources.value.filter((s) => s.type === 'expense')
  })

  const investmentSources = computed(() => {
    return financialSources.value.filter((s) => s.type === 'investment')
  })

  const loanSources = computed(() => {
    return financialSources.value.filter((s) => s.type === 'loan')
  })

  const refresh = () => {
    records.value = recordService.getAllRecords()
    accounts.value = recordService.getAccounts()
  }

  const refreshCategories = () => {
    categories.value = recordService.getCategories()
  }

  const refreshAccounts = () => {
    accounts.value = recordService.getAccounts()
  }

  const refreshIncomeRules = () => {
    incomeRules.value = recordService.getIncomeRules()
  }

  const refreshFinancialSources = () => {
    financialSources.value = recordService.getFinancialSources()
  }

  const addRecord = (data: {
    type: ExpenseRecord['type']
    amount: number
    note: string
    category: string
    date: string
    currency?: string
    entries?: ExpenseRecord['entries']
  }) => {
    recordService.addRecord(data)
    refresh()
  }

  const deleteRecord = (id: string) => {
    recordService.deleteRecord(id)
    refresh()
  }

  const getRecentRecords = (limit: number = 10): ExpenseRecord[] => {
    return [...records.value]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit) as ExpenseRecord[]
  }

  // Category management
  const addCategory = (category: Omit<Category, 'id'> & { id?: string }) => {
    recordService.addCategory(category)
    refreshCategories()
  }

  const deleteCategory = (id: string) => {
    const result = recordService.deleteCategory(id)
    if (result.success) {
      refreshCategories()
    }
    return result
  }

  const updateCategory = (category: Category) => {
    recordService.updateCategory(category)
    refreshCategories()
  }

  // Account management
  const addAccount = (account: { currency: string; accountType: 'cash' | 'investment' | 'loan'; name?: string }): { success: boolean; message: string; account?: Account } => {
    const result = recordService.addAccount(account)
    if (result.success) {
      refreshAccounts()
    }
    return result
  }

  const deleteAccount = (id: string): { success: boolean; message: string } => {
    const result = recordService.deleteAccount(id)
    if (result.success) {
      refreshAccounts()
    }
    return result
  }

  const updateAccount = (account: Account) => {
    recordService.updateAccount(account)
    refreshAccounts()
  }

  // Income rule management
  const addIncomeRule = (incomeRule: Omit<IncomeRule, 'id' | 'createdAt'> & { id?: string }): IncomeRule => {
    const newIncomeRule = recordService.addIncomeRule(incomeRule)
    refreshIncomeRules()
    return newIncomeRule
  }

  const deleteIncomeRule = (id: string): { success: boolean; message: string } => {
    const result = recordService.deleteIncomeRule(id)
    if (result.success) {
      refreshIncomeRules()
    }
    return result
  }

  const updateIncomeRule = (incomeRule: IncomeRule) => {
    recordService.updateIncomeRule(incomeRule)
    refreshIncomeRules()
  }

  // Financial source management
  const addFinancialSource = (source: Omit<FinancialSource, 'id' | 'createdAt'> & { id?: string }): FinancialSource => {
    const newSource = recordService.addFinancialSource(source)
    refreshFinancialSources()
    return newSource
  }

  const deleteFinancialSource = (id: string): { success: boolean; message: string } => {
    const result = recordService.deleteFinancialSource(id)
    if (result.success) {
      refreshFinancialSources()
    }
    return result
  }

  const updateFinancialSource = (id: string, updates: Partial<FinancialSource>) => {
    recordService.updateFinancialSource(id, updates)
    refreshFinancialSources()
  }

  // Summary calculations
  const getMonthlySummary = () => {
    return {
      income: recordService.calculateMonthlyIncome(),
      expense: recordService.calculateMonthlyExpense(),
      balance: recordService.calculateMonthlyBalance(),
      investmentReturn: recordService.calculateExpectedInvestmentReturn(),
      loanPayment: recordService.calculateMonthlyLoanPayment(),
    }
  }

  const getOrCreateAccountByCurrency = (currency: string): Account[] => {
    const accs = recordService.getOrCreateAccountByCurrency(currency)
    refreshAccounts()
    return accs
  }

  const createCurrencyAccounts = (currency: string): Account[] => {
    const accs = recordService.createCurrencyAccounts(currency)
    refreshAccounts()
    return accs
  }

  const getCurrencyBalance = (currency: string): number => {
    return recordService.getCurrencyBalance(currency)
  }

  const isCurrencyEnabled = (currency: string): boolean => {
    return recordService.isCurrencyEnabled(currency)
  }

  // Budget plan management
  const budgetPlans = computed(() => {
    return recordService.getBudgetPlans()
  })

  const saveBudgetPlan = (plan: Omit<BudgetPlan, 'id' | 'createdAt'>): BudgetPlan => {
    return recordService.saveBudgetPlan(plan)
  }

  const deleteBudgetPlan = (id: string): void => {
    recordService.deleteBudgetPlan(id)
  }

  const calculateBudget = (accountIds: string[], periodUnit: BudgetPeriodUnit, periodCount: number): BudgetCalculationResult[] => {
    return recordService.calculateBudget(accountIds, periodUnit, periodCount)
  }

  const exportBudgetToCSV = (results: BudgetCalculationResult[]): string => {
    return recordService.exportBudgetToCSV(results)
  }

  // Exchange rate and custom currency management
  const exchangeRates = computed(() => {
    return recordService.getExchangeRates()
  })

  const customCurrencies = computed(() => {
    return recordService.getCustomCurrencies()
  })

  const updateExchangeRate = (rates: Record<string, number>, baseCurrency: string = 'CNY') => {
    recordService.updateExchangeRates({
      rates,
      baseCurrency,
      lastUpdatedAt: Date.now(),
      source: 'manual',
    })
  }

  const fetchExchangeRatesFromAPI = async (baseCurrency: string = 'CNY'): Promise<{ success: boolean; message: string; rates?: Record<string, number> }> => {
    return recordService.fetchExchangeRatesFromAPI(baseCurrency)
  }

  const canFetchRatesFromAPI = (): { allowed: boolean; remainingHours: number } => {
    return recordService.canFetchRatesFromAPI()
  }

  const addCustomCurrency = (currency: CustomCurrency) => {
    recordService.addCustomCurrency(currency)
    refreshAccounts()
  }

  const deleteCustomCurrency = (code: string) => {
    recordService.deleteCustomCurrency(code)
    refreshAccounts()
  }

  const enableCurrency = (currency: string) => {
    recordService.createCurrencyAccounts(currency)
    refreshAccounts()
  }

  const disableCurrency = (currency: string): { success: boolean; message: string } => {
    const result = recordService.disableCurrency(currency)
    if (result.success) {
      refreshAccounts()
    }
    return result
  }

  const showIncomeExpenseAccounts = ref<boolean>(recordService.getShowIncomeExpenseAccounts())

  const toggleIncomeExpenseAccounts = (value: boolean) => {
    recordService.setShowIncomeExpenseAccounts(value)
    showIncomeExpenseAccounts.value = value
  }

  return {
    records,
    addRecord,
    deleteRecord,
    refresh,
    refreshCategories,
    getRecentRecords,
    count: computed(() => records.value.length),
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
    budgetPlans,
    saveBudgetPlan,
    deleteBudgetPlan,
    calculateBudget,
    exportBudgetToCSV,
    exchangeRates,
    customCurrencies,
    updateExchangeRate,
    fetchExchangeRatesFromAPI,
    canFetchRatesFromAPI,
    addCustomCurrency,
    deleteCustomCurrency,
    enableCurrency,
    showIncomeExpenseAccounts,
    toggleIncomeExpenseAccounts,
  }
}
