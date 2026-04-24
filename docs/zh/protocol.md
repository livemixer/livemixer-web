# 数据协议规范

本文档定义 LiveMixer Web 用于场景配置的数据模型。协议遵循 [v1.0.0 规范](../../protocol/v1.0.0/v1.0.0.json)。

## ProtocolData

表示整个 LiveMixer 项目的顶层数据结构：

```ts
interface ProtocolData {
  version: string;           // 协议版本（如 "1.0.0"）
  metadata: {
    name: string;            // 项目名称
    createdAt: string;       // ISO 8601 时间戳
    updatedAt: string;       // ISO 8601 时间戳
  };
  canvas: CanvasConfig;      // 画布尺寸
  resources?: Resources;     // 共享资源定义
  scenes: Scene[];           // 场景数组
}
```

## CanvasConfig

```ts
interface CanvasConfig {
  width: number;             // 宽度（像素，默认 1920）
  height: number;            // 高度（像素，默认 1080）
}
```

## Layout

```ts
interface Layout {
  x: number;                 // X 位置（像素）
  y: number;                 // Y 位置（像素）
  width: number;             // 宽度（像素）
  height: number;            // 高度（像素）
}
```

## Transform

```ts
interface Transform {
  opacity?: number;          // 0.0 - 1.0（默认 1.0）
  rotation?: number;         // 角度（默认 0）
  filters?: { name: string; value: number }[];  // Konva 滤镜
  borderRadius?: number;     // 圆角（像素）
}
```

## Scene

```ts
interface Scene {
  id: string;                // 唯一场景标识符（如 "scene-1"）
  name: string;              // 显示名称（如 "Scene 1"）
  active?: boolean;          // 是否为当前激活场景
  items: SceneItem[];        // 场景中的项
}
```

## SceneItem

场景项代表画布上的视觉或音频元素：

### 通用字段

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `id` | `string` | - | 唯一标识符，格式：`{type}-{序号}` |
| `type` | `string` | - | 源类型标识符 |
| `zIndex` | `number` | `0` | 渲染顺序 |
| `layout` | `Layout` | - | 位置和尺寸 |
| `transform` | `Transform?` | - | 视觉效果 |
| `visible` | `boolean?` | `true` | 是否渲染 |
| `locked` | `boolean?` | `false` | 是否锁定编辑 |

### 各类型特有字段

**颜色（`type: 'color'`）**

```ts
{ color?: string }  // CSS 颜色值
```

**文字（`type: 'text'`）**

```ts
{
  content?: string;          // 文本内容
  properties?: {
    fontSize?: number;       // 字体大小（默认 32）
    color?: string;          // 文字颜色（默认 "#ffffff"）
  };
}
```

**图片（`type: 'image'`）**

```ts
{ url?: string }  // 图片 URL
```

**媒体（`type: 'media'`）**

```ts
{ url?: string }  // 媒体 URL
```

**屏幕捕获（`type: 'screen'`）**

```ts
{ source?: string }  // 源标识符（如 "screen_capture"）
```

**窗口捕获（`type: 'window'`）**

```ts
{ source?: string }  // 源标识符（如 "window_capture"）
```

**摄像头（`type: 'video_input'`）**

```ts
{
  deviceId?: string;    // 摄像头设备 ID
  mirror?: boolean;     // 水平镜像
  muted?: boolean;      // 静音状态
  volume?: number;      // 音量
}
```

**音频输入（`type: 'audio_input'`）**

```ts
{
  deviceId?: string;       // 麦克风设备 ID
  muted?: boolean;         // 静音状态
  volume?: number;         // 音量
  showOnCanvas?: boolean;  // 是否在画布上显示视觉指示器
}
```

**容器（`type: 'container'`）**

```ts
{ children?: SceneItem[] }  // 嵌套场景项
```

**场景引用（`type: 'scene_ref'`）**

```ts
{ refSceneId?: string }  // 引用的场景 ID
```

**计时器（`type: 'timer'`）**

```ts
{
  timerConfig?: {
    mode: 'countdown' | 'countup' | 'clock';
    duration?: number;       // 倒计时总时长（秒）
    startValue?: number;     // 正计时起始值（秒）
    format?: string;         // 显示格式（如 "HH:MM:SS"）
    running?: boolean;       // 是否运行中
    currentTime?: number;    // 当前时间值（秒）
  };
}
```

**时钟（`type: 'clock'`）**

```ts
{
  timerConfig?: {
    mode: 'clock';
    format?: string;         // 显示格式（如 "HH:MM:SS"）
    running?: boolean;       // 始终为 true
  };
}
```

**LiveKit 流（`type: 'livekit_stream'`）**

```ts
{
  livekitStream?: {
    participantIdentity: string;                // 参会者 ID
    streamSource: 'camera' | 'screen_share';    // 流源类型
  };
}
```

## 版本兼容

协议使用语义化版本。`ProtocolData` 中的 `version` 字段表示 Schema 版本。同一主版本内保持向后兼容，次版本可能添加新字段，消费者应忽略未知字段。

## 示例

完整的 ProtocolData 文档示例参见 [`protocol/v1.0.0/v1.0.0.json`](../../protocol/v1.0.0/v1.0.0.json)。
