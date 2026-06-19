import { useState } from 'react';
import { Form, Input, Select, Modal, message } from 'antd';
import type { Account } from '../../../../types/record';
import { useLanguage } from '../../../providers';
import { CURRENCY_OPTIONS } from '../../../../domain/currency/constants';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'cash', label: '现金' },
  { value: 'investment', label: '投资' },
  { value: 'loan', label: '贷款' },
];

const ACCOUNT_TYPE_NAMES: Record<string, string> = {
  cash: '现金',
  investment: '投资',
  loan: '贷款',
};

interface AccountFormProps {
  account?: Account | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: { name: string; currency: string; accountType: string }) => void;
}

export const AccountForm = ({ account, open, onCancel, onSubmit }: AccountFormProps) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const isEdit = !!account;

  const selectedCurrency = Form.useWatch('currency', form) as string | undefined;
  const selectedType = Form.useWatch('accountType', form) as string | undefined;

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        name: values.name?.trim() || `${values.currency} ${ACCOUNT_TYPE_NAMES[values.accountType]}`,
        currency: values.currency,
        accountType: values.accountType,
      });
    } catch {
      // validation error
    }
  };

  const handleOpenChange = (visible: boolean) => {
    if (visible) {
      if (account) {
        form.setFieldsValue({
          name: account.name,
          currency: account.currency,
          accountType: account.accountType,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ currency: 'CNY', accountType: 'cash' });
      }
    }
    if (!visible) {
      onCancel();
    }
  };

  const title = isEdit ? t.accounts.editAccount : t.accounts.addAccount;

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? t.accounts.confirm : t.accounts.addAccount}
      cancelText={t.accounts.cancel}
      destroyOnClose
      afterOpenChange={handleOpenChange}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label={t.accounts.accountName} name="name">
          <Input placeholder={`${selectedCurrency || 'CNY'} ${ACCOUNT_TYPE_NAMES[selectedType || 'cash']}`} />
        </Form.Item>
        <Form.Item label={t.accounts.currency} name="currency" initialValue="CNY">
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>
        <Form.Item label={t.accounts.type} name="accountType" initialValue="cash">
          <Select options={ACCOUNT_TYPE_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export const AccountEditModal = ({
  account,
  open,
  onCancel,
  onSave,
}: {
  account: Account | null;
  open: boolean;
  onCancel: () => void;
  onSave: (name: string, balance: number) => void;
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(account?.name ?? '');
  const [balance, setBalance] = useState(account?.balance?.toString() ?? '');

  const handleSave = () => {
    if (!name.trim() || !account) return;
    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      message.error(t.accounts.invalidBalance);
      return;
    }
    onSave(name.trim(), parsedBalance);
  };

  const handleOpenChange = (visible: boolean) => {
    if (visible && account) {
      setName(account.name);
      setBalance(account.balance.toString());
    }
    if (!visible) {
      onCancel();
    }
  };

  return (
    <Modal
      title={t.accounts.editAccount}
      open={open}
      onCancel={onCancel}
      onOk={handleSave}
      okText={t.accounts.confirm}
      cancelText={t.accounts.cancel}
      okButtonProps={{ disabled: !name.trim() }}
      destroyOnClose
      afterOpenChange={handleOpenChange}
    >
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            {t.accounts.editAccountName}
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.accounts.editAccountNamePlaceholder}
            autoFocus
            onPressEnter={handleSave}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            {t.accounts.editAccountBalance}
          </label>
          <Input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder={t.accounts.editAccountBalancePlaceholder}
            onPressEnter={handleSave}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            {t.accounts.currency}
          </label>
          <span style={{ color: '#999' }}>{account?.currency}</span>
        </div>
      </div>
    </Modal>
  );
};
