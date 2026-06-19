import type { DataSchema } from '../../types/record';

/**
 * 内存缓存存储
 * 用于避免频繁读写 localStorage 造成的性能开销
 */
class CacheStore {
  private cache: DataSchema | null = null;
  private version: string | null = null;

  /**
   * 获取缓存的数据
   */
  get(): DataSchema | null {
    return this.cache;
  }

  /**
   * 设置缓存数据
   */
  set(data: DataSchema): void {
    this.cache = data;
    this.version = data.version;
  }

  /**
   * 使缓存失效
   */
  invalidate(): void {
    this.cache = null;
    this.version = null;
  }

  /**
   * 获取缓存数据的版本
   */
  getVersion(): string | null {
    return this.version;
  }
}

export const cacheStore = new CacheStore();
