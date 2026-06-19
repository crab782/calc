import { useState, useCallback } from 'react';
import { Button, Card, Space, Tag, Typography, Modal, Input, message } from 'antd';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../providers';
import { useCategories } from '../../../hooks/use-categories';

const { Text } = Typography;

export const CategoryTab = () => {
  const { t } = useLanguage();
  const { incomeCategories, expenseCategories, addCategory, deleteCategory } = useCategories();
  const [showAddCategory, setShowAddCategory] = useState<'income' | 'expense' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleAddCategory = useCallback(() => {
    if (!newCategoryName.trim() || !showAddCategory) return;
    addCategory({ name: newCategoryName.trim(), type: showAddCategory, icon: 'tag' });
    message.success(t.settings.addCategorySuccess);
    setNewCategoryName('');
    setShowAddCategory(null);
  }, [newCategoryName, showAddCategory, addCategory, t]);

  const handleDeleteCategory = useCallback((id: string) => {
    const result = deleteCategory(id);
    if (result.success) {
      message.success(t.settings.deleteCategorySuccess);
    } else {
      message.error(t.settings.categoryInUse);
    }
    setShowDeleteConfirm(null);
  }, [deleteCategory, t]);

  const renderCategorySection = (type: 'income' | 'expense') => {
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    const tagColor = type === 'income' ? 'green' : 'red';
    const addLabel = type === 'income' ? t.settings.addIncomeCategory : t.settings.addExpenseCategory;
    const sectionLabel = type === 'income' ? t.settings.incomeCategories : t.settings.expenseCategories;

    return (
      <div key={type}>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>{sectionLabel}</Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {categories.map((cat) => (
            <Tag
              key={cat.id}
              color={tagColor}
              closable
              onClose={() => setShowDeleteConfirm(cat.id)}
              style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {cat.name}
            </Tag>
          ))}
          <Button
            size="small"
            type="dashed"
            icon={<Plus className="w-3 h-3" />}
            onClick={() => setShowAddCategory(type)}
          >
            {addLabel}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card title={t.settings.categoryManagement} bordered={false}>
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {renderCategorySection('income')}
        {renderCategorySection('expense')}
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
    </Card>
  );
};
