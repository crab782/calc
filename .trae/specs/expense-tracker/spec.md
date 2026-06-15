# 记账工具 - 产品需求文档

## Overview
- **Summary**: 一个基于 React + TypeScript + Vite 的轻量级记账工具，使用 localStorage 作为本地数据库，支持收支记录管理。
- **Purpose**: 提供简单易用的个人记账功能，无需后端服务器，纯静态部署。
- **Target Users**: 需要简单记账功能的个人用户。

## Goals
- 提供总览页展示收支统计概览
- 提供记账页用于添加收支记录
- 左侧导航栏支持页面切换
- 使用 localStorage 持久化数据

## Non-Goals (Out of Scope)
- 多用户支持
- 云端数据同步
- 复杂报表分析
- 用户认证系统

## Background & Context
- 项目使用 Vite + React + TypeScript 技术栈
- 纯静态部署，托管于 GitHub Pages
- 使用 localStorage 替代后端数据库

## Functional Requirements
- **FR-1**: 总览页显示收支统计概览
- **FR-2**: 记账页支持添加收入和支出记录
- **FR-3**: 左侧导航栏支持页面切换
- **FR-4**: 数据持久化到 localStorage

## Non-Functional Requirements
- **NFR-1**: 页面加载时间 < 2s
- **NFR-2**: 响应式设计，支持移动端
- **NFR-3**: 数据自动保存，无需手动提交

## Constraints
- **Technical**: React 19, TypeScript, Vite 8
- **Dependencies**: TailwindCSS 3, Lucide React 图标库

## Assumptions
- 用户浏览器支持 localStorage
- 用户数据量较小（<1000条记录）

## Acceptance Criteria

### AC-1: 总览页展示
- **Given**: 用户访问首页 localhost:5173/
- **When**: 页面加载完成
- **Then**: 显示收支统计卡片，包含总收入、总支出、结余
- **Verification**: `human-judgment`

### AC-2: 记账页功能
- **Given**: 用户点击左侧导航"记账"
- **When**: 用户填写金额、选择类型（收入/支出）、输入备注
- **Then**: 记录保存到 localStorage，总览页数据更新
- **Verification**: `programmatic`

### AC-3: 左侧导航
- **Given**: 用户在任意页面
- **When**: 点击左侧导航菜单项
- **Then**: 页面平滑切换到对应模块
- **Verification**: `human-judgment`

### AC-4: 数据持久化
- **Given**: 用户添加记账记录
- **When**: 刷新页面
- **Then**: 之前的记录仍然存在
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要支持分类管理？
- [ ] 是否需要支持日期筛选？
