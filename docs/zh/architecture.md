# 架构设计

本文档描述 LiveMixer Web Studio 的整体架构、技术栈和模块结构。

## 技术栈

| 层次 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 画布引擎 | Konva.js + react-konva |
| 推流 | LiveKit WebRTC (livekit-client) |
| 状态管理 | Zustand |
| UI 组件 | Radix UI + Tailwind CSS v4 |
| 构建工具 | Vite 7 |
| 代码检查与格式化 | Biome |
| 国际化 | i18next + react-i18next |

## 架构总览

```
+--------------------------------------------------------------+
|                        UI 层（组件）                           |
|  Toolbar | MainLayout | KonvaCanvas | PropertyPanel | ...    |
+--------------------------------------------------------------+
|                        服务层                                  |
|  StreamingService | CanvasCapture | LiveKitPull | MediaStream|
|  PluginContext | PluginRegistry | I18nEngine | Clipboard     |
+--------------------------------------------------------------+
|                      状态层（Zustand）                         |
|  useProtocolStore (场景、项目、撤销/重做)                      |
|  useSettingsStore (偏好设置、推流配置)                         |
+--------------------------------------------------------------+
|                      插件层                                    |
|  ISourcePlugin | PluginContext API | Slot 系统                |
|  内置: Webcam | AudioInput | ScreenCapture | ...            |
+--------------------------------------------------------------+
|                      类型层                                    |
|  ProtocolData | SceneItem | ISourcePlugin | IPluginContext   |
|  LiveMixerExtensions | I18nEngine | ...                     |
+--------------------------------------------------------------+
```

## 模块结构

```
src/
├── components/       # UI 组件
│   ├── ui/           #   基础 UI 原语（基于 Radix）
│   ├── main-layout.tsx       # 主布局容器
│   ├── konva-canvas.tsx      # Konva.js 画布编辑器
│   ├── toolbar.tsx           # 顶部工具栏（含菜单）
│   ├── bottom-bar.tsx        # 场景/源/音频/推流栏
│   ├── property-panel.tsx    # 右侧属性编辑器
│   └── ...                   # 其他组件
├── services/         # 业务逻辑服务
│   ├── streaming.ts           # LiveKit 推流
│   ├── canvas-capture.ts      # Canvas 转 MediaStream
│   ├── livekit-pull.ts        # LiveKit 拉流（订阅）
│   ├── media-stream-manager.ts # 统一媒体流管理
│   ├── plugin-context.ts      # 插件上下文管理器
│   ├── plugin-registry.ts     # 插件注册系统
│   ├── i18n-engine.ts         # i18n 引擎（基于 i18next）
│   └── clipboard.ts           # 剪贴板服务
├── store/            # Zustand 状态仓库
│   ├── protocol.ts            # 场景/项目数据 + 撤销/重做
│   └── setting.ts             # 应用设置
├── types/            # TypeScript 类型定义
│   ├── protocol.ts            # ProtocolData, Scene, SceneItem
│   ├── plugin.ts              # ISourcePlugin, PropsSchema
│   ├── plugin-context.ts      # IPluginContext, 权限, 事件
│   ├── extensions.ts          # LiveMixerExtensions, UserInfo
│   └── i18n-engine.ts        # I18nEngine, IPluginI18n
├── plugins/          # 插件实现
│   └── builtin/
│       ├── webcam/            # 摄像头插件
│       ├── audio-input/       # 音频输入插件
│       ├── screencapture-plugin.tsx  # 屏幕/窗口捕获
│       ├── mediasource-plugin.tsx    # 媒体源（URL 视频）
│       ├── image-plugin.tsx          # 图片叠加
│       └── text-plugin.tsx           # 文字叠加
├── contexts/         # React Context
├── hooks/            # 自定义 React Hooks
├── locales/          # 翻译资源
├── App.tsx           # 主应用组件
├── index.ts          # 库入口点（导出）
└── main.tsx          # 应用入口点
```

## 数据流

主要数据流遵循单向数据模式：

```
用户操作 (UI)
     |
     v
Protocol Store (updateData)
     |
     +---> past[] (撤销历史)
     |
     v
React 组件（重新渲染）
     |
     v
Konva Canvas（可视化渲染）
     |
     v
CanvasCaptureService (captureStream)
     |
     v
StreamingService (LiveKit 推送)
```

### 状态同步到插件上下文

应用状态同步到插件上下文系统，使插件可以观察变化：

```
Protocol Store / Settings Store
     |
     v
App.tsx (useEffect 同步)
     |
     v
PluginContextManager.updateState()
     |
     v
Plugin Context（只读代理）---> 插件事件订阅者
```

## 主布局

`MainLayout` 组件定义应用的视觉结构：

```
+----------------------------------------------------------+
|  Logo   |        工具栏           |    用户区域           |
+---------+---------------------------+---------------------+
| 左侧    |                           |    右侧             |
| 边栏    |       画布区域            |    边栏             |
| (w-80)  |       (flex-1)           |    (w-80)          |
+---------+---------------------------+---------------------+
|              底部栏 (h-56)                                |
+----------------------------------------------------------+
|              状态栏                                       |
+----------------------------------------------------------+
```

每个区域通过 ReactNode 属性接收内容，使布局高度可组合。

## 服务架构

### StreamingService

处理将画布流推送到 LiveKit 房间：

- `connect(url, token, mediaStream, bitrate, codec, fps)` - 连接并发布
- `disconnect()` - 取消发布并断开
- 单例实例导出为 `streamingService`

### CanvasCaptureService

从 HTML Canvas 元素捕获 MediaStream：

- `captureStream(canvas, fps)` - 从画布返回 MediaStream
- `stopCapture()` - 停止所有捕获轨道
- 单例实例导出为 `canvasCaptureService`

### LiveKitPullService

从 LiveKit 房间订阅远端参会者流：

- `connect(url, token, callbacks)` - 连接并订阅
- `disconnect()` - 断开房间连接
- `getParticipants()` - 获取参会者信息列表
- 单例实例导出为 `liveKitPullService`

### MediaStreamManager

集中管理所有媒体流：

- `setStream(itemId, entry)` - 为场景项注册流
- `getStream(itemId)` - 获取流条目
- `removeStream(itemId)` - 移除并清理流
- `onStreamChange(itemId, callback)` - 订阅流变化
- `getVideoInputDevices()` / `getAudioInputDevices()` - 设备枚举
- 单例实例导出为 `mediaStreamManager`

### PluginRegistry

管理插件注册和查找：

- `register(plugin)` - 注册插件并初始化其上下文
- `getPluginBySourceType(sourceType)` - 通过 SceneItem 类型查找插件
- `getSourcePlugins()` - 获取有源类型映射的插件
- 单例实例导出为 `pluginRegistry`

### PluginContextManager

为插件创建和管理安全的上下文实例：

- `createContextForPlugin(pluginId, version, trustLevel)` - 创建插件上下文
- `disposePlugin(pluginId)` - 销毁插件并清理
- `getSlotContents(slot)` - 获取 UI Slot 的内容
- 单例实例导出为 `pluginContextManager`
