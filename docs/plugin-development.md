# Plugin Development Guide

This guide walks through creating a custom source plugin for LiveMixer Web.

## Quick Start

A source plugin is a TypeScript object that implements the `ISourcePlugin` interface. Here is a minimal example:

```tsx
import type { ISourcePlugin, IPluginContext } from 'livemixer-web';
import { Rect, Text } from 'react-konva';

const myPlugin: ISourcePlugin = {
  id: 'com.example.color-rect',
  version: '1.0.0',
  name: 'Color Rectangle',
  category: 'media',
  engines: { host: '>=0.0.1', api: '1.0' },

  propsSchema: {
    color: {
      label: 'Color',
      type: 'color',
      defaultValue: '#3b82f6',
    },
    label: {
      label: 'Label',
      type: 'string',
      defaultValue: 'Hello',
    },
  },

  sourceType: {
    typeId: 'color_rect',
    nameKey: 'sources.colorRect.name',
    descriptionKey: 'sources.colorRect.description',
  },

  onInit: async () => {},
  onUpdate: () => {},

  render: (props) => (
    <>
      <Rect
        x={props.layout?.x || 0}
        y={props.layout?.y || 0}
        width={props.layout?.width || 400}
        height={props.layout?.height || 300}
        fill={props.color || '#3b82f6'}
      />
      <Text
        x={props.layout?.x || 0}
        y={props.layout?.y || 0}
        text={props.label || 'Hello'}
        fontSize={24}
        fill="#ffffff"
      />
    </>
  ),

  onDispose: () => {},
};

export default myPlugin;
```

## Plugin Definition Template

### Metadata

```ts
{
  id: 'com.example.my-plugin',     // Reverse-DNS unique identifier
  version: '1.0.0',                 // Semver version
  name: 'My Plugin',                // Display name
  icon: 'boxes',                    // Optional icon identifier
  category: 'media',                // 'media' | 'text' | 'widget' | 'effect'
  engines: {
    host: '>=0.0.1',               // Compatible host versions
    api: '1.0',                     // Plugin API version
  },
}
```

### PropsSchema Configuration

Define the configurable properties that appear in the property panel:

```ts
propsSchema: {
  // Number control
  opacity: {
    label: 'Opacity',
    type: 'number',
    defaultValue: 100,
    min: 0,
    max: 100,
    step: 1,
    group: 'Appearance',
  },

  // String control
  text: {
    label: 'Text Content',
    type: 'string',
    defaultValue: 'Hello World',
  },

  // Color control
  color: {
    label: 'Text Color',
    type: 'color',
    defaultValue: '#ffffff',
  },

  // Boolean toggle
  visible: {
    label: 'Show Label',
    type: 'boolean',
    defaultValue: true,
  },

  // Select dropdown
  position: {
    label: 'Position',
    type: 'select',
    defaultValue: 'top',
    options: [
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Center', value: 'center' },
    ],
  },

  // Image URL
  imageUrl: {
    label: 'Image URL',
    type: 'image',
    defaultValue: '',
  },

  // Video URL
  videoUrl: {
    label: 'Video URL',
    type: 'video',
    defaultValue: '',
  },

  // Group (nested properties)
  shadow: {
    label: 'Shadow',
    type: 'group',
    defaultValue: {},
  },
}
```

Default values from `propsSchema` are automatically injected into the `SceneItem` when a new item is created from this plugin.

## Render Method

The `render` method returns a Konva node (via react-konva) to display on the canvas:

```tsx
render: (commonProps) => {
  // commonProps contains:
  // - layout: { x, y, width, height }
  // - transform: { opacity, rotation, filters, borderRadius }
  // - visible, locked
  // - All properties from propsSchema defaults
  // - Plus any item-specific properties (url, deviceId, etc.)

  return (
    <Group
      x={commonProps.layout?.x || 0}
      y={commonProps.layout?.y || 0}
      opacity={commonProps.transform?.opacity ?? 1}
      rotation={commonProps.transform?.rotation ?? 0}
    >
      <Rect
        width={commonProps.layout?.width || 400}
        height={commonProps.layout?.height || 300}
        fill={commonProps.color || '#3b82f6'}
      />
    </Group>
  );
}
```

## Using onContextReady

The `onContextReady` callback receives the full plugin context with permission support:

```ts
onContextReady: (ctx: IPluginContext) => {
  // Subscribe to events
  const unsub = ctx.subscribe('scene:item:select', (data) => {
    console.log('Selected item:', data.itemId);
  });

  // Register a slot
  ctx.registerSlot({
    id: 'my-plugin-status',
    slot: 'status-bar-right',
    component: MyStatusBarWidget,
    priority: 5,
  });

  // Register a public API
  ctx.registerAPI({
    doSomething: () => console.log('API called'),
  });

  // Read state
  const currentScene = ctx.state.scene.currentId;

  // Show a toast
  ctx.actions.ui.showToast('Plugin loaded!', 'success');
}
```

## Permission Declaration

Declare the permissions your plugin needs:

```ts
{
  trustLevel: 'community',  // 'builtin' | 'verified' | 'community' | 'untrusted'
  permissions: [
    'scene:read',
    'scene:write',
    'ui:toast',
    'storage:read',
    'storage:write',
  ],
}
```

At runtime, check and request permissions:

```ts
onContextReady: (ctx) => {
  // Check permission
  if (ctx.hasPermission('scene:write')) {
    ctx.actions.scene.addItem({ type: 'color_rect', layout: { x: 0, y: 0, width: 100, height: 100 } });
  }

  // Request additional permissions (shows dialog to user)
  ctx.requestPermission(['devices:access']).then((granted) => {
    if (granted) {
      // Permission was granted
    }
  });
}
```

## Slot Registration

Register UI components into predefined or custom slots:

```ts
ctx.registerSlot({
  id: 'my-plugin-toolbar-btn',
  slot: 'toolbar-right',
  component: MyToolbarButton,
  props: { color: 'blue' },     // Additional props
  priority: 10,                  // Higher = rendered first
  visible: (state) => state.scene.selectedItemId !== null,  // Conditional visibility
});
```

Available predefined slots:

| Slot | Location |
|------|----------|
| `toolbar-left` | Left side of the toolbar |
| `toolbar-center` | Center of the toolbar |
| `toolbar-right` | Right side of the toolbar |
| `sidebar-top` | Top of the left sidebar |
| `sidebar-bottom` | Bottom of the left sidebar |
| `property-panel-top` | Top of the property panel |
| `property-panel-bottom` | Bottom of the property panel |
| `canvas-overlay` | Overlay on top of the canvas |
| `status-bar-left` | Left side of the status bar |
| `status-bar-center` | Center of the status bar |
| `status-bar-right` | Right side of the status bar |
| `dialogs` | Dialog container |
| `context-menu` | Context menu area |
| `add-source-dialog` | Add source dialog |
| `custom:*` | Custom slot names |

## i18n Support

Provide translation resources for your plugin:

```ts
{
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'com.example.my-plugin': {
          sources: {
            colorRect: {
              name: 'Color Rectangle',
              description: 'A colored rectangle with optional label',
            },
          },
        },
      },
      zh: {
        'com.example.my-plugin': {
          sources: {
            colorRect: {
              name: 'Color Rectangle',
              description: 'Colored rectangle with optional label',
            },
          },
        },
      },
    },
  },
}
```

Translation keys in `propsSchema` (via `labelKey`, `groupKey`) will be resolved using these resources.

## Audio Mixer Integration

To add your plugin to the audio mixer:

```ts
{
  audioMixer: {
    enabled: true,
    volumeKey: 'volume',      // Property key for volume (default: 'volume')
    mutedKey: 'muted',        // Property key for muted state (default: 'muted')
    defaultVolume: 1.0,       // Default volume level
  },
}
```

Items created from this plugin will automatically appear in the audio mixer panel.

## Canvas Render Control

Control how your items behave on the canvas:

```ts
{
  canvasRender: {
    // Filter out audio-only items from canvas rendering
    shouldFilter: (item) => item.type === 'audio_input' && !item.showOnCanvas,

    // Disable selection/transform for invisible items
    isSelectable: (item) => item.visible !== false,
  },
}
```

## Property Panel Customization

Replace or extend the default property panel for your plugin's items:

```ts
{
  propertyPanel: {
    component: MyCustomPropertyPanel,  // Custom React component
    replaceDefault: false,              // If true, completely replaces default panel
  },
}
```

The custom component receives `PropertyPanelProps`:

```ts
interface PropertyPanelProps {
  item: SceneItem;
  onUpdate: (updates: Partial<SceneItem>) => void;
  isLocked: boolean;
}
```

You can also exclude specific schema keys from the default panel:

```ts
{
  propertyPanel: {
    excludeSchemaKeys: ['internalState', 'debugFlag'],
  },
}
```

## Add Source Dialog

Customize the flow when a user adds your source type:

```ts
{
  addDialog: {
    component: MyAddDialog,        // Custom dialog component
    immediate: true,                // Show dialog before creating item
    dialogId: 'my-plugin-dialog',  // Slot ID (defaults to `${plugin.id}-dialog`)
  },
}
```

### Browser Permission Handling

For sources that require browser permissions (camera, microphone, screen):

```ts
{
  addDialog: {
    needsBrowserPermission: 'camera',  // 'camera' | 'microphone' | 'screen'
  },
}
```

When set, the browser permission prompt is triggered immediately when the user selects this source type. The obtained `MediaStream` is then passed to the item creation flow.

## Default Layout

Set the default position and size for newly created items:

```ts
{
  defaultLayout: {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  },
}
```

## Stream Initialization

For plugins that manage media streams:

```ts
{
  streamInit: {
    needsStream: true,
    streamType: 'webcam',  // 'webcam' | 'screen' | 'media' | custom
  },
}
```

## Full Example: Third-Party Plugin

See the working example at [docs/plugin/example-third-party-plugin.tsx](./plugin/example-third-party-plugin.tsx).

## Registering Your Plugin

After defining your plugin, register it with the plugin registry:

```ts
import { pluginRegistry } from 'livemixer-web';
import myPlugin from './my-plugin';

pluginRegistry.register(myPlugin);
```

Registration should happen before the application renders (e.g., in your entry file or a setup module).
