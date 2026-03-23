---
trigger: model_decision
description: 编码规范，包括数据流向、UI规范以及架构分层约束
globs: "*.ts, *.tsx"
---

# 编码规范

## 架构分层概念及原则
- **MapCore (内核层)**：必须保持纯粹和高内聚。MapCore 属于空间底座，**绝对禁止**包含任何业务数据请求逻辑。功能限于：OpenLayers 地图初始化、投影转换、全局坐标同步及底图管理。
- **Data Providers (数据提供层)**：负责业务数据的请求组件（如 `PoiDataManager`）。需独立监听空间状态（如视野范围 `mapExtent`、绘制区域 `drawnExtent`），并在获取数据后同步至 Store。
- **LayoutEngine (引擎层)**：负责插件窗口的绝对定位与响应式生命周期，控制层级（Z-Index）、拖拽与缩放。
- **Store (状态层)**：作为核心中枢驱动，主题、业务数据、地图视图状态等，均由 Zustand Store 统一管理。

## 数据流向与更新限制
1. **空间交互触发**：用户在地图上交互时，`MapCore` 捕获并将纯粹的空间状态同步到 Zustand Store。
2. **中心化请求**：数据提供者监听 Store 的空间状态变化，发起 API 异步请求后，将结果更新至 Store (例如 `pois`)。
3. **响应式及分发**：所有插件（如 `ListPlugin`, `ChartPlugin`）及 `MapCore` 图层组件响应 Store 内共享数据的更新，自动进行重新渲染。
4. **统一跨组件通信**：禁止直接使用组件冒泡或透传的事件互相调用，必须依赖 Zustand 变量，或通过特定 Context 方法触发行为驱动更新。

## UI 与样式编写规范
- **主题应用**：所有页面和组件必须支持 Light / Dark 模式。在声明样式时，涉及颜色切换处必须用 Tailwind 的 `dark:` 修饰符。
- **视觉风格要求**：应用要求具有大屏 BI 及现代风格。推荐使用玻璃拟态（Glassmorphism）和 `Slate` 中性色调，表现出专业感与科技感。
- 绝大多数组件应当做到基础的响应式适配。