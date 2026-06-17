import { useState } from 'react';
import { Form, Input, Select, Button, Card, message, Typography } from 'antd';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { generateEntries } from '../lib/record';
import type { ExpenseRecord } from '../types/record';

const { Title } = Typography;

const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

// 交易类型配置
const TRANSACTION_TYPES = [
  { value: 'income', label: '收入', color: '#22c55e' },
  { value: 'expense', label: '支出', color: '#ef4444' },
  { value: 'investment', label: '投资', color: '#3b82f6' },
  { value: 'investment-mature', label: '投资到期', color: '#a855f7' },
  { value: 'loan-receive', label: '贷款到账', color: '#f97316' },
  { value: 'loan-repay', label: '还贷', color: '#eab308' },
] as const;

export const AddRecord = () => {
  const { t } = useLanguage();
  const { addRecord, incomeCategories, expenseCategories } = useRecords();
  const [form] = Form.useForm();
  const [type, setType] = useState<ExpenseRecord['type']>('expense');
  const [saved, setSaved] = useState(false);

  // 判断是否需要本金/利息输入
  const needsPrincipalInterest = type === 'investment-mature' || type === 'loan-repay';

  // 根据类型获取分类列表
  const categories = type === 'income' || type === 'investment-mature'
    ? incomeCategories.map(c => c.name)
    : expenseCategories.map(c => c.name);

  const handleSubmit = (values: any) => {
    const { amount, principal, interest, category, note, date, currency } = values;

    // 验证逻辑
    if (needsPrincipalInterest) {
      if (!principal || principal <= 0 || !interest || interest <= 0 || !category) {
        return;
      }
    } else {
      if (!amount || amount <= 0 || !category) {
        return;
      }
    }

    // 计算总金额
    const totalAmount = needsPrincipalInterest
      ? parseFloat(principal) + parseFloat(interest)
      : parseFloat(amount);

    // 生成分录
    const entries = needsPrincipalInterest
      ? generateEntries(type, totalAmount, parseFloat(principal), parseFloat(interest))
      : generateEntries(type, totalAmount);

    addRecord({
      type,
      amount: totalAmount,
      category,
      note: note || '',
      date,
      currency,
      entries,
    });

    // 重置表单
    form.resetFields();
    form.setFieldsValue({ date: new Date().toISOString().split('T')[0], currency: 'CNY' });
    setSaved(true);

    message.success(t.addRecord.saved || '保存成功');

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  const getCurrencySymbol = (currency: string) => {
    return CURRENCY_SYMBOLS[currency] || '¥';
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>{t.addRecord.title}</Title>

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
          {/* 交易类型选择 */}
          <Form.Item label={t.addRecord.type}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {TRANSACTION_TYPES.map((typeOption) => (
                <Button
                  key={typeOption.value}
                  type={type === typeOption.value ? 'primary' : 'default'}
                  style={{
                    borderColor: type === typeOption.value ? typeOption.color : undefined,
                    backgroundColor: type === typeOption.value ? typeOption.color : undefined,
                    color: type === typeOption.value ? '#fff' : undefined,
                  }}
                  onClick={() => {
                    setType(typeOption.value as ExpenseRecord['type']);
                    form.setFieldValue('category', undefined);
                    form.setFieldValue('amount', undefined);
                    form.setFieldValue('principal', undefined);
                    form.setFieldValue('interest', undefined);
                  }}
                >
                  {typeOption.label}
                </Button>
              ))}
            </div>
          </Form.Item>

          {/* 币种选择 */}
          <Form.Item label={t.addRecord.currency} name="currency">
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>

          {/* 金额输入 */}
          {needsPrincipalInterest ? (
            <>
              <Form.Item
                label="本金"
                name="principal"
                rules={[{ required: true, message: '请输入本金' }]}
              >
                <Input
                  type="number"
                  prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')}
                  placeholder="0.00"
                />
              </Form.Item>
              <Form.Item
                label="利息"
                name="interest"
                rules={[{ required: true, message: '请输入利息' }]}
              >
                <Input
                  type="number"
                  prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')}
                  placeholder="0.00"
                />
              </Form.Item>
            </>
          ) : (
            <Form.Item
              label={t.addRecord.amount}
              name="amount"
              rules={[{ required: true, message: '请输入金额' }]}
            >
              <Input
                type="number"
                prefix={getCurrencySymbol(form.getFieldValue('currency') || 'CNY')}
                placeholder="0.00"
              />
            </Form.Item>
          )}

          {/* 分类选择 */}
          <Form.Item
            label={t.addRecord.category}
            name="category"
            rules={[{ required: true, message: t.addRecord.selectCategory }]}
          >
            <Select
              placeholder={t.addRecord.selectCategory}
              options={categories.map(cat => ({ label: cat, value: cat }))}
            />
          </Form.Item>

          {/* 日期选择 */}
          <Form.Item
            label={t.addRecord.date}
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <input
              type="date"
              className="ant-input"
              style={{ width: '100%', padding: '8px 11px', borderRadius: 6 }}
            />
          </Form.Item>

          {/* 备注 */}
          <Form.Item label={t.addRecord.note} name="note">
            <Input.TextArea
              placeholder={t.addRecord.notePlaceholder}
              rows={3}
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={saved ? <CheckCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              style={{
                width: '100%',
                backgroundColor: saved ? '#22c55e' : undefined,
                borderColor: saved ? '#22c55e' : undefined,
              }}
              disabled={saved}
            >
              {saved ? (t.addRecord.saved || '已保存') : (t.addRecord.addRecord || '添加记录')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
