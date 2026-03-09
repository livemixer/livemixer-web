/**
 * Internationalization Engine Interface
 * Core abstraction for i18n capability in LiveMixer
 */

export type I18nLayer = 'core' | 'plugin' | 'host' | 'user';

export interface LanguageResource {
    [key: string]: string | LanguageResource;
}

export interface I18nEngine {
    /** Get current language code */
    getCurrentLanguage(): string;

    /** Get list of supported languages */
    getSupportedLanguages(): string[];

    /**
     * Translate a key to the current language
     * @param key - Translation key (supports nested keys like 'toolbar.addScene')
     * @param options - Optional interpolation values
     * @returns Translated string or key if not found
     */
    t(key: string, options?: Record<string, unknown>): string;

    /** Check if a key exists in current language */
    exists(key: string): boolean;

    /** Change current language */
    changeLanguage(lang: string): Promise<void>;

    /**
     * Subscribe to language change events
     * @param callback - Called when language changes
     * @returns Unsubscribe function
     */
    onLanguageChange(callback: (lang: string) => void): () => void;

    /**
     * Add resource for a specific namespace
     * @param lang - Language code
     * @param namespace - Resource namespace (e.g., 'core', 'plugin:io.livemixer.text')
     * @param resource - Translation resources
     * @param options - Layer option for priority
     */
    addResource(
        lang: string,
        namespace: string,
        resource: LanguageResource,
        options?: { layer?: I18nLayer }
    ): void;

    /**
     * Add resources for multiple namespaces at once
     * @param lang - Language code
     * @param resources - Map of namespace to resources
     * @param options - Layer option for priority
     */
    addResources(
        lang: string,
        resources: Record<string, LanguageResource>,
        options?: { layer?: I18nLayer }
    ): void;
}

/**
 * I18n metadata for plugins
 */
export interface IPluginI18n {
    /** Default language code */
    defaultLanguage?: string;

    /** Supported languages */
    supportedLanguages?: string[];

    /**
     * Resources keyed by language and namespace
     * @example
     * {
     *   en: {
     *     'plugin:io.livemixer.text': { label: { content: 'Content' } }
     *   },
     *   zh: {
     *     'plugin:io.livemixer.text': { label: { content: '内容' } }
     *   }
     * }
     */
    resources?: {
        [lang: string]: {
            [namespace: string]: LanguageResource;
        };
    };

    /** Custom namespaces (default: ['plugin:<pluginId>']) */
    namespaces?: string[];
}

/**
 * I18n configuration options for built-in engine
 */
export interface I18nEngineOptions {
    /** Default language code */
    defaultLanguage?: string;

    /** Supported languages */
    supportedLanguages?: string[];

    /** Initial core resources */
    coreResources?: {
        [lang: string]: LanguageResource;
    };

    /** Storage key for persisting language preference */
    storageKey?: string;
}
