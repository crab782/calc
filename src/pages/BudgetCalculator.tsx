import { useState, useMemo, useCallback } from 'react';
import { Card, Row, Col, Select, Slider, Button, Typography, Space, message, Empty, Table } from 'antd';
import { ArrowLeft, Download, TrendingUp, BarChart3, PiggyBank } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useRecords } from '../hooks/useRecords';
import type { BudgetPeriodUnit, BudgetCalculationResult } from '../types/record';

const { Title, Text } = Typography;

const budgetTypeNames: Record<string, string> = {
  balance: '账户余额预测',
  trend: '收入支出趋势',
  savings: '储蓄目标规划',
};

const budgetTypeIcons: Record<string, React.ReactNode> = {
  balance: <TrendingUp size={20} />,
  trend: <BarChart3 size={20} />,
  savings: <PiggyBank size={20} />,
};

interface BudgetCalculatorProps {
  budgetType: string;
  onBack: () => void;
}

export const BudgetCalculator = ({ budgetType, onBack }: BudgetCalculatorProps) => {
  const { accounts, calculateBudget, exportBudgetToCSV } = useRecords();

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [periodUnit, setPeriodUnit] = useState<BudgetPeriodUnit>('month');
  const [periodCount, setPeriodCount] = useState(6);
  const [calculationResult, setCalculationResult] = useState<BudgetCalculationResult[]>([]);

  const visibleAccounts = useMemo(() => {
    return accounts.filter(acc => acc.visible === true && ['cash', 'investment', 'loan'].includes(acc.accountType));
  }, [accounts]);

  const handleCalculate = useCallback(() => {
    if (selectedAccountIds.length === 0) {
      message.warning('请至少选择一个账户');
      return;
    }
    if (selectedAccountIds.length > 3) {
      message.warning('最多只能选择3个账户');
      return;
    }

    const result = calculateBudget(selectedAccountIds, periodUnit, periodCount);
    setCalculationResult(result);
    message.success('预算计算完成');
  }, [selectedAccountIds, periodUnit, periodCount, calculateBudget]);

  const handleExport = useCallback(() => {
    if (calculationResult.length === 0) {
      message.warning('请先进行预算计算');
      return;
    }
    const csv = exportBudgetToCSV(calculationResult);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `预算计划_${new Date().toLocaleDateString()}.csv`;
    link.click();
    message.success('导出成功');
  }, [calculationResult, exportBudgetToCSV]);

  // ECharts 折线图配置
  const lineChartOption = useMemo(() => {
    if (calculationResult.length === 0) return {};
    const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];
    const series = calculationResult.map((result, index) => ({
      name: result.accountName,
      type: 'line',
      data: result.periods.map(p => p.estimatedAmount),
      smooth: true,
      itemStyle: { color: colors[index % colors.length] },
      lineStyle: { width: 2 },
    }));

    return {
      title: { text: '预算趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: {
        type: 'category',
        data: calculationResult[0]?.periods.map(p => p.label) || [],
      },
      yAxis: { type: 'value' },
      series,
      grid: { left: 60, right: 20, top: 50, bottom: 60 },
    };
  }, [calculationResult]);

  // ECharts 柱状图配置
  const barChartOption = useMemo(() => {
    if (calculationResult.length === 0) return {};
    const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

    const series = calculationResult.map((result, index) => ({
      name: result.accountName,
      type: 'bar',
      data: result.periods.map(p => p.estimatedAmount),
      itemStyle: { color: colors[index % colors.length] },
    }));

    return {
      title: { text: '账户预算对比', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
      xAxis: {
        type: 'category',
        data: calculationResult[0]?.periods.map(p => p.label) || [],
      },
      yAxis: { type: 'value' },
      series,
      grid: { left: 60, right: 20, top: 50, bottom: 60 },
    };
  }, [calculationResult]);

  // ECharts 饼图配置
  const pieChartOption = useMemo(() => {
    if (calculationResult.length === 0) return {};
    const colors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2'];

    const data = calculationResult.map((result, index) => ({
      name: result.accountName,
      value: result.periods[result.periods.length - 1]?.estimatedAmount || 0,
      itemStyle: { color: colors[index % colors.length] },
    }));

    return {
      title: { text: '最终周期预算占比', left: 'center' },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {d}%' },
        data,
      }],
    };
  }, [calculationResult]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Button
          type="text"
          icon={<ArrowLeft size={18} />}
          onClick={onBack}
        >
          返回预算计划
        </Button>
        <Title level={2} style={{ margin: 0 }}>
          <Space>
            {budgetTypeIcons[budgetType]}
            {budgetTypeNames[budgetType]}
          </Space>
        </Title>
      </div>

      <Row gutter={[24, 24]}>
        {/* 配置面板 */}
        <Col xs={24} lg={8}>
          <Card title="配置参数" style={{ borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              {/* 账户选择 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>选择账户 (最多3个)</Text>
                <Select
                  mode="multiple"
                  placeholder="选择账户"
                  value={selectedAccountIds}
                  onChange={(val) => {
                    if (val.length <= 3) setSelectedAccountIds(val);
                    else message.warning('最多只能选择3个账户');
                  }}
                  style={{ width: '100%' }}
                  maxTagCount={3}
                  options={visibleAccounts.map(acc => ({
                    label: `${acc.name} (${acc.currency})`,
                    value: acc.id,
                  }))}
                />
              </div>

              {/* 周期单位 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>周期单位</Text>
                <Select
                  value={periodUnit}
                  onChange={(val) => {
                    setPeriodUnit(val);
                    setPeriodCount(val === 'month' ? 6 : 2);
                  }}
                  style={{ width: '100%' }}
                  options={[
                    { label: '月份', value: 'month' },
                    { label: '年份', value: 'year' },
                  ]}
                />
              </div>

              {/* 周期数 */}
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  周期数: {periodCount} {periodUnit === 'month' ? '个月' : '年'}
                </Text>
                <Slider
                  min={1}
                  max={periodUnit === 'month' ? 60 : 5}
                  value={periodCount}
                  onChange={setPeriodCount}
                  marks={{
                    1: '1',
                    [periodUnit === 'month' ? 12 : 1]: periodUnit === 'month' ? '1年' : '1',
                    [periodUnit === 'month' ? 60 : 5]: periodUnit === 'month' ? '5年' : '5',
                  }}
                />
              </div>

              {/* 操作按钮 */}
              <Space style={{ width: '100%' }} direction="vertical">
                <Button type="primary" onClick={handleCalculate} style={{ width: '100%' }}>
                  开始计算
                </Button>
                <Button onClick={handleExport} style={{ width: '100%' }}>
                  <Download size={14} /> 导出CSV
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* 结果展示 */}
        <Col xs={24} lg={16}>
          {calculationResult.length === 0 ? (
            <Card style={{ borderRadius: 8 }}>
              <Empty description="请选择账户并设置周期后点击计算" />
            </Card>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size={24}>
              {/* 图表 */}
              <Card title="预算趋势" style={{ borderRadius: 8 }}>
                <ReactECharts option={lineChartOption} style={{ height: 400 }} />
              </Card>

              <Card title="账户预算对比" style={{ borderRadius: 8 }}>
                <ReactECharts option={barChartOption} style={{ height: 400 }} />
              </Card>

              <Card title="最终周期预算占比" style={{ borderRadius: 8 }}>
                <ReactECharts option={pieChartOption} style={{ height: 400 }} />
              </Card>

              {/* 数据表格 */}
              <Card title="详细数据" style={{ borderRadius: 8 }}>
                {calculationResult.map((result) => (
                  <div key={result.accountId} style={{ marginBottom: 16 }}>
                    <Text strong>{result.accountName} ({result.currency})</Text>
                    <Table
                      size="small"
                      dataSource={result.periods}
                      columns={[
                        { title: '周期', dataIndex: 'label', key: 'label' },
                        {
                          title: '预计余额',
                          dataIndex: 'estimatedAmount',
                          key: 'estimatedAmount',
                          render: (val: number) => `¥${val.toFixed(2)}`,
                        },
                      ]}
                      rowKey="index"
                      pagination={false}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                ))}
              </Card>
            </Space>
          )}
        </Col>
      </Row>
    </div>
  );
};
