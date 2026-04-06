import { useCallback, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import { mediaStreamManager } from '../../../services/media-stream-manager';
import type { IPluginContext, ISourcePlugin } from '../../../types/plugin';
import type {
  IPluginContext as IPluginContextNew,
  SlotComponentProps,
} from '../../../types/plugin-context';
import { VideoInputDialog } from './video-input-dialog';

// Slot-compatible wrapper for VideoInputDialog
function VideoInputDialogSlot({ props }: SlotComponentProps) {
  return (
    <VideoInputDialog
      open={props.open}
      onClose={props.onClose}
      onConfirm={props.onConfirm}
    />
  );
}

// ============================================================================
// Legacy exports - proxied to mediaStreamManager for backward compatibility
// These exports are DEPRECATED and will be removed in future versions.
// Use mediaStreamManager directly.
// ============================================================================

/** @deprecated Use mediaStreamManager.getStream() instead */
export const webcamStreamCache = {
  get: (itemId: string) => {
    const entry = mediaStreamManager.getStream(itemId);
    if (!entry) return undefined;
    return {
      stream: entry.stream,
      video: entry.video || null,
      deviceId: entry.metadata?.deviceId,
      label: entry.metadata?.deviceLabel,
    };
  },
  set: (
    itemId: string,
    data: {
      stream: MediaStream;
      video?: HTMLVideoElement;
      deviceId?: string;
      label?: string;
    },
  ) => {
    mediaStreamManager.setStream(itemId, {
      stream: data.stream,
      video: data.video,
      metadata: {
        deviceId: data.deviceId,
        deviceLabel: data.label,
        sourceType: 'webcam',
        pluginId: 'io.livemixer.webcam',
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

/** @deprecated Use mediaStreamManager.setPendingStream() instead */
export function setPendingWebcamStream(
  data: { stream: MediaStream; deviceId: string; label: string } | null,
) {
  if (data) {
    mediaStreamManager.setPendingStream({
      stream: data.stream,
      sourceType: 'webcam',
      metadata: { deviceId: data.deviceId, deviceLabel: data.label },
    });
  }
}

/** @deprecated Use mediaStreamManager.consumePendingStream() instead */
export function consumePendingWebcamStream() {
  const data = mediaStreamManager.consumePendingStream();
  if (!data) return null;
  return {
    stream: data.stream,
    deviceId: data.metadata?.deviceId || '',
    label: data.metadata?.deviceLabel || '',
  };
}

/** @deprecated Use mediaStreamManager.onStreamChange() instead */
export function onWebcamStreamCacheChange(
  itemId: string,
  callback: () => void,
) {
  return mediaStreamManager.onStreamChange(itemId, callback);
}

/** @deprecated Use mediaStreamManager.notifyStreamChange() instead */
export function notifyWebcamStreamCacheChange(itemId: string) {
  mediaStreamManager.notifyStreamChange(itemId);
}

/** @deprecated Use mediaStreamManager.getVideoInputDevices() instead */
export async function getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
  return mediaStreamManager.getVideoInputDevices();
}

export const WebCamPlugin: ISourcePlugin = {
  id: 'io.livemixer.webcam',
  version: '1.0.0',
  name: 'Video Input',
  category: 'media',
  engines: {
    host: '^1.0.0',
    api: '1.0',
  },
  // Source type mapping for add-source-dialog
  sourceType: {
    typeId: 'video_input',
    nameKey: 'addSource.videoInput.name',
    descriptionKey: 'addSource.videoInput.description',
    icon: 'video',
  },
  // Add dialog configuration - immediate dialog for device selection
  addDialog: {
    immediate: true,
    component: VideoInputDialog,
  },
  // Default layout for video input items
  defaultLayout: {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  },
  // Stream initialization configuration
  streamInit: {
    needsStream: true,
    streamType: 'webcam',
  },
  propsSchema: {
    deviceId: {
      label: 'Device',
      labelKey: 'plugins.io.livemixer.webcam.label.deviceId',
      type: 'string',
      defaultValue: '',
    },
    muted: {
      label: 'Muted',
      labelKey: 'plugins.io.livemixer.webcam.label.muted',
      type: 'boolean',
      defaultValue: true,
    },
    volume: {
      label: 'Volume',
      labelKey: 'plugins.io.livemixer.webcam.label.volume',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    opacity: {
      label: 'Opacity',
      labelKey: 'plugins.io.livemixer.webcam.label.opacity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    mirror: {
      label: 'Mirror',
      labelKey: 'plugins.io.livemixer.webcam.label.mirror',
      type: 'boolean',
      defaultValue: true,
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.webcam': {
          label: {
            deviceId: 'Device',
            muted: 'Muted',
            volume: 'Volume',
            opacity: 'Opacity',
            mirror: 'Mirror',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.webcam': {
          label: {
            deviceId: '设备',
            muted: '静音',
            volume: '音量',
            opacity: '不透明度',
            mirror: '镜像',
          },
        },
      },
    },
  },
  // Plugin trust level
  trustLevel: 'builtin',
  // UI configuration - register addDialog
  ui: {
    addDialog: VideoInputDialog,
  },
  // Called when full plugin context is ready
  onContextReady: (ctx: IPluginContextNew) => {
    ctx.logger.info('WebCam plugin context ready');

    // Register dialog to slot system
    ctx.registerSlot({
      id: 'video-input-dialog',
      slot: 'add-source-dialog',
      component: VideoInputDialogSlot,
      priority: 100,
    });
  },
  onInit: (ctx: IPluginContext) => {
    ctx.logger.info('WebCam plugin initialized');
  },
  onUpdate: (newProps: any) => {
    console.log('WebCam plugin updated', newProps);
  },
  render: (commonProps: any) => {
    const { ref: nodeRef, item, ...restProps } = commonProps;

    const deviceId: string = item.deviceId ?? '';
    const muted: boolean = item.muted ?? true;
    const volume: number = item.volume ?? 1;
    const opacity: number = item.opacity ?? 1;
    const mirror: boolean = item.mirror ?? true;

    // State for video element and connection status
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
      null,
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isConnected, setIsConnected] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isStarting, setIsStarting] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const streamIdRef = useRef<string>(item.id);

    // Start webcam capture
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const startCapture = useCallback(
      async (targetDeviceId?: string) => {
        try {
          setError(null);
          setIsStarting(true);

          const did = targetDeviceId || deviceId;

          // Check if we already have a stream for this item with same device
          const cached = webcamStreamCache.get(streamIdRef.current);
          if (cached?.stream.active && cached.deviceId === did) {
            videoRef.current = cached.video;
            setVideoElement(cached.video);
            setIsConnected(true);
            setIsStarting(false);
            return;
          }

          // Stop old stream if exists
          if (cached) {
            cached.stream.getTracks().forEach((track) => track.stop());
            webcamStreamCache.delete(streamIdRef.current);
          }

          // Request webcam
          const constraints: MediaStreamConstraints = {
            video: did ? { deviceId: { exact: did } } : { facingMode: 'user' },
            audio: true,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          // Get device label
          const videoTrack = stream.getVideoTracks()[0];
          const label = videoTrack?.label || 'Webcam';
          const actualDeviceId = videoTrack?.getSettings()?.deviceId || did;

          // Create video element
          const video = document.createElement('video');
          video.srcObject = stream;
          video.playsInline = true;
          video.muted = muted;
          video.volume = volume;
          video.style.display = 'none';
          document.body.appendChild(video);

          // Wait for video to be ready
          await video.play();

          // Cache the stream
          webcamStreamCache.set(streamIdRef.current, {
            stream,
            video,
            deviceId: actualDeviceId,
            label,
          });

          videoRef.current = video;
          setVideoElement(video);
          setIsConnected(true);

          // Handle stream end
          videoTrack.onended = () => {
            setIsConnected(false);
            setVideoElement(null);
            webcamStreamCache.delete(streamIdRef.current);
          };
        } catch (err: any) {
          console.error('Webcam capture error:', err);
          setError(err.message || 'Failed to access webcam');
          setIsConnected(false);
        } finally {
          setIsStarting(false);
        }
      },
      [deviceId, muted, volume],
    );

    // Check for cached stream on mount and subscribe to changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const checkCache = () => {
        const cached = webcamStreamCache.get(streamIdRef.current);
        if (cached?.stream.active) {
          if (videoRef.current !== cached.video) {
            videoRef.current = cached.video;
            setVideoElement(cached.video);
            setIsConnected(true);
          }
        } else if (isConnected) {
          setIsConnected(false);
          setVideoElement(null);
          videoRef.current = null;
        }
      };

      checkCache();
      const unsubscribe = onWebcamStreamCacheChange(
        streamIdRef.current,
        checkCache,
      );
      return () => unsubscribe();
    }, [isConnected]);

    // Start capture when deviceId is set
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      if (deviceId) {
        startCapture(deviceId);
      }
      return () => {};
    }, [deviceId, startCapture]);

    // Update audio settings
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = muted;
      video.volume = volume;
    }, [muted, volume]);

    // Cleanup on unmount
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      return () => {
        const cached = webcamStreamCache.get(streamIdRef.current);
        if (cached) {
          cached.stream.getTracks().forEach((track) => track.stop());
          webcamStreamCache.delete(streamIdRef.current);
        }
      };
    }, []);

    const w: number = restProps.width || 400;
    const h: number = restProps.height || 300;

    // Not connected state
    if (!isConnected || !videoElement) {
      return (
        <>
          <Rect
            {...restProps}
            ref={nodeRef}
            fill="#1a1a2e"
            stroke={error ? '#ef4444' : '#4a4a8a'}
            strokeWidth={2}
            cornerRadius={8}
            opacity={0.9}
          />
          <Text
            x={restProps.x}
            y={restProps.y + h / 2 - 30}
            width={w}
            text={
              error
                ? '⚠ Camera Error'
                : isStarting
                  ? '⏳ Starting...'
                  : '📹 Video Input'
            }
            fontSize={16}
            fill={error ? '#ef4444' : '#8888aa'}
            align="center"
            listening={false}
          />
          <Text
            x={restProps.x}
            y={restProps.y + h / 2}
            width={w}
            text={error ? 'Check permissions' : 'Select device in properties'}
            fontSize={12}
            fill="#666688"
            align="center"
            listening={false}
          />
        </>
      );
    }

    // Get device label
    const cached = webcamStreamCache.get(streamIdRef.current);
    const deviceLabel = cached?.label || 'Webcam';

    return (
      <>
        <Group {...restProps} ref={nodeRef}>
          <KonvaImage
            x={mirror ? w : 0}
            y={0}
            width={w}
            height={h}
            image={videoElement}
            opacity={opacity}
            scaleX={mirror ? -1 : 1}
            cornerRadius={item.transform?.borderRadius || 0}
          />
        </Group>
        {/* Device label at bottom */}
        <Text
          x={restProps.x}
          y={restProps.y + h - 20}
          width={w}
          text={deviceLabel}
          fontSize={10}
          fill="#8888aa"
          align="center"
          opacity={0.8}
          listening={false}
        />
      </>
    );
  },
  onDispose: () => {
    console.log('WebCam plugin disposed');
  },
};
