import { Card, Statistic } from 'antd';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: number;
  prefix?: ReactNode;
  color?: string;
}

export function StatCard({ title, value, prefix, color }: StatCardProps) {
  return (
    <Card hoverable>
      <Statistic
        title={title}
        value={value}
        precision={2}
        prefix={prefix}
        valueStyle={{ color }}
      />
    </Card>
  );
}
