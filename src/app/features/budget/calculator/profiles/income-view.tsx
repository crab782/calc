import { useMemo, useState } from 'react';
import { Card, Row, Col, Select, Slider, Button, Typography, Space, message, Empty } from 'antd';
import { useRecords } from '../../../../hooks/use-records';
import { useFinancialSources } from '../../../../hooks/use-financial-sources';
import { calculateBudget } from '../../../../../domain/budget/calculator/engine';
import { ChartPanel } from '../components/chart-panel';
import { TablePanel } from '../components/table-panel';
import type { BudgetPeriodUnit } from '../../../../../types/record';
import type { BudgetProfileType, BudgetResult } from '../../../../../domain/budget/types';

const { Text } = Typography;

interface PeriodRow {
  key: number;
  period: string;
  amount: number;
}

export function IncomeView() {
  const { records } = useRecords();
  const { sources } = useFinancialSources();

  const [periodUnit, setPeriodUnit] = useState<BudgetPeriodUnit>('month');
  const [periodCount, setPeriodCount] = useState(6);
  const [result, setResult] = useState<BudgetResult | null>(null);

  const currency = useMemo(() => 'CNY', []);

  const handleCalculate = () => {
    const calc = calculateBudget('income' as BudgetProfileType, records, sources, periodCount, currency);
    setResult(calc);
    message.success('收入计算完成');
  };

  const chartOption = useMemo(() => {
    if (!result) return {};
    return {
      title: { text: '收入预测', left: 'center' },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: result.labels },
      yAxis: { type: 'value' },
      series: [{ type: 'bar', data: result.data, itemStyle: { color: '#52c41a' } }],
      grid: { left: 60, right: 20, top: 50, bottom: 60 },
    };
  }, [result]);

  const tableData: PeriodRow[] = useMemo(() => {
    if (!result) return [];
    return result.labels.map((label, i) => ({
      key: i,
      period: label,
      amount: result.data[i],
    }));
  }, [result]);

  const tableColumns = useMemo(() => [
    { title: '周期', dataIndex: 'period', key: 'period' },
    { title: '预计收入', dataIndex: 'amount', key: 'amount', render: (v: number) => `¥${v.toFixed(2)}` },
  ], []);

  if (!result) {
    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="配置参数" style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>周期单位</Text>
                <Select
                  value={periodUnit}
                  onChange={(val) => { setPeriodUnit(val); setPeriodCount(val === 'month' ? 6 : 2); }}
                  style={{ width: '100%' }}
                  options={[{ label: '月份', value: 'month' }, { label: '年份', value: 'year' }]}
                />
              </div>
              <div>
                <Text strong>周期数: {periodCount} {periodUnit === 'month' ? '个月' : '年'}</Text>
                <Slider min={1} max={periodUnit === 'month' ? 60 : 5} value={periodCount} onChange={setPeriodCount} />
              </div>
              <Button type="primary" onClick={handleCalculate} style={{ width: '100%' }}>开始计算</Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card><Empty description="请设置周期后点击计算" /></Card>
        </Col>
      </Row>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={24}>
      <ChartPanel title="收入预测" option={chartOption} />
      <TablePanel title="收入明细" dataSource={tableData as unknown as Record<string, unknown>[]} columns={tableColumns as unknown as Record<string, unknown>[]} />
    </Space>
  );
}
