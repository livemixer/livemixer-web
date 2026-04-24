# API Reference

This document lists all public exports from the `livemixer-web` package.

> Source: [`src/index.ts`](../src/index.ts)

## Components

### LiveMixerApp

The main application component. Renders the complete LiveMixer Web Studio interface.

```tsx
import { LiveMixerApp } from 'livemixer-web';

function App() {
  return <LiveMixerApp />;
}

// With extensions
function AppWithExtensions() {
  return <LiveMixerApp extensions={extensions} />;
}
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `extensions` | `LiveMixerExtensions?` | Optional customization extensions |

### MainLayout

Layout container that arranges the application regions.

```tsx
import { MainLayout } from 'livemixer-web';

<MainLayout
  logo={<MyLogo />}
  toolbar={<MyToolbar />}
  userSection={<UserMenu />}
  canvas={<MyCanvas />}
  leftSidebar={<MySidebar />}
  rightSidebar={<MyPanel />}
  bottomBar={<MyBottomBar />}
  statusBar={<MyStatusBar />}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `logo` | `ReactNode?` | Logo area (top-left) |
| `toolbar` | `ReactNode?` | Toolbar area (top-center) |
| `userSection` | `ReactNode?` | User section (top-right) |
| `canvas` | `ReactNode?` | Canvas area (center) |
| `leftSidebar` | `ReactNode?` | Left sidebar |
| `rightSidebar` | `ReactNode?` | Right sidebar |
| `bottomBar` | `ReactNode?` | Bottom bar |
| `statusBar` | `ReactNode?` | Status bar |

### Toolbar

Top toolbar with menus (File, Edit, View, Tools, Help).

```tsx
import { Toolbar } from 'livemixer-web';
```

### BottomBar

Bottom bar containing scene management, source list, audio mixer, and streaming controls.

```tsx
import { BottomBar } from 'livemixer-web';
```

### KonvaCanvas

Konva.js-powered canvas component for visual scene editing.

```tsx
import { KonvaCanvas } from 'livemixer-web';
```

Supports `ref` with `KonvaCanvasHandle` for imperative access:

```tsx
const canvasRef = useRef<KonvaCanvasHandle>(null);

// Get the underlying canvas element
canvasRef.current?.getCanvas();

// Control continuous rendering (used during streaming)
canvasRef.current?.startContinuousRendering();
canvasRef.current?.stopContinuousRendering();
```

### PropertyPanel

Right sidebar panel for editing the selected source's properties.

```tsx
import { PropertyPanel } from 'livemixer-web';
```

### StatusBar

Bottom status bar showing streaming state, resolution, FPS, and CPU usage.

```tsx
import { StatusBar } from 'livemixer-web';
```

### LeftSidebar

Left sidebar container component.

```tsx
import { LeftSidebar } from 'livemixer-web';
```

### SettingsDialog

Modal dialog for application settings (video, audio, streaming, view, transitions).

```tsx
import { SettingsDialog } from 'livemixer-web';
```

## Services

### streamingService

Singleton instance of `StreamingService` for pushing the canvas stream to LiveKit.

```ts
import { streamingService } from 'livemixer-web';
```

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `connect` | `(url: string, token: string, mediaStream: MediaStream, videoBitrate?: number, videoCodec?: string, maxFramerate?: number) => Promise<void>` | Connect to a LiveKit room and publish stream |
| `disconnect` | `() => Promise<void>` | Disconnect and clean up |
| `getConnectionState` | `() => boolean` | Get connection state |
| `getRoom` | `() => Room \| null` | Get the LiveKit Room instance |

**Video Codecs:** `'h264' | 'h265' | 'vp8' | 'vp9' | 'av1'` (default: `'vp8'`)

### canvasCaptureService

Singleton instance of `CanvasCaptureService` for capturing MediaStream from a canvas element.

```ts
import { canvasCaptureService } from 'livemixer-web';
```

**Methods:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `captureStream` | `(canvas: HTMLCanvasElement, fps?: number) => MediaStream` | Capture a MediaStream from a canvas |
| `stopCapture` | `() => void` | Stop capture and release tracks |
| `getStream` | `() => MediaStream \| null` | Get current stream |

## Stores

### useProtocolStore

Zustand store for scene/item data with undo/redo support.

```ts
import { useProtocolStore } from 'livemixer-web';
```

**State:**

| Field | Type | Description |
|-------|------|-------------|
| `data` | `ProtocolData` | Current scene configuration |
| `past` | `ProtocolData[]` | Undo history stack |
| `future` | `ProtocolData[]` | Redo history stack |
| `canUndo` | `boolean` | Whether undo is available |
| `canRedo` | `boolean` | Whether redo is available |

**Actions:**

| Action | Signature | Description |
|--------|-----------|-------------|
| `updateData` | `(data: ProtocolData) => void` | Update data (pushes current to undo stack) |
| `undo` | `() => void` | Restore previous state |
| `redo` | `() => void` | Restore next state |
| `resetData` | `(sceneName?: string) => void` | Reset to default |

### useSettingsStore

Zustand store for application settings with sensitive data protection.

```ts
import { useSettingsStore } from 'livemixer-web';
```

**Persistent Settings (saved to localStorage):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `language` | `string` | `'zh-CN'` | UI language |
| `theme` | `string` | `'dark'` | UI theme |
| `streamService` | `string` | `'custom'` | Streaming service |
| `livekitUrl` | `string` | `''` | LiveKit server URL |
| `livekitPullUrl` | `string` | `''` | LiveKit pull URL |
| `videoBitrate` | `string` | `'5000'` | Video bitrate (kbps) |
| `audioBitrate` | `string` | `'48000'` | Audio bitrate |
| `videoEncoder` | `string` | `'vp8'` | Video codec |
| `audioEncoder` | `string` | `'opus'` | Audio codec |
| `baseResolution` | `string` | `'1920x1080'` | Base resolution |
| `outputResolution` | `string` | `'1920x1080'` | Output resolution |
| `fps` | `string` | `'30'` | Frame rate |
| `scaleFilter` | `string` | `'bilinear'` | Scale filter |
| `showGrid` | `boolean` | `false` | Show grid overlay |
| `showGuides` | `boolean` | `true` | Show alignment guides |
| `transitionType` | `string` | `'fade'` | Scene transition type |
| `transitionDuration` | `number` | `300` | Transition duration (ms) |

**Sensitive Settings (in-memory only):**

| Field | Type | Description |
|-------|------|-------------|
| `livekitToken` | `string` | LiveKit access token (not persisted) |
| `livekitPullToken` | `string` | LiveKit pull token (not persisted) |

**Actions:**

| Action | Signature | Description |
|--------|-----------|-------------|
| `updatePersistentSettings` | `(settings: Partial<PersistentSettings>) => void` | Update persisted settings |
| `updateSensitiveSettings` | `(settings: Partial<SensitiveSettings>) => void` | Update sensitive settings |
| `resetSettings` | `() => void` | Reset to defaults |

## Types

### ProtocolData

```ts
interface ProtocolData {
  version: string;
  metadata: {
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  canvas: CanvasConfig;
  resources?: Resources;
  scenes: Scene[];
}
```

### Scene

```ts
interface Scene {
  id: string;
  name: string;
  active?: boolean;
  items: SceneItem[];
}
```

### SceneItem

```ts
interface SceneItem {
  id: string;
  type: string;
  zIndex: number;
  layout: Layout;
  transform?: Transform;
  visible?: boolean;
  locked?: boolean;
  // Type-specific fields...
}
```

See [Protocol Specification](./protocol.md) for the complete field reference.

### CanvasConfig

```ts
interface CanvasConfig {
  width: number;
  height: number;
}
```

### LiveMixerExtensions

```ts
interface LiveMixerExtensions {
  logo?: React.ReactNode;
  userComponent?: React.ReactNode;
  getUserInfo?: () => Promise<UserInfo | null>;
  onSaveLayout?: (data: ProtocolData) => Promise<void>;
  onLoadLayout?: () => Promise<ProtocolData | null>;
  onShareLayout?: (data: ProtocolData, options?: { password?: string; expiresIn?: number }) => Promise<string>;
  checkPermission?: (feature: string) => Promise<boolean>;
  customMenuItems?: Array<{ label: string; items: Array<{ label: string; onClick: () => void; divider?: boolean }> }>;
  i18nEngine?: I18nEngine;
  i18nOverrides?: I18nOverrideBundle;
  i18nUserOverrides?: I18nOverrideBundle;
}
```

### UserInfo

```ts
interface UserInfo {
  avatar?: string;
  name?: string;
  role?: 'anonymous' | 'free' | 'pro' | 'admin';
  email?: string;
}
```

### SourceType

```ts
type SourceType =
  | 'color' | 'image' | 'media' | 'text'
  | 'screen' | 'window' | 'video_input' | 'audio_input'
  | 'audio_output' | 'container' | 'scene_ref'
  | 'timer' | 'clock' | 'livekit_stream'
  | string;  // Extensible for custom plugin types
```

### Plugin Types

```ts
// Core plugin interface
interface ISourcePlugin { /* ... */ }

// Plugin context
interface IPluginContext { /* ... */ }

// Permissions
type PluginPermission = 'scene:read' | 'scene:write' | /* ... */;
type PluginTrustLevel = 'builtin' | 'verified' | 'community' | 'untrusted';

// Plugin UI
interface PluginUIConfig { /* ... */ }

// Props schema
interface PropsSchema { /* ... */ }
interface PropsSchemaItem { /* ... */ }
```

See the [Plugin System](./plugin-system.md) documentation for complete type definitions.
