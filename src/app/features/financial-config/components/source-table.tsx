import { useMemo } from 'react';
import { Table, Empty } from 'antd';
import type { FinancialSource, FinancialSourceType } from '../../../../types/record';
import { useLanguage } from '../../../providers';
import { useIncomeColumns } from './columns/income-columns';
import { useExpenseColumns } from './columns/expense-columns';
import { useInvestmentColumns } from './columns/investment-columns';
import { useLoanColumns } from './columns/loan-columns';

interface SourceTableProps {
  sources: FinancialSource[];
  type: FinancialSourceType;
  onEdit: (source: FinancialSource) => void;
  onDelete: (id: string) => void;
}

export const SourceTable = ({ sources, type, onEdit, onDelete }: SourceTableProps) => {
  const { t } = useLanguage();

  const incomeColumns = useIncomeColumns({ onEdit, onDelete });
  const expenseColumns = useExpenseColumns({ onEdit, onDelete });
  const investmentColumns = useInvestmentColumns({ onEdit, onDelete });
  const loanColumns = useLoanColumns({ onEdit, onDelete });

  const columns = useMemo(() => {
    switch (type) {
      case 'income': return incomeColumns;
      case 'expense': return expenseColumns;
      case 'investment': return investmentColumns;
      case 'loan': return loanColumns;
      default: return incomeColumns;
    }
  }, [type, incomeColumns, expenseColumns, investmentColumns, loanColumns]);

  const noDataText = useMemo(() => {
    const key = `no${type.charAt(0).toUpperCase() + type.slice(1)}Config` as keyof typeof t.financialConfig;
    return (t.financialConfig as Record<string | symbol, unknown>)[key] as string | undefined || '';
  }, [type, t]);

  if (sources.length === 0) {
    return <Empty description={noDataText} />;
  }

  return (
    <Table
      columns={columns}
      dataSource={sources}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );
};
