import { Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { SceneItem } from '../types/protocol'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Slider } from './ui/slider'

interface PropertyPanelProps {
  selectedItem: SceneItem | null
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void
}

export function PropertyPanel({
  selectedItem,
  onUpdateItem,
}: PropertyPanelProps) {
  const [localItem, setLocalItem] = useState<SceneItem | null>(selectedItem)

  // 使用 useEffect 确保 selectedItem 的任何变化都同步到 localItem
  useEffect(() => {
    setLocalItem(selectedItem)
  }, [selectedItem])

  if (!selectedItem || !localItem) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-gray-500 text-sm">
        未选中任何元素
      </div>
    )
  }

  const isLocked = localItem.locked === true

  const updateProperty = (updates: Partial<SceneItem>) => {
    // 锁定时不允许修改
    if (isLocked) return

    const newItem = {
      ...localItem,
      ...updates,
      layout: updates.layout
        ? { ...localItem.layout, ...updates.layout }
        : localItem.layout,
      transform: updates.transform
        ? { ...localItem.transform, ...updates.transform }
        : localItem.transform,
    }
    setLocalItem(newItem)
    onUpdateItem?.(selectedItem.id, updates)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-[#3e3e42] bg-[#2d2d30]">
        <h3 className="text-sm font-semibold text-gray-200">属性</h3>
      </div>

      {/* 锁定提示 */}
      {isLocked && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-sm text-red-400">
          <Lock className="w-4 h-4" />
          <span>该元素已锁定，无法编辑属性</span>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* 基本信息 */}
        <div className="space-y-4">
          <div>
            <Label className="block mb-2">元素 ID</Label>
            <div className="text-sm text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded border border-[#3e3e42]">
              {localItem.id}
            </div>
          </div>

          <div>
            <Label className="block mb-2">类型</Label>
            <div className="text-sm text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded border border-[#3e3e42] capitalize">
              {localItem.type}
            </div>
          </div>

          <div>
            <Label htmlFor="zIndex" className="block mb-2">
              层级 (Z-Index)
            </Label>
            <Input
              id="zIndex"
              type="number"
              value={localItem.zIndex}
              onChange={(e) =>
                updateProperty({ zIndex: Number.parseInt(e.target.value) || 0 })
              }
              disabled={isLocked}
            />
          </div>
        </div>

        {/* 位置和大小 */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            位置和大小
          </h4>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <Label htmlFor="x" className="block mb-2">
                X 坐标
              </Label>
              <Input
                id="x"
                type="number"
                value={Math.round(localItem.layout.x)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      x: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="y" className="block mb-2">
                Y 坐标
              </Label>
              <Input
                id="y"
                type="number"
                value={Math.round(localItem.layout.y)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      y: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="width" className="block mb-2">
                宽度
              </Label>
              <Input
                id="width"
                type="number"
                value={Math.round(localItem.layout.width)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      width: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="height" className="block mb-2">
                高度
              </Label>
              <Input
                id="height"
                type="number"
                value={Math.round(localItem.layout.height)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      height: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* 变换 */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            变换
          </h4>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="opacity" className="text-xs">
                  透明度
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {((localItem.transform?.opacity ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={1}
                step={0.01}
                value={[localItem.transform?.opacity ?? 1]}
                onValueChange={(value) =>
                  updateProperty({ transform: { opacity: value[0] } })
                }
                disabled={isLocked}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="rotation" className="text-xs">
                  旋转角度
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {Math.round(localItem.transform?.rotation ?? 0)}°
                </span>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[localItem.transform?.rotation ?? 0]}
                onValueChange={(value) =>
                  updateProperty({ transform: { rotation: value[0] } })
                }
                disabled={isLocked}
              />
            </div>

            {(localItem.type === 'video' ||
              localItem.type === 'scene_ref' ||
              localItem.type === 'color') && (
                <div>
                  <Label htmlFor="borderRadius" className="block mb-2">
                    圆角半径
                  </Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    value={localItem.transform?.borderRadius ?? 0}
                    onChange={(e) =>
                      updateProperty({
                        transform: {
                          borderRadius: Number.parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    placeholder="0"
                    disabled={isLocked}
                  />
                </div>
              )}
          </div>
        </div>

        {/* 特定类型属性 */}
        {localItem.type === 'color' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              颜色
            </h4>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={localItem.color || '#000000'}
                onChange={(e) => updateProperty({ color: e.target.value })}
                className="w-14 h-10 p-1 cursor-pointer"
                disabled={isLocked}
              />
              <Input
                type="text"
                value={localItem.color || '#000000'}
                onChange={(e) => updateProperty({ color: e.target.value })}
                className="flex-1"
                placeholder="#000000"
                disabled={isLocked}
              />
            </div>
          </div>
        )}

        {localItem.type === 'text' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              文本
            </h4>

            <div className="space-y-4">
              <div>
                <Label htmlFor="content" className="block mb-2">
                  内容
                </Label>
                <textarea
                  id="content"
                  value={localItem.content || ''}
                  onChange={(e) => updateProperty({ content: e.target.value })}
                  placeholder="输入文本内容"
                  className="flex min-h-[80px] w-full rounded-md border border-[#3e3e42] bg-[#1e1e1e] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  rows={3}
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="fontSize" className="block mb-2">
                  字号大小
                </Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={localItem.properties?.fontSize || 16}
                  onChange={(e) =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        fontSize: Number.parseFloat(e.target.value) || 16,
                      },
                    })
                  }
                  placeholder="16"
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="textColor" className="block mb-2">
                  文字颜色
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={(e) =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="w-14 h-10 p-1 cursor-pointer"
                    disabled={isLocked}
                  />
                  <Input
                    type="text"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={(e) =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="flex-1"
                    placeholder="#FFFFFF"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {(localItem.type === 'video' || localItem.type === 'screen') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              媒体源
            </h4>
            <Label htmlFor="source" className="block mb-2">
              源地址
            </Label>
            <Input
              id="source"
              type="text"
              value={localItem.source || ''}
              onChange={(e) => updateProperty({ source: e.target.value })}
              placeholder="输入媒体源"
              disabled={isLocked}
            />
          </div>
        )}
      </div>
    </div>
  )
}
