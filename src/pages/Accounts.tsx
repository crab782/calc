import { useState, useMemo } from 'react';
import { Wallet, Plus, Pencil } from 'lucide-react';
import { Card, Button, Modal, Form, Input, Select, Typography, Popconfirm, message } from 'antd';
import { useRecords } from '../hooks/useRecords';
import { useLanguage } from '../contexts/LanguageContext';
import type { Account, AccountType } from '../types/record';

const { Title, Text } = Typography;

// 账户类型选项（用于新建账户）
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: '现金' },
  { value: 'investment', label: '投资' },
  { value: 'loan', label: '贷款' },
];

// 账户类型名称映射
const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  cash: '现金',
  investment: '投资',
  loan: '贷款',
};

// 账户类型配置
const ACCOUNT_TYPE_CONFIG: Record<AccountType, { label: string; color: string }> = {
  cash: { label: '现金', color: 'success' },
  investment: { label: '投资', color: 'processing' },
  loan: { label: '贷款', color: 'warning' },
  income: { label: '收入', color: 'default' },
  expense: { label: '支出', color: 'error' },
};

// 币种选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

// 币种符号映射
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

// AccountCard 子组件
const AccountCard = ({
  account,
  balance,
  formatBalance,
  handleOpenEdit,
  handleDeleteAccount,
}: {
  account: Account;
  balance: number;
  formatBalance: (balance: number, currency: string) => string;
  handleOpenEdit: (account: Account) => void;
  handleDeleteAccount: (id: string) => void;
}) => {
  const accountConfig = ACCOUNT_TYPE_CONFIG[account.accountType];

  return (
    <Card
      hoverable
      style={{ borderRadius: 8 }}
      title={
        <span>
          <Wallet style={{ fontSize: 20, color: '#1677ff', marginRight: 8 }} />
          <Text strong>{account.name}</Text>
          <span style={{ marginLeft: 8 }}>
            <span style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              background: accountConfig?.color === 'success' ? '#f6ffed' : accountConfig?.color === 'processing' ? '#e6f4ff' : accountConfig?.color === 'warning' ? '#fffbe6' : accountConfig?.color === 'error' ? '#fff2f0' : '#fafafa',
              color: accountConfig?.color === 'success' ? '#52c41a' : accountConfig?.color === 'processing' ? '#1677ff' : accountConfig?.color === 'warning' ? '#faad14' : accountConfig?.color === 'error' ? '#ff4d4f' : '#666',
              border: `1px solid ${accountConfig?.color === 'success' ? '#b7eb8f' : accountConfig?.color === 'processing' ? '#91caff' : accountConfig?.color === 'warning' ? '#ffe58f' : accountConfig?.color === 'error' ? '#ffccc7' : '#d9d9d9'}`,
            }}>
              {accountConfig?.label || account.accountType}
            </span>
          </span>
        </span>
      }
      extra={
        <span>
          <Button
            type="text"
            size="small"
            icon={<Pencil style={{ fontSize: 14 }} />}
            onClick={() => handleOpenEdit(account)}
          />
          <Popconfirm
            title="删除账户"
            description="确定要删除此账户吗？"
            onConfirm={() => handleDeleteAccount(account.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<span style={{ fontSize: 14 }}></span>} style={{ marginLeft: 4 }} />
          </Popconfirm>
        </span>
      }
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
        {account.currency}
      </Text>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: balance >= 0 ? undefined : '#ff4d4f',
          display: 'block',
        }}
      >
        {formatBalance(balance, account.currency)}
      </Text>
    </Card>
  );
};

export const Accounts = () => {
  const { t } = useLanguage();
  const {
    accounts,
    records,
    addAccount,
    deleteAccount,
    updateAccount,
  } = useRecords();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [newAccountCurrency, setNewAccountCurrency] = useState('CNY');
  const [newAccountType, setNewAccountType] = useState<'cash' | 'investment' | 'loan'>('cash');
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [form] = Form.useForm();

  // 账户列表排序
  const visibleAccounts = useMemo(() => {
    return accounts.filter(acc =>
      acc.visible === true &&
      ['cash', 'investment', 'loan'].includes(acc.accountType)
    );
  }, [accounts]);

  // 按币种分组
  const accountsByCurrency = useMemo(() => {
    const grouped: Record<string, typeof visibleAccounts> = {};
    visibleAccounts.forEach(acc => {
      if (!grouped[acc.currency]) {
        grouped[acc.currency] = [];
      }
      grouped[acc.currency].push(acc);
    });

    Object.keys(grouped).forEach(currency => {
      const defaultAccount = grouped[currency].find(acc => acc.isDefault);
      const otherAccounts = grouped[currency].filter(acc => !acc.isDefault);
      grouped[currency] = [
        ...(defaultAccount ? [defaultAccount] : []),
        ...otherAccounts,
      ];
    });

    const sortedCurrencies = Object.keys(grouped).sort((a, b) => {
      if (a === 'CNY') return -1;
      if (b === 'CNY') return 1;
      return a.localeCompare(b);
    });

    return {
      currencies: sortedCurrencies,
      groups: grouped,
    };
  }, [visibleAccounts]);

  // 计算每个账户结余
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(acc => { balances[acc.id] = 0; });
    records.forEach(record => {
      record.entries?.forEach(entry => {
        if (!balances[entry.accountId]) balances[entry.accountId] = 0;
        if (entry.direction === 'debit') {
          balances[entry.accountId] += entry.amount;
        } else {
          balances[entry.accountId] -= entry.amount;
        }
      });
    });
    return balances;
  }, [accounts, records]);

  // 格式化余额显示
  const formatBalance = (balance: number, currency: string) => {
    const formatter = new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${CURRENCY_SYMBOLS[currency] || ''}${formatter.format(balance)}`;
  };

  // 添加账户
  const handleAddAccount = async () => {
    try {
      const values = await form.validateFields();
      const result = addAccount({
        currency: values.currency,
        accountType: values.accountType,
        name: values.name?.trim() || `${values.currency} ${ACCOUNT_TYPE_NAMES[values.accountType]}`,
      });
      if (result.success) {
        message.success(t.accounts.addSuccess);
        form.resetFields();
        setShowAddModal(false);
      } else {
        message.error(result.message);
      }
    } catch {
      // validation error
    }
  };

  // 删除账户
  const handleDeleteAccount = (id: string) => {
    const result = deleteAccount(id);
    if (result.success) {
      message.success(t.accounts.deleteSuccess);
    } else {
      message.error(result.message);
    }
  };

  // 打开编辑弹窗
  const handleOpenEdit = (account: Account) => {
    setEditName(account.name);
    setEditBalance(account.balance.toString());
    setShowEditModal(account.id);
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editName.trim() || !showEditModal) return;

    const account = accounts.find(a => a.id === showEditModal);
    if (!account) return;

    const balance = parseFloat(editBalance);
    if (isNaN(balance)) {
      message.error(t.accounts.invalidBalance);
      return;
    }

    updateAccount({ ...account, name: editName.trim(), balance });
    message.success(t.accounts.editSuccess);
    setShowEditModal(null);
  };

  const editingAccount = accounts.find(a => a.id === showEditModal);

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题和添加按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{t.accounts.title}</Title>
        <Button type="primary" icon={<Plus style={{ fontSize: 14 }} />} onClick={() => setShowAddModal(true)}>
          {t.accounts.addAccount}
        </Button>
      </div>

      {/* 账户列表 */}
      {visibleAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
          <Text>暂无账户</Text>
        </div>
      ) : (
        <div>
          {accountsByCurrency.currencies.map((currency) => (
            <div key={currency} style={{ marginBottom: 24 }}>
              <Text type="secondary" style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>
                {currency === 'CNY' ? '本币账户' : `${currency} 账户`}
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {accountsByCurrency.groups[currency].map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    balance={accountBalances[account.id] ?? 0}
                    formatBalance={formatBalance}
                    handleOpenEdit={handleOpenEdit}
                    handleDeleteAccount={handleDeleteAccount}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 添加账户弹窗 */}
      <Modal
        title={t.accounts.addAccount}
        open={showAddModal}
        onCancel={() => { setShowAddModal(false); form.resetFields(); }}
        onOk={handleAddAccount}
        okText={t.accounts.confirm}
        cancelText={t.accounts.cancel}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="账户名称" name="name">
            <Input placeholder={`例如：${newAccountCurrency} ${ACCOUNT_TYPE_NAMES[newAccountType]}`} />
          </Form.Item>
          <Form.Item label="币种" name="currency" initialValue="CNY">
            <Select
              options={CURRENCY_OPTIONS}
              onChange={(value) => setNewAccountCurrency(value)}
            />
          </Form.Item>
          <Form.Item label="账户类型" name="accountType" initialValue="cash">
            <Select
              options={ACCOUNT_TYPE_OPTIONS}
              onChange={(value) => setNewAccountType(value)}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑账户弹窗 */}
      <Modal
        title={t.accounts.editAccount}
        open={!!showEditModal}
        onCancel={() => setShowEditModal(null)}
        onOk={handleSaveEdit}
        okText={t.accounts.confirm}
        cancelText={t.accounts.cancel}
        okButtonProps={{ disabled: !editName.trim() }}
      >
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.accounts.editAccountName}</Text>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t.accounts.editAccountNamePlaceholder}
              autoFocus
              onPressEnter={handleSaveEdit}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.accounts.editAccountBalance}</Text>
            <Input
              type="number"
              value={editBalance}
              onChange={(e) => setEditBalance(e.target.value)}
              placeholder={t.accounts.editAccountBalancePlaceholder}
              onPressEnter={handleSaveEdit}
            />
          </div>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 4 }}>{t.accounts.currency}</Text>
            <Text type="secondary">{editingAccount?.currency}</Text>
          </div>
        </div>
      </Modal>
    </div>
  );
};
