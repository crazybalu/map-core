---
trigger: always_on
description: 技术栈规范，列出了项目使用的核心框架、依赖与技术选型
globs: "*"
---

# 技术栈规范 

本项目使用以下核心技术进行开发，所有的代码实现和组件引入需遵循以下技术栈：

## 前端技术栈 (Frontend)
- **核心框架**：React 19 (`react`, `react-dom`) + TypeScript
- **构建工具**：Vite 6
- **地图引擎**：OpenLayers (`ol` ^10.7.0) - 构建稳定流畅的地图基础对象。
- **状态管理**：Zustand (`zustand` ^5.0.8)
- **UI & 样式**：Tailwind CSS + `lucide-react`
- **图表可视化**：Recharts (`recharts` ^3.4.1)
- **AI 模型**：Google Gemini API (`@google/genai` ^1.30.0)

## 后端技术栈 (Backend)
- **核心框架**：Spring Boot 2.7.14
- **持久层**：Spring Data JPA
- **数据库**：PostgreSQL 10
- **项目管理**：Maven 3.x
- **开发语言**：Java 8
- **辅助工具**：Lombok, Swagger/Knife4j (用于 API 文档)