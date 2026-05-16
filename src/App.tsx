import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import lmsLogo from './assets/lms.svg';
import type { SourceType } from './components/add-source-dialog';
import { BottomBar } from './components/bottom-bar';
import {
  ConfigureSourceDialog,
  type SourceConfig,
} from './components/configure-source-dialog';
import {
  ConfigureTimerDialog,
  type TimerConfig,
} from './components/configure-timer-dialog';
import { KonvaCanvas, type KonvaCanvasHandle } from './components/konva-canvas';
import { MainLayout } from './components/main-layout';
import { ParticipantsPanel } from './components/participants-panel';
import { DialogSlot } from './components/plugin-slot';
import { PropertyPanel } from './components/property-panel';
import { SettingsDialog } from './components/settings-dialog';
import { StatusBar } from './components/status-bar';
import { Toolbar } from './components/toolbar';
import { I18nProvider } from './contexts/I18nContext';
import { usePerformanceMonitor } from './hooks/use-performance-monitor';
import { useI18n } from './hooks/useI18n';
import { coreResources, supportedLanguages } from './locales';
import { canvasCaptureService } from './services/canvas-capture';
import { clipboardService } from './services/clipboard';
import { createI18nEngine } from './services/i18n-engine';
import { liveKitPullService } from './services/livekit-pull';
import { mediaStreamManager } from './services/media-stream-manager';
import { pluginContextManager } from './services/plugin-context';
import { pluginRegistry } from './services/plugin-registry';
import { streamingService } from './services/streaming';
import { useProtocolStore } from './store/protocol';
import { useSettingsStore } from './store/setting';
import type { LiveMixerExtensions } from './types/extensions';
import type { I18nEngine } from './types/i18n-engine';
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
        for (const [lang, namespaces] of Object.entries(
          extensions.i18nOverrides,
        )) {
          for (const [namespace, resource] of Object.entries(namespaces)) {
            engine.addResource(lang, namespace, resource, { layer: 'host' });
          }
        }
      }

      // Apply user overrides if provided
      if (extensions?.i18nUserOverrides) {
        for (const [lang, namespaces] of Object.entries(
          extensions.i18nUserOverrides,
        )) {
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
  }, [
    extensions?.i18nEngine,
    extensions?.i18nOverrides,
    extensions?.i18nUserOverrides,
  ]);

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
  // Performance monitoring (independent of canvas renders)
  const { fps: measuredFps, cpuUsage } = usePerformanceMonitor();
  // Get configuration from protocol store
  const { data, updateData, undo, redo, canUndo, canRedo } = useProtocolStore();
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pendingSourceType, setPendingSourceType] = useState<SourceType | null>(
    null,
  );
  const [configureSourceOpen, setConfigureSourceOpen] = useState(false);
  const [configureTimerOpen, setConfigureTimerOpen] = useState(false);
  const [activePluginDialog, setActivePluginDialog] = useState<string | null>(
    null,
  );
  const canvasRef = useRef<KonvaCanvasHandle>(null);

  // Get LiveKit config and output settings from store
  const {
    livekitUrl,
    livekitToken,
    livekitPullUrl,
    livekitPullToken,
    fps,
    videoBitrate,
    videoEncoder,
    outputResolution,
    showGrid,
    showGuides,
  } = useSettingsStore();

  // Parse output resolution (streaming target resolution, not affected by window scaling)
  const outputRes = useMemo(() => {
    if (outputResolution === 'same') {
      return { width: data.canvas.width, height: data.canvas.height };
    }
    const parts = outputResolution.split('x');
    return {
      width: Number.parseInt(parts[0], 10) || 1920,
      height: Number.parseInt(parts[1], 10) || 1080,
    };
  }, [outputResolution, data.canvas.width, data.canvas.height]);

  // Initialize active scene (run only once)
  useEffect(() => {
    const activeScene = data.scenes.find((s) => s.active) || data.scenes[0];
    if (activeScene && !activeSceneId) {
      setActiveSceneId(activeScene.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSceneId, data.scenes.find, data.scenes[0]]);

  // Configure Plugin Context action handlers
  useEffect(() => {
    pluginContextManager.setActionHandlers({
      scene: {
        selectItem: (itemId) => setSelectedItemId(itemId),
      },
      ui: {
        showDialog: (dialogId) => {
          // Handle specific dialogs
          if (dialogId === 'video-input') {
            setActivePluginDialog('video-input-dialog');
          }
        },
        closeDialog: (dialogId) => {
          if (dialogId === 'video-input') {
            setActivePluginDialog(null);
          }
        },
      },
    });
  }, []);

  const activeScene = data.scenes.find((s) => s.id === activeSceneId) || null;
  const selectedItem =
    activeScene?.items.find((item) => item.id === selectedItemId) || null;

  // Sync state to Plugin Context
  useEffect(() => {
    pluginContextManager.updateState({
      scene: {
        currentId: activeSceneId,
        items: activeScene?.items || [],
        selectedItemId,
        selectedItem,
      },
    });
  }, [activeSceneId, activeScene?.items, selectedItemId, selectedItem]);

  // Add a new scene
  const handleAddScene = () => {
    // Generate new scene ID in the format scene-{number}
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

    // Automatically select the new scene
    setActiveSceneId(newSceneId);
  };

  // Delete a scene
  const handleDeleteScene = (sceneId: string) => {
    if (data.scenes.length <= 1) {
      alert(t('scene.atLeastOne'));
      return;
    }

    const newScenes = data.scenes.filter((s) => s.id !== sceneId);
    updateData({
      ...data,
      scenes: newScenes,
    });

    // If the deleted scene was active, switch to the first one
    if (activeSceneId === sceneId) {
      setActiveSceneId(newScenes[0]?.id || null);
    }
  };

  // Move scene up
  const handleMoveSceneUp = (sceneId: string) => {
    const index = data.scenes.findIndex((s) => s.id === sceneId);
    if (index <= 0) return; // Already at the top, cannot move up

    const newScenes = [...data.scenes];
    [newScenes[index - 1], newScenes[index]] = [
      newScenes[index],
      newScenes[index - 1],
    ];

    updateData({
      ...data,
      scenes: newScenes,
    });
  };

  // Move scene down
  const handleMoveSceneDown = (sceneId: string) => {
    const index = data.scenes.findIndex((s) => s.id === sceneId);
    if (index < 0 || index >= data.scenes.length - 1) return; // Already at the bottom, cannot move down

    const newScenes = [...data.scenes];
    [newScenes[index], newScenes[index + 1]] = [
      newScenes[index + 1],
      newScenes[index],
    ];

    updateData({
      ...data,
      scenes: newScenes,
    });
  };

  // Add a new source to the current scene - step 1: choose source type
  const handleAddItem = async (sourceType: SourceType) => {
    // Get plugin for this source type
    const plugin = pluginRegistry.getPluginBySourceType(sourceType);

    if (plugin) {
      // Check if plugin needs browser permission immediately
      if (plugin.addDialog?.needsBrowserPermission) {
        try {
          let stream: MediaStream | undefined;
          const permissionType = plugin.addDialog.needsBrowserPermission;

          if (permissionType === 'screen') {
            stream = await navigator.mediaDevices.getDisplayMedia({
              video: { displaySurface: 'monitor' } as MediaTrackConstraints,
              audio: true, // Let browser offer "Share audio" option
            });
          }
          // camera and microphone permissions are handled via dialogs

          if (stream) {
            createItem(sourceType, undefined, undefined, stream);
          }
        } catch {
          // User cancelled or error occurred
          console.log(`${sourceType} permission cancelled by user`);
        }
        return;
      }

      // Check if plugin has immediate add dialog
      if (plugin.addDialog?.immediate) {
        // Plugin handles its own add flow via dialog
        // The dialog should be registered to slot system
        // Use configured dialogId or default to plugin.id-dialog
        const dialogId = plugin.addDialog.dialogId || `${plugin.id}-dialog`;
        setActivePluginDialog(dialogId);
        return;
      }

      // For plugins with non-immediate addDialog, add directly
      // Property panel will handle configuration
      createItem(sourceType);
      return;
    }

    // Legacy fallback for non-plugin types (timer, clock, etc.)
    // These will be migrated to plugins in future
    if (sourceType === 'timer' || sourceType === 'clock') {
      setPendingSourceType(sourceType);
      setConfigureTimerOpen(true);
      return;
    }

    // Other types are created directly
    createItem(sourceType);
  };

  // Add a new source to the current scene - step 2: create after configuring source content
  const handleConfigureSource = (config: SourceConfig) => {
    if (!pendingSourceType) return;
    createItem(pendingSourceType, config);
    setPendingSourceType(null);
  };

  // Plugin dialog confirm handler (slot-based)
  const handlePluginDialogConfirm = () => {
    // Consume the pending stream from any plugin
    const pendingStream = mediaStreamManager.consumePendingStream();
    if (pendingStream) {
      // Use the sourceType directly from pending stream metadata
      // This supports any plugin that registers a dialog and provides a stream
      createItem(
        pendingStream.sourceType,
        undefined,
        undefined,
        pendingStream.stream,
        undefined,
        pendingStream.metadata?.deviceId,
        pendingStream.metadata?.deviceLabel,
      );
    }
    setActivePluginDialog(null);
  };

  // Create after configuring timer/clock
  const handleConfigureTimer = (config: TimerConfig) => {
    if (!pendingSourceType) return;
    createItem(pendingSourceType, undefined, config);
    setPendingSourceType(null);
  };

  // Core logic for creating a source item
  const createItem = (
    sourceType: SourceType,
    config?: SourceConfig,
    timerConfig?: TimerConfig,
    stream?: MediaStream,
    webcamStream?: MediaStream,
    webcamDeviceId?: string,
    webcamDeviceLabel?: string,
  ) => {
    if (!activeSceneId) return;

    // Generate new ID in the format type-{number} (similar to OBS)
    const existingItems = activeScene?.items || [];
    const sameTypeItems = existingItems.filter(
      (item) => item.type === sourceType,
    );
    const nextNumber = sameTypeItems.length + 1;
    const newItemId = `${sourceType}-${nextNumber}`;

    let newItem: SceneItem;

    // --- Plugin-based: get plugin by sourceType and extract default props ---
    const plugin = pluginRegistry.getPluginBySourceType(sourceType);

    const pluginDefaultProps: Record<string, unknown> = {};
    if (plugin?.propsSchema) {
      Object.entries(plugin.propsSchema).forEach(([key, schema]) => {
        pluginDefaultProps[key] = (
          schema as unknown as { defaultValue: unknown }
        ).defaultValue;
      });
    }

    // Get default layout from plugin or use fallback
    const defaultLayout = {
      x: plugin?.defaultLayout?.x ?? 100,
      y: plugin?.defaultLayout?.y ?? 100,
      width: plugin?.defaultLayout?.width ?? 400,
      height: plugin?.defaultLayout?.height ?? 300,
    };
    // ----------------------------------------

    // Legacy types not yet migrated to plugins
    // These will be removed once migrated
    const legacyCreators: Record<string, () => SceneItem> = {
      text: () => ({
        id: newItemId,
        type: 'text',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 100 },
        content: t('property.defaultTextContent'),
        properties: { fontSize: 32, color: '#ffffff' },
      }),
      screen: () => ({
        id: newItemId,
        type: 'screen',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 300 },
        source: 'screen_capture',
      }),
      window: () => ({
        id: newItemId,
        type: 'window',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 300 },
        source: 'window_capture',
      }),
      timer: () => ({
        id: newItemId,
        type: 'timer',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 100 },
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
      }),
      clock: () => ({
        id: newItemId,
        type: 'clock',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 100 },
        properties: {
          fontSize: timerConfig?.fontSize || 48,
          color: timerConfig?.color || '#FFFFFF',
        },
        timerConfig: {
          mode: 'clock',
          format: timerConfig?.format || 'HH:MM:SS',
          running: true,
        },
      }),
    };

    // Check if it's a legacy type
    if (legacyCreators[sourceType]) {
      newItem = legacyCreators[sourceType]();
    } else if (plugin) {
      // Create item from plugin configuration
      newItem = {
        id: newItemId,
        type: sourceType,
        zIndex: activeScene?.items.length || 0,
        layout: { ...defaultLayout },
        ...pluginDefaultProps,
        // Apply config for url-based plugins
        ...(config?.url && { url: config.url }),
        // Apply deviceId for stream-based plugins
        ...(webcamDeviceId && { deviceId: webcamDeviceId }),
      };

      // Handle stream initialization for plugins that need it
      const itemStream = stream || webcamStream;
      if (itemStream && plugin.streamInit?.needsStream) {
        const isVideoStream = itemStream.getVideoTracks().length > 0;

        if (isVideoStream) {
          const video = document.createElement('video');
          video.srcObject = itemStream;
          video.playsInline = true;
          video.muted = true;
          video.style.display = 'none';
          document.body.appendChild(video);
          video.play().catch(() => {});

          const title =
            itemStream.getVideoTracks()[0]?.label ||
            (plugin.streamInit.streamType === 'screen'
              ? 'Screen/Window Capture'
              : 'Webcam');

          mediaStreamManager.setStream(newItemId, {
            stream: itemStream,
            video,
            metadata: {
              deviceId: webcamDeviceId,
              deviceLabel: webcamDeviceLabel || title,
              sourceType: plugin.streamInit.streamType || sourceType,
            },
          });

          // Handle stream end
          itemStream.getVideoTracks()[0].onended = () => {
            mediaStreamManager.removeStream(newItemId);
          };
        } else {
          // Audio-only stream
          const audioTrack = itemStream.getAudioTracks()[0];
          const audioLabel =
            webcamDeviceLabel ||
            audioTrack?.label ||
            (sourceType === 'audio_output' ? 'System Audio' : 'Microphone');
          mediaStreamManager.setStream(newItemId, {
            stream: itemStream,
            metadata: {
              deviceId: webcamDeviceId,
              deviceLabel: audioLabel,
              sourceType: plugin.streamInit.streamType || sourceType,
            },
          });
          if (audioTrack) {
            audioTrack.onended = () => {
              mediaStreamManager.removeStream(newItemId);
            };
          }
        }

        // Notify plugin after item is created
        setTimeout(() => mediaStreamManager.notifyStreamChange(newItemId), 0);
      }
    } else {
      // Fallback for unknown types
      newItem = {
        id: newItemId,
        type: 'color',
        zIndex: activeScene?.items.length || 0,
        layout: { x: 100, y: 100, width: 400, height: 300 },
        color: '#3b82f6',
      };
    }

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;
        return {
          ...scene,
          items: [...scene.items, newItem],
        };
      }),
    });

    // Automatically select the newly added source
    setSelectedItemId(newItemId);
  };

  // Delete a source
  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (!activeSceneId) return;

      updateData({
        ...data,
        scenes: data.scenes.map((scene) => {
          if (scene.id !== activeSceneId) return scene;
          return {
            ...scene,
            items: scene.items.filter((item) => item.id !== itemId),
          };
        }),
      });

      // If the deleted item was selected, clear the selection
      if (selectedItemId === itemId) {
        setSelectedItemId(null);
      }
    },
    [activeSceneId, data, updateData, selectedItemId],
  );

  // Copy the selected scene item
  const handleCopyItem = useCallback(() => {
    if (!selectedItem) return;
    clipboardService.copy(selectedItem);
  }, [selectedItem]);

  // Paste clipboard content into the current scene
  const handlePasteItem = useCallback(() => {
    if (!activeSceneId) return;
    const clipboardItem = clipboardService.get();
    if (!clipboardItem) return;

    // Generate new ID based on the original type with auto-incremented number
    const existingItems = activeScene?.items || [];
    const sameTypeItems = existingItems.filter(
      (item) => item.type === clipboardItem.type,
    );
    const nextNumber = sameTypeItems.length + 1;
    const newItemId = `${clipboardItem.type}-${nextNumber}`;

    // Offset position to avoid complete overlap
    const offset = 20;
    const pastedItem: SceneItem = {
      ...clipboardItem,
      id: newItemId,
      zIndex: existingItems.length,
      layout: {
        ...clipboardItem.layout,
        x: clipboardItem.layout.x + offset,
        y: clipboardItem.layout.y + offset,
      },
    };

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;
        return {
          ...scene,
          items: [...scene.items, pastedItem],
        };
      }),
    });

    // Automatically select the pasted item
    setSelectedItemId(newItemId);
  }, [activeSceneId, activeScene, data, updateData]);

  // Delete the selected scene item
  const handleDeleteSelectedItem = useCallback(() => {
    if (!selectedItemId) return;
    handleDeleteItem(selectedItemId);
  }, [selectedItemId, handleDeleteItem]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts inside input fields (avoid interfering with user typing)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        isCtrlOrMeta &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      } else if (isCtrlOrMeta && e.key === 'c') {
        e.preventDefault();
        handleCopyItem();
      } else if (isCtrlOrMeta && e.key === 'v') {
        e.preventDefault();
        handlePasteItem();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelectedItem();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, handleCopyItem, handlePasteItem, handleDeleteSelectedItem]);

  // Move source up
  const handleMoveItemUp = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;

        const index = scene.items.findIndex((item) => item.id === itemId);
        if (index <= 0) return scene; // Already at the top, cannot move up

        // Swap both array position and zIndex field to stay consistent with KonvaCanvas's zIndex-based render order
        const newItems = [...scene.items];
        const upper = newItems[index - 1];
        const current = newItems[index];
        newItems[index - 1] = { ...current, zIndex: upper.zIndex };
        newItems[index] = { ...upper, zIndex: current.zIndex };

        return {
          ...scene,
          items: newItems,
        };
      }),
    });
  };

  // Move source down
  const handleMoveItemDown = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;

        const index = scene.items.findIndex((item) => item.id === itemId);
        if (index < 0 || index >= scene.items.length - 1) return scene; // Already at the bottom, cannot move down

        // Swap both array position and zIndex field to stay consistent with KonvaCanvas's zIndex-based render order
        const newItems = [...scene.items];
        const current = newItems[index];
        const lower = newItems[index + 1];
        newItems[index] = { ...lower, zIndex: current.zIndex };
        newItems[index + 1] = { ...current, zIndex: lower.zIndex };

        return {
          ...scene,
          items: newItems,
        };
      }),
    });
  };

  // Toggle source visibility
  const handleToggleItemVisibility = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map((item) => {
            if (item.id !== itemId) return item;
            return {
              ...item,
              visible: item.visible === false,
            };
          }),
        };
      }),
    });
  };

  // Toggle source lock state
  const handleToggleItemLock = (itemId: string) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map((item) => {
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

  // Update a scene item
  const handleUpdateItem = (itemId: string, updates: Partial<SceneItem>) => {
    if (!activeSceneId) return;

    updateData({
      ...data,
      scenes: data.scenes.map((scene) => {
        if (scene.id !== activeSceneId) return scene;

        return {
          ...scene,
          items: scene.items.map((item) => {
            if (item.id !== itemId) return item;

            return {
              ...item,
              ...updates,
              layout: updates.layout
                ? { ...item.layout, ...updates.layout }
                : item.layout,
              transform: updates.transform
                ? { ...item.transform, ...updates.transform }
                : item.transform,
            };
          }),
        };
      }),
    });
  };

  // Handle streaming toggle
  const handleToggleStreaming = useCallback(async () => {
    if (!isStreaming) {
      // Start streaming
      try {
        if (!livekitUrl || !livekitToken) {
          alert(
            'Please configure the LiveKit server URL and token in Settings first',
          );
          return;
        }

        // Get the output canvas element (fixed resolution, not affected by window scaling)
        const outputCanvas = canvasRef.current?.getOutputCanvas();
        if (!outputCanvas) {
          alert('Failed to get the output canvas element');
          return;
        }

        // Start continuous rendering to keep captureStream producing frames
        canvasRef.current?.startContinuousRendering();

        // Capture media stream from the output canvas (fixed resolution)
        const fpsValue = Number.parseInt(fps, 10) || 30;
        const mediaStream = canvasCaptureService.captureStream(
          outputCanvas,
          fpsValue,
        );

        // Get the video bitrate setting (kbps)
        const bitrateValue = Number.parseInt(videoBitrate, 10) || 5000;

        // Connect to LiveKit and stream using configured encoder, frame rate and output resolution
        await streamingService.connect(
          livekitUrl,
          livekitToken,
          mediaStream,
          bitrateValue,
          videoEncoder as 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1',
          fpsValue,
          outputRes.width,
          outputRes.height,
        );

        setIsStreaming(true);
        console.log('Streaming started');
      } catch (error) {
        console.error('Streaming failed:', error);
        alert(
          `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        // Clean up resources
        canvasRef.current?.stopContinuousRendering();
        canvasCaptureService.stopCapture();
      }
    } else {
      // Stop streaming
      try {
        await streamingService.disconnect();
        canvasCaptureService.stopCapture();
        canvasRef.current?.stopContinuousRendering();
        setIsStreaming(false);
        console.log('Streaming stopped');
      } catch (error) {
        console.error('Failed to stop streaming:', error);
      }
    }
  }, [
    isStreaming,
    livekitUrl,
    livekitToken,
    fps,
    videoBitrate,
    videoEncoder,
    outputRes,
  ]);

  // Handle pull stream connect/disconnect
  const handleTogglePulling = useCallback(async () => {
    if (!isPulling) {
      // Start pulling
      try {
        if (!livekitPullUrl || !livekitPullToken) {
          alert(
            'Please configure the pull-stream server URL and token in Settings first',
          );
          return;
        }

        await liveKitPullService.connect(livekitPullUrl, livekitPullToken, {
          onParticipantsChanged: (participants) => {
            console.log('Participants changed:', participants);
          },
        });

        setIsPulling(true);
        console.log('Pulling started');
      } catch (error) {
        console.error('Pulling failed:', error);
        alert(
          `Pulling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    } else {
      // Stop pulling
      try {
        await liveKitPullService.disconnect();
        setIsPulling(false);
        console.log('Pulling stopped');
      } catch (error) {
        console.error('Failed to stop pulling:', error);
      }
    }
  }, [isPulling, livekitPullUrl, livekitPullToken]);

  // Add a participant stream to the current scene
  const handleAddParticipantToScene = useCallback(
    (identity: string, source: 'camera' | 'screen_share') => {
      if (!activeSceneId) return;

      // Generate new ID
      const existingItems = activeScene?.items || [];
      const sameTypeItems = existingItems.filter(
        (item) => item.type === 'livekit_stream',
      );
      const nextNumber = sameTypeItems.length + 1;
      const newItemId = `livekit_stream-${nextNumber}`;

      // Compute a proper size for the video stream based on the main canvas resolution
      // Default to 1/3 of the canvas width, with height calculated using 16:9 ratio
      const canvasWidth = data.canvas.width;
      const canvasHeight = data.canvas.height;
      const targetWidth = Math.floor(canvasWidth / 3);
      const targetHeight = Math.floor((targetWidth * 9) / 16);

      // Ensure it does not exceed canvas height
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      if (targetHeight > canvasHeight * 0.8) {
        finalHeight = Math.floor(canvasHeight * 0.8);
        finalWidth = Math.floor((finalHeight * 16) / 9);
      }

      // Compute centered position (slight offset to avoid complete overlap)
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
        scenes: data.scenes.map((scene) => {
          if (scene.id !== activeSceneId) return scene;
          return {
            ...scene,
            items: [...scene.items, newItem],
          };
        }),
      });

      // Automatically select the newly added source
      setSelectedItemId(newItemId);

      console.log('Participant added to scene:', {
        identity,
        source,
        size: `${finalWidth}x${finalHeight}`,
      });
    },
    [activeSceneId, activeScene, data, updateData],
  );

  // Use refs to track streaming/pulling state for cleanup on unmount only
  const isStreamingRef = useRef(isStreaming);
  const isPullingRef = useRef(isPulling);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);
  useEffect(() => {
    isPullingRef.current = isPulling;
  }, [isPulling]);

  // Clean up resources on component unmount (run only on unmount)
  useEffect(() => {
    return () => {
      if (isStreamingRef.current) {
        streamingService.disconnect();
        canvasCaptureService.stopCapture();
        canvasRef.current?.stopContinuousRendering();
      }
      if (isPullingRef.current) {
        liveKitPullService.disconnect();
      }
    };
  }, []);

  return (
    <>
      <MainLayout
        logo={
          extensions?.logo || (
            <img
              src={lmsLogo}
              style={{ width: '40px', height: '40px' }}
              alt="LMS logo"
            />
          )
        }
        toolbar={
          <Toolbar
            data={data}
            updateData={updateData}
            editActions={{
              onUndo: undo,
              onRedo: redo,
              onCopy: handleCopyItem,
              onPaste: handlePasteItem,
              onDelete: handleDeleteSelectedItem,
              canUndo,
              canRedo,
              canCopy: !!selectedItem,
              canPaste: clipboardService.hasContent(),
              canDelete: !!selectedItem,
            }}
            toolsActions={{
              audioItems:
                activeScene?.items.filter((item) => {
                  const plugin = pluginRegistry.getPluginBySourceType(
                    item.type,
                  );
                  return plugin?.audioMixer?.enabled === true;
                }) || [],
              onUpdateItem: handleUpdateItem,
            }}
          />
        }
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
                className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors ${
                  isPulling
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isPulling
                  ? t('status.disconnectPull')
                  : t('status.connectPull')}
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
            outputWidth={outputRes.width}
            outputHeight={outputRes.height}
            onSelectItem={setSelectedItemId}
            onUpdateItem={handleUpdateItem}
            selectedItemId={selectedItemId}
            showGrid={showGrid}
            showGuides={showGuides}
          />
        }
        rightSidebar={
          <PropertyPanel
            selectedItem={selectedItem}
            onUpdateItem={handleUpdateItem}
          />
        }
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
            onUpdateItem={handleUpdateItem}
          />
        }
        statusBar={
          <StatusBar
            isStreaming={isStreaming}
            outputResolution={`${outputRes.width}x${outputRes.height}`}
            fps={measuredFps}
            cpuUsage={cpuUsage}
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
      <DialogSlot
        activeDialog={activePluginDialog}
        onClose={() => setActivePluginDialog(null)}
        dialogProps={{
          onConfirm: handlePluginDialogConfirm,
        }}
      />
    </>
  );
}

export default App;
