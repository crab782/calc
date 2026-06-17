import { useState, useRef } from 'react';
import { Card, Button, Typography, Space, Tag, message, Modal, Input, Divider, Alert, Popconfirm } from 'antd';
import { Download, Upload, Trash2, Plus, Sun, Moon, Monitor, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRecords } from '../hooks/useRecords';
import { recordService } from '../lib/record';

const { Title, Text } = Typography;

export const Settings = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { count, refresh, incomeCategories, expenseCategories, addCategory, deleteCategory } = useRecords();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState<'income' | 'expense' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>{t.settings.title}</Title>
        <Button onClick={toggleLanguage} icon={<Globe className="w-4 h-4" />}>
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
