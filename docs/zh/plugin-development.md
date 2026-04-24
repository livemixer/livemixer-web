# 插件开发指南

本指南介绍如何为 LiveMixer Web 创建自定义源插件。

## 快速开始

源插件是实现 `ISourcePlugin` 接口的 TypeScript 对象。以下是最小示例：

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

## PropsSchema 配置

定义出现在属性面板中的可配置属性：

```ts
propsSchema: {
  // 数值控件
  opacity: {
    label: 'Opacity',
    type: 'number',
    defaultValue: 100,
    min: 0,
    max: 100,
    step: 1,
    group: 'Appearance',
  },

  // 字符串控件
  text: {
    label: 'Text Content',
    type: 'string',
    defaultValue: 'Hello World',
  },

  // 颜色控件
  color: {
    label: 'Text Color',
    type: 'color',
    defaultValue: '#ffffff',
  },

  // 布尔切换
  visible: {
    label: 'Show Label',
    type: 'boolean',
    defaultValue: true,
  },

  // 下拉选择
  position: {
    label: 'Position',
    type: 'select',
    defaultValue: 'top',
    options: [
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
    ],
  },
}
```

`propsSchema` 中的默认值会在创建新 `SceneItem` 时自动注入。

## 渲染方法

`render` 方法返回 Konva 节点（通过 react-konva）以在画布上显示：

```tsx
render: (commonProps) => {
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

## 使用 onContextReady

`onContextReady` 回调接收带有权限支持的完整插件上下文：

```ts
onContextReady: (ctx: IPluginContext) => {
  // 订阅事件
  const unsub = ctx.subscribe('scene:item:select', (data) => {
    console.log('选中项:', data.itemId);
  });

  // 注册 Slot
  ctx.registerSlot({
    id: 'my-plugin-status',
    slot: 'status-bar-right',
    component: MyStatusBarWidget,
    priority: 5,
  });

  // 注册公共 API
  ctx.registerAPI({
    doSomething: () => console.log('API called'),
  });

  // 读取状态
  const currentScene = ctx.state.scene.currentId;

  // 显示提示
  ctx.actions.ui.showToast('插件已加载!', 'success');
}
```

## 权限声明

声明你的插件所需的权限：

```ts
{
  trustLevel: 'community',
  permissions: [
    'scene:read',
    'scene:write',
    'ui:toast',
    'storage:read',
    'storage:write',
  ],
}
```

运行时检查和请求权限：

```ts
onContextReady: (ctx) => {
  // 检查权限
  if (ctx.hasPermission('scene:write')) {
    ctx.actions.scene.addItem({ type: 'color_rect', layout: { x: 0, y: 0, width: 100, height: 100 } });
  }

  // 请求额外权限
  ctx.requestPermission(['devices:access']).then((granted) => {
    if (granted) { /* 权限已授予 */ }
  });
}
```

## Slot 注册

将 UI 组件注册到预定义或自定义 Slot：

```ts
ctx.registerSlot({
  id: 'my-plugin-toolbar-btn',
  slot: 'toolbar-right',
  component: MyToolbarButton,
  props: { color: 'blue' },
  priority: 10,
  visible: (state) => state.scene.selectedItemId !== null,
});
```

可用的预定义 Slot：

| Slot | 位置 |
|------|------|
| `toolbar-left` | 工具栏左侧 |
| `toolbar-center` | 工具栏中间 |
| `toolbar-right` | 工具栏右侧 |
| `sidebar-top` | 左侧边栏顶部 |
| `sidebar-bottom` | 左侧边栏底部 |
| `property-panel-top` | 属性面板顶部 |
| `property-panel-bottom` | 属性面板底部 |
| `canvas-overlay` | 画布覆盖层 |
| `status-bar-left/center/right` | 状态栏 |
| `dialogs` | 对话框容器 |
| `add-source-dialog` | 添加源对话框 |
| `custom:*` | 自定义 Slot 名称 |

## i18n 支持

为插件提供翻译资源：

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

## 音频混音集成

将插件添加到音频混音器：

```ts
{
  audioMixer: {
    enabled: true,
    volumeKey: 'volume',
    mutedKey: 'muted',
    defaultVolume: 1.0,
  },
}
```

## 属性面板自定义

替换或扩展默认属性面板：

```ts
{
  propertyPanel: {
    component: MyCustomPropertyPanel,
    replaceDefault: false,  // 设为 true 完全替换默认面板
  },
}
```

## 添加源对话框

自定义用户添加源时的流程：

```ts
{
  addDialog: {
    component: MyAddDialog,
    immediate: true,
    dialogId: 'my-plugin-dialog',
  },
}
```

### 浏览器权限处理

对于需要浏览器权限的源：

```ts
{
  addDialog: {
    needsBrowserPermission: 'camera',  // 'camera' | 'microphone' | 'screen'
  },
}
```

## 注册插件

定义插件后，向插件注册表注册：

```ts
import { pluginRegistry } from 'livemixer-web';
import myPlugin from './my-plugin';

pluginRegistry.register(myPlugin);
```

注册应在应用渲染前完成（例如在入口文件或设置模块中）。

## 完整示例

参见 [docs/plugin/example-third-party-plugin.tsx](../plugin/example-third-party-plugin.tsx) 的工作示例。
