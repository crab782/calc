export type AccountType = 'expense' | 'income' | 'investment' | 'loan' | 'credit';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
  visible: boolean;
  isDefault?: boolean;
  // 投资账户特有字段
  investmentType?: string;
  dayOfMonth?: number;
  principal?: number;
  interest?: number;
}
