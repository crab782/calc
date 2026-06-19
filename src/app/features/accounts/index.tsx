import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button, Collapse, Typography, message } from 'antd';
import { useAccounts } from '../../../app/hooks/use-accounts';
import { useRecords } from '../../../app/hooks/use-records';
import { useLanguage } from '../../providers';
import { AccountTable } from './components/account-table';
import { AccountForm, AccountEditModal } from './components/account-form';
import type { Account } from '../../../types/record';

const { Title, Text } = Typography;
const { Panel } = Collapse;

export const Accounts = () => {
  const { t } = useLanguage();
  const { records } = useRecords();
  const { accounts, addAccount, deleteAccount, updateAccount, getAccountBalance } = useAccounts(records);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  const visibleAccounts = useMemo(() => {
    return accounts.filter(
      acc => acc.visible === true && ['cash', 'investment', 'loan'].includes(acc.accountType),
    );
  }, [accounts]);

  const accountsByCurrency = useMemo(() => {
    const grouped: Record<string, Account[]> = {};
    visibleAccounts.forEach(acc => {
      if (!grouped[acc.currency]) grouped[acc.currency] = [];
      grouped[acc.currency].push(acc);
    });

    Object.keys(grouped).forEach(currency => {
      const sorted = [...grouped[currency]].sort((a, b) => {
        if (a.isDefault) return -1;
        if (b.isDefault) return 1;
        return 0;
      });
      grouped[currency] = sorted;
    });

    const sortedCurrencies = Object.keys(grouped).sort((a, b) => {
      if (a === 'CNY') return -1;
      if (b === 'CNY') return 1;
      return a.localeCompare(b);
    });

    return { currencies: sortedCurrencies, groups: grouped };
  }, [visibleAccounts]);

  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    visibleAccounts.forEach(acc => {
      map[acc.id] = getAccountBalance(acc.id);
    });
    return map;
  }, [visibleAccounts, getAccountBalance]);

  const handleAdd = useCallback((values: { name: string; currency: string; accountType: string }) => {
    const result = addAccount({
      currency: values.currency,
      accountType: values.accountType as 'cash' | 'investment' | 'loan',
      name: values.name,
    });
    if (result.success) {
      message.success(t.accounts.addSuccess);
      setShowAddModal(false);
    } else {
      message.error(result.error);
    }
  }, [addAccount, t]);

  const handleDelete = useCallback((id: string) => {
    const result = deleteAccount(id);
    if (result.success) {
      message.success(t.accounts.deleteSuccess);
    } else {
      message.error(result.error);
    }
  }, [deleteAccount, t]);

  const handleEdit = useCallback((account: Account) => {
    setEditAccount(account);
  }, []);

  const handleSaveEdit = useCallback((name: string, balance: number) => {
    if (!editAccount) return;
    updateAccount({ ...editAccount, name, balance });
    message.success(t.accounts.editSuccess);
    setEditAccount(null);
  }, [editAccount, updateAccount, t]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t.accounts.title}</Title>
        <Button
          type="primary"
          size="small"
          icon={<Plus style={{ fontSize: 14 }} />}
          onClick={() => setShowAddModal(true)}
        >
          {t.accounts.addAccount}
        </Button>
      </div>

      {visibleAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
          <Text>{t.accounts.noAccounts}</Text>
        </div>
      ) : (
        <Collapse
          defaultActiveKey={accountsByCurrency.currencies}
          style={{ background: '#fff' }}
        >
          {accountsByCurrency.currencies.map(currency => (
            <Panel
              key={currency}
              header={
                <span>
                  <Text strong>{currency === 'CNY' ? '本币账户' : `${currency} 账户`}</Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({accountsByCurrency.groups[currency].length})
                  </Text>
                </span>
              }
            >
              <AccountTable
                accounts={accountsByCurrency.groups[currency]}
                balances={balances}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </Panel>
          ))}
        </Collapse>
      )}

      <AccountForm
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        onSubmit={handleAdd}
      />

      <AccountEditModal
        account={editAccount}
        open={!!editAccount}
        onCancel={() => setEditAccount(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
