import { useMemo } from 'react';
import { Button, Card, Col, Empty, List, Row, Space, Tag, Typography } from 'antd';
import { TrendingDown, TrendingUp, Trash2, Wallet } from 'lucide-react';
import { useLanguage } from '../../providers';
import { useRecords, useStatistics } from '../../../app/hooks';
import { useAccounts } from '../../../app/hooks/use-accounts';
import { BalanceChart, ExpenseChart, IncomeChart } from '../../../app/shared/components/charts';
import { StatCard } from './components/stat-card';
import { LangSwitcher } from './components/lang-switcher';
import type { ExpenseRecord } from '../../../types/record';

const { Text, Title } = Typography;

export function DashboardPage() {
  const { t } = useLanguage();
  const { records, deleteRecord } = useRecords();
  const { statistics } = useStatistics(records, []);
  useAccounts(records);

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);
  }, [records]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t.dashboard.title}</Title>
        <LangSwitcher />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title={t.dashboard.totalIncome}
            value={statistics.totalIncome}
            prefix={<TrendingUp style={{ width: 24, height: 24, color: '#22c55e' }} />}
            color="#22c55e"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title={t.dashboard.totalExpense}
            value={statistics.totalExpense}
            prefix={<TrendingDown style={{ width: 24, height: 24, color: '#ef4444' }} />}
            color="#ef4444"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title={t.dashboard.balance}
            value={statistics.balance}
            prefix={<Wallet style={{ width: 24, height: 24, color: '#3b82f6' }} />}
            color="#3b82f6"
          />
        </Col>
      </Row>

      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <BalanceChart />
        <ExpenseChart />
        <IncomeChart />
      </div>

      <Card title={t.dashboard.recentTransactions} bordered={false}>
        {recentRecords.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <p>{t.dashboard.noRecords}</p>
                <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{t.dashboard.addFirstRecord}</p>
              </div>
            }
            style={{ padding: '48px 0' }}
          />
        ) : (
          <List
            dataSource={recentRecords}
            renderItem={(record: ExpenseRecord) => (
              <List.Item
                style={{ padding: '12px 24px' }}
                actions={[
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={() => deleteRecord(record.id)}
                    title={t.dashboard.deleteRecord}
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={record.type === 'income' ? 'green' : 'red'}>
                        {record.type === 'income' ? t.dashboard.income : t.dashboard.expense}
                      </Tag>
                      <Text type="secondary">{record.category}</Text>
                      <Text strong>{record.note || record.category}</Text>
                    </Space>
                  }
                  description={record.date}
                />
                <Text
                  strong
                  style={{
                    color: record.type === 'income' ? '#22c55e' : '#ef4444',
                    fontSize: 16,
                  }}
                >
                  {record.type === 'income' ? '+' : '-'}¥{record.amount.toFixed(2)}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
