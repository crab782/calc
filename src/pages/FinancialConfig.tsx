import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Plus, PiggyBank, CreditCard, Pencil, Delete } from 'lucide-react';
import { Card, Button, Modal, Form, Input, Select, Typography, Space, Empty, Row, Col, message, Popconfirm, Collapse, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { useRecords } from '../hooks/useRecords';
import type {
  FinancialSourceType,
  FinancialPeriod,
  InvestmentType,
  InterestType,
  FinancialSource,
} from '../types/record';

const { Title, Text } = Typography;
const { Panel } = Collapse;

// 币种选项
const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY (¥)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

// 币种符号映射
const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

// 周期选项
const PERIOD_OPTIONS: { value: FinancialPeriod; label: string }[] = [
  { value: 'daily', label: '每日' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
  { value: 'once', label: '一次性' },
];

// 投资类型选项
const INVESTMENT_TYPE_OPTIONS: { value: InvestmentType; label: string }[] = [
  { value: 'once', label: '一次性投资' },
  { value: 'recurring', label: '定期投资' },
];

// 贷款还款方式选项
const INTEREST_TYPE_OPTIONS: { value: InterestType; label: string }[] = [
  { value: 'equal-payment', label: '等额本息' },
  { value: 'equal-principal', label: '等额本金' },
  { value: 'interest-first', label: '先息后本' },
];

// 贷款还款方式显示映射
const INTEREST_TYPE_LABELS: Record<InterestType, string> = {
  'equal-payment': '等额本息',
  'equal-principal': '等额本金',
  'interest-first': '先息后本',
};

export const FinancialConfig = () => {
  const {
    incomeSources,
    expenseSources,
    investmentSources,
    loanSources,
    addFinancialSource,
    deleteFinancialSource,
    updateFinancialSource,
  } = useRecords();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentType, setCurrentType] = useState<FinancialSourceType>('income');
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);
  const [form] = Form.useForm();

  // 格式化金额显示
  const formatAmount = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${CURRENCY_SYMBOLS[currency] || ''}${formatter.format(amount)}`;
  };

  // 计算月度金额
  const calculateMonthlyAmount = (amount: number, period: FinancialPeriod): number => {
    switch (period) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4;
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      case 'once': return 0;
      default: return amount;
    }
  };

  // 计算预期月收入
  const expectedMonthlyIncome = useMemo(() => {
    const incomeByCurrency: Record<string, number> = {};
    incomeSources.forEach((source) => {
      const monthly = calculateMonthlyAmount(source.amount, source.period);
      incomeByCurrency[source.currency] = (incomeByCurrency[source.currency] || 0) + monthly;
    });
    return incomeByCurrency;
  }, [incomeSources]);

  // 计算预期月支出
  const expectedMonthlyExpense = useMemo(() => {
    const expenseByCurrency: Record<string, number> = {};
    expenseSources.forEach((source) => {
      const monthly = calculateMonthlyAmount(source.amount, source.period);
      expenseByCurrency[source.currency] = (expenseByCurrency[source.currency] || 0) + monthly;
    });
    return expenseByCurrency;
  }, [expenseSources]);

  // 计算预期月结余
  const expectedMonthlyBalance = useMemo(() => {
    const balanceByCurrency: Record<string, number> = {};
    const allCurrencies = new Set([...Object.keys(expectedMonthlyIncome), ...Object.keys(expectedMonthlyExpense)]);
    allCurrencies.forEach((currency) => {
      balanceByCurrency[currency] = (expectedMonthlyIncome[currency] || 0) - (expectedMonthlyExpense[currency] || 0);
    });
    return balanceByCurrency;
  }, [expectedMonthlyIncome, expectedMonthlyExpense]);

  // 打开添加弹窗
  const openAddModal = (type: FinancialSourceType) => {
    setCurrentType(type);
    form.resetFields();
    form.setFieldsValue({ period: 'monthly', currency: 'CNY' });
    setShowAddModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (source: FinancialSource) => {
    setEditingSource(source);
    setCurrentType(source.type);
    form.setFieldsValue({
      name: source.name,
      currency: source.currency,
      amount: source.amount,
      period: source.period,
      investmentType: source.investmentType || 'once',
      expectedReturn: source.expectedReturn,
      principal: source.principal,
      interestRate: source.interestRate,
      interestType: source.interestType || 'equal-payment',
    });
    setShowEditModal(true);
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
    setEditingSource(null);
  };

  // 添加来源
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();

      const sourceData: Omit<FinancialSource, 'id' | 'createdAt'> = {
        type: currentType,
        name: values.name.trim(),
        currency: values.currency,
        amount: values.amount,
        period: values.period,
        ...(currentType === 'investment' && {
          investmentType: values.investmentType,
          expectedReturn: values.expectedReturn,
        }),
        ...(currentType === 'loan' && {
          principal: values.principal,
          interestRate: values.interestRate,
          interestType: values.interestType,
        }),
      };

      addFinancialSource(sourceData);
      message.success('添加成功');
      resetForm();
      setShowAddModal(false);
    } catch {
      // validation error
    }
  };

  // 编辑来源
  const handleEdit = async () => {
    try {
      if (!editingSource) return;
      const values = await form.validateFields();

      const updates: Partial<FinancialSource> = {
        name: values.name.trim(),
        currency: values.currency,
        amount: values.amount,
        period: values.period,
        ...(currentType === 'investment' && {
          investmentType: values.investmentType,
          expectedReturn: values.expectedReturn,
        }),
        ...(currentType === 'loan' && {
          principal: values.principal,
          interestRate: values.interestRate,
          interestType: values.interestType,
        }),
      };

      updateFinancialSource(editingSource.id, updates);
      message.success('更新成功');
      resetForm();
      setShowEditModal(false);
    } catch {
      // validation error
    }
  };

  // 删除来源
  const handleDelete = (id: string) => {
    const result = deleteFinancialSource(id);
    if (result.success) {
      message.success('删除成功');
    } else {
      message.error(result.message);
    }
  };

  // Table 列配置
  const getBaseColumns = (): TableColumnsType<FinancialSource> => {
    const periodLabel = (period: FinancialPeriod) => PERIOD_OPTIONS.find(p => p.value === period)?.label || period;

    return [
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        render: (text: string) => <Text strong>{text}</Text>,
      },
      {
        title: '币种',
        dataIndex: 'currency',
        key: 'currency',
        width: 80,
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        render: (amount: number, record: FinancialSource) => (
          <Text strong>{formatAmount(amount, record.currency)}</Text>
        ),
      },
      {
        title: '周期',
        dataIndex: 'period',
        key: 'period',
        width: 80,
        render: (period: FinancialPeriod) => <Tag>{periodLabel(period)}</Tag>,
      },
      {
        title: '月度金额',
        key: 'monthly',
        width: 120,
        render: (_: unknown, record: FinancialSource) => {
          const monthly = calculateMonthlyAmount(record.amount, record.period);
          return monthly > 0 ? (
            <Text>{formatAmount(monthly, record.currency)}</Text>
          ) : (
            <Text type="secondary">—</Text>
          );
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_: unknown, record: FinancialSource) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<Pencil style={{ fontSize: 14 }} />}
              onClick={() => openEditModal(record)}
            />
            <Popconfirm
              title="确认删除"
              description="确定要删除这条记录吗？此操作无法撤销。"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<Delete style={{ fontSize: 14 }} />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];
  };

  const getInvestmentColumns = (): TableColumnsType<FinancialSource> => {
    const baseCols = getBaseColumns();
    const actionCol = baseCols.pop(); // 移除最后一列（操作）

    return [
      ...baseCols,
      {
        title: '预期收益率',
        dataIndex: 'expectedReturn',
        key: 'expectedReturn',
        width: 100,
        render: (value: number | undefined) => value !== undefined ? `${value}%` : '—',
      },
      {
        title: '投资类型',
        dataIndex: 'investmentType',
        key: 'investmentType',
        width: 100,
        render: (value: InvestmentType | undefined) =>
          value ? INVESTMENT_TYPE_OPTIONS.find(i => i.value === value)?.label : '—',
      },
      actionCol!,
    ];
  };

  const getLoanColumns = (): TableColumnsType<FinancialSource> => {
    const baseCols = getBaseColumns();
    const actionCol = baseCols.pop();

    return [
      ...baseCols,
      {
        title: '本金',
        dataIndex: 'principal',
        key: 'principal',
        width: 120,
        render: (value: number | undefined, record: FinancialSource) =>
          value !== undefined ? formatAmount(value, record.currency) : '—',
      },
      {
        title: '利率',
        dataIndex: 'interestRate',
        key: 'interestRate',
        width: 80,
        render: (value: number | undefined) => value !== undefined ? `${value}%` : '—',
      },
      {
        title: '还款方式',
        dataIndex: 'interestType',
        key: 'interestType',
        width: 100,
        render: (value: InterestType | undefined) =>
          value ? INTEREST_TYPE_LABELS[value] : '—',
      },
      actionCol!,
    ];
  };

  // 渲染 Collapse 面板
  const renderSourceTable = (
    sources: FinancialSource[],
    type: FinancialSourceType,
    icon: React.ReactNode,
    title: string,
  ) => {
    const getColumns = () => {
      switch (type) {
        case 'investment': return getInvestmentColumns();
        case 'loan': return getLoanColumns();
        default: return getBaseColumns();
      }
    };

    return (
      <Panel
        key={type}
        header={
          <span>
            {icon}
            <Text strong style={{ marginLeft: 8 }}>{title}配置</Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>({sources.length})</Text>
          </span>
        }
        extra={
          <Button
            type="primary"
            size="small"
            icon={<Plus style={{ fontSize: 14 }} />}
            onClick={(e) => { e.stopPropagation(); openAddModal(type); }}
          >
            添加
          </Button>
        }
      >
        {sources.length === 0 ? (
          <Empty description={`暂无${title}配置，点击上方按钮添加`} />
        ) : (
          <Table
            columns={getColumns()}
            dataSource={sources}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Panel>
    );
  };

  // 渲染表单
  const renderForm = () => (
    <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
      <Form.Item label="名称" name="name" rules={[{ required: true, message: '请输入名称' }]}>
        <Input placeholder="请输入名称" />
      </Form.Item>
      <Form.Item label="币种" name="currency" rules={[{ required: true }]}>
        <Select options={CURRENCY_OPTIONS} />
      </Form.Item>
      <Form.Item label="金额" name="amount" rules={[{ required: true, type: 'number', min: 0, message: '请输入有效金额' }]}>
        <Input type="number" placeholder="请输入金额" min={0} step="0.01" />
      </Form.Item>
      <Form.Item label="周期" name="period" rules={[{ required: true }]}>
        <Select options={PERIOD_OPTIONS} />
      </Form.Item>
      {currentType === 'investment' && (
        <>
          <Form.Item label="投资类型" name="investmentType">
            <Select options={INVESTMENT_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item label="预期收益率 (%)" name="expectedReturn">
            <Input type="number" placeholder="请输入预期收益率" min={0} step="0.01" />
          </Form.Item>
        </>
      )}
      {currentType === 'loan' && (
        <>
          <Form.Item label="本金" name="principal" rules={[{ required: true, type: 'number', min: 0, message: '请输入有效的本金' }]}>
            <Input type="number" placeholder="请输入本金" min={0} step="0.01" />
          </Form.Item>
          <Form.Item label="年利率 (%)" name="interestRate" rules={[{ required: true, type: 'number', min: 0, message: '请输入有效的利率' }]}>
            <Input type="number" placeholder="请输入年利率" min={0} step="0.01" />
          </Form.Item>
          <Form.Item label="还款方式" name="interestType">
            <Select options={INTEREST_TYPE_OPTIONS} />
          </Form.Item>
        </>
      )}
    </Form>
  );

  // 渲染汇总
  const renderSummaryCard = (title: string, _subtitle: string, data: Record<string, number>, icon: React.ReactNode, color: string) => (
    <Card style={{ borderRadius: 8 }}>
      <Space align="center" style={{ marginBottom: 16 }}>
        {icon}
        <div>
          <Text>{title}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>按币种统计</Text>
        </div>
      </Space>
      {Object.keys(data).length === 0 ? (
        <Text type="secondary">暂无数据</Text>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          {Object.entries(data).map(([currency, amount]) => (
            <div key={currency} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{currency}</Text>
              <Text strong style={{ fontSize: 18, color }}>{formatAmount(amount, currency)}</Text>
            </div>
          ))}
        </Space>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>财务配置</Title>

      {/* 财务总览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          {renderSummaryCard('预期月收入', '按币种统计', expectedMonthlyIncome, <TrendingUp style={{ fontSize: 24, color: '#52c41a' }} />, '#52c41a')}
        </Col>
        <Col xs={24} sm={8}>
          {renderSummaryCard('预期月支出', '按币种统计', expectedMonthlyExpense, <TrendingDown style={{ fontSize: 24, color: '#ff4d4f' }} />, '#ff4d4f')}
        </Col>
        <Col xs={24} sm={8}>
          {renderSummaryCard('预期月结余', '按币种统计', expectedMonthlyBalance, <Wallet style={{ fontSize: 24, color: '#1677ff' }} />, '#1677ff')}
        </Col>
      </Row>

      {/* 财务来源配置 - Collapse + Table 布局 */}
      <Collapse
        defaultActiveKey={['income', 'expense', 'investment', 'loan']}
        style={{ background: '#fff' }}
      >
        {renderSourceTable(incomeSources, 'income', <TrendingUp style={{ fontSize: 16, color: '#52c41a' }} />, '收入')}
        {renderSourceTable(expenseSources, 'expense', <TrendingDown style={{ fontSize: 16, color: '#ff4d4f' }} />, '支出')}
        {renderSourceTable(investmentSources, 'investment', <PiggyBank style={{ fontSize: 16, color: '#722ed1' }} />, '投资')}
        {renderSourceTable(loanSources, 'loan', <CreditCard style={{ fontSize: 16, color: '#fa8c16' }} />, '贷款')}
      </Collapse>

      {/* 添加弹窗 */}
      <Modal
        title={`添加${currentType === 'income' ? '收入' : currentType === 'expense' ? '支出' : currentType === 'investment' ? '投资' : '贷款'}`}
        open={showAddModal}
        onCancel={() => { setShowAddModal(false); resetForm(); }}
        onOk={handleAdd}
        okText="添加"
        cancelText="取消"
      >
        {renderForm()}
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title={`编辑${currentType === 'income' ? '收入' : currentType === 'expense' ? '支出' : currentType === 'investment' ? '投资' : '贷款'}`}
        open={showEditModal}
        onCancel={() => { setShowEditModal(false); resetForm(); }}
        onOk={handleEdit}
        okText="保存"
        cancelText="取消"
      >
        {renderForm()}
      </Modal>
    </div>
  );
};
