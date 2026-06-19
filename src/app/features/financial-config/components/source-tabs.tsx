import { useState, useCallback, useMemo } from 'react';
import { Tabs, Button } from 'antd';
import { Plus } from 'lucide-react';
import type { FinancialSourceType, FinancialSource } from '../../../../types/record';
import { useLanguage } from '../../../providers';
import { SourceTable } from './source-table';

interface SourceTabsProps {
  incomeSources: FinancialSource[];
  expenseSources: FinancialSource[];
  investmentSources: FinancialSource[];
  loanSources: FinancialSource[];
  onAdd: (type: FinancialSourceType) => void;
  onEdit: (source: FinancialSource) => void;
  onDelete: (id: string) => void;
}

export const SourceTabs = ({
  incomeSources,
  expenseSources,
  investmentSources,
  loanSources,
  onAdd,
  onEdit,
  onDelete,
}: SourceTabsProps) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<FinancialSourceType>('income');

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as FinancialSourceType);
  }, []);

  const sourcesMap: Record<FinancialSourceType, FinancialSource[]> = {
    income: incomeSources,
    expense: expenseSources,
    investment: investmentSources,
    loan: loanSources,
  };

  const tabConfig = useMemo(() => [
    {
      key: 'income',
      label: t.financialConfig.incomeConfig,
      sources: incomeSources,
    },
    {
      key: 'expense',
      label: t.financialConfig.expenseConfig,
      sources: expenseSources,
    },
    {
      key: 'investment',
      label: t.financialConfig.investmentConfig,
      sources: investmentSources,
    },
    {
      key: 'loan',
      label: t.financialConfig.loanConfig,
      sources: loanSources,
    },
  ], [t, incomeSources, expenseSources, investmentSources, loanSources]);

  return (
    <Tabs
      activeKey={activeTab}
      onChange={handleTabChange}
      items={tabConfig.map(tab => ({
        key: tab.key,
        label: (
          <span>
            {tab.label}
            <span style={{ color: '#999', marginLeft: 4 }}>({tab.sources.length})</span>
          </span>
        ),
        children: (
          <div>
            <div style={{ marginBottom: 12, textAlign: 'right' }}>
              <Button
                type="primary"
                size="small"
                icon={<Plus style={{ fontSize: 14 }} />}
                onClick={() => onAdd(tab.key as FinancialSourceType)}
              >
                {t.financialConfig.add}
              </Button>
            </div>
            <SourceTable
              sources={sourcesMap[tab.key as FinancialSourceType]}
              type={tab.key as FinancialSourceType}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ),
      }))}
    />
  );
};
