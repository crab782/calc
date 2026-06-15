# Expense Tracker - AGENTS.md

## 1. 项目概述

一个基于 React + TypeScript + Vite 构建的轻量级记账工具，数据存储在浏览器 localStorage 中，可打包为静态文件托管到 GitHub Pages。

### 核心功能
- ✅ 记账记录管理（添加、删除）
- ✅ 收支统计展示
- ✅ 月度收支趋势图表（ECharts）
- ✅ 数据导入导出（JSON 格式）
- ✅ 数据版本管理与迁移

---

## 2. 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19.x |
| 语言 | TypeScript | 6.x |
| 构建工具 | Vite | 8.x |
| 样式 | TailwindCSS | 3.x |
| 图表 | ECharts | 5.x |
| 图标 | Lucide React | ^0.x |
| 存储 | localStorage | 浏览器内置 |

---

## 3. 目录结构

```
src/
├── components/          # 可复用 UI 组件
│   ├── Sidebar.tsx      # 侧边导航栏
│   └── MonthlyChart.tsx # 月度收支趋势图表
├── pages/               # 页面级组件
│   ├── Dashboard.tsx    # 总览页（统计卡片、交易列表）
│   ├── AddRecord.tsx    # 添加记账记录页
│   └── Settings.tsx     # 设置页（导入导出）
├── hooks/               # 自定义 React Hooks
│   ├── useRecords.ts    # 记录管理 Hook
│   └── useStatistics.ts # 统计数据 Hook
├── lib/                 # 工具函数与业务逻辑
│   ├── storage.ts       # localStorage 操作封装
│   └── record.ts        # 记录相关业务逻辑
├── types/               # TypeScript 类型定义
│   ├── index.ts         # 通用类型（PageType）
│   └── record.ts        # 记录相关类型定义
├── App.tsx              # 应用入口组件
├── main.tsx             # React 渲染入口
└── index.css            # 全局样式（Tailwind）
```

### 目录职责说明

| 目录 | 职责 | 特征 |
|------|------|------|
| `components/` | UI 组件 | 无状态或轻状态，可复用 |
| `pages/` | 页面容器 | 组合组件，处理页面级逻辑 |
| `hooks/` | 状态管理 | React Hooks，封装状态和操作 |
| `lib/` | 工具函数 | 纯函数，无 React 依赖 |
| `types/` | 类型定义 | TypeScript 接口和类型 |

---

## 4. 数据模型

### 4.1 核心数据结构

#### ExpenseRecord（记账记录）

| 字段名 | 类型 | 说明 | 必填 |
|--------|------|------|------|
| `id` | string | 唯一标识 | ✅ |
| `type` | 'income' \| 'expense' | 类型：收入/支出 | ✅ |
| `amount` | number | 金额（正数） | ✅ |
| `category` | string | 分类名称 | ✅ |
| `note` | string | 备注 | ❌ |
| `date` | string | 日期（YYYY-MM-DD） | ✅ |
| `createdAt` | number | 创建时间戳 | ✅ |

#### Category（分类）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | string | 唯一标识 |
| `name` | string | 分类名称 |
| `type` | 'income' \| 'expense' | 类型 |
| `icon` | string | 图标名称 |

#### DataSchema（存储结构）

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `version` | string | 数据版本号 |
| `records` | ExpenseRecord[] | 记录列表 |
| `categories` | Category[] | 分类配置 |
| `createdAt` | number | 创建时间 |
| `updatedAt` | number | 更新时间 |

### 4.2 默认分类

**收入分类**：工资、奖金、投资收益、兼职、其他收入

**支出分类**：餐饮、交通、购物、娱乐、医疗、教育、房租、水电费、其他支出

---

## 5. 核心功能

### 5.1 记账记录管理

```typescript
// useRecords Hook 提供的方法
const { records, addRecord, deleteRecord, refresh, getRecentRecords, count } = useRecords();
```

### 5.2 统计数据

```typescript
// useStatistics Hook 提供的方法
const { statistics, monthlyData, refresh, formatCurrency, formatDate } = useStatistics();

// statistics 结构
{
  totalIncome: number,  // 总收入
  totalExpense: number, // 总支出
  balance: number       // 结余
}

// monthlyData 结构
{
  month: string,    // YYYY-MM
  income: number,   // 当月收入
  expense: number   // 当月支出
}
```

### 5.3 数据导入导出

```typescript
// 导出数据
const jsonData = recordService.exportData();

// 导入数据
const result = recordService.importData(jsonString);
// 返回: { success: boolean, message: string }
```

---

## 6. 开发指南

### 6.1 安装依赖

```bash
npm install
```

### 6.2 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:5173

### 6.3 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 6.4 代码检查

```bash
npm run lint
```

---

## 7. 部署说明

### 7.1 GitHub Pages 部署

1. 构建项目：`npm run build`
2. 将 `dist/` 目录内容推送到 GitHub Pages

### 7.2 注意事项

- **路径配置**：如果部署在子路径（如 `https://username.github.io/repo-name/`），需配置 `vite.config.ts` 的 `base` 选项
- **数据存储**：数据存储在浏览器 localStorage，不同浏览器/设备数据不互通
- **数据备份**：建议定期导出数据备份

---

## 8. 数据存储说明

### localStorage Key

```
expense_tracker_data
```

### 存储格式

```json
{
  "version": "1.0.0",
  "records": [...],
  "categories": [...],
  "createdAt": 1718428800000,
  "updatedAt": 1718428800000
}
```

---

## 9. 版本迁移

项目支持数据版本迁移，当数据结构升级时会自动迁移旧版本数据。

当前版本：`1.0.0`

---

## 10. 团队协作规范

### 10.1 代码风格

- 使用 TypeScript 严格模式
- 变量命名：驼峰式（camelCase）
- 文件命名：短横线分隔（kebab-case）
- 组件命名：帕斯卡式（PascalCase）

### 10.2 提交规范

```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建/工具更新
```

---

## 11. 扩展建议

### 待添加功能

- [ ] 分类管理（自定义分类）
- [ ] 标签功能
- [ ] 预算管理
- [ ] 数据可视化（饼图、柱状图）
- [ ] 移动端适配

### 技术优化

- [ ] 添加单元测试
- [ ] 使用 IndexedDB 替代 localStorage（大数据量）
- [ ] 添加数据缓存策略
