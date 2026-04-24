# API 参考文档

本文档列出 `livemixer-web` 包的所有公共导出。

## 组件

### LiveMixerApp

主应用组件，渲染完整的 LiveMixer Web Studio 界面。

```tsx
import { LiveMixerApp } from 'livemixer-web';

function App() {
  return <LiveMixerApp />;
}

// 带 extensions
function AppWithExtensions() {
  return <LiveMixerApp extensions={extensions} />;
}
```

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `extensions` | `LiveMixerExtensions?` | 可选的自定义扩展 |

### MainLayout

布局容器，排列应用各区域。

**属性：**

| 属性 | 类型 | 说明 |
|------|------|------|
| `logo` | `ReactNode?` | Logo 区域（左上） |
| `toolbar` | `ReactNode?` | 工具栏区域（上方中间） |
| `userSection` | `ReactNode?` | 用户区域（右上） |
| `canvas` | `ReactNode?` | 画布区域（中间） |
| `leftSidebar` | `ReactNode?` | 左侧边栏 |
| `rightSidebar` | `ReactNode?` | 右侧边栏 |
| `bottomBar` | `ReactNode?` | 底部栏 |
| `statusBar` | `ReactNode?` | 状态栏 |

### KonvaCanvas

基于 Konva.js 的画布组件，支持通过 `ref` 命令式访问：

```tsx
const canvasRef = useRef<KonvaCanvasHandle>(null);

canvasRef.current?.getCanvas();              // 获取底层 canvas 元素
canvasRef.current?.startContinuousRendering(); // 启动持续渲染（推流时使用）
canvasRef.current?.stopContinuousRendering();  // 停止持续渲染
```

### 其他组件

| 组件 | 说明 |
|------|------|
| `Toolbar` | 顶部工具栏（含菜单） |
| `BottomBar` | 底部栏（场景/源/音频/推流） |
| `PropertyPanel` | 属性面板 |
| `StatusBar` | 状态栏 |
| `LeftSidebar` | 左侧边栏 |
| `SettingsDialog` | 设置对话框 |

## 服务

### streamingService

`StreamingService` 单例实例，用于推流到 LiveKit。

| 方法 | 签名 | 说明 |
|------|------|------|
| `connect` | `(url, token, mediaStream, videoBitrate?, videoCodec?, maxFramerate?) => Promise<void>` | 连接到 LiveKit 房间并发布流 |
| `disconnect` | `() => Promise<void>` | 断开连接并清理 |
| `getConnectionState` | `() => boolean` | 获取连接状态 |
| `getRoom` | `() => Room \| null` | 获取 LiveKit Room 实例 |

**视频编码：** `'h264' | 'h265' | 'vp8' | 'vp9' | 'av1'`（默认：`'vp8'`）

### canvasCaptureService

`CanvasCaptureService` 单例实例，用于从 Canvas 捕获 MediaStream。

| 方法 | 签名 | 说明 |
|------|------|------|
| `captureStream` | `(canvas: HTMLCanvasElement, fps?: number) => MediaStream` | 从画布捕获 MediaStream |
| `stopCapture` | `() => void` | 停止捕获并释放轨道 |
| `getStream` | `() => MediaStream \| null` | 获取当前流 |

## Store

### useProtocolStore

带撤销/重做支持的场景/项目数据 Zustand Store。

**状态：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `ProtocolData` | 当前场景配置 |
| `past` | `ProtocolData[]` | 撤销历史栈 |
| `future` | `ProtocolData[]` | 重做历史栈 |
| `canUndo` | `boolean` | 是否可撤销 |
| `canRedo` | `boolean` | 是否可重做 |

**操作：**

| 操作 | 说明 |
|------|------|
| `updateData(data)` | 更新数据（将当前状态推入撤销栈） |
| `undo()` | 恢复上一个状态 |
| `redo()` | 恢复下一个状态 |
| `resetData(sceneName?)` | 重置为默认 |

### useSettingsStore

带敏感数据保护的应用设置 Zustand Store。

**持久化设置（保存到 localStorage）：**

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `language` | `'zh-CN'` | UI 语言 |
| `theme` | `'dark'` | UI 主题 |
| `livekitUrl` | `''` | LiveKit 服务器 URL |
| `videoBitrate` | `'5000'` | 视频码率 (kbps) |
| `videoEncoder` | `'vp8'` | 视频编码 |
| `fps` | `'30'` | 帧率 |
| `baseResolution` | `'1920x1080'` | 基础分辨率 |
| `showGrid` | `false` | 显示网格 |
| `showGuides` | `true` | 显示参考线 |

**敏感设置（仅内存）：**

| 字段 | 说明 |
|------|------|
| `livekitToken` | LiveKit 访问令牌（不持久化） |
| `livekitPullToken` | 拉流令牌（不持久化） |

**操作：**

| 操作 | 说明 |
|------|------|
| `updatePersistentSettings(settings)` | 更新持久化设置 |
| `updateSensitiveSettings(settings)` | 更新敏感设置 |
| `resetSettings()` | 重置为默认值 |

## 类型

### 核心类型

| 类型 | 说明 |
|------|------|
| `ProtocolData` | 顶层项目数据结构 |
| `Scene` | 场景定义 |
| `SceneItem` | 场景项定义 |
| `CanvasConfig` | 画布尺寸配置 |
| `LiveMixerExtensions` | 库模式扩展接口 |
| `UserInfo` | 用户信息 |
| `SourceType` | 源类型标识符 |

### 插件类型

| 类型 | 说明 |
|------|------|
| `ISourcePlugin` | 源插件接口 |
| `IPluginContext` | 插件上下文接口 |
| `PluginPermission` | 权限类型 |
| `PluginTrustLevel` | 信任级别 |
| `PropsSchema` | 属性 Schema |
| `PluginUIConfig` | 插件 UI 配置 |

详见[插件系统设计](./plugin-system.md)和[数据协议规范](./protocol.md)获取完整类型定义。
