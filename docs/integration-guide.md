# Integration Guide

LiveMixer Web can be embedded into any React application as a library component. This guide explains how to integrate it into your project.

## Building the Library

First, build the library output:

```sh
pnpm run build:lib
```

This produces the following files in `dist-lib/`:

| File | Format | Description |
|------|--------|-------------|
| `livemixer-web.es.js` | ES Module | Modern ES module build |
| `livemixer-web.umd.js` | UMD | Universal Module Definition build |
| `livemixer-web.css` | CSS | Extracted styles |
| `index.d.ts` | TypeScript | Type declarations |

## Installation

### From npm (if published)

```sh
pnpm add livemixer-web
```

### From local build

Use [yalc](https://github.com/wclr/yalc) for local development:

```sh
# In livemixer-web
pnpm run build:lib
yalc publish

# In your project
yalc add livemixer-web
pnpm install
```

## Basic Integration

```tsx
import { LiveMixerApp } from 'livemixer-web';
import 'livemixer-web/dist-lib/livemixer-web.css';

function App() {
  return <LiveMixerApp />;
}
```

## Using Extensions

The `LiveMixerApp` component accepts an optional `extensions` prop that allows you to customize the application:

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

The `LiveMixerExtensions` interface provides the following customization points:

### logo

```tsx
logo?: React.ReactNode;
```

Custom logo rendered in the top toolbar on the left side. Replaces the default LiveMixer logo.

### userComponent

```tsx
userComponent?: React.ReactNode;
```

Custom user component rendered in the top toolbar on the right side. Useful for displaying user avatars, login buttons, etc.

### getUserInfo

```tsx
getUserInfo?: () => Promise<UserInfo | null>;
```

Function to retrieve the current logged-in user info. Returns a `UserInfo` object or `null`.

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

Callback invoked when the user triggers a save action. Use this to persist the layout configuration to your backend.

### onLoadLayout

```tsx
onLoadLayout?: () => Promise<ProtocolData | null>;
```

Callback invoked when the user triggers a load action. Return the layout data from your backend, or `null` if no data exists.

### onShareLayout

```tsx
onShareLayout?: (
  data: ProtocolData,
  options?: { password?: string; expiresIn?: number }
) => Promise<string>;
```

Callback invoked when the user triggers a share action. Return a shareable URL string.

### checkPermission

```tsx
checkPermission?: (feature: string) => Promise<boolean>;
```

Function to check user permissions before executing certain features. Return `true` if the feature is permitted.

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

Custom toolbar menu items. Each entry represents a menu with a label and a list of menu items.

### i18nEngine

```tsx
i18nEngine?: I18nEngine;
```

Custom i18n engine implementation. If provided, LiveMixer Web will use this instead of the built-in i18next engine. See the [Internationalization Guide](./i18n-guide.md) for details.

### i18nOverrides

```tsx
i18nOverrides?: I18nOverrideBundle;
```

Host-level translation overrides. Applied at the `host` layer priority (higher than core and plugin layers).

```ts
interface I18nOverrideBundle {
  [lang: string]: {
    [namespace: string]: LanguageResource;
  };
}
```

### i18nUserOverrides

```tsx
i18nUserOverrides?: I18nOverrideBundle;
```

User-level translation overrides. Applied at the `user` layer priority (highest priority, overrides all other layers).

## CSS Import

You must import the CSS file for the application to render correctly:

```tsx
import 'livemixer-web/dist-lib/livemixer-web.css';
```

The CSS uses Tailwind CSS v4 utility classes. If your host application also uses Tailwind, ensure there are no class name conflicts.

## Sub-path Deployment

If your application is deployed under a sub-path (e.g., `https://example.com/mixer/`), configure the `base` option in your Vite config:

```ts
// vite.config.ts
export default defineConfig({
  base: '/mixer/',
});
```

## Custom i18n Engine Integration

If your host application has its own i18n system, you can provide a custom `I18nEngine` implementation:

```tsx
import { I18nEngine } from 'livemixer-web';

class MyI18nEngine implements I18nEngine {
  getCurrentLanguage(): string {
    return myI18n.getLocale();
  }

  getSupportedLanguages(): string[] {
    return ['en', 'zh', 'ja'];
  }

  t(key: string, options?: Record<string, unknown>): string {
    return myI18n.translate(key, options);
  }

  exists(key: string): boolean {
    return myI18n.hasTranslation(key);
  }

  async changeLanguage(lang: string): Promise<void> {
    await myI18n.setLocale(lang);
  }

  onLanguageChange(callback: (lang: string) => void): () => void {
    return myI18n.onLocaleChange(callback);
  }

  addResource(lang: string, namespace: string, resource: any, options?: any): void {
    myI18n.addTranslations(lang, namespace, resource);
  }

  addResources(lang: string, resources: Record<string, any>, options?: any): void {
    for (const [ns, res] of Object.entries(resources)) {
      this.addResource(lang, ns, res, options);
    }
  }
}

const extensions: LiveMixerExtensions = {
  i18nEngine: new MyI18nEngine(),
};
```

See the [Internationalization Guide](./i18n-guide.md) for more details on the i18n system.

## Complete Example

```tsx
import { LiveMixerApp, type LiveMixerExtensions } from 'livemixer-web';
import 'livemixer-web/dist-lib/livemixer-web.css';

const extensions: LiveMixerExtensions = {
  // Custom branding
  logo: <img src="/brand-logo.svg" alt="Brand" className="w-10 h-10" />,

  // User authentication UI
  userComponent: <UserMenu />,

  // Cloud persistence
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

  // Sharing
  onShareLayout: async (data, options) => {
    const res = await fetch('/api/share', {
      method: 'POST',
      body: JSON.stringify({ data, ...options }),
    });
    const { url } = await res.json();
    return url;
  },

  // Permission checks
  checkPermission: async (feature) => {
    return userHasPermission(feature);
  },

  // Custom menus
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
