# Architecture

This document describes the overall architecture, tech stack, and module structure of LiveMixer Web Studio.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Canvas Engine | Konva.js + react-konva |
| Streaming | LiveKit WebRTC (livekit-client) |
| State Management | Zustand |
| UI Components | Radix UI + Tailwind CSS v4 |
| Build Tool | Vite 7 |
| Linting & Formatting | Biome |
| i18n | i18next + react-i18next |

## Architecture Overview

```
+--------------------------------------------------------------+
|                        UI Layer (Components)                  |
|  Toolbar | MainLayout | KonvaCanvas | PropertyPanel | ...    |
+--------------------------------------------------------------+
|                        Service Layer                          |
|  StreamingService | CanvasCapture | LiveKitPull | MediaStream|
|  PluginContext | PluginRegistry | I18nEngine | Clipboard     |
+--------------------------------------------------------------+
|                      State Layer (Zustand)                    |
|  useProtocolStore (scenes, items, undo/redo)                 |
|  useSettingsStore (preferences, streaming config)            |
+--------------------------------------------------------------+
|                      Plugin Layer                             |
|  ISourcePlugin | PluginContext API | Slot System             |
|  Built-in: Webcam | AudioInput | ScreenCapture | ...        |
+--------------------------------------------------------------+
|                      Type Layer                               |
|  ProtocolData | SceneItem | ISourcePlugin | IPluginContext   |
|  LiveMixerExtensions | I18nEngine | ...                     |
+--------------------------------------------------------------+
```

## Module Structure

```
src/
├── components/       # UI components
│   ├── ui/           #   Base UI primitives (Radix-based)
│   ├── main-layout.tsx       # Main layout container
│   ├── konva-canvas.tsx      # Konva.js canvas editor
│   ├── toolbar.tsx           # Top toolbar with menus
│   ├── toolbar-menu.tsx      # Menu items component
│   ├── bottom-bar.tsx        # Scene/source/audio/streaming bar
│   ├── property-panel.tsx    # Right sidebar property editor
│   ├── status-bar.tsx        # Bottom status bar
│   ├── settings-dialog.tsx   # Settings modal
│   ├── add-source-dialog.tsx # Source type selector
│   ├── configure-source-dialog.tsx  # Source config dialog
│   ├── configure-timer-dialog.tsx   # Timer/clock config dialog
│   ├── plugin-slot.tsx       # Plugin slot renderer
│   ├── plugin-manager-dialog.tsx    # Plugin manager
│   ├── participants-panel.tsx       # LiveKit participants
│   ├── livekit-stream-item.tsx      # Remote stream renderer
│   ├── scene-panel.tsx       # Scene list panel
│   ├── source-panel.tsx      # Source list panel
│   ├── audio-mixer-panel.tsx # Audio mixer controls
│   ├── audio-mixer-dialog.tsx # Audio mixer dialog
│   ├── scene-transition-dialog.tsx # Scene transition config
│   └── about-dialog.tsx      # About dialog
├── services/         # Business logic services
│   ├── streaming.ts           # LiveKit push streaming
│   ├── canvas-capture.ts      # Canvas to MediaStream capture
│   ├── livekit-pull.ts        # LiveKit pull (subscribe)
│   ├── media-stream-manager.ts # Unified media stream management
│   ├── plugin-context.ts      # Plugin context manager
│   ├── plugin-registry.ts     # Plugin registration system
│   ├── i18n-engine.ts         # i18n engine (i18next-based)
│   └── clipboard.ts           # Clipboard service
├── store/            # Zustand state stores
│   ├── protocol.ts            # Scene/item data + undo/redo
│   └── setting.ts             # Application settings
├── types/            # TypeScript type definitions
│   ├── protocol.ts            # ProtocolData, Scene, SceneItem
│   ├── plugin.ts              # ISourcePlugin, PropsSchema
│   ├── plugin-context.ts      # IPluginContext, permissions, events
│   ├── extensions.ts          # LiveMixerExtensions, UserInfo
│   └── i18n-engine.ts        # I18nEngine, IPluginI18n
├── plugins/          # Plugin implementations
│   └── builtin/
│       ├── webcam/            # Webcam plugin
│       ├── audio-input/       # Audio input plugin
│       ├── screencapture-plugin.tsx  # Screen/window capture
│       ├── mediasource-plugin.tsx    # Media source (URL video)
│       ├── image-plugin.tsx          # Image overlay
│       └── text-plugin.tsx           # Text overlay
├── contexts/         # React contexts
│   └── I18nContext.tsx        # i18n provider
├── hooks/            # Custom React hooks
│   ├── useI18n.ts             # i18n hook
│   └── use-performance-monitor.ts  # FPS/CPU monitoring
├── locales/          # Translation resources
│   ├── en.ts                  # English
│   ├── zh.ts                  # Chinese
│   └── index.ts               # Exports
├── assets/           # Static assets
├── utils/            # Utility functions
├── App.tsx           # Main application component
├── index.ts          # Library entry point (exports)
├── main.tsx          # Application entry point
└── version.ts        # Version info
```

## Data Flow

The primary data flow follows a unidirectional pattern:

```
User Action (UI)
     |
     v
Protocol Store (updateData)
     |
     +---> past[] (undo history)
     |
     v
React Components (re-render)
     |
     v
Konva Canvas (visual rendering)
     |
     v
CanvasCaptureService (captureStream)
     |
     v
StreamingService (LiveKit publish)
```

### State Sync to Plugin Context

Application state is synchronized to the Plugin Context system so that plugins can observe changes:

```
Protocol Store / Settings Store
     |
     v
App.tsx (useEffect sync)
     |
     v
PluginContextManager.updateState()
     |
     v
Plugin Context (readonly proxy) ---> Plugin event subscribers
```

## Main Layout

The `MainLayout` component defines the application's visual structure:

```
+----------------------------------------------------------+
|  Logo   |        Toolbar           |    User Section      |
+---------+---------------------------+---------------------+
| Left    |                           |    Right             |
| Sidebar |       Canvas Area         |    Sidebar           |
| (w-80)  |       (flex-1)           |    (w-80)            |
+---------+---------------------------+---------------------+
|              Bottom Bar (h-56)                            |
+----------------------------------------------------------+
|              Status Bar                                   |
+----------------------------------------------------------+
```

Each region receives its content as a ReactNode prop, making the layout highly composable.

## Service Architecture

### StreamingService

Handles pushing the canvas stream to a LiveKit room:

- `connect(url, token, mediaStream, bitrate, codec, fps)` - Connect and publish
- `disconnect()` - Unpublish and disconnect
- Singleton instance exported as `streamingService`

### CanvasCaptureService

Captures a `MediaStream` from an HTML Canvas element:

- `captureStream(canvas, fps)` - Returns a MediaStream from the canvas
- `stopCapture()` - Stops all capture tracks
- Singleton instance exported as `canvasCaptureService`

### LiveKitPullService

Subscribes to remote participant streams from a LiveKit room:

- `connect(url, token, callbacks)` - Connect and subscribe
- `disconnect()` - Disconnect from room
- `getParticipants()` - Get participant info list
- `getParticipantVideoTrack(identity, source)` - Get a participant's video track
- Singleton instance exported as `liveKitPullService`

### MediaStreamManager

Centralized management of all media streams:

- `setStream(itemId, entry)` - Register a stream for a scene item
- `getStream(itemId)` - Retrieve a stream entry
- `removeStream(itemId)` - Remove and clean up a stream
- `onStreamChange(itemId, callback)` - Subscribe to stream changes
- `getVideoInputDevices()` - Enumerate video input devices
- `getAudioInputDevices()` - Enumerate audio input devices
- `setPendingStream(data)` / `consumePendingStream()` - Dialog-to-app communication
- Singleton instance exported as `mediaStreamManager`

### PluginRegistry

Manages plugin registration and lookup:

- `register(plugin)` - Register a plugin and initialize its context
- `getPlugin(id)` - Get plugin by ID
- `getAllPlugins()` - Get all registered plugins
- `getPluginsByCategory(category)` - Filter by category
- `getSourcePlugins()` - Get plugins with source type mapping
- `getPluginBySourceType(sourceType)` - Look up plugin by SceneItem type
- `getAudioMixerPlugins()` - Get plugins with audio mixing support
- Singleton instance exported as `pluginRegistry`

### PluginContextManager

Creates and manages secure context instances for plugins:

- `updateState(updater)` - Update application state
- `setActionHandlers(handlers)` - Configure action handlers
- `createContextForPlugin(pluginId, version, trustLevel)` - Create a plugin context
- `disposePlugin(pluginId)` - Dispose a plugin and clean up
- `getSlotContents(slot)` - Get contents for a UI slot
- `subscribeToSlots(callback)` - Subscribe to slot changes
- Singleton instance exported as `pluginContextManager`
