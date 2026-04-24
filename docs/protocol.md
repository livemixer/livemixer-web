# Protocol Specification

This document defines the data model used by LiveMixer Web for scene configurations. The protocol follows the [v1.0.0 specification](../protocol/v1.0.0/v1.0.0.json).

## ProtocolData

The top-level data structure representing an entire LiveMixer project:

```ts
interface ProtocolData {
  version: string;           // Protocol version (e.g., "1.0.0")
  metadata: {
    name: string;            // Project name
    createdAt: string;       // ISO 8601 timestamp
    updatedAt: string;       // ISO 8601 timestamp
  };
  canvas: CanvasConfig;      // Canvas dimensions
  resources?: Resources;     // Shared resource definitions
  scenes: Scene[];           // Array of scenes
}
```

## CanvasConfig

Defines the canvas dimensions:

```ts
interface CanvasConfig {
  width: number;             // Width in pixels (default: 1920)
  height: number;            // Height in pixels (default: 1080)
}
```

Standard resolutions:

| Name | Width | Height |
|------|-------|--------|
| 1080p (Full HD) | 1920 | 1080 |
| 720p (HD) | 1280 | 720 |
| 4K (UHD) | 3840 | 2160 |

## Layout

Defines the position and size of a scene item:

```ts
interface Layout {
  x: number;                 // X position in pixels
  y: number;                 // Y position in pixels
  width: number;             // Width in pixels
  height: number;            // Height in pixels
}
```

## Transform

Optional transform properties for visual effects:

```ts
interface Transform {
  opacity?: number;          // 0.0 - 1.0 (default: 1.0)
  rotation?: number;         // Degrees (default: 0)
  filters?: {                // Konva filters
    name: string;            // Filter name (e.g., "brightness")
    value: number;           // Filter value
  }[];
  borderRadius?: number;     // Border radius in pixels
}
```

## Scene

A scene is a collection of scene items that can be displayed on the canvas:

```ts
interface Scene {
  id: string;                // Unique scene identifier (e.g., "scene-1")
  name: string;              // Display name (e.g., "Scene 1")
  active?: boolean;          // Whether this is the active scene
  items: SceneItem[];        // Items in this scene
}
```

## SceneItem

A scene item represents a visual or audio element on the canvas:

```ts
interface SceneItem {
  id: string;                // Unique item identifier (e.g., "video_input-1")
  type: SourceType;          // Source type identifier
  zIndex: number;            // Rendering order (higher = on top)
  layout: Layout;            // Position and size
  transform?: Transform;     // Visual transform effects
  visible?: boolean;         // Visibility (default: true)
  locked?: boolean;          // Property lock (default: false)

  // Type-specific fields (see below)
}
```

### Common Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `string` | - | Unique identifier, format: `{type}-{sequence}` |
| `type` | `string` | - | Source type identifier |
| `zIndex` | `number` | `0` | Rendering order |
| `layout` | `Layout` | - | Position and size |
| `transform` | `Transform?` | - | Visual effects |
| `visible` | `boolean?` | `true` | Whether the item is rendered |
| `locked` | `boolean?` | `false` | Whether the item is locked from editing |

### Color Type (`type: 'color'`)

A solid color rectangle.

```ts
{
  color?: string;            // CSS color value (e.g., "#3b82f6")
}
```

### Text Type (`type: 'text'`)

A text overlay.

```ts
{
  content?: string;          // Text content
  properties?: {
    fontSize?: number;       // Font size in pixels (default: 32)
    color?: string;          // Text color (default: "#ffffff")
  };
}
```

### Image Type (`type: 'image'`)

An image overlay.

```ts
{
  url?: string;              // Image URL
}
```

### Media Type (`type: 'media'`)

A media source (video from URL).

```ts
{
  url?: string;              // Media URL
}
```

### Screen Type (`type: 'screen'`)

Screen capture source.

```ts
{
  source?: string;           // Source identifier (e.g., "screen_capture")
}
```

### Window Type (`type: 'window'`)

Window capture source.

```ts
{
  source?: string;           // Source identifier (e.g., "window_capture")
}
```

### Video Input Type (`type: 'video_input'`)

Webcam capture source.

```ts
{
  deviceId?: string;         // Webcam device ID
  mirror?: boolean;          // Mirror the video horizontally
  muted?: boolean;           // Mute state
  volume?: number;           // Volume level
}
```

### Audio Input Type (`type: 'audio_input'`)

Audio capture source.

```ts
{
  deviceId?: string;         // Microphone device ID
  muted?: boolean;           // Mute state
  volume?: number;           // Volume level
  showOnCanvas?: boolean;    // Whether to show a visual indicator on canvas
}
```

### Container Type (`type: 'container'`)

A grouping container for nested items.

```ts
{
  children?: SceneItem[];    // Nested scene items
}
```

### Scene Reference Type (`type: 'scene_ref'`)

A reference to another scene (picture-in-picture).

```ts
{
  refSceneId?: string;       // ID of the referenced scene
}
```

### Timer Type (`type: 'timer'`)

Countdown or count-up timer.

```ts
{
  properties?: {
    fontSize?: number;       // Font size
    color?: string;          // Timer color
  };
  timerConfig?: {
    mode: 'countdown' | 'countup' | 'clock';
    duration?: number;       // Total countdown duration (seconds)
    startValue?: number;     // Count-up start value (seconds)
    format?: string;         // Display format (e.g., "HH:MM:SS", "MM:SS")
    running?: boolean;       // Whether the timer is running
    currentTime?: number;    // Current time value (seconds)
    startTime?: number;      // Start timestamp for precision
    pausedAt?: number;       // Time value when paused
  };
}
```

### Clock Type (`type: 'clock'`)

Real-time clock display.

```ts
{
  properties?: {
    fontSize?: number;
    color?: string;
  };
  timerConfig?: {
    mode: 'clock';
    format?: string;         // Display format (e.g., "HH:MM:SS")
    running?: boolean;       // Always true for clock
  };
}
```

### LiveKit Stream Type (`type: 'livekit_stream'`)

A remote participant's stream from a LiveKit room.

```ts
{
  livekitStream?: {
    participantIdentity: string;     // Participant ID
    streamSource: 'camera' | 'screen_share';  // Stream source type
  };
}
```

## Source

A shared resource definition:

```ts
interface Source {
  id: string;                // Source identifier
  type: string;              // Source type
  name: string;              // Display name
  config?: Record<string, string>;  // Device configuration
  url?: string;              // Resource URL
}
```

## Resources

Container for shared resources:

```ts
interface Resources {
  sources: Source[];         // Array of source definitions
}
```

## Version Compatibility

The protocol uses semantic versioning. The `version` field in `ProtocolData` indicates the schema version:

- **1.0.0** - Initial protocol with scene/item/canvas structure

Backward compatibility is maintained within the same major version. New fields may be added in minor versions; consumers should ignore unknown fields.

## Example

A complete example of a ProtocolData document is available at [`protocol/v1.0.0/v1.0.0.json`](../protocol/v1.0.0/v1.0.0.json).
