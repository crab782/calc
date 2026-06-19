import type { Category } from '../types/record';
import type { RecordDAO } from './storage/index';

export function getCategories(dao: RecordDAO): Category[] {
  return dao.getCategories();
}

export function getIncomeCategories(dao: RecordDAO): Category[] {
  return dao.getCategories().filter((c) => c.type === 'income');
}

export function getExpenseCategories(dao: RecordDAO): Category[] {
  return dao.getCategories().filter((c) => c.type === 'expense');
}

export function generateCategoryId(type: 'income' | 'expense'): string {
  const prefix = type === 'income' ? 'inc' : 'exp';
  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  return `${prefix}-${id}`;
}

export function addCategory(dao: RecordDAO, category: Omit<Category, 'id'> & { id?: string }): Category {
  const newCategory: Category = {
    ...category,
    id: category.id || generateCategoryId(category.type),
  };
  dao.addCategory(newCategory);
  return newCategory;
}

export function deleteCategory(dao: RecordDAO, id: string): { success: boolean; message: string } {
  const records = dao.findAll();
  const categoryInUse = records.some((r) => r.category === id);

  if (categoryInUse) {
    return { success: false, message: '该分类正在被使用，无法删除' };
  }

  dao.deleteCategory(id);
  return { success: true, message: '分类删除成功' };
}

export function updateCategory(dao: RecordDAO, category: Category): void {
  dao.updateCategory(category);
}
