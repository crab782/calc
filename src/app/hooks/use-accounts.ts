import { useState, useCallback } from 'react';
import type { Account, ExpenseRecord } from '../../types/record';
import { calculateAccountBalance } from '../../domain/account/balance';
import { recordService } from '../../data/service';

function initAccounts(): Account[] {
  return recordService.getAccounts();
}

export function useAccounts(records: ExpenseRecord[]) {
  const [accounts, setAccounts] = useState<Account[]>(initAccounts);
  const loading = false;

  const addAccount = useCallback((account: {
    currency: string;
    accountType: 'cash' | 'investment' | 'loan';
    name?: string;
  }) => {
    const result = recordService.addAccount(account);
    if (result.success) {
      setAccounts(recordService.getAccounts());
    }
    return result;
  }, []);

  const updateAccount = useCallback((account: Account) => {
    recordService.updateAccount(account);
    setAccounts(recordService.getAccounts());
  }, []);

  const deleteAccount = useCallback((id: string) => {
    const result = recordService.deleteAccount(id);
    if (result.success) {
      setAccounts(recordService.getAccounts());
    }
    return result;
  }, []);

  const getAccountBalance = useCallback((accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;
    return calculateAccountBalance(account, records);
  }, [accounts, records]);

  return { accounts, loading, addAccount, updateAccount, deleteAccount, getAccountBalance };
}
