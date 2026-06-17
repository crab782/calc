import { useState, useRef } from 'react';
import { Card, Button, Typography, Space, Tag, message, Modal, Input, Divider, Alert, Popconfirm, Checkbox } from 'antd';
import { Download, Upload, Trash2, Plus, Sun, Moon, Monitor, Globe, Coins, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../hooks/useRecords';
import { recordService } from '../lib/record';

const { Title, Text } = Typography;

// 预设外币列表（用于币种管理弹窗）
const FOREIGN_CURRENCIES = [
  { value: 'USD', label: '美元 (USD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'GBP', label: '英镑 (GBP)' },
  { value: 'JPY', label: '日元 (JPY)' },
];

export const Settings = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { count, refresh, incomeCategories, expenseCategories, addCategory, deleteCategory, accounts, enableCurrency, disableCurrency, customCurrencies, addCustomCurrency, deleteCustomCurrency } = useRecords();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState<'income' | 'expense' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 币种管理弹窗
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showAddCustomCurrency, setShowAddCustomCurrency] = useState(false);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');

  // 获取所有可用币种（去重）
  const availableCurrencies = Array.from(new Set(accounts.map(a => a.currency)));

  // 检查外币是否启用
  const isCurrencyEnabled = (currency: string): boolean => {
    return accounts.some(a => a.currency === currency && a.visible === true);
  };

  // 处理外币启用/禁用
  const handleCurrencyToggle = (currency: string, enabled: boolean) => {
    if (enabled) {
      enableCurrency(currency);
      message.success(`${currency} 币种已启用`);
    } else {
      const result = disableCurrency(currency);
      if (result.success) {
        message.success(`${currency} 币种已禁用`);
      } else {
        message.error(result.message);
      }
    }
  };

  // 添加自定义货币
  const handleAddCustomCurrency = () => {
    const code = newCurrencyCode.trim().toUpperCase();
    const name = newCurrencyName.trim();
    if (!code || !name) {
      message.error('请输入货币代码和名称');
      return;
    }
    if (availableCurrencies.includes(code)) {
      message.error('该货币代码已存在');
      return;
    }
    addCustomCurrency({ code, name });
    message.success(`自定义货币 ${name} (${code}) 已添加`);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setShowAddCustomCurrency(false);
  };

  // 删除自定义货币
  const handleDeleteCustomCurrency = (code: string) => {
    deleteCustomCurrency(code);
    message.success('自定义货币已删除');
  };

  const handleExport = () => {
    const jsonData = recordService.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'account-book.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    message.success(t.settings.exportSuccess);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (count > 0) {
      const confirmText = t.settings.importConfirm.replace('{count}', String(count));
      if (!confirm(confirmText)) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const importResult = recordService.importData(result);

      if (importResult.success) {
        message.success(t.settings.importSuccess);
        refresh();
      } else {
        message.error(t.settings.importError);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearData = () => {
    recordService.deleteAllRecords();
    refresh();
    message.success(t.settings.clearSuccess);
    setShowConfirmClear(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || !showAddCategory) return;

    addCategory({
      name: newCategoryName.trim(),
      type: showAddCategory,
      icon: 'tag',
    });

    message.success(t.settings.addCategorySuccess);
    setNewCategoryName('');
    setShowAddCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    const result = deleteCategory(id);
    if (result.success) {
      message.success(t.settings.deleteCategorySuccess);
    } else {
      message.error(t.settings.categoryInUse);
    }
    setShowDeleteConfirm(null);
  };

  const themeOptions = [
    { key: 'light' as const, icon: <Sun className="w-6 h-6" style={{ color: '#eab308' }} />, label: t.settings.lightMode },
    { key: 'dark' as const, icon: <Moon className="w-6 h-6" style={{ color: '#6366f1' }} />, label: t.settings.darkMode },
    { key: 'system' as const, icon: <Monitor className="w-6 h-6" style={{ color: '#6b7280' }} />, label: t.settings.systemMode },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>{t.settings.title}</Title>
        <Button size="small" onClick={toggleLanguage} icon={<Globe className="w-4 h-4" />}>
          {language === 'zh' ? 'EN' : '中文'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {/* 外观（主题）区块 */}
        <Card title={t.settings.appearance} bordered={false}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
            {themeOptions.map((option) => (
              <Button
                key={option.key}
                type={theme === option.key ? 'primary' : 'default'}
                onClick={() => setTheme(option.key)}
                style={{
                  height: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {option.icon}
                <Text>{option.label}</Text>
              </Button>
            ))}
          </div>
        </Card>

        {/* 分类管理区块 */}
        <Card title={t.settings.categoryManagement} bordered={false}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* 收入分类 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>{t.settings.incomeCategories}</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {incomeCategories.map((category) => (
                  <Tag
                    key={category.id}
                    color="green"
                    style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    closable
                    onClose={() => setShowDeleteConfirm(category.id)}
                  >
                    {category.name}
                  </Tag>
                ))}
                <Button
                  size="small"
                  type="dashed"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => setShowAddCategory('income')}
                >
                  {t.settings.addIncomeCategory}
                </Button>
              </div>
            </div>

            {/* 支出分类 */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>{t.settings.expenseCategories}</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {expenseCategories.map((category) => (
                  <Tag
                    key={category.id}
                    color="red"
                    style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    closable
                    onClose={() => setShowDeleteConfirm(category.id)}
                  >
                    {category.name}
                  </Tag>
                ))}
                <Button
                  size="small"
                  type="dashed"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => setShowAddCategory('expense')}
                >
                  {t.settings.addExpenseCategory}
                </Button>
              </div>
            </div>
          </Space>
        </Card>

        {/* 币种管理区块 */}
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
            {t.settings.foreignCurrencies}: {FOREIGN_CURRENCIES.filter(fc => isCurrencyEnabled(fc.value)).map(fc => fc.value).join(', ') || '无'}
            {customCurrencies.length > 0 && (
              <>, {t.settings.customCurrencies}: {customCurrencies.map(c => c.code).join(', ')}</>
            )}
          </Text>
        </Card>

        {/* 数据管理区块 */}
        <Card title={t.settings.dataManagement} bordered={false}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--ant-color-fill-alter)', borderRadius: 8 }}>
              <Text type="secondary">{t.settings.currentRecords}</Text>
              <Text strong style={{ fontSize: 20 }}>{count}</Text>
            </div>

            <Space size={12} style={{ width: '100%' }}>
              <Button
                type="primary"
                danger={false}
                icon={<Download className="w-4 h-4" />}
                onClick={handleExport}
                style={{ flex: 1 }}
              >
                {t.settings.exportData}
              </Button>
              <Button
                type="primary"
                icon={<Upload className="w-4 h-4" />}
                onClick={handleImportClick}
                style={{ flex: 1 }}
              >
                {t.settings.importData}
              </Button>
            </Space>

            <Divider style={{ margin: '8px 0' }} />

            <Popconfirm
              title={t.settings.clearConfirm}
              description={t.settings.clearMessage}
              onConfirm={handleClearData}
              okText={t.settings.confirmClear}
              cancelText={t.settings.cancel}
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<Trash2 className="w-4 h-4" />} size="small">
                {t.settings.clearData}
              </Button>
            </Popconfirm>
          </Space>
        </Card>

        <Alert
          type="info"
          title={t.settings.importExportInfo}
          description={
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              <li>{t.settings.info1}</li>
              <li>{t.settings.info2}</li>
              <li>{t.settings.info3}</li>
              <li>{t.settings.info4}</li>
            </ul>
          }
        />
      </Space>

      {/* 币种管理弹窗 */}
      <Modal
        title={t.settings.currencyManagement}
        open={showCurrencyModal}
        onCancel={() => { setShowCurrencyModal(false); setShowAddCustomCurrency(false); setNewCurrencyCode(''); setNewCurrencyName(''); }}
        footer={
          <Button onClick={() => { setShowCurrencyModal(false); setShowAddCustomCurrency(false); setNewCurrencyCode(''); setNewCurrencyName(''); }}>
            {t.settings.cancel}
          </Button>
        }
      >
        <div style={{ marginTop: 16 }}>
          {/* 预设外币 */}
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

          {/* 自定义币种 */}
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
              <Button type="primary" onClick={handleAddCustomCurrency}>
                {t.settings.addCustomCurrency}
              </Button>
              <Button onClick={() => { setShowAddCustomCurrency(false); setNewCurrencyCode(''); setNewCurrencyName(''); }} icon={<X className="w-3 h-3" />}>
                {t.settings.cancel}
              </Button>
            </Space>
          )}
        </div>
      </Modal>

      {/* 添加分类弹窗 */}
      <Modal
        title={showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory}
        open={!!showAddCategory}
        onCancel={() => { setShowAddCategory(null); setNewCategoryName(''); }}
        onOk={handleAddCategory}
        okText={showAddCategory === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory}
        cancelText={t.settings.cancel}
      >
        <Input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder={t.settings.categoryNamePlaceholder}
          autoFocus
          onPressEnter={handleAddCategory}
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* 删除分类确认弹窗 */}
      <Modal
        title={t.settings.deleteCategory}
        open={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onOk={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}
        okText={t.settings.confirmClear}
        cancelText={t.settings.cancel}
        okButtonProps={{ danger: true }}
      >
        <p>{t.settings.deleteCategoryConfirm}</p>
      </Modal>

      {/* 清空数据确认弹窗 */}
      <Modal
        title={t.settings.clearConfirm}
        open={showConfirmClear}
        onCancel={() => setShowConfirmClear(false)}
        onOk={handleClearData}
        okText={t.settings.confirmClear}
        cancelText={t.settings.cancel}
        okButtonProps={{ danger: true }}
      >
        <p>{t.settings.clearMessage}</p>
      </Modal>
    </div>
  );
};
