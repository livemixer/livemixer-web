import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProtocolData } from '../types/protocol'

// Create a default empty scene configuration
const createDefaultProtocolData = (): ProtocolData => ({
  version: '1.0.0',
  metadata: {
    name: 'New Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  canvas: {
    width: 1920,
    height: 1080,
  },
  resources: {
    sources: [],
  },
  scenes: [
    {
      id: 'scene-1',
      name: '场景 1',
      active: true,
      items: [],
    },
  ],
})

// Protocol store interface
interface ProtocolState {
  data: ProtocolData
  updateData: (data: ProtocolData) => void
  resetData: () => void
}

// Create Zustand store
export const useProtocolStore = create<ProtocolState>()(
  persist(
    (set) => ({
      // Initial state
      data: createDefaultProtocolData(),

      // Update protocol data
      updateData: (data) => {
        const updatedData = {
          ...data,
          metadata: {
            ...data.metadata,
            updatedAt: new Date().toISOString(),
          },
        }
        set({ data: updatedData })
      },

      // Reset protocol data
      resetData: () =>
        set({
          data: createDefaultProtocolData(),
        }),
    }),
    {
      name: 'livemixer-protocol',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
