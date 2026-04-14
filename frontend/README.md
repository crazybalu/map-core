<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GeoInsight BI - 地理信息商业智能平台

**GeoInsight BI** 是一个现代化的地理信息商业智能平台。它采用“微内核 + 插件”的设计理念，允许用户在动态交互的地图底图上，根据需求自由挂载、排列和组合各种分析组件（如统计图表、AI 聊天助手、图层管理器等）。

## 🚀 核心设计目标

*   **高度模块化**：功能通过插件实现，核心框架与业务逻辑深度解耦。
*   **动态交互**：支持插件窗口的自由拖拽、缩放和布局管理，提供“窗口化”操作系统体验。
*   **AI 驱动**：原生集成 Google Gemini 模型，提供地理空间数据的智能分析、自动化处理与问答。
*   **高性能地图**：基于 OpenLayers 构建，确保在大数据量下的稳定与流畅。

---

## 🏗️ 系统架构

系统采用分层架构设计，兼顾核心引擎的稳定性与业务功能的灵活性。

### 1. 架构层次
1.  **基础设施层 (Infrastructure)**：React 19, Vite, Tailwind CSS。
2.  **核心内核层 (MapCore)**：负责 OpenLayers 初始化、投影转换、全局坐标同步及底图管理。
3.  **数据提供层 (Data Providers)**：监听全局空间状态，异步请求业务数据（如 POI）并同步至全局状态。
4.  **布局引擎 (LayoutEngine)**：管理插件窗口生命周期、Z-Index、拖拽缩放及布局持久化。
5.  **插件层 (Plugins)**：具体业务单元，如 `ChartPlugin`, `ListPlugin`。
6.  **状态管理层 (Zustand)**：统一管理主题、插件状态、地图视野及业务数据。

### 2. 核心模块设计
*   **插件系统**：定义标准元数据，支持应用启动时动态加载与自动注册。
*   **交互体验**：玻璃拟态（Glassmorphism）视觉风格，支持深/浅色模式切换。

---

## 🛠️ 技术栈选型

| 维度 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React 19 | 利用并发渲染特性 |
| **地图引擎** | OpenLayers | 专业的 GIS 渲染库 |
| **状态管理** | Zustand | 高性能、轻量级状态同步 |
| **AI 模型** | Google Gemini API | 核心智能分析能力 |
| **可视化** | Recharts | 响应式图表展现 |
| **样式引擎** | Tailwind CSS | 实用优先，支持动态主题 |

---

## 🚦 快速开始

### 环境依赖
*   Node.js (建议 v18+)
*   Gemini API Key

### 本地运行
1.  **安装依赖**:
    ```bash
    npm install
    ```
2.  **配置环境**:
    在 `.env.local` 文件中设置 `GEMINI_API_KEY`。
3.  **启动开发服务器**:
    ```bash
    npm run dev
    ```

---

## 📜 扩展与开发

*   **新增插件**：在 `plugins/` 目录创建组件并在 `plugins/index.ts` 中注册，即可在 UI 中挂载。
*   **数据接入**：通过 `services/api.ts` 封装的统一接口对接后端 GIS 数据源。
