import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISourcePlugin } from '../types/plugin';

// 测试前需要重新拿到全新的 registry 实例，避免单测之间相互污染。
// pluginRegistry 是单例模块导出，使用 vi.resetModules 强制重新加载模块。
async function loadFreshRegistry() {
    vi.resetModules();
    const mod = await import('./plugin-registry');
    return mod.pluginRegistry;
}

function makePlugin(overrides: Partial<ISourcePlugin> = {}): ISourcePlugin {
    return {
        id: 'io.livemixer.test',
        version: '1.0.0',
        name: 'Test Plugin',
        category: 'widget',
        engines: { host: '>=0.0.1', api: '1.x' },
        propsSchema: {},
        // ISourcePlugin 中以下生命周期方法为必填，测试用空实现兜底
        onInit: () => { },
        onUpdate: () => { },
        render: () => ({}) as never,
        onDispose: () => { },
        ...overrides,
    };
}

describe('PluginRegistry', () => {
    beforeEach(() => {
        // 静音注册过程中产生的 console.log，保持测试输出整洁
        vi.spyOn(console, 'log').mockImplementation(() => { });
    });

    it('register 后能通过 getPlugin 检索到', async () => {
        const registry = await loadFreshRegistry();
        const plugin = makePlugin();

        registry.register(plugin);

        expect(registry.getPlugin(plugin.id)).toBe(plugin);
    });

    it('getAllPlugins 返回全部已注册插件', async () => {
        const registry = await loadFreshRegistry();
        const a = makePlugin({ id: 'a' });
        const b = makePlugin({ id: 'b' });

        registry.register(a);
        registry.register(b);

        const all = registry.getAllPlugins();
        expect(all).toHaveLength(2);
        expect(all).toEqual(expect.arrayContaining([a, b]));
    });

    it('getPluginsByCategory 仅返回匹配 category 的插件', async () => {
        const registry = await loadFreshRegistry();
        const media = makePlugin({ id: 'm', category: 'media' });
        const text = makePlugin({ id: 't', category: 'text' });

        registry.register(media);
        registry.register(text);

        expect(registry.getPluginsByCategory('media')).toEqual([media]);
        expect(registry.getPluginsByCategory('text')).toEqual([text]);
    });

    it('getSourcePlugins 仅返回声明了 sourceType 的插件', async () => {
        const registry = await loadFreshRegistry();
        const withSource = makePlugin({
            id: 'with-source',
            sourceType: { typeId: 'custom-type' },
        });
        const withoutSource = makePlugin({ id: 'without-source' });

        registry.register(withSource);
        registry.register(withoutSource);

        expect(registry.getSourcePlugins()).toEqual([withSource]);
    });

    it('getPluginBySourceType 优先匹配 plugin id，其次匹配 sourceType.typeId', async () => {
        const registry = await loadFreshRegistry();
        const byId = makePlugin({ id: 'direct-id' });
        const byTypeId = makePlugin({
            id: 'plugin-2',
            sourceType: { typeId: 'mapped-type' },
        });

        registry.register(byId);
        registry.register(byTypeId);

        expect(registry.getPluginBySourceType('direct-id')).toBe(byId);
        expect(registry.getPluginBySourceType('mapped-type')).toBe(byTypeId);
        expect(registry.getPluginBySourceType('unknown')).toBeUndefined();
    });

    it('getAudioMixerPlugins 仅返回开启 audioMixer 的插件', async () => {
        const registry = await loadFreshRegistry();
        const enabled = makePlugin({
            id: 'mix-on',
            audioMixer: { enabled: true },
        });
        const disabled = makePlugin({
            id: 'mix-off',
            audioMixer: { enabled: false },
        });
        const absent = makePlugin({ id: 'mix-none' });

        registry.register(enabled);
        registry.register(disabled);
        registry.register(absent);

        expect(registry.getAudioMixerPlugins()).toEqual([enabled]);
    });

    it('register 时若插件覆盖了 onInit，则会被调用一次', async () => {
        const registry = await loadFreshRegistry();
        const onInit = vi.fn();
        const plugin = makePlugin({ id: 'with-init', onInit });

        registry.register(plugin);

        expect(onInit).toHaveBeenCalledTimes(1);
    });
});
