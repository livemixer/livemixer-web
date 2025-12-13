import { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Rect, Text, Group } from 'react-konva'
import type { Scene, SceneItem } from '../types/protocol'

interface KonvaCanvasProps {
    scene: Scene | null
    canvasWidth: number
    canvasHeight: number
    onSelectItem?: (itemId: string) => void
}

export function KonvaCanvas({ scene, canvasWidth, canvasHeight, onSelectItem }: KonvaCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)
    const [stageSize, setStageSize] = useState({ width: canvasWidth, height: canvasHeight })

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

    const renderItem = (item: SceneItem) => {
        const commonProps = {
            key: item.id,
            x: item.layout.x,
            y: item.layout.y,
            width: item.layout.width,
            height: item.layout.height,
            opacity: item.transform?.opacity ?? 1,
            rotation: item.transform?.rotation ?? 0,
            onClick: () => onSelectItem?.(item.id),
        }

        switch (item.type) {
            case 'color':
                return (
                    <Rect
                        {...commonProps}
                        fill={item.color || '#000000'}
                    />
                )

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
                    <Group
                        key={item.id}
                        x={item.layout.x}
                        y={item.layout.y}
                        width={item.layout.width}
                        height={item.layout.height}
                        opacity={item.transform?.opacity ?? 1}
                        rotation={item.transform?.rotation ?? 0}
                    >
                        {item.children?.map(renderItem)}
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
        <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-[#1e1e1e]">
            <div
                className="relative shadow-lg"
                style={{
                    width: stageSize.width,
                    height: stageSize.height,
                    border: '1px solid #666',
                    backgroundColor: '#000',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
                }}
            >
                <Stage
                    width={stageSize.width}
                    height={stageSize.height}
                    scaleX={scale}
                    scaleY={scale}
                >
                    <Layer>
                        {sortedItems.map(renderItem)}
                    </Layer>
                </Stage>
                {/* 画布尺寸标签 */}
                <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
                    {canvasWidth} × {canvasHeight}
                </div>
            </div>
        </div>
    )
}
