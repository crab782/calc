# 折线图样式修复计划

## 当前状态

查看了三个图表组件：
- `src/components/BalanceChart.tsx` - 结余趋势
- `src/components/ExpenseChart.tsx` - 支出趋势
- `src/components/IncomeChart.tsx` - 收入趋势

**当前问题：**
1. 所有图表都有 `smooth: true`，导致折线圆滑（曲线效果）
2. 实线和虚线之间断开：因为使用了两个分离的 series（一个放实际数据，一个放预测数据），实际数据的最后一个点和预测数据的第一个点之间有 `null` 间隙，导致线条断开

## 修改方案

### 修改 1: 取消圆滑效果
将所有三个图表的 `smooth: true` 改为 `smooth: false`，显示为普通折线。

### 修改 2: 修复实线虚线断开问题
保持两个 series 的结构不变，但在边界处让两个 series 共享同一个数据点。具体做法：

- 实际数据 series：在预测开始的月份也保留值（不设为 null）
- 预测数据 series：在实际数据结束的月份也保留值（不设为 null）

这样实线的最后一个点和虚线的第一个点是同一个点，视觉上会连接起来。

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `src/components/BalanceChart.tsx` | `smooth: false`；修复边界连接 |
| `src/components/ExpenseChart.tsx` | `smooth: false`；修复边界连接 |
| `src/components/IncomeChart.tsx` | `smooth: false`；修复边界连接 |

## 修改细节

以 BalanceChart 为例，原代码：
```typescript
data: monthlyDataWithPrediction.map((item) => (item.isActual ? item.balance : null)),
```

修改为：
```typescript
// 找到实际数据和预测数据的分界点索引
const boundaryIndex = monthlyDataWithPrediction.findIndex((item) => !item.isActual);

// 实际数据系列：包含边界点
data: monthlyDataWithPrediction.map((item, i) => 
  item.isActual || i === boundaryIndex ? item.balance : null
),

// 预测数据系列：包含边界点
data: monthlyDataWithPrediction.map((item, i) => 
  !item.isActual || i === boundaryIndex - 1 ? item.balance : null
),
```

## 验证步骤

1. 运行 `npm run build` 确保 TypeScript 编译成功
2. 检查浏览器中折线是否显示为直角折线（非圆滑曲线）
3. 检查实线和虚线之间是否连续连接，无断开
