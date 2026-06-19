export type SourceType = 'income' | 'expense' | 'investment' | 'loan';
export type CycleType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface BaseFinancialSource {
  id: string;
  name: string;
  type: SourceType;
  currency: string;
  cycle: CycleType;
  amount: number;
  enabled: boolean;
  dayOfMonth?: number;  // monthly/yearly 使用
  dayOfWeek?: WeekDay;  // weekly/biweekly 使用
}

export interface InvestmentSource extends BaseFinancialSource {
  type: 'investment';
  investmentType: string;
  principal: number;
  interest: number;
}

export interface LoanSource extends BaseFinancialSource {
  type: 'loan';
  loanType: 'receive' | 'repay';
  principal: number;
  interest: number;
}

export type FinancialSource = BaseFinancialSource | InvestmentSource | LoanSource;
