import type { ExpenseRecord, Entry } from '../types/record';

export function generateEntries(
  type: ExpenseRecord['type'],
  amount: number,
  principal?: number,
  interest?: number,
  currency: string = 'CNY'
): Entry[] {
  switch (type) {
    case 'income':
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount },
        { accountId: `${currency}-income`, accountName: '收入', direction: 'credit', amount },
      ];

    case 'expense':
      return [
        { accountId: `${currency}-expense`, accountName: '支出', direction: 'debit', amount },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount },
      ];

    case 'investment':
      return [
        { accountId: `${currency}-investment`, accountName: '投资', direction: 'debit', amount },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount },
      ];

    case 'investment-mature': {
      const invPrincipal = principal ?? 0;
      const invInterest = interest ?? 0;
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount: invPrincipal },
        { accountId: `${currency}-investment`, accountName: '投资', direction: 'credit', amount: invPrincipal },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount: invInterest },
        { accountId: `${currency}-income`, accountName: '收入', direction: 'credit', amount: invInterest },
      ];
    }

    case 'loan-receive':
      return [
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'debit', amount },
        { accountId: `${currency}-loan`, accountName: '贷款', direction: 'credit', amount },
      ];

    case 'loan-repay': {
      const loanPrincipal = principal ?? 0;
      const loanInterest = interest ?? 0;
      return [
        { accountId: `${currency}-loan`, accountName: '贷款', direction: 'debit', amount: loanPrincipal },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount: loanPrincipal },
        { accountId: `${currency}-expense`, accountName: '支出', direction: 'debit', amount: loanInterest },
        { accountId: `${currency}-cash`, accountName: '现金', direction: 'credit', amount: loanInterest },
      ];
    }

    default:
      return [];
  }
}
