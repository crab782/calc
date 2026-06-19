import { useMemo } from 'react';
import { Wallet, Pencil, Delete } from 'lucide-react';
import { Button, Table, Tag, Space, Popconfirm, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Account } from '../../../../types/record';
import { useLanguage } from '../../../providers';
import { CURRENCY_SYMBOLS } from '../../../../domain/currency/constants';

const { Text } = Typography;

const TYPE_COLOR_MAP: Record<string, string> = {
  cash: 'success',
  investment: 'processing',
  loan: 'warning',
};

interface AccountTableProps {
  accounts: Account[];
  balances: Record<string, number>;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
}

export const AccountTable = ({ accounts, balances, onEdit, onDelete }: AccountTableProps) => {
  const { t } = useLanguage();

  const columns = useMemo<TableColumnsType<Account>>(() => [
    {
      title: t.accounts.accountName,
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (_: unknown, record: Account) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Wallet style={{ fontSize: 16, color: '#1677ff', flexShrink: 0 }} />
          <Text strong>{record.name}</Text>
          {record.isDefault && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              {t.accounts.defaultAccountLabel}
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: t.accounts.type,
      dataIndex: 'accountType',
      key: 'accountType',
      width: 100,
      render: (_: unknown, record: Account) => (
        <Tag color={TYPE_COLOR_MAP[record.accountType] || 'default'}>
          {(t.accounts.accountType as Record<string, string>)?.[record.accountType] || record.accountType}
        </Tag>
      ),
    },
    {
      title: t.accounts.currency,
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
    },
    {
      title: t.accounts.balance,
      key: 'balance',
      width: 150,
      render: (_: unknown, record: Account) => {
        const bal = balances[record.id] ?? 0;
        return (
          <span style={{ color: bal >= 0 ? undefined : '#ff4d4f', fontWeight: 'bold' }}>
            {CURRENCY_SYMBOLS[record.currency] || ''}
            {bal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      title: t.accounts.action,
      key: 'action',
      width: 100,
      render: (_: unknown, record: Account) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Pencil style={{ fontSize: 14 }} />}
            onClick={() => onEdit(record)}
          />
          <Popconfirm
            title={t.accounts.deleteConfirm}
            description={t.accounts.deleteMessage}
            onConfirm={() => onDelete(record.id)}
            okText={t.accounts.confirm}
            cancelText={t.accounts.cancel}
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<Delete style={{ fontSize: 14 }} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [balances, t, onEdit, onDelete]);

  return (
    <Table
      columns={columns}
      dataSource={accounts}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );
};
