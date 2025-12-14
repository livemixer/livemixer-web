import type { SceneItem } from '../types/protocol'

interface PropertyPanelProps {
  selectedItem: SceneItem | null
}

export function PropertyPanel({ selectedItem }: PropertyPanelProps) {
  if (!selectedItem) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-gray-500 text-sm">
        未选中任何元素
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto select-none">
      <div className="p-4 border-b border-[#3e3e42]">
        <h3 className="text-sm font-semibold text-gray-300">属性</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* 基本信息 */}
        <div>
          <label className="text-xs text-gray-400 block mb-1">元素 ID</label>
          <div className="text-sm text-white">{selectedItem.id}</div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">类型</label>
          <div className="text-sm text-white">{selectedItem.type}</div>
        </div>

        <div>
          <label className="text-xs text-gray-400 block mb-1">
            层级 (Z-Index)
          </label>
          <div className="text-sm text-white">{selectedItem.zIndex}</div>
        </div>

        {/* 位置和大小 */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-300 mb-3">
            位置和大小
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">X</label>
              <div className="text-sm text-white">
                {selectedItem.layout.x}px
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Y</label>
              <div className="text-sm text-white">
                {selectedItem.layout.y}px
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">宽度</label>
              <div className="text-sm text-white">
                {selectedItem.layout.width}px
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">高度</label>
              <div className="text-sm text-white">
                {selectedItem.layout.height}px
              </div>
            </div>
          </div>
        </div>

        {/* 变换 */}
        {selectedItem.transform && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-300 mb-3">变换</h4>

            {selectedItem.transform.opacity !== undefined && (
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">
                  透明度
                </label>
                <div className="text-sm text-white">
                  {selectedItem.transform.opacity}
                </div>
              </div>
            )}

            {selectedItem.transform.rotation !== undefined && (
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">旋转</label>
                <div className="text-sm text-white">
                  {selectedItem.transform.rotation}°
                </div>
              </div>
            )}

            {selectedItem.transform.borderRadius !== undefined && (
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">圆角</label>
                <div className="text-sm text-white">
                  {selectedItem.transform.borderRadius}px
                </div>
              </div>
            )}
          </div>
        )}

        {/* 特定类型属性 */}
        {selectedItem.type === 'color' && selectedItem.color && (
          <div className="border-t border-[#3e3e42] pt-4">
            <label className="text-xs text-gray-400 block mb-1">颜色</label>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border border-gray-600"
                style={{ backgroundColor: selectedItem.color }}
              />
              <div className="text-sm text-white">{selectedItem.color}</div>
            </div>
          </div>
        )}

        {selectedItem.type === 'text' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-300 mb-3">文本</h4>

            <div className="mb-2">
              <label className="text-xs text-gray-400 block mb-1">内容</label>
              <div className="text-sm text-white">{selectedItem.content}</div>
            </div>

            {selectedItem.properties?.fontSize && (
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">字号</label>
                <div className="text-sm text-white">
                  {selectedItem.properties.fontSize}px
                </div>
              </div>
            )}

            {selectedItem.properties?.color && (
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">
                  文字颜色
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-gray-600"
                    style={{ backgroundColor: selectedItem.properties.color }}
                  />
                  <div className="text-sm text-white">
                    {selectedItem.properties.color}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {(selectedItem.type === 'video' || selectedItem.type === 'screen') &&
          selectedItem.source && (
            <div className="border-t border-[#3e3e42] pt-4">
              <label className="text-xs text-gray-400 block mb-1">源</label>
              <div className="text-sm text-white break-all">
                {selectedItem.source}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
