---
trigger: always_on
description: 编码规范，包括数据流向、UI规范以及架构分层约束
globs: "*.ts, *.tsx"
---

# 编码规范 

## 架构分层概念及原则
### 前端分层 (Frontend Layers)
- **MapCore (内核层)**：必须保持纯粹和高内聚。**绝对禁止**包含任何业务数据请求逻辑。功能限于：OpenLayers 地图初始化、投影转换、全局坐标同步及底图管理。
- **Data Providers (数据提供层)**：负责业务数据的请求组件（如 `PoiDataManager`）。需独立监听空间状态，并在获取数据后同步至 Store。
- **LayoutEngine (引擎层)**：负责插件窗口的绝对定位与响应式生命周期，控制层级（Z-Index）、拖拽与缩放。
- **Store (状态层)**：作为核心中枢驱动，主题、业务数据、地图视图状态等，均由 Zustand Store 统一管理。

### 后端分层 (Backend Layers)
- **Controller 层**：负责接收 RESTful 请求，进行简单的参数校验，并调用 Service 层。必须使用 **Swagger/Knife4j** 进行接口标注。
- **Service 层**：承载核心业务逻辑，控制事务。
- **Repository 层**：负责数据库交互，遵循 Spring Data JPA 规范。
- **Entity/DTO**：数据库实体与前端传输对象需严格分离。

## 数据流向与更新限制
1. **空间交互触发**：用户在地图上交互，`MapCore` 同步状态到 Zustand Store。
2. **异步请求**：前端 `services/` 模块向后端 Controller 发起 REST 请求。
3. **统一响应**：后端必须使用统一的响应包装类 `Result<T>` 返回数据。
4. **前端分发**：Data Providers 接收结果并更新 Store，插件据此渲染。

## 命名与编写规范
- **前端 (TS/JS)**：类名用 PascalCase，变量/方法名用 camelCase。
- **后端 (Java)**：严格遵循标准 Java 命名规范。类名用 PascalCase，包名全小写。
- **主题与 UI**：支持 Light / Dark 模式。扁平化政务蓝色系风格。