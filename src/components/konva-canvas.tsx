import type Konva from 'konva';
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text, Transformer } from 'react-konva';
import useImage from 'use-image';
import { pluginRegistry } from '../services/plugin-registry';
import type { Scene, SceneItem, Transform } from '../types/protocol';
import { LiveKitStreamItem } from './livekit-stream-item';

// Plugin renderer: isolates hooks context to avoid Rules of Hooks violations
// Note: using shallow comparison to ensure plugin re-renders when item changes
const PluginRenderer = memo(
  ({ plugin, commonProps, item }: { plugin: any; commonProps: any; item: SceneItem }) => {
    return plugin.render({ ...commonProps, item });
  },
);

// Format time display
function formatTime(seconds: number, format: string): string {
  const absSeconds = Math.abs(Math.floor(seconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  const pad = (num: number) => String(num).padStart(2, '0');

  if (format === 'HH:MM:SS') {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  if (format === 'MM:SS') {
    return `${pad(minutes)}:${pad(secs)}`;
  }
  if (format === 'HH:MM') {
    return `${pad(hours)}:${pad(minutes)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

// Format current time for clock display
function formatClock(format: string): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (format === 'HH:MM:SS') {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  if (format === 'HH:MM') {
    return `${pad(hours)}:${pad(minutes)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Image component: loads and renders images
const ImageItem = memo(({ item, commonProps }: { item: SceneItem; commonProps: any }) => {
  const [image] = useImage(item.url || '', 'anonymous');

  const { ref: nodeRef, ...restProps } = commonProps;

  return (
    <KonvaImage
      {...restProps}
      ref={nodeRef}
      image={image}
      cornerRadius={item.transform?.borderRadius || 0}
    />
  );
});

interface KonvaCanvasProps {
  scene: Scene | null;
  canvasWidth: number;
  canvasHeight: number;
  onSelectItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
  selectedItemId?: string | null;
}

export interface KonvaCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getStage: () => Konva.Stage | null;
  startContinuousRendering: () => void;
  stopContinuousRendering: () => void;
}

export const KonvaCanvas = forwardRef<KonvaCanvasHandle, KonvaCanvasProps>(function KonvaCanvas(
  { scene, canvasWidth, canvasHeight, onSelectItem, onUpdateItem, selectedItemId },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const renderLoopRef = useRef<number | null>(null);
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({
    width: canvasWidth,
    height: canvasHeight,
  });
  const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
  // Pixel ratio for HiDPI displays
  const pixelRatio = window.devicePixelRatio || 1;
  // Timer/clock state
  const [timerStates, setTimerStates] = useState<Map<string, string>>(new Map());
  const timerRafRef = useRef<number | null>(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getCanvas: () => {
      if (!stageRef.current) return null;
      // Get underlying canvas element from Konva Stage
      const stage = stageRef.current.getStage();
      const canvas = stage.getContent().querySelector('canvas');
      return canvas;
    },
    getStage: () => stageRef.current,
    // Start continuous render loop to keep captureStream alive
    startContinuousRendering: () => {
      if (!layerRef.current || renderLoopRef.current !== null) return;

      const renderLoop = () => {
        if (layerRef.current) {
          layerRef.current.batchDraw();
        }
        renderLoopRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoopRef.current = requestAnimationFrame(renderLoop);
      console.log('已启动持续渲染');
    },
    // Stop continuous render loop
    stopContinuousRendering: () => {
      if (renderLoopRef.current !== null) {
        cancelAnimationFrame(renderLoopRef.current);
        renderLoopRef.current = null;
        console.log('已停止持续渲染');
      }
    },
  }));

  // Update transformer target
  useEffect(() => {
    if (!transformerRef.current || !selectedItemId) {
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
      }
      return;
    }

    const selectedNode = shapeRefs.current.get(selectedItemId);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedItemId]);

  // Timer/clock update loop (high precision via requestAnimationFrame)
  useEffect(() => {
    if (!scene) return;

    // Check if any timer or clock items exist
    const hasTimerOrClock = scene.items.some(
      item => item.type === 'timer' || item.type === 'clock',
    );

    if (!hasTimerOrClock) {
      // No timers/clocks: cancel frame loop
      if (timerRafRef.current !== null) {
        cancelAnimationFrame(timerRafRef.current);
        timerRafRef.current = null;
      }
      return;
    }

    // Start frame loop for timer/clock updates
    const updateTimers = () => {
      const newStates = new Map<string, string>();
      const now = performance.now() / 1000; // Convert to seconds (high precision)

      for (const item of scene.items) {
        if (item.type === 'clock' && item.timerConfig) {
          // Clock mode: show current time
          const format = item.timerConfig.format || 'HH:MM:SS';
          newStates.set(item.id, formatClock(format));
        } else if (item.type === 'timer' && item.timerConfig) {
          const config = item.timerConfig;
          const format = config.format || 'MM:SS';

          if (config.mode === 'countdown') {
            // Countdown mode
            if (config.running && config.startTime !== undefined && config.duration !== undefined) {
              const elapsed = now - config.startTime;
              const remaining = Math.max(0, config.duration - elapsed);
              newStates.set(item.id, formatTime(remaining, format));

              // Auto-pause when countdown ends
              if (remaining <= 0 && config.running) {
                onUpdateItem?.(item.id, {
                  timerConfig: {
                    ...config,
                    running: false,
                    currentTime: 0,
                  },
                });
              }
            } else if (config.pausedAt !== undefined) {
              // Paused: show paused time
              newStates.set(item.id, formatTime(config.pausedAt, format));
            } else {
              // Not started: show total duration
              newStates.set(item.id, formatTime(config.duration || 0, format));
            }
          } else if (config.mode === 'countup') {
            // Count-up mode
            if (config.running && config.startTime !== undefined) {
              const elapsed = now - config.startTime + (config.startValue || 0);
              newStates.set(item.id, formatTime(elapsed, format));
            } else if (config.pausedAt !== undefined) {
              // Paused state
              newStates.set(item.id, formatTime(config.pausedAt, format));
            } else {
              // Not started
              newStates.set(item.id, formatTime(config.startValue || 0, format));
            }
          }
        }
      }

      setTimerStates(newStates);
      timerRafRef.current = requestAnimationFrame(updateTimers);
    };

    // Kick off update loop
    timerRafRef.current = requestAnimationFrame(updateTimers);

    return () => {
      if (timerRafRef.current !== null) {
        cancelAnimationFrame(timerRafRef.current);
        timerRafRef.current = null;
      }
    };
  }, [scene, onUpdateItem]);

  // Auto-resize/scale
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      // Guard against zero-sized container
      if (containerWidth === 0 || containerHeight === 0) {
        return;
      }

      const scaleX = containerWidth / canvasWidth;
      const scaleY = containerHeight / canvasHeight;
      const newScale = Math.min(scaleX, scaleY, 1) * 0.9; // Keep slight margin

      // Ensure scale stays valid
      if (newScale > 0 && Number.isFinite(newScale)) {
        setScale(newScale);
        setStageSize({
          width: canvasWidth * newScale,
          height: canvasHeight * newScale,
        });
      }
    };

    // Multiple strategies to ensure first render is correct
    // 1. requestAnimationFrame to wait for DOM render
    const rafId = requestAnimationFrame(() => {
      updateSize();
    });

    // 2. Short timeout in case of render lag
    const timeoutId = setTimeout(() => {
      updateSize();
    }, 100);

    // Use ResizeObserver to track container size
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updateSize);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [canvasWidth, canvasHeight]);

  const handleDragEnd = (itemId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onUpdateItem?.(itemId, {
      layout: {
        x: node.x(),
        y: node.y(),
        width: node.width() * node.scaleX(),
        height: node.height() * node.scaleY(),
      },
    });
    // 重置缩放
    node.scaleX(1);
    node.scaleY(1);
  };

  const handleDragMove = (_e: Konva.KonvaEventObject<DragEvent>) => {
    // 拖拽时实时更新 Transformer
    if (transformerRef.current) {
      transformerRef.current.getLayer()?.batchDraw();
    }
  };

  const handleTransformEnd = (
    itemId: string,
    currentTransform: Transform | undefined,
    e: Konva.KonvaEventObject<Event>,
  ) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

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
    });

    // 重置缩放
    node.scaleX(1);
    node.scaleY(1);
  };

  const renderItem = (item: SceneItem, isChildItem = false) => {
    // 如果隐藏，不渲染
    if (item.visible === false) {
      return null;
    }

    const isSelected = !isChildItem && selectedItemId === item.id;
    const isLocked = item.locked === true;
    const commonProps = {
      key: item.id,
      x: item.layout.x,
      y: item.layout.y,
      width: item.layout.width,
      height: item.layout.height,
      opacity: item.transform?.opacity ?? 1,
      rotation: item.transform?.rotation ?? 0,
      draggable: isSelected && !isLocked, // 锁定时不可拖拽
      onClick: isChildItem ? undefined : () => onSelectItem?.(item.id),
      onTap: isChildItem ? undefined : () => onSelectItem?.(item.id),
      onDragMove: isChildItem || isLocked ? undefined : handleDragMove,
      onDragEnd:
        isChildItem || isLocked
          ? undefined
          : (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(item.id, e),
      onTransformEnd:
        isChildItem || isLocked
          ? undefined
          : (e: Konva.KonvaEventObject<Event>) => handleTransformEnd(item.id, item.transform, e),
      ref: isChildItem
        ? undefined
        : (node: Konva.Node | null) => {
          if (node) {
            shapeRefs.current.set(item.id, node);
          } else {
            shapeRefs.current.delete(item.id);
          }
        },
      // 高亮选中的控件
      ...(isSelected && {
        shadowColor: isLocked ? '#ff6b6b' : '#00a8ff', // 锁定时用红色
        shadowBlur: 10,
        shadowOpacity: 0.8,
      }),
    };

    // --- Plugin PoC: check for registered plugin ---
    const pluginIdMap: Record<string, string> = {
      image: 'io.livemixer.image',
      media: 'io.livemixer.mediasource',
      video_input: 'io.livemixer.webcam',
      text: 'io.livemixer.text',
    };
    const pluginId = pluginIdMap[item.type] || item.type;
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (plugin) {
      const { key, ...restProps } = commonProps;
      return <PluginRenderer key={key} plugin={plugin} commonProps={restProps} item={item} />;
    }
    // ----------------------------------------

    switch (item.type) {
      case 'color': {
        const { key, ...restProps } = commonProps;
        return <Rect key={key} {...restProps} fill={item.color || '#000000'} />;
      }

      case 'image':
        return <ImageItem item={item} commonProps={commonProps} />;

      case 'text': {
        const { key, ...restProps } = commonProps;
        return (
          <Text
            key={key}
            {...restProps}
            text={item.content || ''}
            fontSize={item.properties?.fontSize || 16}
            fill={item.properties?.color || '#FFFFFF'}
            align="left"
            verticalAlign="top"
          />
        );
      }

      case 'timer':
      case 'clock': {
        const { key, ...restProps } = commonProps;
        const displayText = timerStates.get(item.id) || '00:00';
        const fontSize = item.properties?.fontSize || 48;
        const color = item.properties?.color || '#FFFFFF';

        return (
          <Text
            key={key}
            {...restProps}
            text={displayText}
            fontSize={fontSize}
            fill={color}
            align="center"
            verticalAlign="middle"
            fontFamily="monospace"
            fontStyle="bold"
          />
        );
      }

      case 'window': {
        const { key, ...restProps } = commonProps;
        return (
          <Rect
            key={key}
            {...restProps}
            fill="#333333"
            stroke="#666666"
            strokeWidth={2}
            cornerRadius={item.transform?.borderRadius || 0}
          />
        );
      }

      case 'screen': {
        const { key, ...restProps } = commonProps;
        return <Rect key={key} {...restProps} fill="#1a1a1a" stroke="#444444" strokeWidth={2} />;
      }

      case 'container': {
        const { key, ...restProps } = commonProps;
        return (
          <Group key={key} {...restProps}>
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
            {item.children?.map(child => renderItem(child, true))}
          </Group>
        );
      }

      case 'scene_ref': {
        const { key, ...restProps } = commonProps;
        return (
          <Rect
            key={key}
            {...restProps}
            fill="#2a2a2a"
            stroke="#888888"
            strokeWidth={1}
            cornerRadius={item.transform?.borderRadius || 0}
          />
        );
      }

      case 'livekit_stream': {
        const { key, ...restProps } = commonProps;
        // LiveKit streams use placeholder rect; real video via HTML overlay
        return (
          <Rect
            key={key}
            {...restProps}
            fill="#000000"
            stroke="#444444"
            strokeWidth={1}
            cornerRadius={item.transform?.borderRadius || 0}
          />
        );
      }

      default:
        return null;
    }
  };

  if (!scene) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500">
        No scenes yet
      </div>
    );
  }

  // Sort by zIndex
  const sortedItems = [...scene.items].sort((a, b) => a.zIndex - b.zIndex);

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
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: canvasWidth,
            height: canvasHeight,
            position: 'relative',
          }}
        >
          <Stage
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            pixelRatio={pixelRatio}
            onMouseDown={e => {
              // Click blank area to clear selection
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) {
                onSelectItem?.('');
              }
            }}
          >
            <Layer ref={layerRef}>
              {sortedItems.map(item => renderItem(item, false))}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // Block transforms while locked
                  const selectedItem = scene.items.find(i => i.id === selectedItemId);
                  if (selectedItem?.locked) {
                    return oldBox;
                  }
                  // Enforce minimum size
                  if (newBox.width < 5 || newBox.height < 5) {
                    return oldBox;
                  }
                  return newBox;
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
          {/* HTML overlay for LiveKit video streams */}
          {sortedItems
            .filter(item => item.type === 'livekit_stream' && item.visible !== false)
            .map(item => {
              if (!item.livekitStream) return null;
              const rotation = item.transform?.rotation ?? 0;
              const opacity = item.transform?.opacity ?? 1;
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: item.layout.x,
                    top: item.layout.y,
                    width: item.layout.width,
                    height: item.layout.height,
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                    opacity,
                    pointerEvents: selectedItemId === item.id ? 'none' : 'auto',
                    zIndex: item.zIndex + 1000,
                  }}
                  onClick={() => onSelectItem?.(item.id)}
                >
                  <LiveKitStreamItem
                    participantIdentity={item.livekitStream.participantIdentity}
                    streamSource={item.livekitStream.streamSource}
                    width={item.layout.width}
                    height={item.layout.height}
                  />
                </div>
              );
            })}
        </div>
        {/* Canvas size label */}
        <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
          {canvasWidth} × {canvasHeight}
        </div>
      </div>
    </div>
  );
});
