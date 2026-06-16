export interface ExpenseRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  note: string;
  category: string;
  date: string;
  currency: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export interface Account {
  id: string;
  name: string;
  currency: string;
  balance: number;
  createdAt: number;
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

export interface DataSchema {
  version: string;
  records: ExpenseRecord[];
  categories: Category[];
  accounts: Account[];
  incomeRules: IncomeRule[];
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
  balance: 0,
  createdAt: Date.now(),
};

export const DEFAULT_INCOME_RULE: IncomeRule = {
  id: 'default-income-rule',
  name: '工资',
  currency: 'CNY',
  amount: 0,
  period: 'monthly',
  createdAt: Date.now(),
};

export const CURRENT_VERSION = '1.2.0';