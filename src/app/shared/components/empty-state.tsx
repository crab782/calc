import { Empty } from 'antd';

export function EmptyState({ description, action }: { description?: string; action?: React.ReactNode }) {
  return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE}>{action}</Empty>;
}
