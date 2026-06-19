import { loadFromStorage, saveToStorage, clearStorage } from './local';

/**
 * 存储适配器接口
 * 提供统一的 CRUD 操作，屏蔽底层存储实现细节
 */
export interface StorageAdapter {
  /**
   * 读取存储中的原始字符串数据
   */
  read(): string | null;

  /**
   * 写入字符串数据到存储
   */
  write(data: string): void;

  /**
   * 清除存储中的所有数据
   */
  clear(): void;
}

/**
 * 基于 localStorage 的存储适配器实现
 */
export class LocalStorageAdapter implements StorageAdapter {
  read(): string | null {
    return loadFromStorage();
  }

  write(data: string): void {
    saveToStorage(data);
  }

  clear(): void {
    clearStorage();
  }
}

/**
 * 默认的存储适配器实例
 */
export const storageAdapter: StorageAdapter = new LocalStorageAdapter();
