import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import type {
  I18nEngine,
  I18nEngineOptions,
  I18nLayer,
  LanguageResource,
} from '../types/i18n-engine';

/**
 * Deep merge two objects
 */
function deepMerge(
  target: LanguageResource,
  source: LanguageResource,
): LanguageResource {
  const result: LanguageResource = { ...target };

  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        (result[key] as LanguageResource) || {},
        source[key] as LanguageResource,
      );
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * I18nEngine implementation based on i18next
 * Supports layered resources: core < plugin < host < user
 */
export class I18nEngineImpl implements I18nEngine {
  private layerResources: Map<
    I18nLayer,
    Map<string, Map<string, LanguageResource>>
  > = new Map();
  private languageChangeCallbacks: Set<(lang: string) => void> = new Set();
  private initialized = false;
  private options: I18nEngineOptions;

  constructor(options: I18nEngineOptions = {}) {
    this.options = options;
    // Initialize layer storage
    this.layerResources.set('core', new Map());
    this.layerResources.set('plugin', new Map());
    this.layerResources.set('host', new Map());
    this.layerResources.set('user', new Map());
  }

  /**
   * Initialize the i18n engine
   * Must be called before using other methods
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const {
      defaultLanguage = 'en',
      supportedLanguages = ['en', 'zh'],
      coreResources = {},
      storageKey = 'i18nextLng',
    } = this.options;

    // Register core resources to layer storage
    const coreLayer = this.layerResources.get('core')!;
    for (const [lang, resource] of Object.entries(coreResources)) {
      if (!coreLayer.has(lang)) {
        coreLayer.set(lang, new Map());
      }
      coreLayer.get(lang)!.set('core', resource);
    }

    // Build initial i18next resources from core layer
    const initialResources: Record<string, { translation: LanguageResource }> =
      {};
    for (const [lang] of coreLayer) {
      initialResources[lang] = { translation: this.mergeLayersForLang(lang) };
    }

    await i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: initialResources,
        fallbackLng: defaultLanguage,
        supportedLngs: supportedLanguages,
        nonExplicitSupportedLngs: true,
        interpolation: {
          escapeValue: false,
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: storageKey,
          convertDetectedLanguage: (lng: string) => {
            if (lng.startsWith('zh')) return 'zh';
            if (lng.startsWith('en')) return 'en';
            return defaultLanguage;
          },
        },
      });

    // Listen to language changes
    i18n.on('languageChanged', (lang: string) => {
      this.languageChangeCallbacks.forEach((cb) => cb(lang));
    });

    this.initialized = true;
  }

  /**
   * Merge all layers for a language into single resource object
   * Priority: core < plugin < host < user
   */
  private mergeLayersForLang(lang: string): LanguageResource {
    let merged: LanguageResource = {};

    const layers: I18nLayer[] = ['core', 'plugin', 'host', 'user'];

    for (const layer of layers) {
      const layerMap = this.layerResources.get(layer);
      if (!layerMap) continue;

      const langMap = layerMap.get(lang);
      if (!langMap) continue;

      for (const [, resource] of langMap) {
        merged = deepMerge(merged, resource);
      }
    }

    return merged;
  }

  /**
   * Update i18next resources after layer changes
   */
  private updateI18nextResources(): void {
    const currentLang = this.getCurrentLanguage();

    // Update all languages
    for (const lang of this.getSupportedLanguages()) {
      const merged = this.mergeLayersForLang(lang);
      i18n.addResourceBundle(lang, 'translation', merged, true, true);
    }

    // Trigger re-render by notifying language change
    this.languageChangeCallbacks.forEach((cb) => cb(currentLang));
  }

  getCurrentLanguage(): string {
    return i18n.language || this.options.defaultLanguage || 'en';
  }

  getSupportedLanguages(): string[] {
    return this.options.supportedLanguages || ['en', 'zh'];
  }

  t(key: string, options?: Record<string, unknown>): string {
    return i18n.t(key, options);
  }

  exists(key: string): boolean {
    return i18n.exists(key);
  }

  async changeLanguage(lang: string): Promise<void> {
    await i18n.changeLanguage(lang);
  }

  onLanguageChange(callback: (lang: string) => void): () => void {
    this.languageChangeCallbacks.add(callback);
    return () => {
      this.languageChangeCallbacks.delete(callback);
    };
  }

  addResource(
    lang: string,
    namespace: string,
    resource: LanguageResource,
    options?: { layer?: I18nLayer },
  ): void {
    const layer: I18nLayer = options?.layer || 'plugin';

    const layerMap = this.layerResources.get(layer);
    if (!layerMap) return;

    if (!layerMap.has(lang)) {
      layerMap.set(lang, new Map());
    }

    const langMap = layerMap.get(lang)!;
    const existing = langMap.get(namespace) || {};
    langMap.set(namespace, deepMerge(existing, resource));

    // Update i18next if initialized
    if (this.initialized) {
      this.updateI18nextResources();
    }
  }

  addResources(
    lang: string,
    resources: Record<string, LanguageResource>,
    options?: { layer?: I18nLayer },
  ): void {
    for (const [namespace, resource] of Object.entries(resources)) {
      this.addResource(lang, namespace, resource, options);
    }
  }

  /**
   * Get raw i18next instance (for advanced use cases)
   */
  getI18nInstance() {
    return i18n;
  }
}

/**
 * Create and initialize a default I18nEngine
 */
export async function createI18nEngine(
  options?: I18nEngineOptions,
): Promise<I18nEngine> {
  const engine = new I18nEngineImpl(options);
  await engine.init();
  return engine;
}
