# 插件系统设计

本文档描述 LiveMixer Web 插件系统的设计和内部机制。

## 设计理念

插件系统遵循以下原则：

1. **去侵入式** - 插件定义自身行为而不修改核心代码，宿主应用通过明确定义的接口与插件交互
2. **权限隔离** - 每个插件在权限范围内的上下文中运行，操作需要通过权限验证
3. **Slot 扩展** - 插件通过向预定义 Slot 注册组件来扩展 UI，无需直接导入或修改 UI 组件
4. **契约驱动** - 插件通过 `ISourcePlugin` 接口声明其能力、所需权限和 UI 配置

## ISourcePlugin 接口

每个插件必须实现 `ISourcePlugin` 接口：

```ts
interface ISourcePlugin {
  // 元数据
  id: string;
  version: string;
  name: string;
  icon?: string;
  category: 'media' | 'text' | 'widget' | 'effect';

  // 兼容性声明
  engines: { host: string; api: string };

  // 属性定义
  propsSchema: PropsSchema;

  // 国际化（可选）
  i18n?: IPluginI18n;

  // 信任级别与权限
  trustLevel?: PluginTrustLevel;
  permissions?: PluginPermission[];

  // UI 配置
  ui?: PluginUIConfig;

  // 上下文生命周期
  onContextReady?: (ctx: IPluginContext) => void;

  // 插件间通信的公共 API
  api?: Record<string, any>;

  // 源类型映射
  sourceType?: SourceTypeMapping;

  // 音频混音集成
  audioMixer?: AudioMixerConfig;

  // 画布渲染配置
  canvasRender?: CanvasRenderConfig;

  // 属性面板配置
  propertyPanel?: PropertyPanelConfig;

  // 添加源对话框配置
  addDialog?: AddDialogConfig;

  // 默认布局
  defaultLayout?: DefaultLayoutConfig;

  // 流初始化配置
  streamInit?: StreamInitConfig;

  // 生命周期
  onInit: (ctx: IPluginContext) => Promise<void> | void;  // 已弃用，使用 onContextReady
  onUpdate: (newProps: any) => void;
  render: (commonProps: any) => React.ReactElement;
  onDispose: () => void;
}
```

## Plugin Context API

`IPluginContext` 是运行时提供给插件的主要接口，提供对应用状态、操作、事件和通信的安全访问。

### 状态（只读）

```ts
interface PluginContextState {
  readonly scene: SceneState;
  readonly playback: PlaybackState;
  readonly output: OutputState;
  readonly ui: UIState;
  readonly devices: DevicesState;
  readonly user: UserState;
}
```

状态通过深度只读代理访问，直接修改被阻止。插件必须通过操作来修改状态。

### 事件系统

插件通过 `ctx.subscribe()` 或 `ctx.subscribeMany()` 订阅事件：

```ts
type PluginContextEvent =
  | 'scene:change' | 'scene:item:add' | 'scene:item:remove'
  | 'scene:item:update' | 'scene:item:select' | 'scene:item:reorder'
  | 'playback:start' | 'playback:stop' | 'playback:pause'
  | 'devices:change' | 'devices:videoInput:change' | 'devices:audioInput:change'
  | 'ui:theme:change' | 'ui:language:change'
  | 'plugin:ready' | 'plugin:dispose';
```

每个事件通过 `EventDataMap` 接口提供类型化数据。订阅返回取消订阅函数。

### 操作（Actions）

操作按域分组，需要相应权限：

| 操作域 | 方法 | 所需权限 |
|--------|------|----------|
| `scene.addItem` | 添加场景项 | `scene:write` |
| `scene.removeItem` | 移除场景项 | `scene:write` |
| `scene.updateItem` | 更新项属性 | `scene:write` |
| `scene.selectItem` | 选择/取消选择 | `scene:read` |
| `playback.play/pause/stop` | 控制播放 | `playback:control` |
| `ui.showDialog/closeDialog` | 管理对话框 | `ui:dialog` |
| `ui.showToast` | 显示通知 | `ui:toast` |
| `storage.get/set/remove/clear` | 插件存储 | `storage:read` / `storage:write` |

### 权限系统

```ts
type PluginTrustLevel = 'builtin' | 'verified' | 'community' | 'untrusted';

type PluginPermission =
  | 'scene:read' | 'scene:write'
  | 'playback:read' | 'playback:control'
  | 'devices:read' | 'devices:access'
  | 'storage:read' | 'storage:write'
  | 'ui:dialog' | 'ui:toast' | 'ui:slot'
  | 'plugin:communicate';
```

各信任级别的默认权限：

| 权限 | builtin | verified | community | untrusted |
|------|---------|----------|-----------|-----------|
| `scene:read` | 是 | 是 | 是 | 是 |
| `scene:write` | 是 | 是 | - | - |
| `playback:read` | 是 | 是 | 是 | 是 |
| `playback:control` | 是 | - | - | - |
| `devices:read` | 是 | 是 | - | - |
| `devices:access` | 是 | - | - | - |
| `storage:read/write` | 是 | 是 | 是/是 | -/- |
| `ui:dialog` | 是 | 是 | - | - |
| `ui:toast` | 是 | 是 | 是 | - |
| `ui:slot` | 是 | 是 | - | - |
| `plugin:communicate` | 是 | - | - | - |

### Slot 系统

插件可以将 UI 组件注册到预定义的 Slot：

```ts
type PredefinedSlot =
  | 'toolbar-left' | 'toolbar-center' | 'toolbar-right'
  | 'sidebar-top' | 'sidebar-bottom'
  | 'property-panel-top' | 'property-panel-bottom'
  | 'canvas-overlay'
  | 'status-bar-left' | 'status-bar-center' | 'status-bar-right'
  | 'dialogs' | 'context-menu' | 'add-source-dialog';
```

### 插件间通信

插件可以暴露公共 API 并消费其他插件的 API：

```ts
// 注册 API
ctx.registerAPI({ doSomething: () => console.log('API called') });

// 消费其他插件的 API（需要 'plugin:communicate' 权限）
const textApi = ctx.getPluginAPI('io.livemixer.text');
```

## 内置插件

| 插件 | 源类型 | 分类 | 说明 |
|------|--------|------|------|
| 摄像头 | `video_input` | media | 从摄像头设备采集视频 |
| 音频输入 | `audio_input` | media | 从麦克风采集音频 |
| 屏幕捕获 | `screen` / `window` | media | 捕获屏幕或窗口 |
| 媒体源 | `mediasource` | media | 播放媒体 URL |
| 图片 | `image` | media | 显示图片叠加 |
| 文字 | `text` | text | 渲染文字叠加 |
