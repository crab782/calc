import { useState, useCallback, useMemo } from 'react';
import { Button, Card, Space, Tag, Typography, Modal, Input, Checkbox, message } from 'antd';
import { Plus, X, Coins } from 'lucide-react';
import { useLanguage } from '../../../providers';
import { useCurrencies } from '../../../hooks/use-currencies';
import { useAccounts } from '../../../hooks/use-accounts';
import { useRecords } from '../../../hooks/use-records';

const { Text } = Typography;

const FOREIGN_CURRENCIES = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
];

export const CurrencyTab = () => {
  const { t } = useLanguage();
  const { customCurrencies, addCustomCurrency, deleteCustomCurrency } = useCurrencies();
  const { records } = useRecords();
  const { accounts } = useAccounts(records);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showAddCustomCurrency, setShowAddCustomCurrency] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');

  const availableCurrencies = useMemo(
    () => Array.from(new Set(accounts.map(a => a.currency))),
    [accounts],
  );

  const isCurrencyEnabled = useCallback((currency: string) =>
    accounts.some(a => a.currency === currency && a.visible === true),
    [accounts],
  );

  const handleCurrencyToggle = useCallback((currency: string, enabled: boolean) => {
    if (enabled) {
      message.success(`${currency} 币种已启用`);
    } else {
      message.warning(`${currency} 币种已禁用`);
    }
  }, []);

  const handleAddCustomCurrency = useCallback(() => {
    const code = newCurrencyCode.trim().toUpperCase();
    const name = newCurrencyName.trim();
    if (!code || !name) {
      message.error('请输入货币代码和名称');
      return;
    }
    if (availableCurrencies.some(c => c.toUpperCase() === code)) {
      message.error('该货币代码已存在');
      return;
    }
    addCustomCurrency({ code, name });
    message.success(`自定义货币 ${name} (${code}) 已添加`);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setShowAddCustomCurrency(false);
  }, [newCurrencyCode, newCurrencyName, availableCurrencies, addCustomCurrency]);

  const handleDeleteCustomCurrency = useCallback((code: string) => {
    deleteCustomCurrency(code);
    message.success('自定义货币已删除');
  }, [deleteCustomCurrency]);

  const handleModalClose = useCallback(() => {
    setShowCurrencyModal(false);
    setShowAddCustomCurrency(false);
    setNewCurrencyCode('');
    setNewCurrencyName('');
  }, []);

  const enabledForeign = FOREIGN_CURRENCIES.filter(fc => isCurrencyEnabled(fc.value)).map(fc => fc.value);

  return (
    <Card
      title={t.settings.currencyManagement}
      bordered={false}
      extra={
        <Button icon={<Coins className="w-4 h-4" />} onClick={() => setShowCurrencyModal(true)}>
          {t.settings.manageCurrencies}
        </Button>
      }
    >
      <Text type="secondary">
        {t.settings.foreignCurrencies}: {enabledForeign.join(', ') || '无'}
        {customCurrencies.length > 0 && (
          <>, {t.settings.customCurrencies}: {customCurrencies.map(c => c.code).join(', ')}</>
        )}
      </Text>

      {/* 币种管理弹窗 */}
      <Modal
        title={t.settings.currencyManagement}
        open={showCurrencyModal}
        onCancel={handleModalClose}
        footer={<Button onClick={handleModalClose}>{t.settings.cancel}</Button>}
      >
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 12 }}>{t.settings.foreignCurrencies}</Text>
          <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 24 }}>
            {FOREIGN_CURRENCIES.map((fc) => (
              <Checkbox
                key={fc.value}
                checked={isCurrencyEnabled(fc.value)}
                onChange={(e) => handleCurrencyToggle(fc.value, e.target.checked)}
              >
                {fc.label}
              </Checkbox>
            ))}
          </Space>

          <Text strong style={{ display: 'block', marginBottom: 12 }}>{t.settings.customCurrencies}</Text>
          {customCurrencies.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {customCurrencies.map((c) => (
                <Tag
                  key={c.code}
                  closable
                  onClose={() => handleDeleteCustomCurrency(c.code)}
                  color="blue"
                  style={{ padding: '4px 8px' }}
                >
                  {c.name} ({c.code})
                </Tag>
              ))}
            </div>
          ) : (
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>{t.settings.noCustomCurrencies}</Text>
          )}
          {!showAddCustomCurrency ? (
            <Button
              type="dashed"
              icon={<Plus className="w-3 h-3" />}
              onClick={() => setShowAddCustomCurrency(true)}
              style={{ width: '100%' }}
            >
              {t.settings.addCustomCurrency}
            </Button>
          ) : (
            <Space style={{ width: '100%' }}>
              <Input
                placeholder={t.settings.currencyCode}
                value={newCurrencyCode}
                onChange={(e) => setNewCurrencyCode(e.target.value.toUpperCase())}
                style={{ width: 100 }}
                maxLength={5}
              />
              <Input
                placeholder={t.settings.currencyName}
                value={newCurrencyName}
                onChange={(e) => setNewCurrencyName(e.target.value)}
                style={{ flex: 1 }}
              />
              <Button type="primary" onClick={handleAddCustomCurrency}>{t.settings.addCustomCurrency}</Button>
              <Button onClick={handleModalClose} icon={<X className="w-3 h-3" />}>{t.settings.cancel}</Button>
            </Space>
          )}
        </div>
      </Modal>
    </Card>
  );
};
