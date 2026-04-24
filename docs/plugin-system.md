# Plugin System

This document describes the design and internals of the LiveMixer Web plugin system.

## Design Philosophy

The plugin system follows these principles:

1. **Non-intrusive** - Plugins define their own behavior without modifying core code. The host application interacts with plugins through well-defined interfaces.
2. **Permission Isolation** - Each plugin runs within a permission-scoped context. Actions are validated against the plugin's granted permissions.
3. **Slot Extension** - Plugins can extend the UI by registering components into predefined slots, without directly importing or modifying UI components.
4. **Contract-based** - Plugins declare their capabilities, required permissions, and UI configuration through the `ISourcePlugin` interface.

## ISourcePlugin Interface

Every plugin must implement the `ISourcePlugin` interface:

```ts
interface ISourcePlugin {
  // Metadata
  id: string;
  version: string;
  name: string;
  icon?: string;
  category: 'media' | 'text' | 'widget' | 'effect';

  // Compatibility declaration
  engines: {
    host: string;
    api: string;
  };

  // Property definitions
  propsSchema: PropsSchema;

  // Internationalization (optional)
  i18n?: IPluginI18n;

  // Trust level and permissions
  trustLevel?: PluginTrustLevel;
  permissions?: PluginPermission[];

  // UI configuration
  ui?: PluginUIConfig;

  // Context lifecycle
  onContextReady?: (ctx: IPluginContext) => void;

  // Public API for inter-plugin communication
  api?: Record<string, any>;

  // Source type mapping
  sourceType?: SourceTypeMapping;

  // Audio mixer integration
  audioMixer?: AudioMixerConfig;

  // Canvas render configuration
  canvasRender?: CanvasRenderConfig;

  // Property panel configuration
  propertyPanel?: PropertyPanelConfig;

  // Add source dialog configuration
  addDialog?: AddDialogConfig;

  // Default layout for created items
  defaultLayout?: DefaultLayoutConfig;

  // Stream initialization configuration
  streamInit?: StreamInitConfig;

  // Lifecycle
  onInit: (ctx: IPluginContext) => Promise<void> | void;  // deprecated, use onContextReady
  onUpdate: (newProps: any) => void;
  render: (commonProps: any) => React.ReactElement;
  onDispose: () => void;
}
```

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique plugin identifier (e.g., `io.livemixer.webcam`) |
| `version` | `string` | Semver version string |
| `name` | `string` | Human-readable plugin name |
| `icon` | `string?` | Icon identifier for the UI |
| `category` | `enum` | Plugin category: `media`, `text`, `widget`, or `effect` |
| `engines` | `object` | Compatibility declaration (`host` and `api` version strings) |

### PropsSchema

The `propsSchema` defines the configurable properties of a plugin. Each property is described by a `PropsSchemaItem`:

```ts
interface PropsSchemaItem {
  label: string;
  labelKey?: string;       // i18n key for label
  type: PluginControlType;  // 'number' | 'string' | 'color' | 'boolean' | 'select' | 'image' | 'video' | 'group'
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; labelKey?: string; value: any }[];
  group?: string;
  groupKey?: string;
}

interface PropsSchema {
  [key: string]: PropsSchemaItem;
}
```

The property panel automatically generates controls based on the schema. Default values from `propsSchema` are injected into newly created `SceneItem` instances.

### Source Type Mapping

```ts
interface SourceTypeMapping {
  typeId: string;          // The source type identifier used in SceneItem.type
  nameKey?: string;        // i18n key for the add source dialog
  descriptionKey?: string; // i18n key for description
  icon?: string;           // Icon identifier
}
```

If `sourceType` is defined, the plugin appears as a selectable option in the Add Source dialog.

### Audio Mixer Integration

```ts
interface AudioMixerConfig {
  enabled: boolean;        // Whether this plugin supports audio mixing
  volumeKey?: string;      // Property key for volume (default: 'volume')
  mutedKey?: string;       // Property key for muted state (default: 'muted')
  defaultVolume?: number;  // Default volume value
}
```

When `audioMixer.enabled` is `true`, items of this type automatically appear in the audio mixer panel.

### Canvas Render Configuration

```ts
interface CanvasRenderConfig {
  shouldFilter?: (item: SceneItem) => boolean; // Exclude from canvas rendering
  isSelectable?: (item: SceneItem) => boolean; // Allow selection/transform
}
```

### Add Dialog Configuration

```ts
interface AddDialogConfig {
  component?: React.ComponentType<any>; // Custom dialog component
  immediate?: boolean;                   // Show dialog before creating item
  dialogId?: string;                     // Slot ID for the dialog
  needsBrowserPermission?: 'camera' | 'microphone' | 'screen'; // Request browser permission on add
}
```

## Plugin Context API

The `IPluginContext` is the primary interface provided to plugins at runtime. It offers secure access to application state, actions, events, and communication.

### State (Readonly)

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

State is accessed through a deep readonly proxy. Direct modifications are blocked. Plugins must use actions to modify state.

### Event System

Plugins subscribe to events via `ctx.subscribe()` or `ctx.subscribeMany()`:

```ts
// Available events
type PluginContextEvent =
  | 'scene:change' | 'scene:item:add' | 'scene:item:remove'
  | 'scene:item:update' | 'scene:item:select' | 'scene:item:reorder'
  | 'playback:start' | 'playback:stop' | 'playback:pause'
  | 'devices:change' | 'devices:videoInput:change' | 'devices:audioInput:change'
  | 'ui:theme:change' | 'ui:language:change'
  | 'plugin:ready' | 'plugin:dispose';
```

Each event provides typed data through the `EventDataMap` interface. Subscriptions return an unsubscribe function.

### Actions

Actions are grouped by domain and require appropriate permissions:

```ts
interface PluginContextActions {
  scene: SceneActions;     // Requires 'scene:read' / 'scene:write'
  playback: PlaybackActions; // Requires 'playback:read' / 'playback:control'
  ui: UIActions;           // Requires 'ui:dialog' / 'ui:toast'
  storage: StorageActions; // Requires 'storage:read' / 'storage:write'
}
```

| Action Domain | Methods | Required Permission |
|---------------|---------|-------------------|
| `scene.addItem` | Add a new scene item | `scene:write` |
| `scene.removeItem` | Remove a scene item | `scene:write` |
| `scene.updateItem` | Update item properties | `scene:write` |
| `scene.selectItem` | Select/deselect item | `scene:read` |
| `scene.reorderItems` | Reorder items | `scene:write` |
| `scene.duplicateItem` | Duplicate an item | `scene:write` |
| `playback.play/pause/stop/toggle` | Control playback | `playback:control` |
| `ui.showDialog/closeDialog` | Manage dialogs | `ui:dialog` |
| `ui.showToast` | Show notifications | `ui:toast` |
| `ui.setTheme/setLanguage` | Change UI settings | - |
| `storage.get/set/remove/clear` | Plugin storage | `storage:read` / `storage:write` |

### Permission System

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

Default permissions by trust level:

| Permission | builtin | verified | community | untrusted |
|-----------|---------|----------|-----------|-----------|
| `scene:read` | Yes | Yes | Yes | Yes |
| `scene:write` | Yes | Yes | - | - |
| `playback:read` | Yes | Yes | Yes | Yes |
| `playback:control` | Yes | - | - | - |
| `devices:read` | Yes | Yes | - | - |
| `devices:access` | Yes | - | - | - |
| `storage:read` | Yes | Yes | Yes | - |
| `storage:write` | Yes | Yes | Yes | - |
| `ui:dialog` | Yes | Yes | - | - |
| `ui:toast` | Yes | Yes | Yes | - |
| `ui:slot` | Yes | Yes | - | - |
| `plugin:communicate` | Yes | - | - | - |

### Slot System

Plugins can register UI components into predefined slots:

```ts
type PredefinedSlot =
  | 'toolbar-left' | 'toolbar-center' | 'toolbar-right'
  | 'sidebar-top' | 'sidebar-bottom'
  | 'property-panel-top' | 'property-panel-bottom'
  | 'canvas-overlay'
  | 'status-bar-left' | 'status-bar-center' | 'status-bar-right'
  | 'dialogs' | 'context-menu' | 'add-source-dialog';

type SlotName = PredefinedSlot | `custom:${string}`;
```

Registration:

```ts
ctx.registerSlot({
  id: 'my-plugin-toolbar-btn',
  slot: 'toolbar-right',
  component: MyToolbarButton,
  priority: 10,
  visible: (state) => state.scene.selectedItemId !== null,
});
```

Slot contents are sorted by `priority` (higher = rendered first) and can be conditionally visible based on application state.

### Plugin Communication

Plugins can expose public APIs and consume other plugins' APIs:

```ts
// Register an API
ctx.registerAPI({
  getPlaybackTime: () => currentTime,
  seekTo: (time: number) => { /* ... */ },
});

// Consume another plugin's API
const textApi = ctx.getPluginAPI<TextPluginAPI>('io.livemixer.text');
if (textApi) {
  textApi.updateContent('Hello World');
}
```

Requires the `plugin:communicate` permission.

## Plugin Registration

Plugins are registered with the `PluginRegistry` singleton:

```ts
import { pluginRegistry } from './services/plugin-registry';

pluginRegistry.register(myPlugin);
```

During registration:
1. The plugin is stored in the registry map
2. Plugin i18n resources are registered with the I18nEngine
3. A basic `IPluginContext` is created and `onInit` is called (legacy)
4. A full `IPluginContext` with permission system is created and `onContextReady` is called

## Built-in Plugins

| Plugin | Source Type | Category | Description |
|--------|-------------|----------|-------------|
| Webcam | `video_input` | media | Capture video from a webcam device |
| Audio Input | `audio_input` | media | Capture audio from a microphone |
| Screen Capture | `screen` / `window` | media | Capture screen or window |
| Media Source | `mediasource` | media | Play a media URL |
| Image | `image` | media | Display an image overlay |
| Text | `text` | text | Render text overlay |
