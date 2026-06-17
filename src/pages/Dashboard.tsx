import { TrendingUp, TrendingDown, Wallet, Trash2, Globe } from 'lucide-react';
import { Card, Row, Col, Button, Tag, List, Typography, Space, Empty } from 'antd';
import { BalanceChart } from '../components/BalanceChart';
import { ExpenseChart } from '../components/ExpenseChart';
import { IncomeChart } from '../components/IncomeChart';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { useStatistics } from '../hooks/useStatistics';

const { Text } = Typography;

export const Dashboard = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { getRecentRecords, deleteRecord } = useRecords();
  const { statistics, formatCurrency, formatDate } = useStatistics();

  const recentRecords = getRecentRecords(10);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', margin: 0 }}>{t.dashboard.title}</h1>
        <Button
          onClick={toggleLanguage}
          icon={<Globe className="w-4 h-4" />}
        >
          {language === 'zh' ? 'EN' : '中文'}
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: '20px' } }}
          >
            <Space size={16}>
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
              }}>
                <TrendingUp style={{ width: 24, height: 24, color: '#22c55e' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>{t.dashboard.totalIncome}</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#22c55e' }}>
                  {formatCurrency(statistics.totalIncome)}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: '20px' } }}
          >
            <Space size={16}>
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
              }}>
                <TrendingDown style={{ width: 24, height: 24, color: '#ef4444' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>{t.dashboard.totalExpense}</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
                  {formatCurrency(statistics.totalExpense)}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            bordered={false}
            styles={{ body: { padding: '20px' } }}
          >
            <Space size={16}>
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
              }}>
                <Wallet style={{ width: 24, height: 24, color: '#3b82f6' }} />
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 14 }}>{t.dashboard.balance}</Text>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#3b82f6' }}>
                  {formatCurrency(statistics.balance)}
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <BalanceChart />
        <ExpenseChart />
        <IncomeChart />
      </div>

      <Card
        title={t.dashboard.recentTransactions}
        bordered={false}
        styles={{ body: { padding: 0 } }}
      >
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
            renderItem={(record) => (
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
                  description={formatDate(record.date)}
                />
                <Text
                  strong
                  style={{
                    color: record.type === 'income' ? '#22c55e' : '#ef4444',
                    fontSize: 16,
                  }}
                >
                  {record.type === 'income' ? '+' : '-'}
                  {formatCurrency(record.amount)}
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};
