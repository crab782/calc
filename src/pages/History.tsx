import { useMemo } from 'react';
import { Card, Table, Tag, Typography, Empty } from 'antd';
import { History as HistoryIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';
import type { ExpenseRecord } from '../types/record';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

interface GroupedRecords {
  [key: string]: {
    records: ExpenseRecord[];
    totalIncome: number;
    totalExpense: number;
  };
}

export const History = () => {
  const { t } = useLanguage();
  const { records } = useRecords();
  const { formatCurrency, formatDate } = useStatistics();

  // 按月份分组并计算统计
  const groupedRecords = useMemo(() => {
    const grouped: GroupedRecords = {};

    const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

    sortedRecords.forEach((record) => {
      const monthKey = record.date.substring(0, 7);

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          records: [],
          totalIncome: 0,
          totalExpense: 0,
        };
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

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return `${year}年${parseInt(month)}月`;
  };

  const sortedMonths = useMemo(() => {
    return Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
  }, [groupedRecords]);

  const columns: ColumnsType<ExpenseRecord> = useMemo(() => [
    {
      title: t.history.time,
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => formatDate(date),
    },
    {
      title: t.history.category,
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: t.history.amount,
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number, record: ExpenseRecord) => (
        <Text strong style={{ color: record.type === 'income' ? '#22c55e' : '#ef4444' }}>
          {record.type === 'income' ? '+' : '-'}{formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: t.history.type,
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type === 'income' ? t.history.incomeType : t.history.expenseType}
        </Tag>
      ),
    },
    {
      title: t.history.description,
      dataIndex: 'note',
      key: 'note',
      render: (note: string) => note || '-',
    },
  ], [formatCurrency, formatDate, t]);

  if (sortedMonths.length === 0) {
    return (
      <div>
        <Title level={2} style={{ marginBottom: 24 }}>
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
      <Title level={2} style={{ marginBottom: 24 }}>
        <HistoryIcon className="w-8 h-8 inline-block mr-2" style={{ verticalAlign: 'middle', color: '#1677ff' }} />
        {t.history.title}
      </Title>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sortedMonths.map((month) => {
          const monthData = groupedRecords[month];

          return (
            <Card
              key={month}
              bordered={false}
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>{formatMonth(month)}</span>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <span>
                      <TrendingUp className="w-4 h-4 inline-block mr-1" style={{ color: '#22c55e', verticalAlign: 'middle' }} />
                      <Text type="secondary" style={{ marginRight: 4 }}>{t.history.income}:</Text>
                      <Text strong style={{ color: '#22c55e' }}>+{formatCurrency(monthData.totalIncome)}</Text>
                    </span>
                    <span>
                      <TrendingDown className="w-4 h-4 inline-block mr-1" style={{ color: '#ef4444', verticalAlign: 'middle' }} />
                      <Text type="secondary" style={{ marginRight: 4 }}>{t.history.expense}:</Text>
                      <Text strong style={{ color: '#ef4444' }}>-{formatCurrency(monthData.totalExpense)}</Text>
                    </span>
                  </div>
                </div>
              }
            >
              <Table
                columns={columns}
                dataSource={monthData.records}
                rowKey="id"
                pagination={false}
                size="middle"
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
};
