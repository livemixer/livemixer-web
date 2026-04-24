import type Konva from 'konva';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from 'react-konva';
import useImage from 'use-image';
import { pluginRegistry } from '../services/plugin-registry';
import type { Scene, SceneItem, Transform } from '../types/protocol';
import { LiveKitStreamItem } from './livekit-stream-item';

// Plugin renderer: isolates hooks context to avoid Rules of Hooks violations
// Note: using shallow comparison to ensure plugin re-renders when item changes
const PluginRenderer = memo(
  ({
    plugin,
    commonProps,
    item,
  }: {
    plugin: any;
    commonProps: any;
    item: SceneItem;
  }) => {
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
const ImageItem = memo(
  ({ item, commonProps }: { item: SceneItem; commonProps: any }) => {
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
  },
);

interface KonvaCanvasProps {
  scene: Scene | null;
  canvasWidth: number;
  canvasHeight: number;
  outputWidth: number;
  outputHeight: number;
  onSelectItem?: (itemId: string) => void;
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
  selectedItemId?: string | null;
  showGrid?: boolean;
  showGuides?: boolean;
}

export interface KonvaCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
  getOutputCanvas: () => HTMLCanvasElement | null;
  getStage: () => Konva.Stage | null;
  startContinuousRendering: () => void;
  stopContinuousRendering: () => void;
}

export const KonvaCanvas = forwardRef<KonvaCanvasHandle, KonvaCanvasProps>(
  function KonvaCanvas(
    {
      scene,
      canvasWidth,
      canvasHeight,
      outputWidth,
      outputHeight,
      onSelectItem,
      onUpdateItem,
      selectedItemId,
      showGrid = false,
      showGuides = true,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const transformerRef = useRef<Konva.Transformer>(null);
    const renderLoopRef = useRef<number | null>(null);
    const bgWorkerRef = useRef<Worker | null>(null);
    const isRenderingRef = useRef(false);
    const [scale, setScale] = useState(1);
    const [stageSize, setStageSize] = useState({
      width: 0,
      height: 0,
    });
    const shapeRefs = useRef<Map<string, Konva.Node>>(new Map());
    // Pixel ratio for HiDPI displays (display only)
    const pixelRatio = window.devicePixelRatio || 1;
    // Ref for editor overlay group (grid, guides, transformer) to hide during output render
    const editorOverlayRef = useRef<Konva.Group>(null);
    // Timer/clock state
    const [timerStates, setTimerStates] = useState<Map<string, string>>(
      new Map(),
    );

    // Offscreen canvas for fixed-resolution output streaming
    const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
    // Ref to always access latest output dimensions inside callbacks
    const outputSizeRef = useRef({ width: outputWidth, height: outputHeight });
    // Ref for canvasWidth/canvasHeight to use in callbacks without stale closures
    const canvasDimsRef = useRef({ width: canvasWidth, height: canvasHeight });
    // Ref to store LiveKit stream video elements for output rendering
    const livekitVideoMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
    // Ref to access current scene in syncToOutputCanvas without stale closure
    const sceneRef = useRef<Scene | null>(scene);
    sceneRef.current = scene;

    // Initialize and resize offscreen canvas when output dimensions change
    useEffect(() => {
      if (!outputCanvasRef.current) {
        outputCanvasRef.current = document.createElement('canvas');
      }
      outputCanvasRef.current.width = outputWidth;
      outputCanvasRef.current.height = outputHeight;
      outputSizeRef.current = { width: outputWidth, height: outputHeight };
    }, [outputWidth, outputHeight]);

    // Keep canvas dims ref in sync
    useEffect(() => {
      canvasDimsRef.current = { width: canvasWidth, height: canvasHeight };
    }, [canvasWidth, canvasHeight]);

    // Render scene at output resolution using Konva's toCanvas API
    // Uses the current Stage display size with high pixelRatio to achieve output resolution
    // WITHOUT modifying Stage properties (avoids interfering with drag/interaction)
    const syncToOutputCanvas = useCallback(() => {
      const outputCanvas = outputCanvasRef.current;
      if (!outputCanvas || !layerRef.current || !stageRef.current) return;

      const { width: outW, height: outH } = outputSizeRef.current;

      const stage = stageRef.current.getStage();
      // Use current display size (already includes scale factor)
      const displayWidth = stage.width();
      const displayHeight = stage.height();

      if (displayWidth <= 0 || displayHeight <= 0) return;

      // Hide editor-only UI elements (transformer, grid, guides) from output
      const editorOverlay = editorOverlayRef.current;
      if (editorOverlay) editorOverlay.visible(false);

      try {
        // High pixelRatio compensates for display scaling:
        // display is e.g. 640x360, pixelRatio=3 produces 1920x1080 pixel canvas
        const renderPixelRatio = Math.max(
          outW / displayWidth,
          outH / displayHeight,
        );

        // Render layer at display coordinates but at high pixel density
        const tempCanvas = layerRef.current.toCanvas({
          x: 0,
          y: 0,
          width: displayWidth,
          height: displayHeight,
          pixelRatio: renderPixelRatio,
        });

        const ctx = outputCanvas.getContext('2d');
        if (!ctx) return;

        // Clear with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, outW, outH);

        // Draw the high-res render to the output canvas
        ctx.drawImage(tempCanvas, 0, 0, outW, outH);

        // Composite LiveKit stream video frames (HTML overlay content)
        // These are not part of the Konva layer, so we draw them manually
        const currentScene = sceneRef.current;
        if (currentScene) {
          const { width: cW, height: cH } = canvasDimsRef.current;
          const scaleX = outW / cW;
          const scaleY = outH / cH;

          for (const item of currentScene.items) {
            if (item.type !== 'livekit_stream' || item.visible === false)
              continue;
            const video = livekitVideoMapRef.current.get(item.id);
            if (!video || video.readyState < 2) continue;

            const x = item.layout.x * scaleX;
            const y = item.layout.y * scaleY;
            const w = item.layout.width * scaleX;
            const h = item.layout.height * scaleY;
            const rotation = item.transform?.rotation ?? 0;
            const opacity = item.transform?.opacity ?? 1;

            ctx.save();
            ctx.globalAlpha = opacity;
            if (rotation !== 0) {
              ctx.translate(x + w / 2, y + h / 2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(video, -w / 2, -h / 2, w, h);
            } else {
              ctx.drawImage(video, x, y, w, h);
            }
            ctx.restore();
          }
        }
      } finally {
        // Restore editor overlay visibility
        if (editorOverlay) editorOverlay.visible(true);
      }
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      getCanvas: () => {
        if (!stageRef.current) return null;
        // Get underlying canvas element from Konva Stage
        const stage = stageRef.current.getStage();
        const canvas = stage.getContent().querySelector('canvas');
        return canvas;
      },
      getOutputCanvas: () => outputCanvasRef.current,
      getStage: () => stageRef.current,
      // Start continuous render loop to keep captureStream alive
      startContinuousRendering: () => {
        if (!layerRef.current || isRenderingRef.current) return;
        isRenderingRef.current = true;

        // Core render tick: draw Konva layer + sync to output canvas
        const doRender = () => {
          if (layerRef.current) {
            layerRef.current.batchDraw();
          }
          syncToOutputCanvas();
        };

        // RAF-based loop for when page is visible
        const startRAFLoop = () => {
          if (renderLoopRef.current !== null) return;
          const loop = () => {
            doRender();
            renderLoopRef.current = requestAnimationFrame(loop);
          };
          renderLoopRef.current = requestAnimationFrame(loop);
        };

        // Web Worker timer for when page is hidden
        // Worker timers are NOT throttled by browser unlike setInterval
        const startBgWorker = () => {
          if (bgWorkerRef.current) return;
          const blob = new Blob(
            [
              'let t;onmessage=e=>{clearInterval(t);if(e.data>0)t=setInterval(()=>postMessage(1),e.data)}',
            ],
            { type: 'application/javascript' },
          );
          const worker = new Worker(URL.createObjectURL(blob));
          worker.onmessage = () => doRender();
          worker.postMessage(33); // ~30fps
          bgWorkerRef.current = worker;
        };

        const stopRAFLoop = () => {
          if (renderLoopRef.current !== null) {
            cancelAnimationFrame(renderLoopRef.current);
            renderLoopRef.current = null;
          }
        };

        const stopBgWorker = () => {
          if (bgWorkerRef.current) {
            bgWorkerRef.current.terminate();
            bgWorkerRef.current = null;
          }
        };

        // Switch between RAF and Worker based on page visibility
        const handleVisibilityChange = () => {
          if (document.hidden) {
            stopRAFLoop();
            startBgWorker();
          } else {
            stopBgWorker();
            startRAFLoop();
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Store cleanup handler for stopContinuousRendering
        (isRenderingRef as any)._cleanup = () => {
          document.removeEventListener(
            'visibilitychange',
            handleVisibilityChange,
          );
          stopRAFLoop();
          stopBgWorker();
        };

        // Start with appropriate mode
        if (document.hidden) {
          startBgWorker();
        } else {
          startRAFLoop();
        }
        console.log('已启动持续渲染');
      },
      // Stop continuous render loop
      stopContinuousRendering: () => {
        if (!isRenderingRef.current) return;
        if ((isRenderingRef as any)._cleanup) {
          (isRenderingRef as any)._cleanup();
          (isRenderingRef as any)._cleanup = null;
        }
        isRenderingRef.current = false;
        console.log('已停止持续渲染');
      },
    }));

    // Update transformer target
    useEffect(() => {
      if (!transformerRef.current || !selectedItemId || !scene) {
        if (transformerRef.current) {
          transformerRef.current.nodes([]);
        }
        return;
      }

      // Check if selected item can be selected on canvas (via plugin config)
      const selectedItem = scene.items.find((i) => i.id === selectedItemId);
      if (selectedItem) {
        const plugin = pluginRegistry.getPluginBySourceType(selectedItem.type);
        if (plugin?.canvasRender?.isSelectable?.(selectedItem) === false) {
          transformerRef.current.nodes([]);
          return;
        }
      }

      const selectedNode = shapeRefs.current.get(selectedItemId);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }, [selectedItemId, scene]);

    // Timer/clock update loop (throttled to ~10fps to avoid excessive re-renders)
    useEffect(() => {
      if (!scene) return;

      // Check if any timer or clock items exist
      const hasTimerOrClock = scene.items.some(
        (item) => item.type === 'timer' || item.type === 'clock',
      );

      if (!hasTimerOrClock) {
        // No timers/clocks: clear any existing timer
        return;
      }

      // Use setInterval at 100ms instead of rAF at 60fps
      // Timer text displays don't need sub-frame precision
      const intervalId = setInterval(() => {
        const newStates = new Map<string, string>();
        const now = performance.now() / 1000;

        for (const item of scene.items) {
          if (item.type === 'clock' && item.timerConfig) {
            const format = item.timerConfig.format || 'HH:MM:SS';
            newStates.set(item.id, formatClock(format));
          } else if (item.type === 'timer' && item.timerConfig) {
            const config = item.timerConfig;
            const format = config.format || 'MM:SS';

            if (config.mode === 'countdown') {
              if (
                config.running &&
                config.startTime !== undefined &&
                config.duration !== undefined
              ) {
                const elapsed = now - config.startTime;
                const remaining = Math.max(0, config.duration - elapsed);
                newStates.set(item.id, formatTime(remaining, format));

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
                newStates.set(item.id, formatTime(config.pausedAt, format));
              } else {
                newStates.set(
                  item.id,
                  formatTime(config.duration || 0, format),
                );
              }
            } else if (config.mode === 'countup') {
              if (config.running && config.startTime !== undefined) {
                const elapsed =
                  now - config.startTime + (config.startValue || 0);
                newStates.set(item.id, formatTime(elapsed, format));
              } else if (config.pausedAt !== undefined) {
                newStates.set(item.id, formatTime(config.pausedAt, format));
              } else {
                newStates.set(
                  item.id,
                  formatTime(config.startValue || 0, format),
                );
              }
            }
          }
        }

        setTimerStates(newStates);
      }, 100);

      return () => {
        clearInterval(intervalId);
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

    const handleDragEnd = useCallback(
      (itemId: string, e: Konva.KonvaEventObject<DragEvent>) => {
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
      },
      [onUpdateItem],
    );

    const handleDragMove = useCallback(
      (_e: Konva.KonvaEventObject<DragEvent>) => {
        // 拖拽时实时更新 Transformer
        if (transformerRef.current) {
          transformerRef.current.getLayer()?.batchDraw();
        }
      },
      [],
    );

    const handleTransformEnd = useCallback(
      (
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
      },
      [onUpdateItem],
    );

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
            : (e: Konva.KonvaEventObject<DragEvent>) =>
                handleDragEnd(item.id, e),
        onTransformEnd:
          isChildItem || isLocked
            ? undefined
            : (e: Konva.KonvaEventObject<Event>) =>
                handleTransformEnd(item.id, item.transform, e),
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

      // --- Plugin rendering: check for registered plugin ---
      const plugin = pluginRegistry.getPluginBySourceType(item.type);
      if (plugin) {
        const { key, ...restProps } = commonProps;
        return (
          <PluginRenderer
            key={key}
            plugin={plugin}
            commonProps={restProps}
            item={item}
          />
        );
      }
      // ----------------------------------------

      switch (item.type) {
        case 'color': {
          const { key, ...restProps } = commonProps;
          return (
            <Rect key={key} {...restProps} fill={item.color || '#000000'} />
          );
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
          return (
            <Rect
              key={key}
              {...restProps}
              fill="#1a1a1a"
              stroke="#444444"
              strokeWidth={2}
            />
          );
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
              {item.children?.map((child) => renderItem(child, true))}
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

    // Render grid lines
    const renderGrid = () => {
      if (!showGrid) return null;
      const gridSize = 50;
      const lines = [];
      // Vertical lines
      for (let x = gridSize; x < canvasWidth; x += gridSize) {
        lines.push(
          <Line
            key={`grid-v-${x}`}
            points={[x, 0, x, canvasHeight]}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={0.5}
            listening={false}
          />,
        );
      }
      // Horizontal lines
      for (let y = gridSize; y < canvasHeight; y += gridSize) {
        lines.push(
          <Line
            key={`grid-h-${y}`}
            points={[0, y, canvasWidth, y]}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth={0.5}
            listening={false}
          />,
        );
      }
      return lines;
    };

    // Render center guides (crosshair at canvas center)
    const renderGuides = () => {
      if (!showGuides) return null;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      return (
        <>
          <Line
            points={[centerX, 0, centerX, canvasHeight]}
            stroke="rgba(0,168,255,0.7)"
            strokeWidth={1}
            dash={[6, 4]}
            listening={false}
          />
          <Line
            points={[0, centerY, canvasWidth, centerY]}
            stroke="rgba(0,168,255,0.7)"
            strokeWidth={1}
            dash={[6, 4]}
            listening={false}
          />
        </>
      );
    };

    // Sort by zIndex, filter out items that plugins mark as shouldFilter
    // Must be before early return to satisfy Rules of Hooks
    const sortedItems = useMemo(
      () =>
        scene
          ? [...scene.items]
              .filter((item) => {
                const plugin = pluginRegistry.getPluginBySourceType(item.type);
                // If plugin has shouldFilter and it returns true, exclude from rendering
                if (plugin?.canvasRender?.shouldFilter?.(item)) {
                  return false;
                }
                return true;
              })
              .sort((a, b) => a.zIndex - b.zIndex)
          : [],
      [scene],
    );

    if (!scene) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500">
          No scenes yet
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-[#1e1e1e]"
      >
        {stageSize.width > 0 && stageSize.height > 0 && (
          <div
            className="relative shadow-lg"
            style={{
              width: stageSize.width,
              height: stageSize.height,
              border: '1px solid #666',
              backgroundColor: '#000',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Stage
              ref={stageRef}
              width={stageSize.width}
              height={stageSize.height}
              scaleX={scale}
              scaleY={scale}
              pixelRatio={pixelRatio}
              onMouseDown={(e) => {
                // Click blank area to clear selection
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  onSelectItem?.('');
                }
              }}
            >
              <Layer ref={layerRef}>
                {sortedItems.map((item) => renderItem(item, false))}
                {/* Editor overlay group: hidden during output rendering */}
                <Group ref={editorOverlayRef}>
                  {renderGrid()}
                  {renderGuides()}
                  <Transformer
                    ref={transformerRef}
                    boundBoxFunc={(oldBox, newBox) => {
                      // Block transforms while locked
                      const selectedItem = scene.items.find(
                        (i) => i.id === selectedItemId,
                      );
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
                </Group>
              </Layer>
            </Stage>
            {/* HTML overlay for LiveKit video streams */}
            {sortedItems
              .filter(
                (item) =>
                  item.type === 'livekit_stream' && item.visible !== false,
              )
              .map((item) => {
                if (!item.livekitStream) return null;
                const rotation = item.transform?.rotation ?? 0;
                const opacity = item.transform?.opacity ?? 1;
                return (
                  <div
                    key={item.id}
                    ref={(el) => {
                      if (el) {
                        const video = el.querySelector('video');
                        if (video)
                          livekitVideoMapRef.current.set(item.id, video);
                      } else {
                        livekitVideoMapRef.current.delete(item.id);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      left: item.layout.x * scale,
                      top: item.layout.y * scale,
                      width: item.layout.width * scale,
                      height: item.layout.height * scale,
                      transform: `rotate(${rotation}deg)`,
                      transformOrigin: 'center',
                      opacity,
                      pointerEvents:
                        selectedItemId === item.id ? 'none' : 'auto',
                      zIndex: item.zIndex + 1000,
                    }}
                    onClick={() => onSelectItem?.(item.id)}
                  >
                    <LiveKitStreamItem
                      participantIdentity={
                        item.livekitStream.participantIdentity
                      }
                      streamSource={item.livekitStream.streamSource}
                      width={item.layout.width * scale}
                      height={item.layout.height * scale}
                    />
                  </div>
                );
              })}
            {/* Canvas size label */}
            <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
              {canvasWidth} × {canvasHeight}
            </div>
          </div>
        )}
      </div>
    );
  },
);
