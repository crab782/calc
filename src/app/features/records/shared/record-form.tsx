import { Form, Input, Select, Button, Card, message } from 'antd';
import { useState, useMemo } from 'react';
import type { ExpenseRecord, Category } from '../../../../types/record';
import { CURRENCY_OPTIONS, CURRENCY_SYMBOLS } from '../../../../domain/currency/constants';
import { generateEntries } from '../../../../data/service';

interface RecordFormProps {
  incomeCategories: Category[];
  expenseCategories: Category[];
  onSubmit: (data: {
    type: ExpenseRecord['type'];
    amount: number;
    category: string;
    note: string;
    date: string;
    currency: string;
    entries: ExpenseRecord['entries'];
  }) => void;
}

const TRANSACTION_TYPES = [
  { value: 'income', label: '收入', color: '#22c55e' },
  { value: 'expense', label: '支出', color: '#ef4444' },
  { value: 'investment', label: '投资', color: '#3b82f6' },
  { value: 'investment-mature', label: '投资到期', color: '#a855f7' },
  { value: 'loan-receive', label: '贷款到账', color: '#f97316' },
  { value: 'loan-repay', label: '还贷', color: '#eab308' },
] as const;

export function RecordForm({ incomeCategories, expenseCategories, onSubmit }: RecordFormProps) {
  const [form] = Form.useForm();
  const [type, setType] = useState<ExpenseRecord['type']>('expense');
  const [saved, setSaved] = useState(false);

  const needsPrincipalInterest = type === 'investment-mature' || type === 'loan-repay';

  const categories = useMemo(() => {
    const cats = type === 'income' || type === 'investment-mature'
      ? incomeCategories
      : expenseCategories;
    return cats.map(c => c.name);
  }, [type, incomeCategories, expenseCategories]);

  const handleSubmit = (values: any) => {
    const { amount, principal, interest, category, note, date, currency } = values;

    if (needsPrincipalInterest) {
      if (!principal || principal <= 0 || !interest || interest <= 0 || !category) return;
    } else {
      if (!amount || amount <= 0 || !category) return;
    }

    const totalAmount = needsPrincipalInterest
      ? parseFloat(principal) + parseFloat(interest)
      : parseFloat(amount);

    const entries = needsPrincipalInterest
      ? generateEntries(type, totalAmount, parseFloat(principal), parseFloat(interest))
      : generateEntries(type, totalAmount);

    onSubmit({
      type,
      amount: totalAmount,
      category,
      note: note || '',
      date,
      currency,
      entries,
    });

    form.resetFields();
    form.setFieldsValue({ date: new Date().toISOString().split('T')[0], currency: 'CNY' });
    setSaved(true);
    message.success('保存成功');
    setTimeout(() => setSaved(false), 2000);
  };

  const getCurrencySymbol = (currency: string) => CURRENCY_SYMBOLS[currency] || '¥';

  return (
    <Card style={{ maxWidth: 640, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: new Date().toISOString().split('T')[0],
          currency: 'CNY',
        }}
      >
        <Form.Item label="类型">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {TRANSACTION_TYPES.map((opt) => (
              <Button
                key={opt.value}
                type={type === opt.value ? 'primary' : 'default'}
                style={{
                  borderColor: type === opt.value ? opt.color : undefined,
                  backgroundColor: type === opt.value ? opt.color : undefined,
                  color: type === opt.value ? '#fff' : undefined,
                }}
                onClick={() => {
                  setType(opt.value as ExpenseRecord['type']);
                  form.setFieldValue('category', undefined);
                  form.setFieldValue('amount', undefined);
                  form.setFieldValue('principal', undefined);
                  form.setFieldValue('interest', undefined);
                }}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </Form.Item>

        <Form.Item label="币种" name="currency">
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>

        {needsPrincipalInterest ? (
          <>
            <Form.Item label="本金" name="principal" rules={[{ required: true, message: '请输入本金' }]}>
              <Input type="number" prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')} placeholder="0.00" />
            </Form.Item>
            <Form.Item label="利息" name="interest" rules={[{ required: true, message: '请输入利息' }]}>
              <Input type="number" prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')} placeholder="0.00" />
            </Form.Item>
          </>
        ) : (
          <Form.Item label="金额" name="amount" rules={[{ required: true, message: '请输入金额' }]}>
            <Input type="number" prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')} placeholder="0.00" />
          </Form.Item>
        )}

        <Form.Item label="分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
          <Select placeholder="请选择分类" options={categories.map(cat => ({ label: cat, value: cat }))} />
        </Form.Item>

        <Form.Item label="日期" name="date" rules={[{ required: true, message: '请选择日期' }]}>
          <input type="date" className="ant-input" style={{ width: '100%', padding: '8px 11px', borderRadius: 6 }} />
        </Form.Item>

        <Form.Item label="备注" name="note">
          <Input.TextArea placeholder="添加备注（可选）" rows={3} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{
              width: '100%',
              backgroundColor: saved ? '#22c55e' : undefined,
              borderColor: saved ? '#22c55e' : undefined,
            }}
            disabled={saved}
          >
            {saved ? '已保存' : '添加记录'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
