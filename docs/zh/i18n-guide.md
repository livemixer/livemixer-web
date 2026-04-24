# 国际化指南

LiveMixer Web 通过基于 [i18next](https://www.i18next.com/) 的分层 i18n 系统支持多语言界面。

## I18nEngine 接口

核心 i18n 抽象是 `I18nEngine` 接口：

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

## 分层资源系统

资源按四个层次组织，优先级递增：

```
core < plugin < host < user
```

| 层 | 说明 | 谁添加资源 |
|----|------|-----------|
| `core` | 内置应用翻译 | LiveMixer Web 核心 |
| `plugin` | 插件特定翻译 | 插件作者通过 `IPluginI18n` |
| `host` | 宿主应用覆盖 | 集成者通过 `i18nOverrides` |
| `user` | 用户级自定义 | 集成者通过 `i18nUserOverrides` |

当同一键存在于多个层时，高优先级层优先。所有层深度合并，支持部分覆盖。

## 内置语言

| 语言 | 代码 | 文件 |
|------|------|------|
| 英文 | `en` | `src/locales/en.ts` |
| 中文 | `zh` | `src/locales/zh.ts` |

默认语言由以下顺序决定：
1. localStorage 中保存的偏好（`livemixer-settings.language`）
2. 浏览器语言检测
3. 回退到 `en`

## 插件 i18n

插件通过 `i18n` 字段提供自己的翻译：

```ts
const myPlugin: ISourcePlugin = {
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'com.example.my-plugin': {
          sources: { mySource: { name: 'My Source' } },
        },
      },
      zh: {
        'com.example.my-plugin': {
          sources: { mySource: { name: '自定义源' } },
        },
      },
    },
  },
};
```

插件注册时，其 i18n 资源自动添加到 `plugin` 层。

## 自定义 i18n 引擎

如果宿主应用有自己的 i18n 系统，可以通过 `LiveMixerExtensions.i18nEngine` 提供自定义实现：

```tsx
class MyCustomI18nEngine implements I18nEngine {
  getCurrentLanguage(): string { return myApp.getLocale(); }
  t(key: string, options?: Record<string, unknown>): string { return myApp.translate(key, options); }
  // ...实现其他方法
}

const extensions: LiveMixerExtensions = {
  i18nEngine: new MyCustomI18nEngine(),
};
```

提供自定义引擎时，内置 i18next 初始化完全跳过。

## 宿主覆盖

集成者可以在 `host` 层覆盖任何翻译键：

```tsx
const extensions: LiveMixerExtensions = {
  i18nOverrides: {
    en: { 'app.title': 'My Custom Mixer' },
    zh: { 'app.title': '自定义混流器' },
  },
};
```

## 用户级覆盖

用于用户特定的自定义（如管理员配置的标签）：

```tsx
const extensions: LiveMixerExtensions = {
  i18nUserOverrides: {
    en: { 'toolbar.help': 'Support' },
  },
};
```

用户覆盖具有最高优先级。

## 添加新语言

1. 在 `src/locales/` 创建资源文件（如 `ja.ts`）
2. 在 `src/locales/index.ts` 注册新语言
3. 浏览器语言检测自动识别新语言
4. 为插件也添加对应翻译
