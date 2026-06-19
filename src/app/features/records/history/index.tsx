import { useMemo } from 'react';
import { Card, Empty, Typography } from 'antd';
import { History as HistoryIcon } from 'lucide-react';
import { useLanguage } from '../../../providers';
import { useRecords, useFinancialSources, useStatistics } from '../../../hooks';
import { RecordGroup } from './components/record-group';
import type { ExpenseRecord } from '../../../../types/record';

const { Title } = Typography;

interface GroupedMonth {
  records: ExpenseRecord[];
  totalIncome: number;
  totalExpense: number;
}

export function HistoryPage() {
  const { t } = useLanguage();
  const { records, deleteRecord } = useRecords();
  const { sources: financialSources } = useFinancialSources();
  useStatistics(records, financialSources);

  const groupedData = useMemo(() => {
    const grouped: Record<string, GroupedMonth> = {};
    const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

    sorted.forEach((record) => {
      const monthKey = record.date.substring(0, 7);
      if (!grouped[monthKey]) {
        grouped[monthKey] = { records: [], totalIncome: 0, totalExpense: 0 };
      }
      grouped[monthKey].records.push(record);
      if (record.type === 'income') {
        grouped[monthKey].totalIncome += record.amount;
      } else {
        grouped[monthKey].totalExpense += record.amount;
      }
    });

    return grouped;
  }, [records]);

  const sortedMonths = useMemo(() => {
    return Object.keys(groupedData).sort((a, b) => b.localeCompare(a));
  }, [groupedData]);

  if (sortedMonths.length === 0) {
    return (
      <div>
        <Title level={4} style={{ marginBottom: 16 }}>
          <HistoryIcon className="w-8 h-8 inline-block mr-2" style={{ verticalAlign: 'middle' }} />
          {t.history.title}
        </Title>
        <Card bordered={false}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p>{t.history.noRecords}</p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.history.addFirstRecord}</p>
              </div>
            }
            style={{ padding: '48px 0' }}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>
        <HistoryIcon className="w-8 h-8 inline-block mr-2" style={{ verticalAlign: 'middle', color: '#1677ff' }} />
        {t.history.title}
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sortedMonths.map((month) => {
          const monthData = groupedData[month];
          return (
            <RecordGroup
              key={month}
              month={month}
              records={monthData.records}
              totalIncome={monthData.totalIncome}
              totalExpense={monthData.totalExpense}
              onDelete={deleteRecord}
            />
          );
        })}
      </div>
    </div>
  );
}
