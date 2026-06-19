import { useEffect, useMemo } from 'react';
import { Form, Input, Select, Modal } from 'antd';
import type { FinancialSource, FinancialSourceType, FinancialPeriod, InvestmentType, InterestType } from '../../../../types/record';
import { useLanguage } from '../../../providers';
import { CURRENCY_OPTIONS } from '../../../../domain/currency/constants';

const PERIOD_OPTIONS = [
  { value: 'daily' as FinancialPeriod, label: '每日' },
  { value: 'weekly' as FinancialPeriod, label: '每周' },
  { value: 'monthly' as FinancialPeriod, label: '每月' },
  { value: 'yearly' as FinancialPeriod, label: '每年' },
  { value: 'once' as FinancialPeriod, label: '一次性' },
];

const DAY_OF_MONTH_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}日`,
})).concat({ value: -1, label: '最后一天' });

const DAY_OF_WEEK_OPTIONS = [
  { value: 1, label: '周一' },
  { value: 2, label: '周二' },
  { value: 3, label: '周三' },
  { value: 4, label: '周四' },
  { value: 5, label: '周五' },
  { value: 6, label: '周六' },
  { value: 0, label: '周日' },
];

const INVESTMENT_TYPE_OPTIONS = [
  { value: 'once' as InvestmentType, label: '一次性投资' },
  { value: 'recurring' as InvestmentType, label: '定期投资' },
];

const INTEREST_TYPE_OPTIONS = [
  { value: 'equal-payment' as InterestType, label: '等额本息' },
  { value: 'equal-principal' as InterestType, label: '等额本金' },
  { value: 'interest-first' as InterestType, label: '先息后本' },
];

interface SourceFormProps {
  type: FinancialSourceType;
  source: FinancialSource | null;
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
}

export const SourceForm = ({ type, source, open, onCancel, onSubmit }: SourceFormProps) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const isEdit = !!source;

  useEffect(() => {
    if (open) {
      if (source) {
        form.setFieldsValue({
          name: source.name,
          currency: source.currency,
          amount: source.amount,
          period: source.period,
          dayOfMonth: source.dayOfMonth ?? (source.period === 'monthly' ? -1 : undefined),
          dayOfWeek: source.dayOfWeek ?? (source.period === 'weekly' ? 6 : undefined),
          investmentType: source.investmentType || 'once',
          expectedReturn: source.expectedReturn,
          principal: source.principal,
          interestRate: source.interestRate,
          interestType: source.interestType || 'equal-payment',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          period: 'monthly',
          currency: 'CNY',
          dayOfMonth: -1,
          dayOfWeek: 6,
        });
      }
    }
  }, [open, source, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch {
      // validation error
    }
  };

  const selectedPeriod = Form.useWatch('period', form) as FinancialPeriod | undefined;

  const typeLabel = type === 'income' ? t.financialConfig.income
    : type === 'expense' ? t.financialConfig.expense
      : type === 'investment' ? t.financialConfig.investment
        : t.financialConfig.loan;

  const title = isEdit
    ? (t.financialConfig as unknown as Record<string, string>)[`edit${typeLabel}`] || ''
    : (t.financialConfig as unknown as Record<string, string>)[`add${typeLabel}`] || '';

  const periodOptions = useMemo(() => PERIOD_OPTIONS.map(o => ({
    value: o.value,
    label: (t.financialConfig as unknown as Record<string, string>)[o.value] || o.label,
  })), [t.financialConfig]);

  const dayOfMonthOptions = useMemo(() => DAY_OF_MONTH_OPTIONS.map(o => ({
    value: o.value,
    label: o.value === -1 ? t.financialConfig.lastDayOfMonth : `${o.value}日`,
  })), [t]);

  const dayOfWeekOptions = useMemo(() => {
    const dayOfWeekLabels = (t.financialConfig as Record<string, unknown>)?.dayOfWeekLabels as Record<string, string> | undefined;
    return DAY_OF_WEEK_OPTIONS.map(o => ({
      value: o.value,
      label: dayOfWeekLabels?.[String(o.value)] || o.label,
    }));
  }, [t]);

  const investmentTypeOptions = useMemo(() => INVESTMENT_TYPE_OPTIONS.map(o => ({
    value: o.value,
    label: o.value === 'once'
      ? t.financialConfig.onceInvestment
      : t.financialConfig.recurringInvestment,
  })), [t]);

  const interestTypeOptions = useMemo(() => INTEREST_TYPE_OPTIONS.map(o => ({
    value: o.value,
    label: o.value === 'equal-payment'
      ? t.financialConfig.equalPayment
      : o.value === 'equal-principal'
        ? t.financialConfig.equalPrincipal
        : t.financialConfig.interestFirst,
  })), [t]);

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={isEdit ? t.financialConfig.confirm : t.financialConfig.add}
      cancelText={t.financialConfig.cancel}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label={t.financialConfig.name}
          name="name"
          rules={[{ required: true, message: t.financialConfig.nameRequired }]}
        >
          <Input placeholder={t.financialConfig.namePlaceholder} />
        </Form.Item>
        <Form.Item
          label={t.financialConfig.currency}
          name="currency"
          rules={[{ required: true }]}
        >
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>
        <Form.Item
          label={t.financialConfig.amount}
          name="amount"
          rules={[{ required: true, type: 'number', min: 0, message: t.financialConfig.amountRequired }]}
        >
          <Input type="number" placeholder={t.financialConfig.amountPlaceholder} min={0} step="0.01" />
        </Form.Item>
        <Form.Item
          label={t.financialConfig.period}
          name="period"
          rules={[{ required: true }]}
        >
          <Select options={periodOptions} />
        </Form.Item>
        {selectedPeriod === 'monthly' && (
          <Form.Item
            label={t.financialConfig.dayOfMonth}
            name="dayOfMonth"
            rules={[{ required: true, message: t.financialConfig.selectDayOfMonth }]}
          >
            <Select options={dayOfMonthOptions} placeholder={t.financialConfig.selectDayOfMonth} />
          </Form.Item>
        )}
        {selectedPeriod === 'weekly' && (
          <Form.Item
            label={t.financialConfig.dayOfWeek}
            name="dayOfWeek"
            rules={[{ required: true, message: t.financialConfig.selectDayOfWeek }]}
          >
            <Select options={dayOfWeekOptions} placeholder={t.financialConfig.selectDayOfWeek} />
          </Form.Item>
        )}
        {type === 'investment' && (
          <>
            <Form.Item label={t.financialConfig.investmentType} name="investmentType">
              <Select options={investmentTypeOptions} />
            </Form.Item>
            <Form.Item
              label={t.financialConfig.expectedReturn}
              name="expectedReturn"
            >
              <Input type="number" placeholder={t.financialConfig.expectedReturnPlaceholder} min={0} step="0.01" />
            </Form.Item>
          </>
        )}
        {type === 'loan' && (
          <>
            <Form.Item
              label={t.financialConfig.principal}
              name="principal"
              rules={[{ required: true, type: 'number', min: 0, message: t.financialConfig.principalRequired }]}
            >
              <Input type="number" placeholder={t.financialConfig.principalPlaceholder} min={0} step="0.01" />
            </Form.Item>
            <Form.Item
              label={t.financialConfig.interestRate}
              name="interestRate"
              rules={[{ required: true, type: 'number', min: 0, message: t.financialConfig.interestRateRequired }]}
            >
              <Input type="number" placeholder={t.financialConfig.interestRatePlaceholder} min={0} step="0.01" />
            </Form.Item>
            <Form.Item label={t.financialConfig.interestType} name="interestType">
              <Select options={interestTypeOptions} />
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};
