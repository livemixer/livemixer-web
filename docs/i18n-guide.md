# Internationalization Guide

LiveMixer Web supports multilingual interfaces through a layered i18n system built on [i18next](https://www.i18next.com/).

## I18nEngine Interface

The core i18n abstraction is the `I18nEngine` interface:

```ts
interface I18nEngine {
  getCurrentLanguage(): string;
  getSupportedLanguages(): string[];
  t(key: string, options?: Record<string, unknown>): string;
  exists(key: string): boolean;
  changeLanguage(lang: string): Promise<void>;
  onLanguageChange(callback: (lang: string) => void): () => void;
  addResource(lang: string, namespace: string, resource: LanguageResource, options?: { layer?: I18nLayer }): void;
  addResources(lang: string, resources: Record<string, LanguageResource>, options?: { layer?: I18nLayer }): void;
}
```

The built-in implementation (`I18nEngineImpl`) wraps i18next with a layered resource management system.

## Layered Resource System

Resources are organized into four layers with increasing priority:

```
core < plugin < host < user
```

| Layer | Description | Who adds resources |
|-------|-------------|-------------------|
| `core` | Built-in application translations | LiveMixer Web core |
| `plugin` | Plugin-specific translations | Plugin authors via `IPluginI18n` |
| `host` | Host application overrides | Integrators via `LiveMixerExtensions.i18nOverrides` |
| `user` | User-level customizations | Integrators via `LiveMixerExtensions.i18nUserOverrides` |

When the same key exists in multiple layers, the higher-priority layer takes precedence. All layers are deep-merged, so partial overrides are supported.

## Built-in Languages

LiveMixer Web ships with two language packs:

| Language | Code | File |
|----------|------|------|
| English | `en` | [`src/locales/en.ts`](../src/locales/en.ts) |
| Chinese | `zh` | [`src/locales/zh.ts`](../src/locales/zh.ts) |

The default language is determined by:
1. Saved preference in localStorage (`livemixer-settings.language`)
2. Browser language detection (via `i18next-browser-languagedetector`)
3. Fallback to `en`

## Core Resources

Core resources contain translations for the application UI:

- Toolbar menu items (File, Edit, View, Tools, Help)
- Scene management labels
- Source type names and descriptions
- Property panel labels
- Settings dialog labels
- Status bar messages
- Dialog buttons and prompts

Resources are structured as nested objects with dot-notation keys:

```ts
// Example structure
{
  toolbar: {
    file: 'File',
    edit: 'Edit',
  },
  scene: {
    defaultName: 'Scene {{number}}',
    atLeastOne: 'At least one scene is required',
  },
  sources: {
    webcam: {
      name: 'Webcam',
      description: 'Capture video from a webcam device',
    },
  },
}
```

## Plugin i18n

Plugins can provide their own translations through the `i18n` field:

```ts
const myPlugin: ISourcePlugin = {
  // ...
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'com.example.my-plugin': {
          sources: {
            mySource: {
              name: 'My Source',
              description: 'A custom source type',
            },
          },
          property: {
            myProp: 'My Property',
          },
        },
      },
      zh: {
        'com.example.my-plugin': {
          sources: {
            mySource: {
              name: 'My Source',
              description: 'Custom source type',
            },
          },
          property: {
            myProp: 'My Property',
          },
        },
      },
    },
  },
};
```

When a plugin is registered, its i18n resources are automatically added to the I18nEngine at the `plugin` layer. The namespace is expanded from dot notation:

```
Namespace: 'com.example.my-plugin'
Resource: { sources: { mySource: { name: 'My Source' } } }

Expanded:
{
  com: {
    example: {
      'my-plugin': {
        sources: {
          mySource: {
            name: 'My Source'
          }
        }
      }
    }
  }
}
```

### Using i18n in PropsSchema

The `labelKey` and `groupKey` fields in `PropsSchemaItem` allow labels to be resolved from i18n resources:

```ts
propsSchema: {
  color: {
    label: 'Color',                          // Fallback label
    labelKey: 'com.example.my-plugin.property.color',  // i18n key
    type: 'color',
    defaultValue: '#3b82f6',
  },
}
```

## Custom i18n Engine

If your host application has its own i18n system, you can provide a custom `I18nEngine` implementation via `LiveMixerExtensions.i18nEngine`:

```tsx
import type { I18nEngine } from 'livemixer-web';

class MyCustomI18nEngine implements I18nEngine {
  getCurrentLanguage(): string {
    return myApp.getLocale();
  }

  getSupportedLanguages(): string[] {
    return ['en', 'zh', 'ja', 'ko'];
  }

  t(key: string, options?: Record<string, unknown>): string {
    return myApp.translate(key, options);
  }

  exists(key: string): boolean {
    return myApp.hasKey(key);
  }

  async changeLanguage(lang: string): Promise<void> {
    await myApp.setLocale(lang);
  }

  onLanguageChange(callback: (lang: string) => void): () => void {
    return myApp.onLocaleChange(callback);
  }

  addResource(lang: string, namespace: string, resource: any, options?: any): void {
    myApp.addTranslations(lang, namespace, resource);
  }

  addResources(lang: string, resources: Record<string, any>, options?: any): void {
    for (const [ns, res] of Object.entries(resources)) {
      this.addResource(lang, ns, res, options);
    }
  }
}

const extensions: LiveMixerExtensions = {
  i18nEngine: new MyCustomI18nEngine(),
};
```

When a custom engine is provided, the built-in i18next initialization is skipped entirely.

## Host Overrides

Integrators can override any translation key at the `host` layer:

```tsx
const extensions: LiveMixerExtensions = {
  i18nOverrides: {
    en: {
      // Override the application title
      'app.title': 'My Custom Mixer',
    },
    zh: {
      'app.title': 'My Custom Mixer',
    },
  },
};
```

## User-Level Overrides

For user-specific customizations (e.g., admin-configured labels), use the `user` layer:

```tsx
const extensions: LiveMixerExtensions = {
  i18nUserOverrides: {
    en: {
      'toolbar.help': 'Support',
    },
  },
};
```

User overrides have the highest priority and will override all other layers.

## useI18n Hook

The `useI18n` hook provides access to the i18n engine within React components:

```tsx
import { useI18n } from 'livemixer-web';

function MyComponent() {
  const { t, engine } = useI18n();

  return (
    <div>
      <h1>{t('toolbar.file')}</h1>
      <p>Current language: {engine.getCurrentLanguage()}</p>
    </div>
  );
}
```

## I18nContext / I18nProvider

The `I18nProvider` wraps the application and provides the i18n engine through React Context:

```tsx
import { I18nProvider } from 'livemixer-web';

function App() {
  const engine = useMyI18nEngine();

  return (
    <I18nProvider engine={engine}>
      <MyAppContent />
    </I18nProvider>
  );
}
```

## Adding a New Language

To add a new language (e.g., Japanese):

### 1. Create the resource file

Create `src/locales/ja.ts` with the same structure as `en.ts`:

```ts
export const jaResources: LanguageResource = {
  toolbar: {
    file: 'ファイル',
    edit: '編集',
    // ... translate all keys
  },
  // ...
};
```

### 2. Register in the locale index

Update `src/locales/index.ts`:

```ts
import { jaResources } from './ja';

export const coreResources = {
  en: enResources,
  zh: zhResources,
  ja: jaResources,
};

export const supportedLanguages = new Set(['en', 'zh', 'ja']);
```

### 3. Update language detection

The i18n engine's language detection will automatically detect `ja` from the browser locale. No additional configuration is needed.

### 4. Add plugin translations

If you maintain plugins, add `ja` translations to their `i18n.resources` as well.
