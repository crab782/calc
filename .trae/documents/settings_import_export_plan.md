# 设置页面与导入导出功能 - 实现计划

## 需求分析

用户希望在记账工具中添加一个"设置"页面，包含以下功能：
- 导出数据为 JSON 文件
- 从 JSON 文件导入数据

## 当前项目结构

```
src/
├── components/
│   └── Sidebar.tsx          # 左侧导航栏
├── pages/
│   ├── Dashboard.tsx        # 总览页
│   └── AddRecord.tsx        # 记账页
├── types/
│   └── index.ts             # 类型定义
├── utils/
│   └── storage.ts           # localStorage 工具函数
└── App.tsx                  # 主应用入口
```

## 实现步骤

### 1. 更新类型定义
- 修改 `types/index.ts`，添加 `settings` 页面类型到 `PageType`

### 2. 更新 localStorage 工具函数
- 修改 `utils/storage.ts`，添加：
  - `exportData()` - 导出数据为 JSON 字符串
  - `importData(jsonString)` - 从 JSON 字符串导入数据

### 3. 创建设置页面组件
- 创建 `pages/Settings.tsx`，包含：
  - 导出按钮：将数据导出为 JSON 文件下载
  - 导入按钮：选择 JSON 文件并导入
  - 确认覆盖提示
  - 操作成功/失败反馈

### 4. 更新侧边栏导航
- 修改 `components/Sidebar.tsx`，添加"设置"导航项

### 5. 更新主应用入口
- 修改 `App.tsx`，添加设置页面的路由逻辑

## 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | 添加 settings 页面类型 |
| `src/utils/storage.ts` | 修改 | 添加导入导出函数 |
| `src/pages/Settings.tsx` | 新建 | 创建设置页面组件 |
| `src/components/Sidebar.tsx` | 修改 | 添加设置导航项 |
| `src/App.tsx` | 修改 | 添加设置页面路由 |

## 技术实现要点

### 导出功能实现
1. 从 localStorage 获取所有记录
2. 转换为格式化的 JSON 字符串
3. 创建 Blob 对象并生成下载链接
4. 触发浏览器下载

### 导入功能实现
1. 创建文件选择 input
2. 读取选中的 JSON 文件
3. 解析 JSON 数据并验证格式
4. 将数据写入 localStorage
5. 刷新页面或通知组件更新

### 注意事项
- 导入前需确认是否覆盖现有数据
- 需验证导入数据格式是否正确
- 导入成功后需刷新页面或触发组件更新

## 风险处理
- JSON 文件格式错误：显示错误提示
- 数据结构不匹配：跳过无效记录或提示用户
- 导入空数据：提示用户数据为空

## 完成后测试要点
1. 导出数据文件是否正确生成
2. 导入数据是否正确保存
3. 覆盖确认提示是否正常工作
4. 导入错误数据是否有正确提示
