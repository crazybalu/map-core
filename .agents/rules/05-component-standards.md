---
trigger: model_decision
description: 组件规范与插件开发方式，规定了新模块、新窗口和插件的编写范式 
globs: "plugins/**/*.{ts,tsx}"
---

# 组件及插件规范

## 插件系统 (Plugin System) 原则
1. **模块化与统一注册**：
   - 具有独立业务含义的功能被视为一个插件。
   - 新插件开发必须在 `plugins/` 目录中建立相关功能文件，并统一在 `plugins/index.ts` 内部抛出及通过 `registerPlugins()` 在 `PluginRegistry` 完成注册。
   - 每个插件须定义元数据：唯一的 ID/Name、展现的图标(Icon)、以及对应的 React UI Component 引用。
   
2. **容器与窗口化引擎**：
   - 独立的插件展示将被视为一种独立“功能弹窗或面板” (Widgetized Window)。
   - 插件通过 LayoutEngine 挂载，被外部容器接管其坐标（X,Y）、尺寸（W,H）。
   - 须支持标题栏展示、关闭能力，内部保持自我的响应式结构调整。

## 开发与状态互动约束
1. **禁止 Props 地狱**：
   - 无论是 `ChartPlugin` 还是 `ListPlugin`，在需要大体积业务数据（例如多点的 POI、统计结果、搜索关键字）时不应该通过 props 层层获取。
   - 所有的全局业务数据皆向 Zustand Global Store 发起订阅读取与改写。
   
2. **MapCore 交互隔离**：
   - 依赖对地图实施具体动作时（如点击列表进行视口飞行、放置 Marker、触发框选），必须应用 `MapCoreProvider` 暴漏给上来的 Context / 控制函数方法，而不要尝试在组件内单独 new Map。
   
3. **健壮与最佳实践**：
   - 使用现代级 React (Hook/FC) 结构编写组件。
   - 对所有的非预期空数据状态做好防崩溃渲染保护 (Fallback boundaries)。