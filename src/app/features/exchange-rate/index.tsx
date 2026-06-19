import { useState, useMemo } from 'react';
import { Card, Button, Input, Space, Typography, Table, message, Alert, Tag } from 'antd';
import { RefreshCw, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrencies } from '../../hooks/use-currencies';
import { useRecords } from '../../hooks/use-records';
import { ROUTES } from '../../router/routes';
import { DEFAULT_EXCHANGE_RATES, type Account } from '../../../types/record';
import { recordService } from '../../../data/service';

const { Title, Text } = Typography;

interface ExchangeRateRow {
  key: string;
  currency: string;
  rate: number;
}

export function ExchangeRatePage() {
  const navigate = useNavigate();
  const { exchangeRates, customCurrencies, updateExchangeRate, fetchExchangeRatesFromAPI, canFetchRatesFromAPI } = useCurrencies();
  useRecords();
  const accounts: Account[] = useMemo(() => recordService.getAccounts(), []);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [isFetching, setIsFetching] = useState(false);

  const defaultCurrency = useMemo(() => {
    const defaultAccount = accounts.find(a => a.isDefault);
    return defaultAccount?.currency || 'CNY';
  }, [accounts]);

  const enabledCurrencies = useMemo(() => {
    const currencies = new Set<string>();
    accounts.forEach(a => {
      if (a.currency !== defaultCurrency && a.visible) currencies.add(a.currency);
    });
    customCurrencies.forEach(c => currencies.add(c.code));
    return Array.from(currencies).sort();
  }, [accounts, defaultCurrency, customCurrencies]);

  const tableData: ExchangeRateRow[] = useMemo(() =>
    enabledCurrencies.map(currency => ({
      key: currency,
      currency,
      rate: exchangeRates.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? 0,
    })),
    [enabledCurrencies, exchangeRates],
  );

  const handleStartEdit = () => {
    const initial: Record<string, string> = {};
    enabledCurrencies.forEach(currency => {
      initial[currency] = String(exchangeRates.rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? '');
    });
    setEditingRates(initial);
    setIsEditing(true);
  };

  const handleSave = () => {
    const rates: Record<string, number> = {};
    for (const [currency, value] of Object.entries(editingRates)) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) { message.error('汇率无效'); return; }
      rates[currency] = num;
    }
    updateExchangeRate(rates, defaultCurrency);
    message.success('保存成功');
    setIsEditing(false);
    setEditingRates({});
  };

  const handleFetchFromAPI = async () => {
    const canFetch = canFetchRatesFromAPI();
    if (!canFetch.allowed) {
      message.warning(`请等待 ${Math.ceil(canFetch.remainingHours)} 小时后再次获取`);
      return;
    }
    setIsFetching(true);
    try {
      const result = await fetchExchangeRatesFromAPI(defaultCurrency);
      message.success(result.success ? result.message : result.message);
    } finally {
      setIsFetching(false);
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getSourceText = (source: string) => {
    switch (source) {
      case 'manual': return '手动';
      case 'api': return 'API';
      default: return '默认';
    }
  };

  const columns = useMemo(() => {
    const cols = [
      {
        title: '币种',
        dataIndex: 'currency',
        key: 'currency',
        width: 120,
        render: (currency: string) => <Text strong>{currency}</Text>,
      },
      {
        title: '汇率',
        dataIndex: 'rate',
        key: 'rate',
        width: 200,
        render: (_: number, record: ExchangeRateRow) => {
          if (isEditing) {
            return (
              <Input
                type="number"
                value={editingRates[record.currency] ?? ''}
                onChange={(e) => setEditingRates(prev => ({ ...prev, [record.currency]: e.target.value }))}
                placeholder={`1 ${defaultCurrency} = ? ${record.currency}`}
                step="0.0001"
              />
            );
          }
          return <Text>{`1 ${defaultCurrency} = ${record.rate} ${record.currency}`}</Text>;
        },
      },
    ];
    return cols;
  }, [isEditing, editingRates, defaultCurrency]);

  const hasMultiCurrency = enabledCurrencies.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button type="text" icon={<ArrowLeft size={16} />} onClick={() => navigate(ROUTES.SETTINGS)}>
            返回
          </Button>
          <Title level={4} style={{ margin: 0 }}>汇率管理</Title>
        </Space>
      </div>

      {!hasMultiCurrency ? (
        <Alert message="未启用多币种功能" type="info" showIcon style={{ marginBottom: 16 }} />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card
            title="汇率信息"
            extra={
              <Space>
                {!isEditing ? (
                  <>
                    <Button icon={<RefreshCw size={14} />} onClick={handleFetchFromAPI} loading={isFetching}>
                      从 API 获取
                    </Button>
                    <Button type="primary" icon={<Save size={14} />} onClick={handleStartEdit}>
                      手动编辑
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => { setIsEditing(false); setEditingRates({}); }}>取消</Button>
                    <Button type="primary" icon={<Save size={14} />} onClick={handleSave}>保存</Button>
                  </>
                )}
              </Space>
            }
          >
            <Space direction="vertical" size={8}>
              <div><Text type="secondary">基准币种: </Text><Text strong>{defaultCurrency}</Text></div>
              <div><Text type="secondary">最后更新: </Text><Text>{formatLastUpdate(exchangeRates.lastUpdatedAt)}</Text></div>
              <div>
                <Text type="secondary">汇率来源: </Text>
                <Tag color={exchangeRates.source === 'api' ? 'green' : exchangeRates.source === 'manual' ? 'blue' : 'default'}>
                  {getSourceText(exchangeRates.source)}
                </Tag>
              </div>
            </Space>
          </Card>

          <Card bordered={false}>
            <Table dataSource={tableData} columns={columns} pagination={false} size="small" />
          </Card>
        </Space>
      )}
    </div>
  );
}
