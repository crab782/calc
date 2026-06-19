import type { Account } from '../../types/record';
import type { SchemaManager } from './schema';

export class AccountStore {
  schema: SchemaManager;
  constructor(schema: SchemaManager) {
    this.schema = schema;
  }

  getAccounts(): Account[] {
    const schema = this.schema.getSchema();
    return [...schema.accounts];
  }

  saveAccounts(accounts: Account[]): void {
    const schema = this.schema.getSchema();
    schema.accounts = accounts;
    this.schema.saveSchema(schema);
  }

  addAccount(account: Account): void {
    const schema = this.schema.getSchema();
    schema.accounts.push(account);
    this.schema.saveSchema(schema);
  }

  deleteAccount(id: string): void {
    const schema = this.schema.getSchema();
    const account = schema.accounts.find(a => a.id === id);
    if (account) {
      account.visible = false;
      this.schema.saveSchema(schema);
    }
  }

  updateAccount(account: Account): void {
    const schema = this.schema.getSchema();
    const index = schema.accounts.findIndex((a) => a.id === account.id);
    if (index >= 0) {
      schema.accounts[index] = account;
      this.schema.saveSchema(schema);
    }
  }

  createCurrencyAccounts(currency: string): Account[] {
    const schema = this.schema.getSchema();
    const now = Date.now();

    const existingAccounts = schema.accounts.filter(a => a.currency === currency);
    if (existingAccounts.length > 0) {
      existingAccounts.forEach(a => {
        a.visible = true;
      });
      this.schema.saveSchema(schema);
      return existingAccounts;
    }

    const newAccounts: Account[] = [
      { id: `${currency}-cash`, name: '现金', currency, accountType: 'cash', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-investment`, name: '储存', currency, accountType: 'investment', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-loan`, name: '贷款', currency, accountType: 'loan', balance: 0, createdAt: now, isDefault: false, visible: true },
      { id: `${currency}-expense`, name: '支出', currency, accountType: 'expense', balance: 0, createdAt: now, isDefault: false, visible: false },
      { id: `${currency}-income`, name: '收入', currency, accountType: 'income', balance: 0, createdAt: now, isDefault: false, visible: false },
    ];

    schema.accounts.push(...newAccounts);
    this.schema.saveSchema(schema);
    return newAccounts;
  }

  getCurrencyBalance(currency: string): number {
    const schema = this.schema.getSchema();
    const currencyAccounts = schema.accounts.filter(a => a.currency === currency);

    if (currencyAccounts.length === 0) {
      return 0;
    }

    const balances: Record<string, number> = {};
    currencyAccounts.forEach(acc => {
      balances[acc.id] = 0;
    });

    schema.records.forEach(record => {
      record.entries?.forEach(entry => {
        if (balances[entry.accountId] !== undefined) {
          if (entry.direction === 'debit') {
            balances[entry.accountId] += entry.amount;
          } else {
            balances[entry.accountId] -= entry.amount;
          }
        }
      });
    });

    return currencyAccounts
      .filter(a => a.visible === true)
      .reduce((sum, acc) => sum + balances[acc.id], 0);
  }

  disableCurrency(currency: string): { success: boolean; message: string } {
    const schema = this.schema.getSchema();

    if (currency === 'CNY') {
      return { success: false, message: '无法禁用默认币种' };
    }

    const balance = this.getCurrencyBalance(currency);
    if (balance !== 0) {
      return { success: false, message: '该币种账户有余额，无法禁用' };
    }

    schema.accounts.forEach(a => {
      if (a.currency === currency) {
        a.visible = false;
      }
    });

    this.schema.saveSchema(schema);
    return { success: true, message: '币种已禁用' };
  }

  isCurrencyEnabled(currency: string): boolean {
    const schema = this.schema.getSchema();
    const currencyAccounts = schema.accounts.filter(a => a.currency === currency);
    return currencyAccounts.some(a => a.visible === true);
  }
}
