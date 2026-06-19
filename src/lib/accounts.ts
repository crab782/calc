import type { Account } from '../types/record';
import type { RecordDAO } from './storage/index';

const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  cash: '现金',
  investment: '投资',
  loan: '贷款',
};

export function getAccounts(dao: RecordDAO): Account[] {
  return dao.getAccounts();
}

export function generateAccountId(): string {
  return 'acc-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function addAccount(
  dao: RecordDAO,
  account: { currency: string; accountType: 'cash' | 'investment' | 'loan'; name?: string }
): { success: boolean; message: string; account?: Account } {
  const { currency, accountType, name: customName } = account;
  const id = generateAccountId();
  const name = customName || `${currency} ${ACCOUNT_TYPE_NAMES[accountType]}`;

  const newAccount: Account = {
    id,
    name,
    currency,
    accountType,
    balance: 0,
    createdAt: Date.now(),
    isDefault: false,
    visible: true,
  };
  dao.addAccount(newAccount);
  return { success: true, message: '账户创建成功', account: newAccount };
}

export function getAccountBalance(dao: RecordDAO, accountId: string): number {
  const records = dao.findAll();
  let balance = 0;
  records.forEach(record => {
    record.entries?.forEach(entry => {
      if (entry.accountId === accountId) {
        if (entry.direction === 'debit') {
          balance += entry.amount;
        } else {
          balance -= entry.amount;
        }
      }
    });
  });
  return balance;
}

export function deleteAccount(dao: RecordDAO, id: string): { success: boolean; message: string } {
  const accounts = dao.getAccounts();
  if (accounts.length <= 1) {
    return { success: false, message: '至少需要保留一个账户' };
  }

  const balance = getAccountBalance(dao, id);
  if (balance !== 0) {
    return { success: false, message: '账户有余额，无法删除' };
  }

  const account = accounts.find(a => a.id === id);
  if (account) {
    account.visible = false;
    dao.updateAccount(account);
  }
  return { success: true, message: '账户删除成功' };
}

export function updateAccount(dao: RecordDAO, account: Account): void {
  dao.updateAccount(account);
}

export function getOrCreateAccountByCurrency(dao: RecordDAO, currency: string): Account[] {
  return dao.createCurrencyAccounts(currency);
}

export function createCurrencyAccounts(dao: RecordDAO, currency: string): Account[] {
  return dao.createCurrencyAccounts(currency);
}

export function getCurrencyBalance(dao: RecordDAO, currency: string): number {
  return dao.getCurrencyBalance(currency);
}

export function disableCurrency(dao: RecordDAO, currency: string): { success: boolean; message: string } {
  return dao.disableCurrency(currency);
}

export function isCurrencyEnabled(dao: RecordDAO, currency: string): boolean {
  return dao.isCurrencyEnabled(currency);
}
