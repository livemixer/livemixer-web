import { Play, Square, Settings } from 'lucide-react'
import type { Scene, Source } from '../types/protocol'

interface BottomBarProps {
    scenes: Scene[]
    activeSceneId: string | null
    onSceneSelect: (sceneId: string) => void
    sources: Source[]
    selectedItemId: string | null
    onSelectItem: (itemId: string) => void
    isStreaming: boolean
    onToggleStreaming: () => void
}

export function BottomBar({
    scenes,
    activeSceneId,
    onSceneSelect,
    sources,
    selectedItemId,
    onSelectItem,
    isStreaming,
    onToggleStreaming,
}: BottomBarProps) {
    const activeScene = scenes.find((s) => s.id === activeSceneId)

    return (
        <div className="w-full h-full flex">
            {/* 场景区域 - 30% */}
            <div className="w-[30%] flex flex-col border-r border-[#3e3e42] overflow-hidden">
                <div className="px-4 py-2 border-b border-[#3e3e42] text-center">
                    <h3 className="text-sm font-semibold text-gray-300">场景</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="space-y-2">
                        {scenes.map((scene) => (
                            <div
                                key={scene.id}
                                onClick={() => onSceneSelect(scene.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        onSceneSelect(scene.id)
                                    }
                                }}
                                className={`
                  px-3 py-2 rounded cursor-pointer transition-colors text-sm select-none
                  ${activeSceneId === scene.id
                                        ? 'bg-blue-500/80 text-white'
                                        : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#3e3e42]'
                                    }
                `}
                            >
                                <div className="font-medium">{scene.name}</div>
                                <div className="text-xs opacity-70">{scene.items.length} 个元素</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 源区域（属于当前场景）- 45% */}
            <div className="flex-1 flex flex-col border-r border-[#3e3e42] overflow-hidden">
                <div className="px-4 py-2 border-b border-[#3e3e42] text-center">
                    <h3 className="text-sm font-semibold text-gray-300">
                        源 {activeScene && `- ${activeScene.name}`}
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    {activeScene ? (
                        <div className="space-y-2">
                            {activeScene.items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => onSelectItem(item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            onSelectItem(item.id)
                                        }
                                    }}
                                    className={`
                                        px-3 py-2 rounded transition-colors cursor-pointer select-none
                                        ${selectedItemId === item.id
                                            ? 'bg-blue-500/80 text-white'
                                            : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#3e3e42]'
                                        }
                                    `}
                                >
                                    <div className="text-sm font-medium">{item.id}</div>
                                    <div className="text-xs opacity-70">{item.type}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                            请选择一个场景
                        </div>
                    )}
                </div>
            </div>

            {/* 控制按钮区域 - 25% */}
            <div className="w-[25%] flex flex-col overflow-hidden">
                <div className="px-4 py-2 border-b border-[#3e3e42] text-center">
                    <h3 className="text-sm font-semibold text-gray-300">控制</h3>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={onToggleStreaming}
                        className={`
              w-full px-4 py-3 rounded font-medium transition-all flex items-center justify-center gap-2
              ${isStreaming
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }
            `}
                    >
                        {isStreaming ? (
                            <>
                                <Square className="w-5 h-5" fill="currentColor" />
                                <span>停止直播</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5" fill="currentColor" />
                                <span>开始直播</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="w-full px-4 py-3 bg-[#1e1e1e] hover:bg-[#3e3e42] text-white rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <Settings className="w-5 h-5" />
                        <span>设置</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
