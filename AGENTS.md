# Expense Tracker - AGENTS.md

## 1. 项目概述

一个基于 React + TypeScript + Vite 构建的轻量级记账工具，数据存储在浏览器 localStorage 中，可打包为静态文件托管到 GitHub Pages。

### 核心功能
- ✅ 记账记录管理（添加、删除）
- ✅ 收支统计展示
- ✅ 月度收支趋势图表（ECharts）
- ✅ 数据导入导出（JSON 格式）
- ✅ 数据版本管理与迁移

### 其他说明
- `.ai/` 目录仅用于记录提示词以便 git 追溯，无实际项目用途，AI 在开发时应忽略该目录。

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

### 6.5 JSON 数据分析工具

项目导出格式为 `JSON.stringify(data, null, 2)`（格式化缩进输出），可使用 jq 命令行工具分析导出的 JSON 数据。

**安装**：`scoop install jq`（Windows）

**常用命令示例**（以 `account-book.json` 为例）：

```bash
# 统计收入/支出记录数量
jq '[.records[] | select(.type=="income")] | length' account-book.json
jq '[.records[] | select(.type=="expense")] | length' account-book.json

# 找出没有 currency 字段的旧记录
jq '[.records[] | select(.currency == null or .currency == "undefined")]' account-book.json

# 统计总收入/总支出
jq '{income: ([.records[] | select(.type=="income") | .amount] | add), expense: ([.records[] | select(.type=="expense") | .amount] | add)}' account-book.json

# 按月份分组统计
jq '.records | group_by(.date[0:7]) | map({month: .[0].date[0:7], count: length})' account-book.json

# 查看特定账户信息
jq '.accounts[] | {name, currency, balance}' account-book.json

# 查看特定记录详情
jq '.records[] | select(.id == "mqfcbbqpfj0di0rrdcg")' account-book.json
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

## 11. 设计规范

### 11.1 多币种与投资品处理原则

**核心原则：默认账户币种为唯一标尺**

用户设置的默认账户（`isDefault: true` 的账户）的币种视为记账的"尺子"，所有统计、总览、图表均以该币种为基准进行计算和展示。

**设计思路**：

将外币（USD/EUR/GBP/JPY 等）、股票、基金、黄金、加密货币等会波动的资产统一视为**投资品**处理：

1. **记账时**：投资品按实际交易币种和金额记录，`currency` 字段保存原始币种（如 `USD`）
2. **统计时**：总览页、月度趋势等统计只计算默认账户币种（如 CNY）的记录，投资品不参与日常收支统计
3. **账户页**：每个账户独立展示对应币种的结余，互不混合
4. **需要查看投资品价值时**：通过汇率换算回默认币种（CNY），相当于用 CNY 这把尺子衡量所有资产

**为什么这样设计**：

- 投资品价值会波动，不适合与日常收支混在一起统计
- 用户的核心诉求是管理日常收支，投资品是辅助功能
- 统一以默认币种为基准，避免多币种混合导致统计混乱
- 保持简单，不引入复杂的实时汇率系统

**实现位置**：

- `RecordService.getDefaultAccountCurrency()` — 获取默认账户币种
- `RecordService.getStatistics()` — 按默认币种过滤记录统计
- `RecordService.getMonthlyData()` — 按默认币种过滤记录
- `RecordService.generateMonthlyDataWithPrediction()` — 按默认币种过滤记录

### 11.2 代码风格

- 使用 TypeScript 严格模式
- 变量命名：驼峰式（camelCase）
- 文件命名：短横线分隔（kebab-case）
- 组件命名：帕斯卡式（PascalCase）

---

## 12. 团队协作规范

### 12.1 提交规范

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

## 13. 扩展建议

### 待添加功能

- [ ] 分类管理（自定义分类）
- [ ] 标签功能
- [ ] 预算管理
- [ ] 数据可视化（饼图、柱状图）
- [ ] 移动端适配
- [ ] 投资品汇率换算功能

### 技术优化

- [ ] 添加单元测试
- [ ] 使用 IndexedDB 替代 localStorage（大数据量）
- [ ] 添加数据缓存策略
