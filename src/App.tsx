import { useCallback, useEffect, useRef, useState } from 'react';
import lmsLogo from './assets/lms.svg';
import { I18nProvider } from './contexts/I18nContext';
import { useI18n } from './hooks/useI18n';
import type { SourceType } from './components/add-source-dialog';
import { BottomBar } from './components/bottom-bar';
import { ConfigureSourceDialog, type SourceConfig } from './components/configure-source-dialog';
import { ConfigureTimerDialog, type TimerConfig } from './components/configure-timer-dialog';
import { KonvaCanvas, type KonvaCanvasHandle } from './components/konva-canvas';
import { MainLayout } from './components/main-layout';
import { ParticipantsPanel } from './components/participants-panel';
import { PropertyPanel } from './components/property-panel';
import { SettingsDialog } from './components/settings-dialog';
import { StatusBar } from './components/status-bar';
import { Toolbar } from './components/toolbar';
import { canvasCaptureService } from './services/canvas-capture';
import { createI18nEngine } from './services/i18n-engine';
import { liveKitPullService } from './services/livekit-pull';
import { pluginRegistry } from './services/plugin-registry';
import { streamingService } from './services/streaming';
import { coreResources, supportedLanguages } from './locales';
import { useProtocolStore } from './store/protocol';
import { useSettingsStore } from './store/setting';
import type { I18nEngine } from './types/i18n-engine';
import type { LiveMixerExtensions } from './types/extensions';
import type { SceneItem } from './types/protocol';
import './App.css';

function App({ extensions }: { extensions?: LiveMixerExtensions } = {}) {
  // i18n engine state
  const [i18nEngine, setI18nEngine] = useState<I18nEngine | null>(null);
  const [i18nReady, setI18nReady] = useState(false);

  // Initialize i18n engine
  useEffect(() => {
    const initI18n = async () => {
      let engine: I18nEngine;

      // Get saved language from localStorage (sync with settings store)
      const savedSettings = localStorage.getItem('livemixer-settings');
      let initialLanguage = 'en';
      if (savedSettings) {
        try {
          const settings = JSON.parse(savedSettings);
          // Convert zh-CN -> zh, en-US -> en
          initialLanguage = settings.language?.startsWith('zh') ? 'zh' : 'en';
        } catch {
          // Ignore parse error, use default
        }
      }

      if (extensions?.i18nEngine) {
        // Use host-provided i18n engine
        engine = extensions.i18nEngine;
      } else {
        // Create built-in i18n engine
        engine = await createI18nEngine({
          defaultLanguage: initialLanguage,
          supportedLanguages: Array.from(supportedLanguages),
          coreResources,
        });
      }

      // Apply host overrides if provided
      if (extensions?.i18nOverrides) {
        for (const [lang, namespaces] of Object.entries(extensions.i18nOverrides)) {
          for (const [namespace, resource] of Object.entries(namespaces)) {
            engine.addResource(lang, namespace, resource, { layer: 'host' });
          }
        }
      }

      // Apply user overrides if provided
      if (extensions?.i18nUserOverrides) {
        for (const [lang, namespaces] of Object.entries(extensions.i18nUserOverrides)) {
          for (const [namespace, resource] of Object.entries(namespaces)) {
            engine.addResource(lang, namespace, resource, { layer: 'user' });
          }
        }
      }

      // Set i18n engine in plugin registry so plugins can register their i18n resources
      pluginRegistry.setI18nEngine(engine);

      setI18nEngine(engine);
      setI18nReady(true);
    };

    initI18n();
  }, [extensions?.i18nEngine, extensions?.i18nOverrides, extensions?.i18nUserOverrides]);

  // Show loading state while i18n is initializing
  if (!i18nReady || !i18nEngine) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1e1e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <I18nProvider engine={i18nEngine}>
      <AppContent extensions={extensions} />
    </I18nProvider>
  );
}

function AppContent({ extensions }: { extensions?: LiveMixerExtensions }) {
  const { t } = useI18n();
  // 从 protocol store 获取配置
  const { data, updateData } = useProtocolStore();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSourceType, setPendingSourceType] = useState<SourceType | null>(null);
  const [configureSourceOpen, setConfigureSourceOpen] = useState(false);
  const [configureTimerOpen, setConfigureTimerOpen] = useState(false);
  const canvasRef = useRef<KonvaCanvasHandle>(null);

  // 从 store 获取 LiveKit 配置和输出设置
  const {
    livekitUrl,
    livekitToken,
    livekitPullUrl,
    livekitPullToken,
    fps,
    videoBitrate,
    videoEncoder,
  } = useSettingsStore();

  // 初始化激活场景（仅执行一次）
  useEffect(() => {
    const activeScene = data.scenes.find(s => s.active) || data.scenes[0];
    if (activeScene && !activeSceneId) {
      setActiveSceneId(activeScene.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSceneId, data.scenes.find, data.scenes[0]]);

  const activeScene = data.scenes.find(s => s.id === activeSceneId) || null;
  const selectedItem = activeScene?.items.find(item => item.id === selectedItemId) || null;

  // 添加新场景
  const handleAddScene = () => {
    // 生成新场景 ID，格式为 scene-序号
    const nextNumber = data.scenes.length + 1;
    const newSceneId = `scene-${nextNumber}`;
    const newScene = {
      id: newSceneId,
      name: t('scene.defaultName', { number: nextNumber }),
      active: false,
      items: [],
    };

    updateData({
      ...data,
      scenes: [...data.scenes, newScene],
    });

    // 自动选择新场景
    setActiveSceneId(newSceneId);
  };

  // 删除场景
  const handleDeleteScene = (sceneId: string) => {
    if (data.scenes.length <= 1) {
      alert(t('scene.atLeastOne'));
      return;
    }

    const newScenes = data.scenes.filter(s => s.id !== sceneId);
    updateData({
      ...data,
      scenes: newScenes,
    });

    // 如果删除的是当前激活的场景，切换到第一个场景
    if (activeSceneId === sceneId) {
      setActiveSceneId(newScenes[0]?.id || null);
    }
  };

  // 上移场景
  const handleMoveSceneUp = (sceneId: string) => {
    const index = data.scenes.findIndex(s => s.id === sceneId);
    if (index <= 0) return; // 已经是第一个，无法上移

    const newScenes = [...data.scenes];
    [newScenes[index - 1], newScenes[index]] = [newScenes[index], newScenes[index - 1]];

    updateData({
      ...data,
      scenes: newScenes,
    });
  };

  // 下移场景
  const handleMoveSceneDown = (sceneId: string) => {
    const index = data.scenes.findIndex(s => s.id === sceneId);
    if (index < 0 || index >= data.scenes.length - 1) return; // 已经是最后一个，无法下移

    const newScenes = [...data.scenes];
    [newScenes[index], newScenes[index + 1]] = [newScenes[index + 1], newScenes[index]];

    updateData({
      ...data,
      scenes: newScenes,
    });
  };

  // 添加新源到当前场景 - 第一步：选择源类型
  const handleAddItem = (sourceType: SourceType) => {
    // 对于图像和媒体源，需要进一步配置
    if (sourceType === 'image' || sourceType === 'media') {
      setPendingSourceType(sourceType);
      setConfigureSourceOpen(true);
      return;
    }

    // 定时器和时钟需要配置
    if (sourceType === 'timer' || sourceType === 'clock') {
      setPendingSourceType(sourceType);
      setConfigureTimerOpen(true);
      return;
    }

    // 其他类型直接创建
    createItem(sourceType);
  };

  // 添加新源到当前场景 - 第二步：配置源内容后创建
  const handleConfigureSource = (config: SourceConfig) => {
    if (!pendingSourceType) return;
    createItem(pendingSourceType, config);
    setPendingSourceType(null);
  };

  // 配置定时器/时钟后创建
  const handleConfigureTimer = (config: TimerConfig) => {
    if (!pendingSourceType) return;
    createItem(pendingSourceType, undefined, config);
    setPendingSourceType(null);
  };

  // 创建源项的核心逻辑
  const createItem = (sourceType: SourceType, config?: SourceConfig, timerConfig?: TimerConfig) => {
    if (!activeSceneId) return;

    // 生成新的 ID，格式为 type-序号（类似 OBS）
    const existingItems = activeScene?.items || [];
    const sameTypeItems = existingItems.filter(item => item.type === sourceType);
    const nextNumber = sameTypeItems.length + 1;
    const newItemId = `${sourceType}-${nextNumber}`;

    let newItem: SceneItem;

    // --- 插件化 PoC: 尝试通过插件获取默认属性 ---
    const pluginIdMap: Record<string, string> = {
      image: 'io.livemixer.image',
      media: 'io.livemixer.mediasource',
      video_input: 'io.livemixer.webcam',
      text: 'io.livemixer.text',
    };
    const pluginId = pluginIdMap[sourceType] || sourceType;
    const plugin = pluginRegistry.getPlugin(pluginId);

    const pluginDefaultProps: Record<string, unknown> = {};
    if (plugin?.propsSchema) {
      Object.entries(plugin.propsSchema).forEach(([key, schema]) => {
        pluginDefaultProps[key] = (schema as unknown as { defaultValue: unknown }).defaultValue;
      });
    }
    // ----------------------------------------

    // 根据源类型创建不同的项
    switch (sourceType) {
      case 'image':
        newItem = {
          id: newItemId,
          type: 'image',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 300,
          },
          ...pluginDefaultProps,
          url: config?.url || '',
        };
        break;
      case 'media':
        newItem = {
          id: newItemId,
          type: 'media',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 300,
          },
          ...pluginDefaultProps,
          url: config?.url || '',
        };
        break;
      case 'text':
        newItem = {
          id: newItemId,
          type: 'text',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 100,
          },
          content: t('property.defaultTextContent'),
          properties: {
            fontSize: 32,
            color: '#ffffff',
          },
        };
        break;
      case 'screen':
        newItem = {
          id: newItemId,
          type: 'screen',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 300,
          },
          source: 'screen_capture', // 待用户选择显示器
        };
        break;
      case 'window':
        newItem = {
          id: newItemId,
          type: 'window',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 300,
          },
          source: 'window_capture', // 待用户选择窗口
        };
        break;
      case 'video_input':
        newItem = {
          id: newItemId,
          type: 'video_input',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 300,
          },
          source: 'video_device', // 待用户选择设备
          ...pluginDefaultProps,
        };
        break;
      case 'audio_input':
        newItem = {
          id: newItemId,
          type: 'audio_input',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 200,
            height: 100,
          },
          source: 'audio_input_device', // 待用户选择设备
        };
        break;
      case 'audio_output':
        newItem = {
          id: newItemId,
          type: 'audio_output',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 200,
            height: 100,
          },
          source: 'audio_output_device', // 待用户选择设备
        };
        break;
      case 'timer':
        newItem = {
          id: newItemId,
          type: 'timer',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 100,
          },
          properties: {
            fontSize: timerConfig?.fontSize || 48,
            color: timerConfig?.color || '#FFFFFF',
          },
          timerConfig: {
            mode: timerConfig?.mode || 'countdown',
            duration: timerConfig?.duration || 300,
            startValue: timerConfig?.startValue || 0,
            format: timerConfig?.format || 'MM:SS',
            running: false,
            currentTime: 0,
          },
        };
        break;
      case 'clock':
        newItem = {
          id: newItemId,
          type: 'clock',
          zIndex: activeScene?.items.length || 0,
          layout: {
            x: 100,
            y: 100,
            width: 400,
            height: 100,
          },
          properties: {
            fontSize: timerConfig?.fontSize || 48,
            color: timerConfig?.color || '#FFFFFF',
          },
          timerConfig: {
            mode: 'clock',
            format: timerConfig?.format || 'HH:MM:SS',
            running: true, // 时钟默认运行
          },
        };
        break;
      default:
        // 如果是插件类型，创建一个通用的 SceneItem
        if (plugin) {
          newItem = {
            id: newItemId,
            type: sourceType,
            zIndex: activeScene?.items.length || 0,
            layout: {
              x: 100,
              y: 100,
              width: 400,
              height: 300,
            },
            ...pluginDefaultProps,
          };
        } else {
          // 默认为 color 类型（保留向后兼容）
          newItem = {
            id: newItemId,
            type: 'color',
            zIndex: activeScene?.items.length || 0,
            layout: {
              x: 100,
              y: 100,
              width: 400,
              height: 300,
            },
            color: '#3b82f6',
          };
        }
    }

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;
        return {
          ...scene,
          items: [...scene.items, newItem],
        };
      }),
    });

    // 自动选择新添加的源
    setSelectedItemId(newItemId);
  };

  // 删除源
  const handleDeleteItem = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;
        return {
          ...scene,
          items: scene.items.filter(item => item.id !== itemId),
        };
      }),
    });

    // 如果删除的是当前选中的源，清除选中状态
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
    }
  };

  // 上移源
  const handleMoveItemUp = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;

        const index = scene.items.findIndex(item => item.id === itemId);
        if (index <= 0) return scene; // 已经是第一个，无法上移

        const newItems = [...scene.items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

        return {
          ...scene,
          items: newItems,
        };
      }),
    });
  };

  // 下移源
  const handleMoveItemDown = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;

        const index = scene.items.findIndex(item => item.id === itemId);
        if (index < 0 || index >= scene.items.length - 1) return scene; // 已经是最后一个，无法下移

        const newItems = [...scene.items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

        return {
          ...scene,
          items: newItems,
        };
      }),
    });
  };

  // 切换源的可见性
  const handleToggleItemVisibility = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              visible: item.visible === false ? true : false,
            };
          }),
        };
      }),
    });
  };

  // 切换源的锁定状态
  const handleToggleItemLock = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map(item => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              locked: !item.locked,
            };
          }),
        };
      }),
    });
  };

  // 更新场景项
  const handleUpdateItem = (itemId: string, updates: Partial<SceneItem>) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map(scene => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map(item => {
            if (item.id !== itemId) return item;

            return {
              ...item,
              ...updates,
              layout: updates.layout ? { ...item.layout, ...updates.layout } : item.layout,
              transform: updates.transform
                ? { ...item.transform, ...updates.transform }
                : item.transform,
            };
          }),
        };
      }),
    });
  };

  // 处理推流开关
  const handleToggleStreaming = useCallback(async () => {
    if (!isStreaming) {
      // 开始推流
      try {
        if (!livekitUrl || !livekitToken) {
          alert('请先在设置中配置 LiveKit 服务器地址和 Token');
          return;
        }

        // 获取 Canvas 元素
        const canvas = canvasRef.current?.getCanvas();
        if (!canvas) {
          alert('无法获取画布元素');
          return;
        }

        // 启动持续渲染，确保 captureStream 持续捕获帧
        canvasRef.current?.startContinuousRendering();

        // 从 Canvas 捕获媒体流
        const fpsValue = Number.parseInt(fps, 10) || 30;
        const mediaStream = canvasCaptureService.captureStream(canvas, fpsValue);

        // 获取视频码率设置（kbps）
        const bitrateValue = Number.parseInt(videoBitrate, 10) || 5000;

        // 连接到 LiveKit 并推流，使用设置中的编码器和帧率
        await streamingService.connect(
          livekitUrl,
          livekitToken,
          mediaStream,
          bitrateValue,
          videoEncoder as 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1',
          fpsValue,
        );

        setIsStreaming(true);
        console.log('开始推流');
      } catch (error) {
        console.error('推流失败:', error);
        alert(`推流失败: ${error instanceof Error ? error.message : '未知错误'}`);
        // 清理资源
        canvasRef.current?.stopContinuousRendering();
        canvasCaptureService.stopCapture();
      }
    } else {
      // 停止推流
      try {
        await streamingService.disconnect();
        canvasCaptureService.stopCapture();
        canvasRef.current?.stopContinuousRendering();
        setIsStreaming(false);
        console.log('停止推流');
      } catch (error) {
        console.error('停止推流失败:', error);
      }
    }
  }, [isStreaming, livekitUrl, livekitToken, fps, videoBitrate, videoEncoder]);

  // 处理拉流连接/断开
  const handleTogglePulling = useCallback(async () => {
    if (!isPulling) {
      // 开始拉流
      try {
        if (!livekitPullUrl || !livekitPullToken) {
          alert('请先在设置中配置拉流服务器地址和 Token');
          return;
        }

        await liveKitPullService.connect(livekitPullUrl, livekitPullToken, {
          onParticipantsChanged: participants => {
            console.log('参会者列表变化:', participants);
          },
        });

        setIsPulling(true);
        console.log('开始拉流');
      } catch (error) {
        console.error('拉流失败:', error);
        alert(`拉流失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } else {
      // 停止拉流
      try {
        await liveKitPullService.disconnect();
        setIsPulling(false);
        console.log('停止拉流');
      } catch (error) {
        console.error('停止拉流失败:', error);
      }
    }
  }, [isPulling, livekitPullUrl, livekitPullToken]);

  // 从参会者添加到场景
  const handleAddParticipantToScene = useCallback(
    (identity: string, source: 'camera' | 'screen_share') => {
      if (!activeSceneId) return;

      // 生成新的 ID
      const existingItems = activeScene?.items || [];
      const sameTypeItems = existingItems.filter(item => item.type === 'livekit_stream');
      const nextNumber = sameTypeItems.length + 1;
      const newItemId = `livekit_stream-${nextNumber}`;

      // 根据主画面分辨率计算视频流的合适尺寸
      // 默认占主画面的 1/3 宽度，高度按 16:9 比例计算
      const canvasWidth = data.canvas.width;
      const canvasHeight = data.canvas.height;
      const targetWidth = Math.floor(canvasWidth / 3);
      const targetHeight = Math.floor((targetWidth * 9) / 16);

      // 确保不超出画布高度
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      if (targetHeight > canvasHeight * 0.8) {
        finalHeight = Math.floor(canvasHeight * 0.8);
        finalWidth = Math.floor((finalHeight * 16) / 9);
      }

      // 计算居中位置（稍微偏移以避免完全重叠）
      const offsetX = (nextNumber - 1) * 50;
      const offsetY = (nextNumber - 1) * 50;
      const x = Math.floor((canvasWidth - finalWidth) / 2) + offsetX;
      const y = Math.floor((canvasHeight - finalHeight) / 2) + offsetY;

      const newItem: SceneItem = {
        id: newItemId,
        type: 'livekit_stream',
        zIndex: activeScene?.items.length || 0,
        layout: {
          x: Math.max(0, Math.min(x, canvasWidth - finalWidth)),
          y: Math.max(0, Math.min(y, canvasHeight - finalHeight)),
          width: finalWidth,
          height: finalHeight,
        },
        livekitStream: {
          participantIdentity: identity,
          streamSource: source,
        },
      };

      updateData({
        ...data,
        scenes: data.scenes.map(scene => {
          if (scene.id !== activeSceneId) return scene;
          return {
            ...scene,
            items: [...scene.items, newItem],
          };
        }),
      });

      // 自动选择新添加的源
      setSelectedItemId(newItemId);

      console.log('已添加参会者到场景:', {
        identity,
        source,
        size: `${finalWidth}x${finalHeight}`,
      });
    },
    [activeSceneId, activeScene, data, updateData],
  );

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      if (isStreaming) {
        streamingService.disconnect();
        canvasCaptureService.stopCapture();
        canvasRef.current?.stopContinuousRendering();
      }
      if (isPulling) {
        liveKitPullService.disconnect();
      }
    };
  }, [isStreaming, isPulling]);

  return (
    <>
      <MainLayout
        logo={
          extensions?.logo || (
            <img src={lmsLogo} style={{ width: '40px', height: '40px' }} alt="LMS logo" />
          )
        }
        toolbar={<Toolbar data={data} updateData={updateData} />}
        userSection={extensions?.userComponent}
        leftSidebar={
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <ParticipantsPanel
                isConnected={isPulling}
                onAddToScene={handleAddParticipantToScene}
              />
            </div>
            <div className="shrink-0 p-4 border-t border-[#3e3e42]">
              <button
                type="button"
                onClick={handleTogglePulling}
                className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${isPulling
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
              >
                {isPulling ? t('status.disconnectPull') : t('status.connectPull')}
              </button>
            </div>
          </div>
        }
        canvas={
          <KonvaCanvas
            ref={canvasRef}
            scene={activeScene}
            canvasWidth={data.canvas.width}
            canvasHeight={data.canvas.height}
            onSelectItem={setSelectedItemId}
            onUpdateItem={handleUpdateItem}
            selectedItemId={selectedItemId}
          />
        }
        rightSidebar={<PropertyPanel selectedItem={selectedItem} onUpdateItem={handleUpdateItem} />}
        bottomBar={
          <BottomBar
            scenes={data.scenes}
            activeSceneId={activeSceneId}
            onSceneSelect={setActiveSceneId}
            selectedItemId={selectedItemId}
            onSelectItem={setSelectedItemId}
            isStreaming={isStreaming}
            onToggleStreaming={handleToggleStreaming}
            onSettingsClick={() => setSettingsOpen(true)}
            onAddScene={handleAddScene}
            onDeleteScene={handleDeleteScene}
            onMoveSceneUp={handleMoveSceneUp}
            onMoveSceneDown={handleMoveSceneDown}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onMoveItemUp={handleMoveItemUp}
            onMoveItemDown={handleMoveItemDown}
            onToggleItemVisibility={handleToggleItemVisibility}
            onToggleItemLock={handleToggleItemLock}
          />
        }
        statusBar={
          <StatusBar
            isStreaming={isStreaming}
            outputResolution={`${data.canvas.width}x${data.canvas.height}`}
            fps={60}
            cpuUsage={Math.random() * 20}
          />
        }
      />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ConfigureSourceDialog
        open={configureSourceOpen}
        onOpenChange={setConfigureSourceOpen}
        sourceType={pendingSourceType}
        onConfirm={handleConfigureSource}
      />
      <ConfigureTimerDialog
        open={configureTimerOpen}
        onOpenChange={setConfigureTimerOpen}
        sourceType={pendingSourceType}
        onConfirm={handleConfigureTimer}
      />
    </>
  );
}

export default App;
