# 推流与拉流指南

本指南介绍 LiveMixer Web 基于 [LiveKit](https://livekit.io/) 的推流（Push）和拉流（Pull）能力。

## 前提条件

- 运行中的 [LiveKit 服务器](https://docs.livekit.io/oss/getting-started/installation/)实例
- 目标房间的有效 LiveKit 访问令牌
- 令牌需具有适当的权限（推流需 publish，拉流需 subscribe）

## 推流

推流捕获画布输出并将其作为 WebRTC 流发布到 LiveKit 房间。

### 架构

```
Konva Canvas
     |
     v
CanvasCaptureService (captureStream)
     |
     v
MediaStream（视频 + 音频轨道）
     |
     v
StreamingService（LiveKit 连接 + 发布）
     |
     v
LiveKit Room (WebRTC)
```

### 配置

在设置对话框中配置推流参数：

| 设置 | 字段 | 默认值 | 说明 |
|------|------|--------|------|
| LiveKit URL | `livekitUrl` | - | 服务器 URL |
| LiveKit Token | `livekitToken` | - | 访问令牌（不持久化） |
| 视频码率 | `videoBitrate` | `5000` | 视频码率 (kbps) |
| 视频编码 | `videoEncoder` | `vp8` | 视频编码 |
| 帧率 | `fps` | `30` | 目标帧率 |

### StreamingService API

```ts
import { streamingService } from 'livemixer-web';

// 连接并开始推流
await streamingService.connect(url, token, mediaStream, videoBitrate, videoCodec, maxFramerate);

// 断开并停止推流
await streamingService.disconnect();

// 检查连接状态
const isStreaming = streamingService.getConnectionState();
```

### 视频编码

| 编码 | 标识符 | 说明 |
|------|--------|------|
| VP8 | `vp8` | 默认，兼容性好，CPU 占用低 |
| VP9 | `vp9` | 更低码率更高质量，CPU 占用高 |
| H.264 | `h264` | SFU 录制兼容性最好 |
| H.265 | `h265` | 下一代编码，浏览器支持有限 |
| AV1 | `av1` | 开源编码，浏览器支持有限 |

### 推流流程

1. 用户点击开始推流
2. 验证 LiveKit URL 和 Token
3. 获取 Canvas 元素
4. 启用持续渲染：`canvasRef.current.startContinuousRendering()`
5. 捕获 MediaStream：`canvasCaptureService.captureStream(canvas, fps)`
6. 调用 `StreamingService.connect()` 连接并发布
7. 更新 UI 中的推流状态

### 停止推流

1. 用户点击停止推流
2. `StreamingService.disconnect()` 取消发布并断开
3. `CanvasCaptureService.stopCapture()` 停止捕获轨道
4. 禁用持续渲染
5. 更新 UI 中的推流状态

## 拉流

拉流连接到 LiveKit 房间并订阅远端参会者的音视频轨道。

### LiveKitPullService API

```ts
import { liveKitPullService } from 'livemixer-web';

// 连接并订阅
await liveKitPullService.connect(url, token, {
  onParticipantsChanged: (participants) => {
    console.log('参会者:', participants);
  },
});

// 获取参会者信息
const participants = liveKitPullService.getParticipants();

// 获取特定参会者的视频轨道
const videoTrack = liveKitPullService.getParticipantVideoTrack('user-identity', 'camera');

// 断开连接
await liveKitPullService.disconnect();
```

### ParticipantInfo

```ts
interface ParticipantInfo {
  identity: string;              // 参会者标识
  name?: string;                 // 显示名称
  isSpeaking: boolean;           // 是否在发言
  isCameraEnabled: boolean;      // 摄像头是否启用
  isMicrophoneEnabled: boolean;  // 麦克风是否启用
  isScreenShareEnabled: boolean; // 屏幕共享是否启用
}
```

### 添加参会者到场景

远端参会者添加到画布时，创建 `livekit_stream` 类型的 SceneItem，默认尺寸为画布宽度的 1/3，16:9 纵横比。

## MediaStreamManager

`MediaStreamManager` 提供所有媒体流的集中管理。

```ts
import { mediaStreamManager } from 'livemixer-web';

// 注册流
mediaStreamManager.setStream(itemId, { stream, video, metadata });

// 获取流
const entry = mediaStreamManager.getStream(itemId);

// 移除流（停止轨道并从 DOM 移除视频元素）
mediaStreamManager.removeStream(itemId);

// 设备枚举
const videoDevices = await mediaStreamManager.getVideoInputDevices();
const audioDevices = await mediaStreamManager.getAudioInputDevices();
```

### 设备枚举

设备枚举方法优雅处理权限请求：
- 首先尝试不请求权限进行枚举
- 如果设备标签为空（权限未授予），请求 `getUserMedia` 权限
- 权限授予后重新枚举以获取设备标签
- 权限被拒绝时优雅回退

### Pending Stream（对话框通信）

`MediaStreamManager` 还提供插件将流从对话框传递到主应用的机制：

```ts
// 设置待处理流（插件对话框关闭前调用）
mediaStreamManager.setPendingStream({ stream, sourceType, metadata });

// 消费待处理流（App 创建项时调用）
const pending = mediaStreamManager.consumePendingStream();
```

## 清理

组件卸载时所有推流资源都会被清理：

```ts
useEffect(() => {
  return () => {
    if (isStreaming) {
      streamingService.disconnect();
      canvasCaptureService.stopCapture();
    }
    if (isPulling) {
      liveKitPullService.disconnect();
    }
  };
}, [isStreaming, isPulling]);
```
