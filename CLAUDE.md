# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导。

## 开发命令

### 核心命令
- `npm run dev` - 启动开发服务器 (端口 8080)
- `npm run build` - 构建生产版本
- `npm run start` - 启动生产服务器 (端口 8080)
- `npm run lint` - 运行 ESLint 代码检查
- `npm run init-uploads` - 初始化上传目录结构

### 重要说明
- 开发和生产服务器都运行在端口 8080
- 构建前会自动运行 `init-uploads` 脚本
- 安装依赖后会自动执行 `postinstall` 钩子初始化上传目录

## 架构概述

### 技术栈
- **前端框架**: Next.js 15.3.2 (App Router)
- **UI 组件库**: Ant Design + Tailwind CSS
- **状态管理**: React Context (AuthContext, PointsContext)
- **数据库**: MySQL2 + TypeORM
- **身份验证**: NextAuth.js + JWT
- **LINE 集成**: LIFF SDK + LINE Pay
- **拖拽功能**: @dnd-kit
- **动画**: Framer Motion

### 应用模块

#### 1. 管理后台 (`/app/admin/bakery/`)
核心的店铺管理系统，包含:
- **订单管理** (`orders/`) - 订单查看、编辑、状态更新、导出
- **商品管理** (`products/`) - 商品 CRUD、分类管理
- **客户管理** (`customers/`) - 客户信息管理
- **佣金系统** (`commissions/`) - 佣金计划、分配、统计
- **优惠券** (`coupons/`) - 优惠券管理
- **积分系统** (`points/`) - 积分设置、交易记录、虚拟卡
- **数据导出** (`export/`) - 订单数据导出功能

#### 2. 客户端 (`/app/client/`)
客户购买界面，集成 LIFF:
- **烘焙坊** (`bakery/`) - 商品展示、购物车、积分查看
- **结账流程** (`checkout/`) - LINE Pay 集成、订单确认
- **订单查看** (`orders/`) - 客户订单历史
- **积分商城** (`points/`) - 积分兑换、虚拟卡购买

#### 3. 销售系统
- **城市销售** (`/app/city-sales/`) - 城市级别销售管理
- **用户销售** (`/app/user-sales/`) - 个人销售者管理
- **佣金申请** (`/app/apply-commission/`) - 佣金申请流程

### 关键配置

#### 环境配置
- `lib/env.ts` - LIFF ID 配置和环境变量处理
- `middleware.ts` - 路由保护和权限验证
- `next.config.ts` - API 代理、图片优化、路由重写

#### 认证流程
- `/admin` 路径需要 token 验证
- 使用 HTTP-only cookies 存储访问令牌
- 支持开发模式下的 debug token

#### API 集成
- 后端 API 代理到 `http://localhost:4000`
- 本地 API 路由: `/api/upload`, `/api/images`, `/api/sample-request`
- LINE 服务集成: `app/services/lineService.ts`

### 数据模型重点

#### 订单系统
- 商品价格字段支持字符串和数字格式 (`OrderItem.price: number | string`)
- 优先使用 API 返回的 `subtotal` 字段进行计算
- 支持负数价格 (积分抵扣等场景)

#### 权限管理
- 基于 role 的用户权限控制
- 中间件层面的路由保护
- Context 层面的状态管理

### 开发注意事项

#### 类型定义
- 订单相关类型定义在 `app/admin/bakery/orders/types/index.ts`
- 价格处理需要同时支持字符串和数字格式

#### 样式规范
- 使用 Tailwind CSS 作为主要样式方案
- Ant Design 组件用于复杂 UI 交互
- 响应式设计支持移动端

#### LINE 集成
- LIFF SDK 动态导入避免 SSR 问题
- LINE Pay 支付流程集成
- LINE 消息模板服务

#### 文件结构
- `uploads/` 目录用于存储用户上传文件
- `public/` 包含静态资源和示例图片
- 组件按功能模块组织，保持层次清晰