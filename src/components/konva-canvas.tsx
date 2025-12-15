import type Konva from 'konva'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { Group, Layer, Rect, Stage, Text, Transformer } from 'react-konva'
import type { Scene, SceneItem, Transform } from '../types/protocol'

interface KonvaCanvasProps {
  scene: Scene | null
  canvasWidth: number
  canvasHeight: number
  onSelectItem?: (itemId: string) => void
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void
  selectedItemId?: string | null
}

export interface KonvaCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
  getStage: () => Konva.Stage | null
  startContinuousRendering: () => void
  stopContinuousRendering: () => void
}

export const KonvaCanvas = forwardRef<KonvaCanvasHandle, KonvaCanvasProps>(
  function KonvaCanvas(
    {
      scene,
      canvasWidth,
      canvasHeight,
      onSelectItem,
      onUpdateItem,
      selectedItemId,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)
    const layerRef = useRef<Konva.Layer>(null)
    const transformerRef = useRef<Konva.Transformer>(null)
    const renderLoopRef = useRef<number | null>(null)
    const [scale, setScale] = useState(1)
    const [stageSize, setStageSize] = useState({
      width: canvasWidth,
      height: canvasHeight,
    })
    const shapeRefs = useRef<Map<string, Konva.Node>>(new Map())

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      getCanvas: () => {
        if (!stageRef.current) return null
        // 获取 Konva Stage 底层的实际 Canvas DOM 元素
        const stage = stageRef.current.getStage()
        const canvas = stage.getContent().querySelector('canvas')
        return canvas
      },
      getStage: () => stageRef.current,
      // 启动持续渲染，确保 captureStream 持续捕获帧
      startContinuousRendering: () => {
        if (!layerRef.current || renderLoopRef.current !== null) return

        const renderLoop = () => {
          if (layerRef.current) {
            layerRef.current.batchDraw()
          }
          renderLoopRef.current = requestAnimationFrame(renderLoop)
        }

        renderLoopRef.current = requestAnimationFrame(renderLoop)
        console.log('已启动持续渲染')
      },
      // 停止持续渲染
      stopContinuousRendering: () => {
        if (renderLoopRef.current !== null) {
          cancelAnimationFrame(renderLoopRef.current)
          renderLoopRef.current = null
          console.log('已停止持续渲染')
        }
      },
    }))

    // 更新 Transformer 目标
    useEffect(() => {
      if (!transformerRef.current || !selectedItemId) {
        if (transformerRef.current) {
          transformerRef.current.nodes([])
        }
        return
      }

      const selectedNode = shapeRefs.current.get(selectedItemId)
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode])
        transformerRef.current.getLayer()?.batchDraw()
      }
    }, [selectedItemId])

    // 自适应缩放
    useEffect(() => {
      const updateSize = () => {
        if (!containerRef.current) return

        const container = containerRef.current
        const containerWidth = container.clientWidth
        const containerHeight = container.clientHeight

        // 防止容器尺寸为 0 导致计算错误
        if (containerWidth === 0 || containerHeight === 0) {
          return
        }

        const scaleX = containerWidth / canvasWidth
        const scaleY = containerHeight / canvasHeight
        const newScale = Math.min(scaleX, scaleY, 1) * 0.9 // 保留一些边距

        // 确保 scale 有效
        if (newScale > 0 && Number.isFinite(newScale)) {
          setScale(newScale)
          setStageSize({
            width: canvasWidth * newScale,
            height: canvasHeight * newScale,
          })
        }
      }

      // 使用多重策略确保首次加载正确
      // 1. requestAnimationFrame 确保 DOM 已渲染
      const rafId = requestAnimationFrame(() => {
        updateSize()
      })

      // 2. 短延迟后再次检查（应对某些浏览器渲染延迟）
      const timeoutId = setTimeout(() => {
        updateSize()
      }, 100)

      // 使用 ResizeObserver 监听容器尺寸变化
      const resizeObserver = new ResizeObserver(() => {
        updateSize()
      })

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current)
      }

      window.addEventListener('resize', updateSize)
      return () => {
        cancelAnimationFrame(rafId)
        clearTimeout(timeoutId)
        resizeObserver.disconnect()
        window.removeEventListener('resize', updateSize)
      }
    }, [canvasWidth, canvasHeight])

    const handleDragEnd = (
      itemId: string,
      e: Konva.KonvaEventObject<DragEvent>,
    ) => {
      const node = e.target
      onUpdateItem?.(itemId, {
        layout: {
          x: node.x(),
          y: node.y(),
          width: node.width() * node.scaleX(),
          height: node.height() * node.scaleY(),
        },
      })
      // 重置缩放
      node.scaleX(1)
      node.scaleY(1)
    }

    const handleTransformEnd = (
      itemId: string,
      currentTransform: Transform | undefined,
      e: Konva.KonvaEventObject<Event>,
    ) => {
      const node = e.target
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      onUpdateItem?.(itemId, {
        layout: {
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(5, node.height() * scaleY),
        },
        transform: {
          ...currentTransform,
          rotation: node.rotation(),
        },
      })

      // 重置缩放
      node.scaleX(1)
      node.scaleY(1)
    }

    const renderItem = (item: SceneItem, isChildItem = false) => {
      const isSelected = !isChildItem && selectedItemId === item.id
      const commonProps = {
        key: item.id,
        x: item.layout.x,
        y: item.layout.y,
        width: item.layout.width,
        height: item.layout.height,
        opacity: item.transform?.opacity ?? 1,
        rotation: item.transform?.rotation ?? 0,
        draggable: isSelected,
        onClick: isChildItem ? undefined : () => onSelectItem?.(item.id),
        onTap: isChildItem ? undefined : () => onSelectItem?.(item.id),
        onDragEnd: isChildItem
          ? undefined
          : (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(item.id, e),
        onTransformEnd: isChildItem
          ? undefined
          : (e: Konva.KonvaEventObject<Event>) =>
              handleTransformEnd(item.id, item.transform, e),
        ref: isChildItem
          ? undefined
          : (node: Konva.Node | null) => {
              if (node) {
                shapeRefs.current.set(item.id, node)
              } else {
                shapeRefs.current.delete(item.id)
              }
            },
        // 高亮选中的控件
        ...(isSelected && {
          shadowColor: '#00a8ff',
          shadowBlur: 10,
          shadowOpacity: 0.8,
        }),
      }

      switch (item.type) {
        case 'color':
          return <Rect {...commonProps} fill={item.color || '#000000'} />

        case 'text':
          return (
            <Text
              {...commonProps}
              text={item.content || ''}
              fontSize={item.properties?.fontSize || 16}
              fill={item.properties?.color || '#FFFFFF'}
              align="left"
              verticalAlign="top"
            />
          )

        case 'video':
          return (
            <Rect
              {...commonProps}
              fill="#333333"
              stroke="#666666"
              strokeWidth={2}
              cornerRadius={item.transform?.borderRadius || 0}
            />
          )

        case 'screen':
          return (
            <Rect
              {...commonProps}
              fill="#1a1a1a"
              stroke="#444444"
              strokeWidth={2}
            />
          )

        case 'container':
          return (
            <Group {...commonProps} key={item.id}>
              {/* 容器边框（可选，便于识别） */}
              <Rect
                x={0}
                y={0}
                width={item.layout.width}
                height={item.layout.height}
                stroke={isSelected ? '#00a8ff' : '#666666'}
                strokeWidth={isSelected ? 2 : 1}
                dash={[10, 5]}
                listening={false}
              />
              {/* 渲染子元素（不可交互） */}
              {item.children?.map((child) => renderItem(child, true))}
            </Group>
          )

        case 'scene_ref':
          return (
            <Rect
              {...commonProps}
              fill="#2a2a2a"
              stroke="#888888"
              strokeWidth={1}
              cornerRadius={item.transform?.borderRadius || 0}
            />
          )

        default:
          return null
      }
    }

    if (!scene) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          暂无场景
        </div>
      )
    }

    // 按 zIndex 排序
    const sortedItems = [...scene.items].sort((a, b) => a.zIndex - b.zIndex)

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-[#1e1e1e]"
      >
        <div
          className="relative shadow-lg"
          style={{
            width: stageSize.width,
            height: stageSize.height,
            border: '1px solid #666',
            backgroundColor: '#000',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={(e) => {
              // 点击空白处取消选中
              const clickedOnEmpty = e.target === e.target.getStage()
              if (clickedOnEmpty) {
                onSelectItem?.('')
              }
            }}
          >
            <Layer ref={layerRef}>
              {sortedItems.map((item) => renderItem(item, false))}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // 限制最小尺寸
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox
                  }
                  return newBox
                }}
                enabledAnchors={[
                  'top-left',
                  'top-right',
                  'bottom-left',
                  'bottom-right',
                  'middle-left',
                  'middle-right',
                  'top-center',
                  'bottom-center',
                ]}
                rotateEnabled={true}
                keepRatio={false}
              />
            </Layer>
          </Stage>
          {/* 画布尺寸标签 */}
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
            {canvasWidth} × {canvasHeight}
          </div>
        </div>
      </div>
    )
  },
)
