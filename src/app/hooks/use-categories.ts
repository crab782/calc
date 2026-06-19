import { useState, useCallback, useMemo } from 'react';
import type { Category } from '../../types/record';
import { recordService } from '../../data/service';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => recordService.getCategories());

  const incomeCategories = useMemo(
    () => categories.filter(c => c.type === 'income'),
    [categories],
  );

  const expenseCategories = useMemo(
    () => categories.filter(c => c.type === 'expense'),
    [categories],
  );

  const addCategory = useCallback((category: Omit<Category, 'id'> & { id?: string }) => {
    recordService.addCategory(category);
    setCategories(recordService.getCategories());
  }, []);

  const updateCategory = useCallback((category: Category) => {
    recordService.updateCategory(category);
    setCategories(recordService.getCategories());
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const result = recordService.deleteCategory(id);
    if (result.success) {
      setCategories(recordService.getCategories());
    }
    return result;
  }, []);

  const refresh = useCallback(() => {
    setCategories(recordService.getCategories());
  }, []);

  return {
    categories,
    incomeCategories,
    expenseCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh,
  };
}
