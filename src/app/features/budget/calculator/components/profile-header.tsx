import { Typography, Button, Space } from 'antd';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../../router/routes';
import type { BudgetProfileType } from '../../../../../domain/budget/types';

const { Title } = Typography;

interface ProfileHeaderProps {
  title: string;
  profileType: BudgetProfileType;
}

const profileIcons: Record<BudgetProfileType, string> = {
  balance: '💰',
  income: '📈',
  expense: '📉',
};

export function ProfileHeader({ title, profileType }: ProfileHeaderProps) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      <Button
        type="text"
        size="small"
        icon={<ArrowLeft size={18} />}
        onClick={() => navigate(ROUTES.BUDGET_PLAN)}
      >
        返回
      </Button>
      <Title level={4} style={{ margin: 0 }}>
        <Space>
          <span style={{ fontSize: 20 }}>{profileIcons[profileType]}</span>
          {title}
        </Space>
      </Title>
    </div>
  );
}
