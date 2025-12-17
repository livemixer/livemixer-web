import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ProtocolData } from '../types/protocol'

// 创建默认的空白场景配置
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

// Protocol Store 接口
interface ProtocolState {
    data: ProtocolData
    updateData: (data: ProtocolData) => void
    resetData: () => void
}

// 创建 Zustand store
export const useProtocolStore = create<ProtocolState>()(
    persist(
        (set) => ({
            // 初始状态
            data: createDefaultProtocolData(),

            // 更新配置
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

            // 重置配置
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
