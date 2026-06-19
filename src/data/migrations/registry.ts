interface Migration {
  from: string;
  to: string;
  migrate: (data: any) => any;
}

const migrations: Migration[] = [];

/**
 * 注册一个迁移规则
 */
export function registerMigration(migration: Migration): void {
  migrations.push(migration);
}

/**
 * 获取所有已注册的迁移规则
 */
export function getMigrations(): Migration[] {
  return [...migrations];
}

/**
 * 按顺序执行迁移，直到数据版本达到最新
 */
export function runMigrations(data: any): any {
  let currentData = data;

  // 循环查找并执行迁移，直到没有可执行的迁移为止
  let migrated = true;
  while (migrated) {
    migrated = false;
    for (const migration of migrations) {
      if (currentData.version === migration.from) {
        currentData = migration.migrate(currentData);
        migrated = true;
        break; // 每次只执行一个迁移，然后重新开始查找
      }
    }
  }

  return currentData;
}
