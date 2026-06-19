import { useMemo } from 'react';
import { Tag, Typography, Button, Popconfirm, Space } from 'antd';
import { Pencil, Delete } from 'lucide-react';
import type { TableColumnsType } from 'antd';
import type { FinancialSource, FinancialPeriod } from '../../../../../types/record';
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

interface IncomeColumnsProps {
  onEdit: (source: FinancialSource) => void;
  onDelete: (id: string) => void;
}

export const useIncomeColumns = ({ onEdit, onDelete }: IncomeColumnsProps) => {
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

    return [
      {
        title: t.financialConfig.name,
        dataIndex: 'name',
        key: 'name',
        width: 150,
        render: (text: string) => <Text strong>{text}</Text>,
      },
      {
        title: t.financialConfig.currency,
        dataIndex: 'currency',
        key: 'currency',
        width: 80,
      },
      {
        title: t.financialConfig.amount,
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        render: (amount: number, record: FinancialSource) => (
          <Text strong>{CURRENCY_SYMBOLS[record.currency] || ''}{amount.toFixed(2)}</Text>
        ),
      },
      {
        title: t.financialConfig.period,
        dataIndex: 'period',
        key: 'period',
        width: 120,
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
        title: t.financialConfig.monthlyAmount,
        key: 'monthly',
        width: 120,
        render: (_: unknown, record: FinancialSource) => {
          let monthly = 0;
          switch (record.period) {
            case 'daily': monthly = record.amount * 30; break;
            case 'weekly': monthly = record.amount * 4; break;
            case 'monthly': monthly = record.amount; break;
            case 'yearly': monthly = record.amount / 12; break;
            default: break;
          }
          return monthly > 0 ? (
            <Text>{CURRENCY_SYMBOLS[record.currency] || ''}{monthly.toFixed(2)}</Text>
          ) : (
            <Text type="secondary">—</Text>
          );
        },
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
