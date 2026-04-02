---
trigger: always_on
description: 目录结构规范，说明了项目中各文件夹的作用与存放规则
globs: "*"
---

# 目录结构规范 

项目中各模块与代码归属须参照以下文件夹职责放置，保持模块的高内聚、低耦合：

- `components/`：基础的、公用性高的 React UI 组件存放地。
- `config/`：应用级别的所有配置、环境常量等配置选项所在位置。
- `core/`：系统 MapCore 层。主要以存放 OpenLayers 实例提供者的封装与核心图层逻辑为主。
- `plugins/`：所有的业务功能插件模块。如 ChatPlugin / ChartPlugin。新增可视窗口与业务组件在此进行开发。
- `services/`：负责对后端系统发起外部交互或 API 请求（如 `api.ts` 应封装统一的接口资源）。
- `stores/`：存放所有的状态管理单元（Store 定义片区，基于 Zustand 构建）。
- `types.ts` 等类型定义文件：全工程通用的 TypeScript Interface, Type 定义或相关 DTO 契约。