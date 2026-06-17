import { useState, useMemo } from 'react';
import { Card, Button, Input, Space, Typography, Table, message, Alert, Tag } from 'antd';
import { RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRecords } from '../hooks/useRecords';
import { DEFAULT_EXCHANGE_RATES } from '../types/record';
import type { PageType } from '../types';

const { Title, Text } = Typography;

interface ExchangeRateRow {
  key: string;
  currency: string;
  rate: number;
  editRate?: string;
}

export const ExchangeRate = ({ onBack }: { onBack: (page: PageType) => void }) => {
  const { t } = useLanguage();
  const {
    exchangeRates,
    customCurrencies,
    updateExchangeRate,
    fetchExchangeRatesFromAPI,
    canFetchRatesFromAPI,
    accounts,
  } = useRecords();

  const [isEditing, setIsEditing] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(false);

  // 获取默认币种
  const defaultCurrency = useMemo(() => {
    const defaultAccount = accounts.find(a => a.isDefault);
    return defaultAccount?.currency || 'CNY';
  }, [accounts]);

  // 获取已启用的外币列表（非默认币种的可见账户）
  const enabledCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    accounts.forEach(a => {
      if (a.currency !== defaultCurrency && a.visible) {
        currencies.add(a.currency);
      }
    });
    // 添加自定义币种
    customCurrencies.forEach(c => currencies.add(c.code));
    return Array.from(currencies).sort();
  }, [accounts, defaultCurrency, customCurrencies]);

  // 构建表格数据
  const tableData: ExchangeRateRow[] = useMemo(() => {
    return enabledCurrencies.map(currency => ({
      key: currency,
      currency,
      rate: exchangeRates.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? 0,
      editRate: editingRates[currency] ?? '',
    }));
  }, [enabledCurrencies, exchangeRates, editingRates]);

  // 获取汇率来源文本
  const getSourceText = (source: string) => {
    switch (source) {
      case 'manual':
        return t.exchangeRate.sourceManual;
      case 'api':
        return t.exchangeRate.sourceApi;
      default:
        return t.exchangeRate.sourceDefault;
    }
  };

  // 格式化更新时间
  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 检查是否启用了多币种
  const hasMultiCurrency = enabledCurrencies.length > 0;

  // 处理编辑
  const handleStartEdit = () => {
    const initial: Record<string, string> = {};
    enabledCurrencies.forEach(currency => {
      initial[currency] = String(exchangeRates.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? '');
    });
    setEditingRates(initial);
    setIsEditing(true);
  };

  // 处理保存
  const handleSave = () => {
    const rates: Record<string, number> = {};
    for (const [currency, value] of Object.entries(editingRates)) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        message.error(t.exchangeRate.invalidRate);
        return;
      }
      rates[currency] = num;
    }
    updateExchangeRate(rates, defaultCurrency);
    message.success(t.exchangeRate.saveSuccess);
    setIsEditing(false);
    setEditingRates({});
  };

  // 处理取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRates({});
  };

  // 处理从 API 获取
  const handleFetchFromAPI = async () => {
    const canFetch = canFetchRatesFromAPI();
    if (!canFetch.allowed) {
      const hours = Math.ceil(canFetch.remainingHours);
      message.warning(t.exchangeRate.hoursLeft.replace('{hours}', String(hours)));
      return;
    }

    setIsFetching(true);
    try {
      const result = await fetchExchangeRatesFromAPI(defaultCurrency);
      if (result.success) {
        message.success(t.exchangeRate.fetchSuccess);
      } else {
        message.error(result.message || t.exchangeRate.fetchError);
      }
    } catch {
      message.error(t.exchangeRate.fetchError);
    } finally {
      setIsFetching(false);
    }
  };

  const columns = [
    {
      title: t.exchangeRate.currency,
      dataIndex: 'currency',
      key: 'currency',
      width: 120,
      render: (currency: string) => <Text strong>{currency}</Text>,
    },
    {
      title: t.exchangeRate.rate,
      dataIndex: 'rate',
      key: 'rate',
      width: 200,
      render: (_: number, record: ExchangeRateRow) => {
        if (isEditing) {
          return (
            <Input
              type="number"
              value={editingRates[record.currency] ?? ''}
              onChange={(e) =>
                setEditingRates(prev => ({ ...prev, [record.currency]: e.target.value }))
              }
              placeholder={`1 ${defaultCurrency} = ? ${record.currency}`}
              step="0.0001"
            />
          );
        }
        return <Text>{`1 ${defaultCurrency} = ${record.rate} ${record.currency}`}</Text>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <Button type="text" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => onBack('settings')}>
            {'返回'}
          </Button>
          <Title level={2} style={{ margin: 0 }}>{t.exchangeRate.title}</Title>
        </Space>
      </div>

      {!hasMultiCurrency ? (
        <Alert
          message={t.exchangeRate.noMultiCurrency}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {/* 汇率信息卡片 */}
          <Card
            title={t.exchangeRate.title}
            extra={
              <Space>
                {!isEditing ? (
                  <>
                    <Button
                      icon={<RefreshCw className="w-4 h-4" />}
                      onClick={handleFetchFromAPI}
                      loading={isFetching}
                      disabled={isFetching}
                    >
                      {t.exchangeRate.fetchFromAPI}
                    </Button>
                    <Button
                      type="primary"
                      icon={<Save className="w-4 h-4" />}
                      onClick={handleStartEdit}
                    >
                      {t.exchangeRate.manualEdit}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleCancelEdit}>
                      {t.exchangeRate.cancel}
                    </Button>
                    <Button
                      type="primary"
                      icon={<Save className="w-4 h-4" />}
                      onClick={handleSave}
                    >
                      {t.exchangeRate.save}
                    </Button>
                  </>
                )}
              </Space>
            }
          >
            <Space direction="vertical" size={8}>
              <div>
                <Text type="secondary">{t.exchangeRate.baseCurrency}: </Text>
                <Text strong>{defaultCurrency}</Text>
              </div>
              <div>
                <Text type="secondary">{t.exchangeRate.lastUpdate}: </Text>
                <Text>{formatLastUpdate(exchangeRates.lastUpdatedAt)}</Text>
              </div>
              <div>
                <Text type="secondary">{t.exchangeRate.source}: </Text>
                <Tag color={exchangeRates.source === 'api' ? 'green' : exchangeRates.source === 'manual' ? 'blue' : 'default'}>
                  {getSourceText(exchangeRates.source)}
                </Tag>
              </div>
            </Space>
          </Card>

          {/* 汇率表格 */}
          <Card bordered={false}>
            <Table
              dataSource={tableData}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Space>
      )}
    </div>
  );
};
