import { useMemo, useState } from 'react';
import { Card, Row, Col, Select, Slider, Button, Typography, Space, message, Empty } from 'antd';
import { useRecords } from '../../../../hooks/use-records';
import { useFinancialSources } from '../../../../hooks/use-financial-sources';
import { calculateBudget } from '../../../../../domain/budget/calculator/engine';
import { recordService } from '../../../../../data/service';
import { ChartPanel } from '../components/chart-panel';
import { TablePanel } from '../components/table-panel';
import type { BudgetPeriodUnit } from '../../../../../types/record';
import type { BudgetProfileType, BudgetResult } from '../../../../../domain/budget/types';

const { Text } = Typography;

interface PeriodRow {
  key: string;
  account: string;
  period: string;
  amount: number;
}

export function BalanceView() {
  const { records } = useRecords();
  const { sources } = useFinancialSources();
  const accounts = useMemo(() => recordService.getAccounts(), []);

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodUnit, setPeriodUnit] = useState<BudgetPeriodUnit>('month');
  const [periodCount, setPeriodCount] = useState(6);
  const [results, setResults] = useState<BudgetResult[]>([]);

  const visibleAccounts = useMemo(
    () => accounts.filter(a => a.visible === true && ['cash', 'investment', 'loan'].includes(a.accountType)),
    [accounts],
  );

  const currency = useMemo(() => recordService.getDefaultAccountCurrency(), []);

  const handleCalculate = () => {
    if (selectedAccountIds.length === 0) {
      message.warning('请至少选择一个账户');
      return;
    }
    const allResults = selectedAccountIds.map(id =>
      calculateBudget('balance' as BudgetProfileType, records, sources, periodCount, currency, id),
    );
    setResults(allResults);
    message.success('计算完成');
  };

  const chartOption = useMemo(() => {
    if (results.length === 0) return {};
    const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1'];
    return {
      title: { text: '结余预测趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: { type: 'category', data: results[0]?.labels || [] },
      yAxis: { type: 'value' },
      series: results.map((r, i) => ({
        name: selectedAccountIds[i] || '',
        type: 'line',
        data: r.data,
        smooth: true,
        itemStyle: { color: colors[i % colors.length] },
      })),
      grid: { left: 60, right: 20, top: 50, bottom: 60 },
    };
  }, [results, selectedAccountIds]);

  const tableData: PeriodRow[] = useMemo(() => {
    const data: PeriodRow[] = [];
    results.forEach((r, idx) => {
      r.labels.forEach((label, i) => {
        data.push({
          key: `${idx}-${i}`,
          account: selectedAccountIds[idx] || '',
          period: label,
          amount: r.data[i],
        });
      });
    });
    return data;
  }, [results, selectedAccountIds]);

  const tableColumns = useMemo(() => [
    { title: '周期', dataIndex: 'period', key: 'period' },
    {
      title: '预计结余',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => `¥${val.toFixed(2)}`,
    },
  ], []);

  if (results.length === 0) {
    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card title="配置参数" style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>选择账户 (最多3个)</Text>
                <Select
                  mode="multiple"
                  placeholder="选择账户"
                  value={selectedAccountIds}
                  onChange={(val) => val.length <= 3 && setSelectedAccountIds(val)}
                  style={{ width: '100%' }}
                  options={visibleAccounts.map(a => ({ label: `${a.name} (${a.currency})`, value: a.id }))}
                />
              </div>
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
          <Card><Empty description="请选择账户并设置周期后点击计算" /></Card>
        </Col>
      </Row>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={24}>
      <ChartPanel title="结余预测趋势" option={chartOption} />
      <TablePanel title="详细数据" dataSource={tableData as unknown as Record<string, unknown>[]} columns={tableColumns as unknown as Record<string, unknown>[]} />
    </Space>
  );
}
