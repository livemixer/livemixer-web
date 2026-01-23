import type { ISourcePlugin, IPluginContext } from '../types/plugin';

class PluginRegistry {
    private plugins: Map<string, ISourcePlugin> = new Map();

    register(plugin: ISourcePlugin) {
        console.log(`Registering plugin: ${plugin.id}@${plugin.version}`);
        this.plugins.set(plugin.id, plugin);

        // 初始化插件上下文
        const context: IPluginContext = {
            canvasWidth: 1920, // 默认值，实际应从系统配置获取
            canvasHeight: 1080,
            logger: {
                info: (msg) => console.log(`[Plugin:${plugin.name}] ${msg}`),
                error: (msg) => console.error(`[Plugin:${plugin.name}] ${msg}`),
            },
            assetLoader: {
                loadTexture: async (url) => {
                    return new Promise((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = url;
                    });
                }
            }
        };

        if (plugin.onInit) {
            plugin.onInit(context);
        }
    }

    getPlugin(id: string): ISourcePlugin | undefined {
        return this.plugins.get(id);
    }

    getAllPlugins(): ISourcePlugin[] {
        return Array.from(this.plugins.values());
    }

    getPluginsByCategory(category: ISourcePlugin['category']): ISourcePlugin[] {
        return this.getAllPlugins().filter(p => p.category === category);
    }
}

export const pluginRegistry = new PluginRegistry();
