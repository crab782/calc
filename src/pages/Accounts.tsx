import { useState, useMemo } from 'react';
import { Wallet, Plus, Pencil, Delete } from 'lucide-react';
import { Button, Modal, Form, Input, Select, Typography, Popconfirm, message, Collapse, Table, Space, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useRecords } from '../hooks/useRecords';
import { useLanguage } from '../contexts/LanguageContext';
import type { Account } from '../types/record';

const { Title, Text } = Typography;
const { Panel } = Collapse;

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

  // Table 列定义
  const getColumns = (): TableColumnsType<Account> => {
    const typeColorMap: Record<string, string> = {
      cash: 'success',
      investment: 'processing',
      loan: 'warning',
    };

    return [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (_: any, record: Account) => (
          <span>
            <Wallet style={{ fontSize: 16, color: '#1677ff', marginRight: 6, verticalAlign: 'middle' }} />
            <Text strong>{record.name}</Text>
            {record.isDefault && (
              <Tag color="blue" style={{ marginLeft: 8, fontSize: 11 }}>
                {t.accounts.defaultAccountLabel}
              </Tag>
            )}
          </span>
        ),
      },
      {
        title: '类型',
        dataIndex: 'accountType',
        key: 'accountType',
        width: 100,
        render: (_: any, record: Account) => (
          <Tag color={typeColorMap[record.accountType] || 'default'}>
            {ACCOUNT_TYPE_NAMES[record.accountType] || record.accountType}
          </Tag>
        ),
      },
      {
        title: '币种',
        dataIndex: 'currency',
        key: 'currency',
        width: 80,
      },
      {
        title: '余额',
        key: 'balance',
        width: 150,
        render: (_: any, record: Account) => {
          const bal = accountBalances[record.id] ?? 0;
          return (
            <span style={{ color: bal >= 0 ? undefined : '#ff4d4f', fontWeight: 'bold' }}>
              {CURRENCY_SYMBOLS[record.currency] || ''}{bal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
            </span>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_: any, record: Account) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<Pencil style={{ fontSize: 14 }} />}
              onClick={() => handleOpenEdit(record)}
            />
            <Popconfirm
              title={t.accounts.deleteConfirm}
              description={t.accounts.deleteMessage}
              onConfirm={() => handleDeleteAccount(record.id)}
              okText={t.accounts.confirm}
              cancelText={t.accounts.cancel}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<Delete style={{ fontSize: 14 }} />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];
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
          <Text>{t.accounts.noAccounts}</Text>
        </div>
      ) : (
        <Collapse
          defaultActiveKey={accountsByCurrency.currencies}
          style={{ background: '#fff' }}
        >
          {accountsByCurrency.currencies.map((currency) => (
            <Panel
              key={currency}
              header={
                <span>
                  <Text strong>
                    {currency === 'CNY' ? '本币账户' : `${currency} 账户`}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    ({accountsByCurrency.groups[currency].length})
                  </Text>
                </span>
              }
            >
              <Table
                columns={getColumns()}
                dataSource={accountsByCurrency.groups[currency]}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Panel>
          ))}
        </Collapse>
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
