import type { IPluginContext, ISourcePlugin } from '../types/plugin'

class PluginRegistry {
  private plugins: Map<string, ISourcePlugin> = new Map()

  register(plugin: ISourcePlugin) {
    console.log(`Registering plugin: ${plugin.id}@${plugin.version}`)
    this.plugins.set(plugin.id, plugin)

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
}

export const pluginRegistry = new PluginRegistry()
