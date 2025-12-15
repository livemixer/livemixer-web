import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 非敏感配置接口（可以持久化到 localStorage）
interface PersistentSettings {
    // 常规设置
    language: string
    theme: string

    // 直播设置（非敏感部分）
    streamService: string
    livekitUrl: string

    // 输出设置
    videoBitrate: string
    audioBitrate: string
    videoEncoder: string
    audioEncoder: string

    // 音频设置
    audioDevice: string
    sampleRate: string
    channels: string

    // 视频设置
    baseResolution: string
    outputResolution: string
    fps: string
    scaleFilter: string
    customWidth?: string
    customHeight?: string
}

// 敏感配置接口（仅存储在内存中，不持久化）
interface SensitiveSettings {
    livekitToken: string
}

// 完整设置状态接口
interface SettingsState extends PersistentSettings, SensitiveSettings {
    // 更新持久化配置的方法
    updatePersistentSettings: (settings: Partial<PersistentSettings>) => void

    // 更新敏感配置的方法
    updateSensitiveSettings: (settings: Partial<SensitiveSettings>) => void

    // 重置所有设置
    resetSettings: () => void
}

// 默认配置
const defaultPersistentSettings: PersistentSettings = {
    // 常规设置
    language: 'zh-CN',
    theme: 'dark',

    // 直播设置
    streamService: 'custom',
    livekitUrl: '',

    // 输出设置
    videoBitrate: '2500',
    audioBitrate: '48000',
    videoEncoder: 'h264',
    audioEncoder: 'opus',

    // 音频设置
    audioDevice: 'default',
    sampleRate: '48000',
    channels: 'stereo',

    // 视频设置
    baseResolution: '1920x1080',
    outputResolution: '1920x1080',
    fps: '30',
    scaleFilter: 'bilinear',
}

const defaultSensitiveSettings: SensitiveSettings = {
    livekitToken: '',
}

// 创建 Zustand store
export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            // 初始状态：合并持久化配置和敏感配置
            ...defaultPersistentSettings,
            ...defaultSensitiveSettings,

            // 更新持久化配置（会自动保存到 localStorage）
            updatePersistentSettings: (settings) => set((state) => ({
                ...state,
                ...settings,
            })),

            // 更新敏感配置（仅更新内存，不持久化）
            updateSensitiveSettings: (settings) => set((state) => ({
                ...state,
                ...settings,
            })),

            // 重置所有设置
            resetSettings: () => set({
                ...defaultPersistentSettings,
                ...defaultSensitiveSettings,
            }),
        }),
        {
            name: 'livemixer-settings', // localStorage key
            storage: createJSONStorage(() => localStorage),

            // 仅持久化非敏感配置
            partialize: (state) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { livekitToken, updatePersistentSettings, updateSensitiveSettings, resetSettings, ...persistentState } = state
                return persistentState
            },
        }
    )
)
