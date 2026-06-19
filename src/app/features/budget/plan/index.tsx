import { Card, Row, Col, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { useBudget } from '../../../hooks';
import { useRecords } from '../../../hooks/use-records';
import { useFinancialSources } from '../../../hooks/use-financial-sources';
import { ROUTES } from '../../../router/routes';
import type { BudgetProfileType } from '../../../../domain/budget/types';

const { Title, Text } = Typography;

const profiles: { key: BudgetProfileType; title: string; description: string; color: string }[] = [
  {
    key: 'balance',
    title: '账户结余计算器',
    description: '基于账户历史收支，预测未来结余趋势',
    color: '#1677ff',
  },
  {
    key: 'income',
    title: '收入计算器',
    description: '根据收入来源规则，计算预期收入',
    color: '#52c41a',
  },
  {
    key: 'expense',
    title: '支出计算器',
    description: '根据支出来源规则，计算预期支出',
    color: '#fa8c16',
  },
];

export function BudgetPlanPage() {
  const navigate = useNavigate();
  const { records } = useRecords();
  const { sources } = useFinancialSources();
  const { budgetPlans } = useBudget(records, sources);

  const handleNavigate = (type: BudgetProfileType) => {
    navigate(ROUTES.BUDGET_CALCULATOR.replace(':profile', type));
  };

  return (
    <div>
      <Title level={4} style={{ marginBottom: 8 }}>预算计划</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        选择预算类型开始规划您的财务
      </Text>

      <Row gutter={[24, 24]}>
        {profiles.map((profile) => (
          <Col xs={24} sm={12} md={8} key={profile.key}>
            <Card
              hoverable
              onClick={() => handleNavigate(profile.key)}
              style={{
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                cursor: 'pointer',
              }}
              styles={{
                body: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 24px',
                  textAlign: 'center',
                },
              }}
            >
              <Space direction="vertical" size="middle" style={{ alignItems: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  backgroundColor: profile.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: profile.color,
                }}>
                  {profile.key === 'balance' ? '💰' : profile.key === 'income' ? '📈' : '📉'}
                </div>
                <div>
                  <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 6 }}>
                    {profile.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {profile.description}
                  </Text>
                </div>
                <Text style={{ color: profile.color }}>
                  <Space><span>开始计算</span><ArrowRight size={14} /></Space>
                </Text>
              </Space>
            </Card>
          </Col>
        ))}

        {/* 已保存的计划列表 */}
        {budgetPlans.length > 0 && (
          <>
            <Col span={24}>
              <Title level={5} style={{ marginBottom: 12 }}>我的计划</Title>
            </Col>
            {budgetPlans.map((plan) => (
              <Col xs={24} sm={12} md={8} key={plan.id}>
                <Card
                  hoverable
                  onClick={() => plan.profileType && handleNavigate(plan.profileType)}
                  style={{ borderRadius: 12, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                >
                  <Text strong>{plan.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>{plan.description}</Text>
                </Card>
              </Col>
            ))}
          </>
        )}

        {/* 添加计划入口 */}
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            style={{
              borderRadius: 12,
              border: '1px dashed #d9d9d9',
              cursor: 'pointer',
            }}
            styles={{
              body: {
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px',
              },
            }}
          >
            <Space direction="vertical" style={{ alignItems: 'center' }}>
              <PlusCircle size={32} style={{ color: '#bfbfbf' }} />
              <Text type="secondary">添加新计划</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
