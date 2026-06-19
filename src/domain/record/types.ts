export type RecordType = 'income' | 'expense' | 'transfer' | 'investment' | 'loan-receive' | 'loan-repay';

export interface Entry {
  accountId: string;
  amount: number;
  role: 'source' | 'target';
}

export interface ExpenseRecord {
  id: string;
  type: RecordType;
  amount: number;
  note: string;
  category: string;
  date: string;
  currency: string;
  accountId: string;
  entries: Entry[];
  createdAt: number;
  // 投资/贷款相关字段
  investmentType?: string;
  principal?: number;
  interest?: number;
  financialSourceId?: string;
}
