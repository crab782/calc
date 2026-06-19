import { Card, Typography } from 'antd';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ExpenseRecord } from '../../../../../types/record';
import { RecordItem } from './record-item';

const { Text } = Typography;

const formatCurrency = (amount: number) => `¥${amount.toFixed(2)}`;

interface RecordGroupProps {
  month: string;
  records: ExpenseRecord[];
  totalIncome: number;
  totalExpense: number;
  onDelete: (id: string) => void;
}

export function RecordGroup({ month, records, totalIncome, totalExpense, onDelete }: RecordGroupProps) {
  const [year, monthNum] = month.split('-');
  const monthLabel = `${year}年${parseInt(monthNum)}月`;

  return (
    <Card
      bordered={false}
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{monthLabel}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <span>
              <TrendingUp className="w-4 h-4 inline-block mr-1" style={{ color: '#22c55e', verticalAlign: 'middle' }} />
              <Text type="secondary" style={{ marginRight: 4 }}>收入:</Text>
              <Text strong style={{ color: '#22c55e' }}>+{formatCurrency(totalIncome)}</Text>
            </span>
            <span>
              <TrendingDown className="w-4 h-4 inline-block mr-1" style={{ color: '#ef4444', verticalAlign: 'middle' }} />
              <Text type="secondary" style={{ marginRight: 4 }}>支出:</Text>
              <Text strong style={{ color: '#ef4444' }}>-{formatCurrency(totalExpense)}</Text>
            </span>
          </div>
        </div>
      }
    >
      {records.map((record) => (
        <RecordItem
          key={record.id}
          record={record}
          onDelete={onDelete}
        />
      ))}
    </Card>
  );
}
