import { Card, Row, Col, Typography, Space } from 'antd';
import { TrendingUp, BarChart3, PiggyBank, ArrowRight } from 'lucide-react';

const { Title, Text } = Typography;

interface BudgetPlanProps {
  onNavigate: (type: string) => void;
}

const budgetTypes = [
  {
    key: 'balance',
    title: '账户余额预测',
    description: '预测账户未来余额变化趋势',
    icon: <TrendingUp size={28} />,
    color: '#1677ff',
  },
  {
    key: 'trend',
    title: '收入支出趋势',
    description: '分析未来收支趋势和变化',
    icon: <BarChart3 size={28} />,
    color: '#52c41a',
  },
  {
    key: 'savings',
    title: '储蓄目标规划',
    description: '规划储蓄目标和实现进度',
    icon: <PiggyBank size={28} />,
    color: '#fa8c16',
  },
];

export const BudgetPlan = ({ onNavigate }: BudgetPlanProps) => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>预算计划</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 32, fontSize: 16 }}>
        选择一个预算类型开始规划您的财务未来
      </Text>
      <Row gutter={[24, 24]}>
        {budgetTypes.map((type) => (
          <Col xs={24} sm={12} md={8} key={type.key}>
            <Card
              hoverable
              onClick={() => onNavigate(type.key)}
              style={{
                borderRadius: 12,
                height: '100%',
                border: '1px solid #f0f0f0',
                cursor: 'pointer',
              }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 24px',
                  textAlign: 'center',
                },
              }}
            >
              <Space direction="vertical" size="large" style={{ alignItems: 'center' }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  backgroundColor: type.color + '15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: type.color,
                }}>
                  {type.icon}
                </div>
                <div>
                  <Text strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>
                    {type.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 14 }}>
                    {type.description}
                  </Text>
                </div>
                <Text style={{ color: type.color }}>
                  <Space><span>开始规划</span><ArrowRight size={16} /></Space>
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
