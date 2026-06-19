const STORAGE_KEY = 'expense_tracker_data';

/**
 * 从 localStorage 加载原始 JSON 字符串
 */
export function loadFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * 将 JSON 字符串保存到 localStorage
 */
export function saveToStorage(data: string): void {
  localStorage.setItem(STORAGE_KEY, data);
}

/**
 * 清除 localStorage 中的数据
 */
export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}
