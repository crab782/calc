// 分录接口：用于记录每笔交易涉及的账户和金额
export interface Entry {
  accountId: string;
  accountName: string;
  direction: 'debit' | 'credit'; // 借/贷
  amount: number;
}

export interface ExpenseRecord {
  id: string;
  type: 'income' | 'expense' | 'investment' | 'investment-mature' | 'loan-receive' | 'loan-repay';
  amount: number;
  note: string;
  category: string;
  date: string;
  currency: string;
  createdAt: number;
  entries: Entry[];
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export type AccountType = 'cash' | 'investment' | 'loan' | 'income' | 'expense';

export interface Account {
  id: string;
  name: string;
  currency: string;
  accountType: AccountType; // 账户类型
  balance: number;
  createdAt: number;
  isDefault: boolean;
  visible: boolean; // 是否在账户页显示
}

export type IncomePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface IncomeRule {
  id: string;
  name: string;
  currency: string;
  amount: number;
  period: IncomePeriod;
  createdAt: number;
}

// 资金来源类型
export type FinancialSourceType = 'income' | 'expense' | 'investment' | 'loan';

// 投资类型
export type InvestmentType = 'once' | 'recurring';

// 贷款还款方式
export type InterestType = 'equal-payment' | 'equal-principal' | 'interest-first';

// 资金来源周期
export type FinancialPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';

// 资金来源接口
export interface FinancialSource {
  id: string;
  type: FinancialSourceType;
  name: string;
  currency: string;
  amount: number;
  period: FinancialPeriod;
  investmentType?: InvestmentType; // 投资特有字段
  expectedReturn?: number; // 投资特有字段：预期收益率
  principal?: number; // 贷款特有字段：本金
  interestRate?: number; // 贷款特有字段：利率
  interestType?: InterestType; // 贷款特有字段：还款方式
  createdAt: number;
}

export type BudgetPeriodUnit = 'month' | 'year';

export interface BudgetPlan {
  id: string;
  name: string;
  accountIds: string[];  // 最多3个账户
  periodUnit: BudgetPeriodUnit;
  periodCount: number;   // 月份1-60或年份1-5
  createdAt: number;
}

export interface BudgetCalculationResult {
  accountId: string;
  accountName: string;
  currency: string;
  periods: BudgetPeriod[];
}

export interface BudgetPeriod {
  index: number;
  label: string;  // 如 "第1月" 或 "第1年"
  estimatedAmount: number;
}

// 自定义货币
export interface CustomCurrency {
  code: string;  // 如 "HKD"
  name: string;  // 如 "港币"
}

// 汇率数据
export interface ExchangeRateData {
  rates: Record<string, number>;  // 本币到外币的汇率映射，如 { USD: 0.14, EUR: 0.13 }
  baseCurrency: string;            // 基准币种，如 "CNY"
  lastUpdatedAt: number;           // 最后更新时间戳
  source: 'manual' | 'api' | 'default';  // 汇率来源
  apiSource?: string;              // API 来源名称，如 'frankfurter (CNY base)'
}

export interface DataSchema {
  version: string;
  records: ExpenseRecord[];
  categories: Category[];
  accounts: Account[];
  incomeRules: IncomeRule[];
  financialSources: FinancialSource[];
  budgetPlans: BudgetPlan[];
  customCurrencies: CustomCurrency[];
  exchangeRates: ExchangeRateData;
  createdAt: number;
  updatedAt: number;
}

export const INCOME_CATEGORIES: Category[] = [
  { id: 'inc-salary', name: '工资', type: 'income', icon: 'briefcase' },
  { id: 'inc-bonus', name: '奖金', type: 'income', icon: 'gift' },
  { id: 'inc-investment', name: '投资收益', type: 'income', icon: 'trending-up' },
  { id: 'inc-part-time', name: '兼职', type: 'income', icon: 'clock' },
  { id: 'inc-other', name: '其他收入', type: 'income', icon: 'plus' },
];

export const EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-food', name: '餐饮', type: 'expense', icon: 'utensils' },
  { id: 'exp-transport', name: '交通', type: 'expense', icon: 'car' },
  { id: 'exp-shopping', name: '购物', type: 'expense', icon: 'shopping-bag' },
  { id: 'exp-entertainment', name: '娱乐', type: 'expense', icon: 'gamepad-2' },
  { id: 'exp-medical', name: '医疗', type: 'expense', icon: 'heart-pulse' },
  { id: 'exp-education', name: '教育', type: 'expense', icon: 'graduation-cap' },
  { id: 'exp-rent', name: '房租', type: 'expense', icon: 'home' },
  { id: 'exp-utilities', name: '水电费', type: 'expense', icon: 'droplets' },
  { id: 'exp-other', name: '其他支出', type: 'expense', icon: 'more-horizontal' },
];

export const DEFAULT_ACCOUNT: Account = {
  id: 'default-account',
  name: '总账户',
  currency: 'CNY',
  accountType: 'cash',
  balance: 0,
  createdAt: Date.now(),
  isDefault: true,
  visible: true,
};

export const DEFAULT_INCOME_RULE: IncomeRule = {
  id: 'default-income-rule',
  name: '工资',
  currency: 'CNY',
  amount: 0,
  period: 'monthly',
  createdAt: Date.now(),
};

export const CURRENT_VERSION = '1.8.0';

// 硬编码默认汇率表（以 CNY 为基准）
// 1 CNY = X 外币
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 0.14,
  EUR: 0.13,
  GBP: 0.11,
  JPY: 21.5,
  KRW: 195.0,
  TWD: 4.5,
  HKD: 1.09,
  AUD: 0.22,
  CAD: 0.20,
  SGD: 0.19,
  THB: 4.8,
  MYR: 0.63,
};

// 汇率 API 列表（按优先级排序）
export const EXCHANGE_RATE_APIS = [
  {
    name: 'frankfurter (CNY base)',
    url: 'https://api.frankfurter.app/latest?from=CNY',
    parser: (data: any, _base: string) => {
      // { "amount": 1.0, "base": "CNY", "date": "2024-01-01", "rates": { "USD": 0.14, ... } }
      return data.rates || {};
    },
  },
  {
    name: 'frankfurter (USD base)',
    url: 'https://api.frankfurter.app/latest?from=USD',
    parser: (data: any, base: string) => {
      // 返回 USD 对其他币种的汇率，需要转换
      const rates: Record<string, number> = data.rates || {};
      const usdToBase = rates[base] || 7.1;
      const result: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== base) {
          result[currency] = (rate as number) / usdToBase;
        }
      }
      return result;
    },
  },
  {
    name: 'open.er-api (USD base)',
    url: 'https://open.er-api.com/v6/latest/USD',
    parser: (data: any, base: string) => {
      const rates: Record<string, number> = data.conversion_rates || {};
      const usdToBase = rates[base] || 7.1;
      const result: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== base) {
          result[currency] = (rate as number) / usdToBase;
        }
      }
      return result;
    },
  },
  {
    name: 'exchangerate-api (USD base)',
    url: 'https://api.exchangerate-api.com/v4/latest/USD',
    parser: (data: any, base: string) => {
      const rates: Record<string, number> = data.rates || {};
      const usdToBase = rates[base] || 7.1;
      const result: Record<string, number> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        if (currency !== base) {
          result[currency] = (rate as number) / usdToBase;
        }
      }
      return result;
    },
  },
  {
    name: 'currency-api (CNY base)',
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cny.json',
    parser: (data: any, _base: string) => {
      const baseKey = Object.keys(data).find(k => k !== 'date');
      if (baseKey) {
        const rates = data[baseKey];
        const result: Record<string, number> = {};
        for (const [currency, rate] of Object.entries(rates)) {
          result[currency.toUpperCase()] = rate as number;
        }
        return result;
      }
      return {};
    },
  },
];