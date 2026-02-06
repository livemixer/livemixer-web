import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

// Non-sensitive settings interface (safe to persist to localStorage)
interface PersistentSettings {
  // General settings
  language: string
  theme: string

  // Streaming settings (non-sensitive)
  streamService: string
  livekitUrl: string

  // Pull settings (non-sensitive)
  livekitPullUrl: string

  // Output settings
  videoBitrate: string
  audioBitrate: string
  videoEncoder: string
  audioEncoder: string

  // Audio settings
  audioDevice: string
  sampleRate: string
  channels: string

  // Video settings
  baseResolution: string
  outputResolution: string
  fps: string
  scaleFilter: string
  customWidth?: string
  customHeight?: string
}

// Sensitive settings interface (in-memory only, not persisted)
interface SensitiveSettings {
  livekitToken: string
  livekitPullToken: string
}

// Full settings state interface
interface SettingsState extends PersistentSettings, SensitiveSettings {
  // Update persisted settings
  updatePersistentSettings: (settings: Partial<PersistentSettings>) => void

  // Update sensitive settings
  updateSensitiveSettings: (settings: Partial<SensitiveSettings>) => void

  // Reset all settings
  resetSettings: () => void
}

// Default configuration
const defaultPersistentSettings: PersistentSettings = {
  // General settings
  language: 'zh-CN',
  theme: 'dark',

  // Streaming settings
  streamService: 'custom',
  livekitUrl: '',

  // Pull settings
  livekitPullUrl: '',

  // Output settings
  videoBitrate: '5000',
  audioBitrate: '48000',
  videoEncoder: 'vp8',
  audioEncoder: 'opus',

  // Audio settings
  audioDevice: 'default',
  sampleRate: '48000',
  channels: 'stereo',

  // Video settings
  baseResolution: '1920x1080',
  outputResolution: '1920x1080',
  fps: '30',
  scaleFilter: 'bilinear',
}

const defaultSensitiveSettings: SensitiveSettings = {
  livekitToken: '',
  livekitPullToken: '',
}

// Create Zustand store
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state: merge persisted and sensitive settings
      ...defaultPersistentSettings,
      ...defaultSensitiveSettings,

      // Update persisted settings (auto-saved to localStorage)
      updatePersistentSettings: (settings) =>
        set((state) => ({
          ...state,
          ...settings,
        })),

      // Update sensitive settings (in-memory only, not persisted)
      updateSensitiveSettings: (settings) =>
        set((state) => ({
          ...state,
          ...settings,
        })),

      // Reset all settings
      resetSettings: () =>
        set({
          ...defaultPersistentSettings,
          ...defaultSensitiveSettings,
        }),
    }),
    {
      name: 'livemixer-settings', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Persist only non-sensitive settings
      partialize: (state) => {
        const {
          livekitToken: _livekitToken,
          livekitPullToken: _livekitPullToken,
          updatePersistentSettings: _updatePersistentSettings,
          updateSensitiveSettings: _updateSensitiveSettings,
          resetSettings: _resetSettings,
          ...persistentState
        } = state
        return persistentState
      },
    },
  ),
)
