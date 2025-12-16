import { ChevronDown, ChevronUp, Play, Plus, Settings, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Scene } from '../types/protocol'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface BottomBarProps {
  scenes: Scene[]
  activeSceneId: string | null
  onSceneSelect: (sceneId: string) => void
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
  isStreaming: boolean
  onToggleStreaming: () => void
  onSettingsClick: () => void
  onAddScene: () => void
  onDeleteScene: (sceneId: string) => void
  onMoveSceneUp: (sceneId: string) => void
  onMoveSceneDown: (sceneId: string) => void
  onAddItem: () => void
  onDeleteItem: (itemId: string) => void
  onMoveItemUp: (itemId: string) => void
  onMoveItemDown: (itemId: string) => void
}

export function BottomBar({
  scenes,
  activeSceneId,
  onSceneSelect,
  selectedItemId,
  onSelectItem,
  isStreaming,
  onToggleStreaming,
  onSettingsClick,
  onAddScene,
  onDeleteScene,
  onMoveSceneUp,
  onMoveSceneDown,
  onAddItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
}: BottomBarProps) {
  const activeScene = scenes.find((s) => s.id === activeSceneId)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false)
  const sceneToDelete = activeScene
  const itemToDelete = activeScene?.items.find(
    (item) => item.id === selectedItemId,
  )

  return (
    <TooltipProvider>
      <div className="w-full h-full flex">
        {/* 场景区域 - 30% */}
        <div className="w-[30%] flex flex-col border-r border-[#3e3e42] overflow-hidden">
          <div className="px-4 py-2 border-b border-[#3e3e42] text-center">
            <h3 className="text-sm font-semibold text-gray-300">场景</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {scenes.map((scene) => (
                <Tooltip key={scene.id}>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
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
                      <div className="text-xs opacity-70">
                        {scene.items.length} 个元素
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-[#2d2d30] border-[#3e3e42] text-white"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{scene.name}</div>
                      <div className="text-xs text-gray-400">
                        ID: {scene.id}
                      </div>
                      <div className="text-xs text-gray-400">
                        {scene.items.length} 个元素
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
          {/* 场景操作按钮 - 底部 */}
          <div className="border-t border-[#3e3e42] p-2 flex items-center justify-center gap-2 bg-[#1a1a1a]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onAddScene}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                添加场景
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={!activeSceneId || scenes.length <= 1}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                删除场景
              </TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-[#3e3e42]" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => activeSceneId && onMoveSceneUp(activeSceneId)}
                  disabled={!activeSceneId || scenes.findIndex(s => s.id === activeSceneId) === 0}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                上移
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => activeSceneId && onMoveSceneDown(activeSceneId)}
                  disabled={!activeSceneId || scenes.findIndex(s => s.id === activeSceneId) === scenes.length - 1}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                下移
              </TooltipContent>
            </Tooltip>
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
                  <Tooltip key={item.id}>
                    <TooltipTrigger asChild>
                      <div
                        role="button"
                        tabIndex={0}
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
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-[#2d2d30] border-[#3e3e42] text-white"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{item.id}</div>
                        <div className="text-xs text-gray-400">
                          类型: {item.type}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                请选择一个场景
              </div>
            )}
          </div>
          {/* 源操作按钮 - 底部 */}
          <div className="border-t border-[#3e3e42] p-2 flex items-center justify-center gap-2 bg-[#1a1a1a]">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onAddItem}
                  disabled={!activeSceneId}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                添加源
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDeleteItemDialogOpen(true)}
                  disabled={!selectedItemId}
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                删除源
              </TooltipContent>
            </Tooltip>
            <div className="w-px h-5 bg-[#3e3e42]" />
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => selectedItemId && onMoveItemUp(selectedItemId)}
                  disabled={
                    !selectedItemId ||
                    !activeScene ||
                    activeScene.items.findIndex((i) => i.id === selectedItemId) === 0
                  }
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronUp className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                上移
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => selectedItemId && onMoveItemDown(selectedItemId)}
                  disabled={
                    !selectedItemId ||
                    !activeScene ||
                    activeScene.items.findIndex((i) => i.id === selectedItemId) ===
                    activeScene.items.length - 1
                  }
                  className="p-2 hover:bg-[#3e3e42] rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronDown className="w-4 h-4 text-gray-300" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
                下移
              </TooltipContent>
            </Tooltip>
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
              onClick={onSettingsClick}
              className="w-full px-4 py-3 bg-[#1e1e1e] hover:bg-[#3e3e42] text-white rounded transition-colors flex items-center justify-center gap-2"
            >
              <Settings className="w-5 h-5" />
              <span>设置</span>
            </button>
          </div>
        </div>
      </div>

      {/* 删除场景确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除场景</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除场景 "{sceneToDelete?.name}" 吗？
              <br />
              <span className="text-yellow-500 font-medium">
                此操作无法撤销，场景中的所有元素都将被删除。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (activeSceneId) {
                  onDeleteScene(activeSceneId)
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除源确认对话框 */}
      <AlertDialog open={deleteItemDialogOpen} onOpenChange={setDeleteItemDialogOpen}>
        <AlertDialogContent className="shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除源</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除源 "{itemToDelete?.id}" 吗？
              <br />
              <span className="text-yellow-500 font-medium">
                此操作无法撤销。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedItemId) {
                  onDeleteItem(selectedItemId)
                }
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  )
}
