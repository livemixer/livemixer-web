# 库模式集成文档

LiveMixer Web 可以作为库组件嵌入到任何 React 应用中。本指南说明如何将集成到你的项目中。

## 构建库

首先构建库产物：

```sh
pnpm run build:lib
```

在 `dist-lib/` 目录下生成以下文件：

| 文件 | 格式 | 说明 |
|------|------|------|
| `livemixer-web.es.js` | ES Module | 现代 ES 模块构建 |
| `livemixer-web.umd.js` | UMD | 通用模块定义构建 |
| `livemixer-web.css` | CSS | 提取的样式 |
| `index.d.ts` | TypeScript | 类型声明 |

## 安装

### 从 npm 安装（如已发布）

```sh
pnpm add livemixer-web
```

### 从本地构建安装

使用 [yalc](https://github.com/wclr/yalc) 进行本地开发：

```sh
# 在 livemixer-web 中
pnpm run build:lib
yalc publish

# 在你的项目中
yalc add livemixer-web
pnpm install
```

## 基本集成

```tsx
import { LiveMixerApp } from 'livemixer-web';
import 'livemixer-web/dist-lib/livemixer-web.css';

function App() {
  return <LiveMixerApp />;
}
```

## 使用 Extensions

`LiveMixerApp` 组件接受可选的 `extensions` 属性，用于自定义应用：

```tsx
import { LiveMixerApp, type LiveMixerExtensions } from 'livemixer-web';
import 'livemixer-web/dist-lib/livemixer-web.css';

const extensions: LiveMixerExtensions = {
  logo: <img src="/my-logo.svg" alt="Logo" className="w-10 h-10" />,
  userComponent: <UserAvatar onLogin={handleLogin} onLogout={handleLogout} />,
};

function App() {
  return <LiveMixerApp extensions={extensions} />;
}
```

## LiveMixerExtensions API

`LiveMixerExtensions` 接口提供以下自定义能力：

### logo

```tsx
logo?: React.ReactNode;
```

在顶部工具栏左侧渲染的自定义 Logo，替代默认的 LiveMixer Logo。

### userComponent

```tsx
userComponent?: React.ReactNode;
```

在顶部工具栏右侧渲染的自定义用户组件，用于显示用户头像、登录按钮等。

### getUserInfo

```tsx
getUserInfo?: () => Promise<UserInfo | null>;
```

获取当前登录用户信息的函数。返回 `UserInfo` 对象或 `null`。

```ts
interface UserInfo {
  avatar?: string;
  name?: string;
  role?: 'anonymous' | 'free' | 'pro' | 'admin';
  email?: string;
}
```

### onSaveLayout

```tsx
onSaveLayout?: (data: ProtocolData) => Promise<void>;
```

用户触发保存操作时调用的回调。用于将布局配置持久化到你的后端。

### onLoadLayout

```tsx
onLoadLayout?: () => Promise<ProtocolData | null>;
```

用户触发加载操作时调用的回调。从你的后端返回布局数据，没有数据时返回 `null`。

### onShareLayout

```tsx
onShareLayout?: (
  data: ProtocolData,
  options?: { password?: string; expiresIn?: number }
) => Promise<string>;
```

用户触发分享操作时调用的回调。返回可分享的 URL 字符串。

### checkPermission

```tsx
checkPermission?: (feature: string) => Promise<boolean>;
```

在执行某些功能前检查用户权限的函数。如果允许则返回 `true`。

### customMenuItems

```tsx
customMenuItems?: Array<{
  label: string;
  items: Array<{
    label: string;
    onClick: () => void;
    divider?: boolean;
  }>;
}>;
```

自定义工具栏菜单项。每个条目代表一个带标签和菜单项列表的菜单。

### i18nEngine

```tsx
i18nEngine?: I18nEngine;
```

自定义 i18n 引擎实现。如果提供，LiveMixer Web 将使用此引擎代替内置的 i18next 引擎。详见[国际化指南](./i18n-guide.md)。

### i18nOverrides

```tsx
i18nOverrides?: I18nOverrideBundle;
```

宿主级翻译覆盖。以 `host` 层优先级应用（高于 core 和 plugin 层）。

### i18nUserOverrides

```tsx
i18nUserOverrides?: I18nOverrideBundle;
```

用户级翻译覆盖。以 `user` 层优先级应用（最高优先级，覆盖所有其他层）。

## CSS 引入

必须引入 CSS 文件才能正确渲染：

```tsx
import 'livemixer-web/dist-lib/livemixer-web.css';
```

CSS 使用 Tailwind CSS v4 工具类。如果你的宿主应用也使用 Tailwind，请确保没有类名冲突。

## 子路径部署

如果你的应用部署在子路径下（如 `https://example.com/mixer/`），在 Vite 配置中设置 `base` 选项：

```ts
// vite.config.ts
export default defineConfig({
  base: '/mixer/',
});
```

## 完整示例

```tsx
import { LiveMixerApp, type LiveMixerExtensions } from 'livemixer-web';
import 'livemixer-web/dist-lib/livemixer-web.css';

const extensions: LiveMixerExtensions = {
  // 自定义品牌
  logo: <img src="/brand-logo.svg" alt="Brand" className="w-10 h-10" />,

  // 用户认证 UI
  userComponent: <UserMenu />,

  // 云端持久化
  onSaveLayout: async (data) => {
    await fetch('/api/layouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  onLoadLayout: async () => {
    const res = await fetch('/api/layouts/current');
    if (res.ok) return res.json();
    return null;
  },

  // 分享
  onShareLayout: async (data, options) => {
    const res = await fetch('/api/share', {
      method: 'POST',
      body: JSON.stringify({ data, ...options }),
    });
    const { url } = await res.json();
    return url;
  },

  // 权限检查
  checkPermission: async (feature) => {
    return userHasPermission(feature);
  },

  // 自定义菜单
  customMenuItems: [
    {
      label: 'Workspace',
      items: [
        { label: 'My Projects', onClick: () => navigate('/projects') },
        { label: 'Team Settings', onClick: () => navigate('/settings'), divider: true },
      ],
    },
  ],
};

function App() {
  return (
    <div className="w-screen h-screen">
      <LiveMixerApp extensions={extensions} />
    </div>
  );
}
```
