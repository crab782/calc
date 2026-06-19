import { useState, useCallback, useMemo } from 'react';
import { Typography, Card, Row, Col, message } from 'antd';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useFinancialSources } from '../../../app/hooks/use-financial-sources';
import { useLanguage } from '../../providers';
import { SourceTabs } from './components/source-tabs';
import { SourceForm } from './components/source-form';
import { CURRENCY_SYMBOLS } from '../../../domain/currency/constants';
import type { FinancialSource, FinancialSourceType, FinancialPeriod, InvestmentType, InterestType } from '../../../types/record';

const { Title, Text } = Typography;

export const FinancialConfig = () => {
  const { t } = useLanguage();
  const {
    incomeSources,
    expenseSources,
    investmentSources,
    loanSources,
    addSource,
    updateSource,
    deleteSource,
  } = useFinancialSources();

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<FinancialSourceType>('income');
  const [editingSource, setEditingSource] = useState<FinancialSource | null>(null);

  const formatAmount = useCallback((amount: number, currency: string) => {
    return `${CURRENCY_SYMBOLS[currency] || ''}${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, []);

  const calculateMonthlyAmount = useCallback((amount: number, period: FinancialPeriod): number => {
    switch (period) {
      case 'daily': return amount * 30;
      case 'weekly': return amount * 4;
      case 'monthly': return amount;
      case 'yearly': return amount / 12;
      case 'once': return 0;
      default: return amount;
    }
  }, []);

  const expectedMonthlyIncome = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    incomeSources.forEach(s => {
      const monthly = calculateMonthlyAmount(s.amount, s.period);
      byCurrency[s.currency] = (byCurrency[s.currency] || 0) + monthly;
    });
    return byCurrency;
  }, [incomeSources, calculateMonthlyAmount]);

  const expectedMonthlyExpense = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    expenseSources.forEach(s => {
      const monthly = calculateMonthlyAmount(s.amount, s.period);
      byCurrency[s.currency] = (byCurrency[s.currency] || 0) + monthly;
    });
    return byCurrency;
  }, [expenseSources, calculateMonthlyAmount]);

  const expectedMonthlyBalance = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    const allCurrencies = new Set([
      ...Object.keys(expectedMonthlyIncome),
      ...Object.keys(expectedMonthlyExpense),
    ]);
    allCurrencies.forEach(currency => {
      byCurrency[currency] = (expectedMonthlyIncome[currency] || 0) - (expectedMonthlyExpense[currency] || 0);
    });
    return byCurrency;
  }, [expectedMonthlyIncome, expectedMonthlyExpense]);

  const handleAdd = useCallback((type: FinancialSourceType) => {
    setModalType(type);
    setEditingSource(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((source: FinancialSource) => {
    setModalType(source.type);
    setEditingSource(source);
    setShowModal(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteSource(id);
    message.success(t.financialConfig.deleteSuccess);
  }, [deleteSource, t]);

  const handleSubmit = useCallback((values: Record<string, unknown>) => {
    if (editingSource) {
      const updates: Partial<FinancialSource> = {
        name: (values.name as string).trim(),
        currency: values.currency as string,
        amount: values.amount as number,
        period: values.period as FinancialPeriod,
        dayOfMonth: values.period === 'monthly' ? values.dayOfMonth as number : undefined,
        dayOfWeek: values.period === 'weekly' ? values.dayOfWeek as number : undefined,
        ...(modalType === 'investment' && {
          investmentType: values.investmentType as InvestmentType | undefined,
          expectedReturn: values.expectedReturn as number,
        }),
        ...(modalType === 'loan' && {
          principal: values.principal as number,
          interestRate: values.interestRate as number,
          interestType: values.interestType as InterestType | undefined,
        }),
      };
      updateSource(editingSource.id, updates);
      message.success(t.financialConfig.updateSuccess);
    } else {
      const sourceData: Omit<FinancialSource, 'id' | 'createdAt'> = {
        type: modalType,
        name: (values.name as string).trim(),
        currency: values.currency as string,
        amount: values.amount as number,
        period: values.period as FinancialPeriod,
        dayOfMonth: values.period === 'monthly' ? values.dayOfMonth as number : undefined,
        dayOfWeek: values.period === 'weekly' ? values.dayOfWeek as number : undefined,
        ...(modalType === 'investment' && {
          investmentType: values.investmentType as InvestmentType | undefined,
          expectedReturn: values.expectedReturn as number,
        }),
        ...(modalType === 'loan' && {
          principal: values.principal as number,
          interestRate: values.interestRate as number,
          interestType: values.interestType as InterestType | undefined,
        }),
      };
      addSource(sourceData);
      message.success(t.financialConfig.addSuccess);
    }
    setShowModal(false);
    setEditingSource(null);
  }, [modalType, editingSource, addSource, updateSource, t]);

  const renderSummaryCard = (title: string, data: Record<string, number>, icon: React.ReactNode, color: string) => (
    <Card style={{ borderRadius: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        {icon}
        <div style={{ marginLeft: 8 }}>
          <Text>{title}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{t.financialConfig.byCurrency}</Text>
        </div>
      </div>
      {Object.keys(data).length === 0 ? (
        <Text type="secondary">{t.financialConfig.noData}</Text>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(data).map(([currency, amount]) => (
            <div key={currency} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">{currency}</Text>
              <Text strong style={{ fontSize: 18, color }}>{formatAmount(amount, currency)}</Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Title level={4}>{t.financialConfig.title}</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          {renderSummaryCard(
            t.financialConfig.expectedMonthlyIncome,
            expectedMonthlyIncome,
            <TrendingUp style={{ fontSize: 24, color: '#52c41a' }} />,
            '#52c41a',
          )}
        </Col>
        <Col xs={24} sm={8}>
          {renderSummaryCard(
            t.financialConfig.expectedMonthlyExpense,
            expectedMonthlyExpense,
            <TrendingDown style={{ fontSize: 24, color: '#ff4d4f' }} />,
            '#ff4d4f',
          )}
        </Col>
        <Col xs={24} sm={8}>
          {renderSummaryCard(
            t.financialConfig.expectedMonthlyBalance,
            expectedMonthlyBalance,
            <Wallet style={{ fontSize: 24, color: '#1677ff' }} />,
            '#1677ff',
          )}
        </Col>
      </Row>

      <SourceTabs
        incomeSources={incomeSources}
        expenseSources={expenseSources}
        investmentSources={investmentSources}
        loanSources={loanSources}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <SourceForm
        type={modalType}
        source={editingSource}
        open={showModal}
        onCancel={() => { setShowModal(false); setEditingSource(null); }}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
