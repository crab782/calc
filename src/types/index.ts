export interface Record {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  note: string;
  category: string;
  date: string;
}

export interface Statistics {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export type PageType = 'dashboard' | 'add-record' | 'history' | 'settings';
