import { Typography } from 'antd';
import { useLanguage } from '../../../../app/providers';
import { useRecords, useCategories } from '../../../../app/hooks';
import { RecordForm } from '../shared/record-form';
import type { Entry } from '../../../../types/record';

const { Title } = Typography;

export function AddRecordPage() {
  const { t } = useLanguage();
  const { addRecord } = useRecords();
  const { incomeCategories, expenseCategories } = useCategories();

  const handleSubmit = (data: {
    type: 'income' | 'expense' | 'investment' | 'investment-mature' | 'loan-receive' | 'loan-repay';
    amount: number;
    category: string;
    note: string;
    date: string;
    currency: string;
    entries?: Entry[];
  }) => {
    addRecord({
      type: data.type,
      amount: data.amount,
      category: data.category,
      note: data.note,
      date: data.date,
      currency: data.currency,
      entries: data.entries,
    });
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        {t.addRecord.title}
      </Title>
      <RecordForm
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
