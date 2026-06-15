# MVC 数据分层架构 - 产品需求文档

## Overview
- **Summary**: 重构现有记账工具的数据层，采用经典 MVC 架构，建立清晰的数据操作层（DAO/Data Layer），定义明确的数据模型和操作接口，确保 JSON 导入导出的完整性和一致性。
- **Purpose**: 提升代码可维护性，便于跟踪 localStorage 中存储的数据结构，采用行业主流规范方案。
- **Target Users**: 开发人员，便于后续维护和扩展。

## Goals
- 建立清晰的 MVC 分层架构
- 创建数据模型层（Model）定义数据结构
- 创建数据访问层（DAO）封装 localStorage 操作
- 创建服务层（Service）处理业务逻辑
- 确保 JSON 导入导出格式完整一致
- 提供数据迁移和版本管理能力

## Non-Goals (Out of Scope)
- 引入后端数据库
- 实现用户认证系统
- 复杂的事务管理
- 分布式数据同步

## Background & Context
- 当前项目使用 localStorage 存储数据，数据结构直接存储为 JSON 数组
- 需要更清晰的架构分层，便于跟踪数据结构（类似数据库表和字段的概念）
- 需要确保导入导出的数据格式完整一致

## Functional Requirements
- **FR-1**: 定义数据模型（Record、Category 等）
- **FR-2**: 创建数据访问对象（DAO）封装 CRUD 操作
- **FR-3**: 创建服务层处理业务逻辑
- **FR-4**: 支持数据版本管理和迁移
- **FR-5**: 确保导入导出数据格式一致

## Non-Functional Requirements
- **NFR-1**: 数据操作层与 UI 层解耦
- **NFR-2**: 导入数据时进行完整性校验
- **NFR-3**: 支持数据版本迁移
- **NFR-4**: 提供清晰的错误处理机制

## Constraints
- **Technical**: React 19, TypeScript, localStorage
- **Dependencies**: 无新增第三方库

## Assumptions
- 用户浏览器支持 localStorage
- 数据量较小（<1000条记录）

## Acceptance Criteria

### AC-1: 数据模型定义
- **Given**: 需要定义记账记录结构
- **When**: 创建数据模型
- **Then**: 定义清晰的字段类型和约束
- **Verification**: `human-judgment`

### AC-2: DAO 层实现
- **Given**: 需要操作数据
- **When**: 调用 DAO 方法
- **Then**: 数据正确读写到 localStorage
- **Verification**: `programmatic`

### AC-3: 数据导入导出
- **Given**: 用户执行导入导出操作
- **When**: 导入或导出 JSON 文件
- **Then**: 数据格式完整一致，包含版本信息
- **Verification**: `programmatic`

### AC-4: 数据版本管理
- **Given**: 数据结构升级
- **When**: 应用启动时
- **Then**: 自动检测版本并执行迁移
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要支持多表关联？
- [ ] 是否需要事务支持？
