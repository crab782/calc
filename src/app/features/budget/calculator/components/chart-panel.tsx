import { Card, Typography } from 'antd';
import { BaseChart } from '../../../../shared/components';

const { Title } = Typography;

interface ChartPanelProps {
  title?: string;
  option: Record<string, unknown>;
  height?: number;
}

export function ChartPanel({ title, option, height = 350 }: ChartPanelProps) {
  return (
    <Card style={{ borderRadius: 8 }}>
      {title && <Title level={5} style={{ marginBottom: 16, marginTop: 0 }}>{title}</Title>}
      <BaseChart option={option} style={{ height }} />
    </Card>
  );
}
