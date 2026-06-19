import { Card, Table, Typography } from 'antd';
import type { TablePaginationConfig } from 'antd';

const { Title } = Typography;

interface TablePanelProps {
  title?: string;
  dataSource: Record<string, unknown>[];
  columns: Record<string, unknown>[];
  rowKey?: string;
  pagination?: TablePaginationConfig | false;
}

export function TablePanel({
  title,
  dataSource,
  columns,
  rowKey = 'index',
  pagination = false,
}: TablePanelProps) {
  return (
    <Card style={{ borderRadius: 8 }}>
      {title && <Title level={5} style={{ marginBottom: 16, marginTop: 0 }}>{title}</Title>}
      <Table
        size="small"
        dataSource={dataSource}
        columns={columns}
        rowKey={rowKey}
        pagination={pagination}
      />
    </Card>
  );
}
