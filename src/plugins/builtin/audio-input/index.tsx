import { useCallback, useEffect, useRef, useState } from 'react';
import { Rect, Text } from 'react-konva';
import { mediaStreamManager } from '../../../services/media-stream-manager';
import type { IPluginContext, ISourcePlugin } from '../../../types/plugin';
import type {
  IPluginContext as IPluginContextNew,
  SlotComponentProps,
} from '../../../types/plugin-context';
import { AudioInputDialog } from './audio-input-dialog';

// ============================================================================
// Slot-compatible wrapper for AudioInputDialog
// ============================================================================

function AudioInputDialogSlot({ props }: SlotComponentProps) {
  return (
    <AudioInputDialog
      open={props.open}
      onClose={props.onClose}
      onConfirm={props.onConfirm}
    />
  );
}

// ============================================================================
// Legacy exports - proxied to mediaStreamManager for backward compatibility
// ============================================================================

/** @deprecated Use mediaStreamManager.getStream() instead */
export const audioStreamCache = {
  get: (itemId: string) => {
    const entry = mediaStreamManager.getStream(itemId);
    if (!entry) return undefined;
    return {
      stream: entry.stream,
      deviceId: entry.metadata?.deviceId,
      label: entry.metadata?.deviceLabel,
    };
  },
  set: (
    itemId: string,
    data: { stream: MediaStream; deviceId?: string; label?: string },
  ) => {
    mediaStreamManager.setStream(itemId, {
      stream: data.stream,
      metadata: {
        deviceId: data.deviceId,
        deviceLabel: data.label,
        sourceType: 'audio_input',
        pluginId: 'io.livemixer.audioinput',
      },
    });
  },
  delete: (itemId: string) => {
    mediaStreamManager.removeStream(itemId);
  },
  has: (itemId: string) => {
    return mediaStreamManager.hasStream(itemId);
  },
};

/** Store pending audio input stream (from dialog -> App) */
export function setPendingAudioInputStream(
  data: { stream: MediaStream; deviceId: string; label: string } | null,
) {
  if (data) {
    mediaStreamManager.setPendingStream({
      stream: data.stream,
      sourceType: 'audio_input',
      metadata: { deviceId: data.deviceId, deviceLabel: data.label },
    });
  }
}

/** Consume pending audio input stream */
export function consumePendingAudioInputStream() {
  const data = mediaStreamManager.consumePendingStream();
  if (!data) return null;
  return {
    stream: data.stream,
    deviceId: data.metadata?.deviceId || '',
    label: data.metadata?.deviceLabel || '',
  };
}

/** @deprecated Use mediaStreamManager.notifyStreamChange() instead */
export function notifyAudioStreamCacheChange(itemId: string) {
  mediaStreamManager.notifyStreamChange(itemId);
}

/** @deprecated Use mediaStreamManager.onStreamChange() instead */
export function onAudioStreamCacheChange(itemId: string, callback: () => void) {
  return mediaStreamManager.onStreamChange(itemId, callback);
}

/** @deprecated Use mediaStreamManager.getAudioInputDevices() instead */
export async function getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  return mediaStreamManager.getAudioInputDevices();
}

// ============================================================================
// Plugin Definition
// ============================================================================

export const AudioInputPlugin: ISourcePlugin = {
  id: 'io.livemixer.audioinput',
  version: '1.0.0',
  name: 'Audio Input',
  category: 'media',
  engines: {
    host: '^1.0.0',
    api: '1.0',
  },
  // Source type mapping for add-source-dialog
  sourceType: {
    typeId: 'audio_input',
    nameKey: 'addSource.audioInput.name',
    descriptionKey: 'addSource.audioInput.description',
    icon: 'mic',
  },
  // Add dialog configuration - immediate dialog for device selection
  addDialog: {
    immediate: true,
    component: AudioInputDialog,
  },
  // Default layout for audio input items
  defaultLayout: {
    x: 100,
    y: 100,
    width: 300,
    height: 80,
  },
  // Audio mixer configuration - this plugin supports audio mixing
  audioMixer: {
    enabled: true,
    volumeKey: 'volume',
    mutedKey: 'muted',
    defaultVolume: 1,
  },
  // Canvas render configuration - filter when showOnCanvas is false
  canvasRender: {
    shouldFilter: (item) => item.showOnCanvas === false,
    isSelectable: (item) => item.showOnCanvas !== false,
  },
  // Stream initialization configuration
  streamInit: {
    needsStream: true,
    streamType: 'audio_input',
  },
  propsSchema: {
    deviceId: {
      label: 'Device',
      labelKey: 'plugins.io.livemixer.audioinput.label.deviceId',
      type: 'string',
      defaultValue: '',
    },
    muted: {
      label: 'Muted',
      labelKey: 'plugins.io.livemixer.audioinput.label.muted',
      type: 'boolean',
      defaultValue: false,
    },
    volume: {
      label: 'Volume',
      labelKey: 'plugins.io.livemixer.audioinput.label.volume',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    showOnCanvas: {
      label: 'Show on Canvas',
      labelKey: 'plugins.io.livemixer.audioinput.label.showOnCanvas',
      type: 'boolean',
      defaultValue: false,
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.audioinput': {
          label: {
            deviceId: 'Device',
            muted: 'Muted',
            volume: 'Volume',
            showOnCanvas: 'Show on Canvas',
          },
          dialog: {
            title: 'Audio Input Device',
            description:
              'Select a microphone and check the audio level before adding',
            device: 'Device',
            noDevices: 'No audio input devices found',
            preview: 'Audio Level',
            loading: 'Loading...',
            selectToPreview: 'Select a device to monitor',
            listening: 'Listening...',
            cancel: 'Cancel',
            confirm: 'OK',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.audioinput': {
          label: {
            deviceId: '设备',
            muted: '静音',
            volume: '音量',
            showOnCanvas: '在画布中显示',
          },
          dialog: {
            title: '音频输入设备',
            description: '选择麦克风并确认音量后添加',
            device: '设备',
            noDevices: '未找到音频输入设备',
            preview: '音频电平',
            loading: '加载中...',
            selectToPreview: '选择设备以监测',
            listening: '监听中...',
            cancel: '取消',
            confirm: '确定',
          },
        },
      },
    },
  },
  // Plugin trust level
  trustLevel: 'builtin',
  // UI configuration
  ui: {
    addDialog: AudioInputDialog,
  },
  // Called when full plugin context is ready
  onContextReady: (ctx: IPluginContextNew) => {
    ctx.logger.info('AudioInput plugin context ready');

    // Register dialog to slot system
    ctx.registerSlot({
      id: 'audio-input-dialog',
      slot: 'add-source-dialog',
      component: AudioInputDialogSlot,
      priority: 90,
    });
  },
  onInit: (ctx: IPluginContext) => {
    ctx.logger.info('AudioInput plugin initialized');
  },
  onUpdate: (newProps: any) => {
    console.log('AudioInput plugin updated', newProps);
  },
  render: (commonProps: any) => {
    const { ref: nodeRef, item, ...restProps } = commonProps;

    const deviceId: string = item.deviceId ?? '';
    const muted: boolean = item.muted ?? false;
    const volume: number = item.volume ?? 1;
    const showOnCanvas: boolean = item.showOnCanvas ?? false;

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isCapturing, setIsCapturing] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isStarting, setIsStarting] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [audioLevel, setAudioLevel] = useState(0);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const streamIdRef = useRef<string>(item.id);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const analyserRef = useRef<AnalyserNode | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const audioCtxRef = useRef<AudioContext | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const animFrameRef = useRef<number>(0);

    // Start audio level animation
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const startLevelMonitor = useCallback((stream: MediaStream) => {
      try {
        const audioCtx = new AudioContext();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioLevel(Math.min(100, (avg / 128) * 100));
          animFrameRef.current = requestAnimationFrame(tick);
        };
        animFrameRef.current = requestAnimationFrame(tick);
      } catch {
        // AudioContext not available
      }
    }, []);

    // Start audio capture
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const startCapture = useCallback(
      async (targetDeviceId?: string) => {
        try {
          setError(null);
          setIsStarting(true);

          const did = targetDeviceId || deviceId;

          // Check existing stream
          const cached = audioStreamCache.get(streamIdRef.current);
          if (cached?.stream.active && cached.deviceId === did) {
            setIsCapturing(true);
            startLevelMonitor(cached.stream);
            setIsStarting(false);
            return;
          }

          // Stop old stream
          if (cached) {
            cached.stream.getTracks().forEach((track) => track.stop());
            audioStreamCache.delete(streamIdRef.current);
          }

          // Request microphone
          const constraints: MediaStreamConstraints = {
            audio: did ? { deviceId: { exact: did } } : true,
            video: false,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          const audioTrack = stream.getAudioTracks()[0];
          const label = audioTrack?.label || 'Microphone';
          const actualDeviceId = audioTrack?.getSettings()?.deviceId || did;

          // Create audio element for playback (monitoring)
          const audio = document.createElement('audio');
          audio.srcObject = stream;
          audio.muted = muted;
          audio.volume = volume;
          audio.style.display = 'none';
          document.body.appendChild(audio);
          audio.play().catch(() => {});

          audioRef.current = audio;
          audioStreamCache.set(streamIdRef.current, {
            stream,
            deviceId: actualDeviceId,
            label,
          });
          setIsCapturing(true);
          startLevelMonitor(stream);

          // Handle stream end
          audioTrack.onended = () => {
            setIsCapturing(false);
            setAudioLevel(0);
            audioStreamCache.delete(streamIdRef.current);
          };
        } catch (err: any) {
          console.error('Audio input capture error:', err);
          setError(err.message || 'Failed to access microphone');
          setIsCapturing(false);
        } finally {
          setIsStarting(false);
        }
      },
      [deviceId, muted, volume, startLevelMonitor],
    );

    // Check for cached stream on mount and subscribe to changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const checkCache = () => {
        const cached = audioStreamCache.get(streamIdRef.current);
        if (cached?.stream.active) {
          if (!isCapturing) {
            setIsCapturing(true);
            startLevelMonitor(cached.stream);
          }
        } else if (isCapturing) {
          setIsCapturing(false);
          setAudioLevel(0);
        }
      };

      checkCache();
      const unsubscribe = onAudioStreamCacheChange(
        streamIdRef.current,
        checkCache,
      );
      return () => unsubscribe();
    }, [isCapturing, startLevelMonitor]);

    // Start capture only when deviceId changes (not on mount/reload)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const prevDeviceIdRef = useRef<string>(deviceId);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      // Only auto-start when deviceId actually changes (user switched device),
      // not on initial mount (page refresh)
      if (deviceId && deviceId !== prevDeviceIdRef.current) {
        startCapture(deviceId);
      }
      prevDeviceIdRef.current = deviceId;
    }, [deviceId, startCapture]);

    // Update audio mute/volume settings
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = muted;
      audio.volume = volume;
    }, [muted, volume]);

    // Cleanup on unmount
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return () => {
        cancelAnimationFrame(animFrameRef.current);
        audioCtxRef.current?.close();
        const cached = audioStreamCache.get(streamIdRef.current);
        if (cached) {
          cached.stream.getTracks().forEach((track) => track.stop());
          audioStreamCache.delete(streamIdRef.current);
        }
        if (audioRef.current) {
          audioRef.current.remove();
          audioRef.current = null;
        }
      };
    }, []);

    const w: number = restProps.width || 300;
    const h: number = restProps.height || 80;

    // When showOnCanvas is false, render an invisible placeholder
    if (!showOnCanvas) {
      return (
        <Rect
          {...restProps}
          ref={nodeRef}
          width={0}
          height={0}
          opacity={0}
          listening={false}
        />
      );
    }

    // Determine label text based on state
    const statusText = error
      ? '⚠ Mic Error'
      : isStarting
        ? '⏳ Starting...'
        : isCapturing
          ? '🎙 Capturing'
          : '🎙 Audio Input';

    const subText = error
      ? 'Check permissions'
      : isCapturing
        ? audioStreamCache.get(streamIdRef.current)?.label || 'Microphone'
        : 'Select device in properties';

    // Level bar width based on audio level
    const levelBarWidth = isCapturing
      ? Math.max(4, (audioLevel / 100) * (w - 20))
      : 0;

    return (
      <>
        {/* Background */}
        <Rect
          {...restProps}
          ref={nodeRef}
          fill="#0d1117"
          stroke={error ? '#ef4444' : isCapturing ? '#3b82f6' : '#2d3748'}
          strokeWidth={2}
          cornerRadius={8}
          opacity={0.95}
        />

        {/* Title */}
        <Text
          x={restProps.x}
          y={restProps.y + h / 2 - 16}
          width={w}
          text={statusText}
          fontSize={14}
          fill={error ? '#ef4444' : isCapturing ? '#60a5fa' : '#8888aa'}
          align="center"
          listening={false}
        />

        {/* Sub-text / device name */}
        <Text
          x={restProps.x}
          y={restProps.y + h / 2 + 4}
          width={w}
          text={subText}
          fontSize={11}
          fill="#666688"
          align="center"
          listening={false}
        />

        {/* Audio level bar */}
        {isCapturing && (
          <Rect
            x={restProps.x + 10}
            y={restProps.y + h - 14}
            width={levelBarWidth}
            height={4}
            fill={
              audioLevel > 85
                ? '#ef4444'
                : audioLevel > 60
                  ? '#f59e0b'
                  : '#22c55e'
            }
            cornerRadius={2}
            listening={false}
          />
        )}
        {/* Level bar track */}
        {isCapturing && (
          <Rect
            x={restProps.x + 10}
            y={restProps.y + h - 14}
            width={w - 20}
            height={4}
            fill="transparent"
            stroke="#2d3748"
            strokeWidth={1}
            cornerRadius={2}
            listening={false}
          />
        )}
      </>
    );
  },
  onDispose: () => {
    console.log('AudioInput plugin disposed');
  },
};
