import type { I18nEngine, LanguageResource } from '../types/i18n-engine'
import type { IPluginContext, ISourcePlugin } from '../types/plugin'
import { pluginContextManager } from './plugin-context'

class PluginRegistry {
  private plugins: Map<string, ISourcePlugin> = new Map()
  private i18nEngine: I18nEngine | null = null

  /**
   * Set the I18nEngine instance for plugin i18n registration
   * This will also register i18n resources for all already-registered plugins
   */
  setI18nEngine(engine: I18nEngine) {
    this.i18nEngine = engine

    // Register i18n resources for all already-registered plugins
    for (const plugin of this.plugins.values()) {
      this.registerPluginI18n(plugin)
    }
  }

  /**
   * Get the I18nEngine instance
   */
  getI18nEngine(): I18nEngine | null {
    return this.i18nEngine
  }

  /**
   * Register plugin i18n resources to the I18nEngine
   */
  private registerPluginI18n(plugin: ISourcePlugin) {
    if (!this.i18nEngine || !plugin.i18n?.resources) {
      return
    }

    for (const [lang, namespaces] of Object.entries(plugin.i18n.resources)) {
      for (const [namespace, resource] of Object.entries(namespaces)) {
        // Expand namespace to nested object path
        // e.g., 'plugins.io.livemixer.text' -> { plugins: { io: { livemixer: { text: resource } } } }
        const expandedResource = this.expandNamespaceToResource(namespace, resource)
        // Use a unique namespace identifier for storage
        this.i18nEngine.addResource(lang, `__plugin_${plugin.id}__`, expandedResource, { layer: 'plugin' })
      }
    }

    console.log(`[Plugin:${plugin.name}] i18n resources registered`)
  }

  /**
   * Expand a dot-notation namespace to a nested resource object
   * e.g., 'plugins.io.livemixer.text' with { label: { content: 'Content' } }
   * becomes { plugins: { io: { livemixer: { text: { label: { content: 'Content' } } } } } }
   */
  private expandNamespaceToResource(namespace: string, resource: LanguageResource): LanguageResource {
    const keys = namespace.split('.')
    let result: LanguageResource = resource

    // Build nested object from right to left
    for (let i = keys.length - 1; i >= 0; i--) {
      result = { [keys[i]]: result }
    }

    return result
  }

  register(plugin: ISourcePlugin) {
    console.log(`Registering plugin: ${plugin.id}@${plugin.version}`)
    this.plugins.set(plugin.id, plugin)

    // Register plugin i18n resources
    this.registerPluginI18n(plugin)

    // Initialize plugin context
    const context: IPluginContext = {
      canvasWidth: 1920, // Default value; should come from system configuration
      canvasHeight: 1080,
      logger: {
        info: (msg) => console.log(`[Plugin:${plugin.name}] ${msg}`),
        error: (msg) => console.error(`[Plugin:${plugin.name}] ${msg}`),
      },
      assetLoader: {
        loadTexture: async (url) => {
          return new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = url
          })
        },
      },
    }

    if (plugin.onInit) {
      plugin.onInit(context)
    }

    // Call onContextReady with full plugin context (if plugin supports it)
    if (plugin.onContextReady) {
      const fullContext = pluginContextManager.createContextForPlugin(
        plugin.id,
        plugin.version,
        plugin.trustLevel || 'community'
      )
      plugin.onContextReady(fullContext)
    }
  }

  getPlugin(id: string): ISourcePlugin | undefined {
    return this.plugins.get(id)
  }

  getAllPlugins(): ISourcePlugin[] {
    return Array.from(this.plugins.values())
  }

  getPluginsByCategory(category: ISourcePlugin['category']): ISourcePlugin[] {
    return this.getAllPlugins().filter((p) => p.category === category)
  }

  /**
   * Get all plugins that have source type mapping defined
   * These plugins can be added as sources in the add-source-dialog
   */
  getSourcePlugins(): ISourcePlugin[] {
    return this.getAllPlugins().filter((p) => p.sourceType !== undefined)
  }

  /**
   * Get plugin by source type ID
   * Maps SceneItem.type to the corresponding plugin
   */
  getPluginBySourceType(sourceType: string): ISourcePlugin | undefined {
    // First try direct plugin ID match
    const plugin = this.plugins.get(sourceType)
    if (plugin) return plugin

    // Then try sourceType.typeId match
    for (const p of this.plugins.values()) {
      if (p.sourceType?.typeId === sourceType) {
        return p
      }
    }

    return undefined
  }

  /**
   * Get all plugins that support audio mixing
   */
  getAudioMixerPlugins(): ISourcePlugin[] {
    return this.getAllPlugins().filter((p) => p.audioMixer?.enabled === true)
  }
}

export const pluginRegistry = new PluginRegistry()
