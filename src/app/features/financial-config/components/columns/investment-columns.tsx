import { useMemo } from 'react';
import { Tag, Typography, Button, Popconfirm, Space } from 'antd';
import { Pencil, Delete } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import type { FinancialSource, FinancialPeriod, InvestmentType } from '../../../../../types/record';
import { useLanguage } from '../../../../providers';
import { CURRENCY_SYMBOLS } from '../../../../../domain/currency/constants';

const { Text } = Typography;

const getDayOfMonthLabel = (dayOfMonth: number, t: ReturnType<typeof useLanguage>['t']): string => {
  if (dayOfMonth === -1) return t.financialConfig.lastDayOfMonth;
  return t.financialConfig.dayOfMonthLabel.replace('{{day}}', String(dayOfMonth));
};

const getDayOfWeekLabel = (dayOfWeek: number, t: ReturnType<typeof useLanguage>['t']): string => {
  const labels = t.financialConfig.dayOfWeekLabels as Record<string, string>;
  return labels[String(dayOfWeek)] || String(dayOfWeek);
};

interface InvestmentColumnsProps {
  onEdit: (source: FinancialSource) => void;
  onDelete: (id: string) => void;
}

export const useInvestmentColumns = ({ onEdit, onDelete }: InvestmentColumnsProps) => {
  const { t } = useLanguage();

  return useMemo<TableColumnsType<FinancialSource>>(() => {
    const periodLabel = (period: FinancialPeriod): string => {
      const map: Record<string, string> = {
        daily: t.financialConfig.daily,
        weekly: t.financialConfig.weekly,
        monthly: t.financialConfig.monthly,
        yearly: t.financialConfig.yearly,
        once: t.financialConfig.once,
      };
      return map[period] || period;
    };

    const investmentTypeLabel = (type: InvestmentType | undefined): string => {
      if (!type) return '—';
      if (type === 'once') return t.financialConfig.onceInvestment;
      return t.financialConfig.recurringInvestment;
    };

    return [
      {
        title: t.financialConfig.name,
        dataIndex: 'name',
        key: 'name',
        width: 130,
        render: (text: string) => <Text strong>{text}</Text>,
      },
      {
        title: t.financialConfig.currency,
        dataIndex: 'currency',
        key: 'currency',
        width: 70,
      },
      {
        title: t.financialConfig.amount,
        dataIndex: 'amount',
        key: 'amount',
        width: 100,
        render: (amount: number, record: FinancialSource) => (
          <Text strong>{CURRENCY_SYMBOLS[record.currency] || ''}{amount.toFixed(2)}</Text>
        ),
      },
      {
        title: t.financialConfig.period,
        dataIndex: 'period',
        key: 'period',
        width: 100,
        render: (period: FinancialPeriod, record: FinancialSource) => {
          const base = periodLabel(period);
          if (period === 'monthly' && record.dayOfMonth !== undefined) {
            return <Tag>{`${base} ${getDayOfMonthLabel(record.dayOfMonth, t)}`}</Tag>;
          }
          if (period === 'weekly' && record.dayOfWeek !== undefined) {
            return <Tag>{`${base} ${getDayOfWeekLabel(record.dayOfWeek, t)}`}</Tag>;
          }
          return <Tag>{base}</Tag>;
        },
      },
      {
        title: t.financialConfig.expectedReturn,
        dataIndex: 'expectedReturn',
        key: 'expectedReturn',
        width: 90,
        render: (value: number | undefined) => value !== undefined ? `${value}%` : '—',
      },
      {
        title: t.financialConfig.investmentType,
        dataIndex: 'investmentType',
        key: 'investmentType',
        width: 100,
        render: (value: InvestmentType | undefined) => investmentTypeLabel(value),
      },
      {
        title: t.financialConfig.action,
        key: 'action',
        width: 100,
        render: (_: unknown, record: FinancialSource) => (
          <Space size="small">
            <Button type="text" size="small" icon={<Pencil style={{ fontSize: 14 }} />} onClick={() => onEdit(record)} />
            <Popconfirm
              title={t.financialConfig.deleteConfirm}
              description={t.financialConfig.deleteMessage}
              onConfirm={() => onDelete(record.id)}
              okText={t.financialConfig.confirm}
              cancelText={t.financialConfig.cancel}
              okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<Delete style={{ fontSize: 14 }} />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [onEdit, onDelete, t]);
};
