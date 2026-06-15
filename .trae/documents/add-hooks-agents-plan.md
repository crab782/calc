# 添加 Hooks 目录和生成 AGENTS.md - 实现计划

## 需求分析

用户希望：
1. 添加 `hooks/` 目录，创建自定义 React Hooks 来管理记账数据状态
2. 生成 `AGENTS.md` 文档，记录项目框架和目录结构

## 当前项目结构

```
src/
├── components/
│   ├── Sidebar.tsx
│   └── MonthlyChart.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── AddRecord.tsx
│   └── Settings.tsx
├── lib/
│   ├── storage.ts
│   └── record.ts
└── types/
    ├── index.ts
    └── record.ts
```

## 实现步骤

### 1. 创建 hooks 目录和文件

创建自定义 React Hooks 来管理数据状态：
- `useRecords.ts` - 管理记账记录的状态和操作
- `useStatistics.ts` - 管理统计数据

### 2. 更新组件使用 hooks

更新页面组件以使用新的 hooks：
- Dashboard.tsx
- AddRecord.tsx
- Settings.tsx

### 3. 生成 AGENTS.md 文档

创建项目文档，包含：
- 项目概述
- 技术栈
- 目录结构
- 数据模型
- 核心功能

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/hooks/useRecords.ts` | 新建 | 记录管理 hook |
| `src/hooks/useStatistics.ts` | 新建 | 统计数据 hook |
| `src/pages/Dashboard.tsx` | 修改 | 使用 hooks |
| `src/pages/AddRecord.tsx` | 修改 | 使用 hooks |
| `src/pages/Settings.tsx` | 修改 | 使用 hooks |
| `AGENTS.md` | 新建 | 项目文档 |

## 技术实现要点

### Hooks 设计

```typescript
// useRecords hook 提供：
// - records: ExpenseRecord[] - 记录列表
// - addRecord: (data) => void - 添加记录
// - deleteRecord: (id) => void - 删除记录
// - refresh: () => void - 刷新数据

// useStatistics hook 提供：
// - statistics: Statistics - 统计数据
// - monthlyData: MonthlyData[] - 月度数据
```

### AGENTS.md 结构

```markdown
# 项目名称 - AGENTS.md

## 1. 项目概述
## 2. 技术栈
## 3. 目录结构
## 4. 数据模型
## 5. 核心功能
## 6. 开发指南
## 7. 部署说明
```

## 完成后测试要点

1. hooks 是否正确获取和更新数据
2. 组件使用 hooks 后功能是否正常
3. AGENTS.md 文档是否完整清晰
