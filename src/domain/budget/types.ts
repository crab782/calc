export type BudgetProfileType = 'balance' | 'income' | 'expense';

export interface BudgetProfile {
  type: BudgetProfileType;
  name: string;
  icon: string;
}

export interface BudgetPlan {
  id: string;
  name: string;
  description: string;
  profileType: BudgetProfileType;
  enabled: boolean;
}

export interface BudgetResult {
  profileType: BudgetProfileType;
  data: number[];
  labels: string[];
  total: number;
  prediction?: number[];
}
