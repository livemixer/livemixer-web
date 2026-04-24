# State Management

LiveMixer Web uses [Zustand](https://github.com/pmndrs/zustand) for state management. This document covers the store architecture, data flow, and persistence strategy.

## Why Zustand

- **Minimal boilerplate** - No reducers, actions, or dispatch functions
- **React-friendly** - Hooks-based API with automatic re-render optimization
- **Middleware support** - Built-in `persist` and `immer` middleware
- **TypeScript-first** - Full type inference for store state and actions
- **Lightweight** - Small bundle size with no dependencies

## useProtocolStore

The protocol store manages scene and item data with undo/redo support.

**Source:** [`src/store/protocol.ts`](../src/store/protocol.ts)

### State Structure

```ts
interface ProtocolState {
  data: ProtocolData;        // Current scene configuration
  past: ProtocolData[];      // Undo history stack
  future: ProtocolData[];    // Redo history stack
  canUndo: boolean;          // Whether undo is available
  canRedo: boolean;          // Whether redo is available
}
```

### Default Data

```ts
const defaultData: ProtocolData = {
  version: '1.0.0',
  metadata: {
    name: 'New Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  canvas: { width: 1920, height: 1080 },
  resources: { sources: [] },
  scenes: [{
    id: 'scene-1',
    name: 'Scene 1',
    active: true,
    items: [],
  }],
};
```

### Actions

#### updateData

Updates the protocol data and pushes the current state to the undo history.

```ts
updateData: (data: ProtocolData) => void
```

The `updatedAt` metadata field is automatically set to the current timestamp. The `future` stack is cleared (new changes invalidate redo history).

**Example:**

```ts
const { data, updateData } = useProtocolStore();

// Add a new item to the active scene
updateData({
  ...data,
  scenes: data.scenes.map(scene => {
    if (scene.id !== activeSceneId) return scene;
    return { ...scene, items: [...scene.items, newItem] };
  }),
});
```

#### undo

Restores the previous state from the undo history.

```ts
undo: () => void
```

- Pops the last entry from `past` and sets it as the current `data`
- Pushes the current `data` to the `future` stack
- Updates `canUndo` and `canRedo` flags

#### redo

Restores the next state from the redo history.

```ts
redo: () => void
```

- Pops the first entry from `future` and sets it as the current `data`
- Pushes the current `data` to the `past` stack
- Updates `canUndo` and `canRedo` flags

#### resetData

Resets the protocol data to the default state.

```ts
resetData: (sceneName?: string) => void
```

Pushes the current data to the undo history before resetting.

### Undo/Redo Implementation

The undo/redo mechanism uses a two-stack approach:

```
  past[]          data          future[]
[older...]     [current]     [...newer]

  <-- undo                    redo -->
```

- **MAX_HISTORY_SIZE** = 50 entries
- When `past` exceeds 50 entries, the oldest entry is discarded
- `updateData` clears the `future` stack (standard undo/redo behavior)
- Only the `data` field is persisted to localStorage (not the history stacks)

### Persistence

The store uses Zustand's `persist` middleware with `localStorage`:

```ts
persist(
  // ... store definition
  {
    name: 'livemixer-protocol',    // localStorage key
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({      // Only persist data, not history
      data: state.data,
    }),
  },
)
```

The `partialize` function ensures that only `data` is persisted. The `past` and `future` stacks are reset on page reload.

## useSettingsStore

The settings store manages application preferences with sensitive data protection.

**Source:** [`src/store/setting.ts`](../src/store/setting.ts)

### State Structure

The store separates settings into two categories:

#### PersistentSettings (saved to localStorage)

```ts
interface PersistentSettings {
  // General
  language: string;           // UI language (default: 'zh-CN')
  theme: string;              // UI theme (default: 'dark')

  // Streaming
  streamService: string;      // Service type (default: 'custom')
  livekitUrl: string;         // LiveKit server URL

  // Pull
  livekitPullUrl: string;     // LiveKit pull URL

  // Output
  videoBitrate: string;       // Video bitrate in kbps (default: '5000')
  audioBitrate: string;       // Audio bitrate (default: '48000')
  videoEncoder: string;       // Video codec (default: 'vp8')
  audioEncoder: string;       // Audio codec (default: 'opus')

  // Audio
  audioDevice: string;        // Audio device (default: 'default')
  sampleRate: string;         // Sample rate (default: '48000')
  channels: string;           // Channel config (default: 'stereo')

  // Video
  baseResolution: string;     // Base resolution (default: '1920x1080')
  outputResolution: string;   // Output resolution (default: '1920x1080')
  fps: string;                // Frame rate (default: '30')
  scaleFilter: string;        // Scale filter (default: 'bilinear')

  // View
  showGrid: boolean;          // Show grid overlay (default: false)
  showGuides: boolean;        // Show alignment guides (default: true)

  // Transition
  transitionType: 'cut' | 'fade' | 'dissolve' | 'swipe' | 'stinger';  // default: 'fade'
  transitionDuration: number; // Duration in ms (default: 300)
}
```

#### SensitiveSettings (in-memory only)

```ts
interface SensitiveSettings {
  livekitToken: string;       // LiveKit access token (NOT persisted)
  livekitPullToken: string;   // LiveKit pull token (NOT persisted)
}
```

### Actions

#### updatePersistentSettings

Updates settings that are saved to localStorage.

```ts
updatePersistentSettings: (settings: Partial<PersistentSettings>) => void
```

**Example:**

```ts
const { updatePersistentSettings } = useSettingsStore();

updatePersistentSettings({
  language: 'en',
  theme: 'light',
  fps: '60',
});
```

#### updateSensitiveSettings

Updates sensitive settings that are kept in memory only.

```ts
updateSensitiveSettings: (settings: Partial<SensitiveSettings>) => void
```

**Example:**

```ts
updateSensitiveSettings({
  livekitToken: 'eyJhbGciOiJIUzI1NiIs...',
});
```

#### resetSettings

Resets all settings (both persistent and sensitive) to their defaults.

```ts
resetSettings: () => void
```

### Sensitive Data Protection

The `partialize` function in the persist middleware explicitly excludes sensitive fields:

```ts
partialize: (state) => {
  const {
    livekitToken: _livekitToken,
    livekitPullToken: _livekitPullToken,
    updatePersistentSettings: _updatePersistentSettings,
    updateSensitiveSettings: _updateSensitiveSettings,
    resetSettings: _resetSettings,
    ...persistentState
  } = state;
  return persistentState;
}
```

This ensures that access tokens are never stored in localStorage and are lost when the page is refreshed.

## State Sync to Plugin Context

Application state is synchronized from Zustand stores to the Plugin Context system so plugins can observe changes:

```ts
// In App.tsx
useEffect(() => {
  pluginContextManager.updateState({
    scene: {
      currentId: activeSceneId,
      items: activeScene?.items || [],
      selectedItemId,
      selectedItem,
    },
  });
}, [activeSceneId, activeScene?.items, selectedItemId, selectedItem]);
```

Action handlers are configured once on mount:

```ts
useEffect(() => {
  pluginContextManager.setActionHandlers({
    scene: {
      selectItem: (itemId) => setSelectedItemId(itemId),
    },
    ui: {
      showDialog: (dialogId) => { /* ... */ },
      closeDialog: (dialogId) => { /* ... */ },
    },
  });
}, []);
```

This creates a one-way data flow from Zustand stores through the Plugin Context to plugins, ensuring plugins always read fresh state while modifications go through permission-checked actions.
