import { Button, Card, Popconfirm, Space, Tag, Typography } from 'antd';
import { Trash2 } from 'lucide-react';
import type { ExpenseRecord } from '../../../../../types/record';

const { Text } = Typography;

interface RecordItemProps {
  record: ExpenseRecord;
  onDelete: (id: string) => void;
}

export function RecordItem({ record, onDelete }: RecordItemProps) {
  const typeLabel = record.type === 'income' ? '收入' : '支出';
  const typeColor = record.type === 'income' ? 'green' : 'red';
  const amountColor = record.type === 'income' ? '#22c55e' : '#ef4444';
  const amountPrefix = record.type === 'income' ? '+' : '-';

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space direction="vertical" size={0}>
          <Space>
            <Tag color={typeColor}>{typeLabel}</Tag>
            <Text strong>{record.category}</Text>
          </Space>
          {record.note && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.note}</Text>
          )}
          <Text type="secondary" style={{ fontSize: 12 }}>{record.date}</Text>
        </Space>
        <Space>
          <Text strong style={{ color: amountColor, fontSize: 16 }}>
            {amountPrefix}¥{record.amount.toFixed(2)}
          </Text>
          <Popconfirm title="确认删除?" onConfirm={() => onDelete(record.id)}>
            <Button type="text" danger size="small" icon={<Trash2 className="w-3 h-3" />} />
          </Popconfirm>
        </Space>
      </div>
    </Card>
  );
}
