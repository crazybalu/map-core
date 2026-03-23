---
trigger: manual
description: 技术栈规范，列出了项目使用的核心框架、依赖与技术选型
globs: "*"
---

# 技术栈规范

本项目使用以下核心技术进行开发，所有的代码实现和组件引入需遵循以下技术栈：

- **核心前端框架**：React 19 (`react`, `react-dom`) + TypeScript
- **构建工具**：Vite 6
- **地图引擎**：OpenLayers (`ol` ^10.7.0) - 构建稳定流畅的地图基础对象。
- **状态管理**：Zustand (`zustand` ^5.0.8) - 轻量级、高性能状态管理，适合频繁更新的布局数据。
- **UI & 样式**：Tailwind CSS + `lucide-react` 提供丰富的图标资源。
- **图表及数据可视化**：Recharts (`recharts` ^3.4.1) - 基于 SVG 的响应式图表库。
- **AI 模型与交互**：Google Gemini API (`@google/genai` ^1.30.0) 提供自然语言处理与数据洞察。
- **代码规范约束**：ESLint (React Hooks / React Refresh) + TypeScript Eslint