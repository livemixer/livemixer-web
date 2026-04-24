# 快速上手

LiveMixer Web Studio 是一个基于 React、Konva.js 和 LiveKit WebRTC 构建的开源实时视频混流应用。

它提供了类似 OBS Studio 的浏览器端视频混流体验，用户可以在画布上组合多个视频源（摄像头、屏幕捕获、媒体文件、文本、图片），并通过 LiveKit 实时推流。

## 特性

- **可视化画布编辑器** - 基于 Konva.js 的画布编辑器，支持拖拽、缩放、图层管理
- **场景管理** - 多场景创建、排序与切换
- **内置源插件**
  - 摄像头采集
  - 屏幕/窗口采集
  - 媒体源（URL 视频）
  - 图片叠加
  - 文字叠加
  - 计时器与时钟
  - 音频输入与混音面板
- **实时推流** - 通过 LiveKit WebRTC 将画布内容实时推流
- **拉流** - 拉取远端参会者音视频流并添加到画布
- **插件系统** - 可扩展的插件架构，支持插件注册表、Context API 和 Slot 扩展
- **国际化** - 基于 i18next 的多语言支持（内置英文与中文）
- **配置持久化** - 场景配置的 JSON 导入与导出
- **库模式** - 可作为 React 组件嵌入到其他应用（ES + UMD 构建）

## 环境要求

- **Node.js** >= 18
- **pnpm**（推荐包管理器）

## 安装

```sh
pnpm install
```

## 开发

启动开发服务器（支持热更新）：

```sh
pnpm run dev
```

启动后访问 `http://localhost:5173`（默认地址）。

## 构建

```sh
# 构建为独立 Web 应用
pnpm run build

# 构建为库模式 (ES Module + UMD)
pnpm run build:lib
```

构建产物说明：

| 命令 | 产物目录 | 说明 |
|------|----------|------|
| `pnpm run build` | `dist/` | 独立 Web 应用 |
| `pnpm run build:lib` | `dist-lib/` | 可嵌入的库（ES + UMD + 类型声明） |

## 预览

预览生产构建：

```sh
pnpm run preview
```

## 在线演示

访问在线演示：[LiveMixer Web Studio Demo](https://livemixer.github.io/livemixer-web/)

## 下一步

- [用户使用手册](./user-guide.md) - 了解如何使用 LiveMixer Web Studio
- [库模式集成](./integration-guide.md) - 将 LiveMixer Web 嵌入到你的应用
- [架构设计](./architecture.md) - 了解项目架构与技术栈
- [插件开发](./plugin-development.md) - 开发自定义源插件
