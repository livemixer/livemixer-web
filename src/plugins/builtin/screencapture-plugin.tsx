import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Rect, Text } from 'react-konva';
import { mediaStreamManager } from '../../services/media-stream-manager';
import type { IPluginContext, ISourcePlugin } from '../../types/plugin';

// ============================================================================
// Legacy exports - proxied to mediaStreamManager for backward compatibility
// These exports are DEPRECATED and will be removed in future versions.
// Use mediaStreamManager directly.
// ============================================================================

/** @deprecated Use mediaStreamManager.getStream() instead */
export const streamCache = {
  get: (itemId: string) => {
    const entry = mediaStreamManager.getStream(itemId);
    if (!entry) return undefined;
    return {
      stream: entry.stream,
      video: entry.video || null,
      title: entry.metadata?.deviceLabel,
    };
  },
  set: (
    itemId: string,
    data: { stream: MediaStream; video?: HTMLVideoElement; title?: string },
  ) => {
    mediaStreamManager.setStream(itemId, {
      stream: data.stream,
      video: data.video,
      metadata: {
        deviceLabel: data.title,
        sourceType: 'screen',
        pluginId: 'io.livemixer.screencapture',
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

/** @deprecated Use mediaStreamManager.onStreamChange() instead */
export function onStreamCacheChange(itemId: string, callback: () => void) {
  return mediaStreamManager.onStreamChange(itemId, callback);
}

/** @deprecated Use mediaStreamManager.notifyStreamChange() instead */
export function notifyStreamCacheChange(itemId: string) {
  mediaStreamManager.notifyStreamChange(itemId);
}

export const ScreenCapturePlugin: ISourcePlugin = {
  id: 'io.livemixer.screencapture',
  version: '1.0.0',
  name: 'Screen Capture',
  category: 'media',
  engines: { host: '^1.0.0', api: '1.0' },
  // Source type mapping for add-source-dialog
  sourceType: {
    typeId: 'screen_capture',
    nameKey: 'addSource.screenCapture.name',
    descriptionKey: 'addSource.screenCapture.description',
    icon: 'monitor',
  },
  // Add dialog configuration - immediate permission request for screen capture
  addDialog: {
    immediate: true,
    needsBrowserPermission: 'screen',
  },
  // Default layout for screen capture items
  defaultLayout: {
    x: 100,
    y: 100,
    width: 800,
    height: 450,
  },
  // Audio mixer configuration - supports audio when screen share includes audio
  audioMixer: {
    enabled: true,
    volumeKey: 'volume',
    mutedKey: 'muted',
    defaultVolume: 1,
  },
  // Stream initialization configuration
  streamInit: {
    needsStream: true,
    streamType: 'screen',
  },
  propsSchema: {
    captureAudio: {
      label: 'Capture Audio',
      labelKey: 'plugins.io.livemixer.screencapture.label.captureAudio',
      type: 'boolean',
      defaultValue: true,
    },
    muted: {
      label: 'Muted',
      labelKey: 'plugins.io.livemixer.screencapture.label.muted',
      type: 'boolean',
      defaultValue: true,
    },
    volume: {
      label: 'Volume',
      labelKey: 'plugins.io.livemixer.screencapture.label.volume',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    opacity: {
      label: 'Opacity',
      labelKey: 'plugins.io.livemixer.screencapture.label.opacity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.05,
    },
    showVideo: {
      label: 'Show Video',
      labelKey: 'plugins.io.livemixer.screencapture.label.showVideo',
      type: 'boolean',
      defaultValue: true,
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.screencapture': {
          label: {
            captureAudio: 'Capture Audio',
            muted: 'Muted',
            volume: 'Volume',
            opacity: 'Opacity',
            showVideo: 'Show Video',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.screencapture': {
          label: {
            captureAudio: '捕获音频',
            muted: '静音',
            volume: '音量',
            opacity: '不透明度',
            showVideo: '显示画面',
          },
        },
      },
    },
  },
  onInit: (ctx: IPluginContext) => {
    ctx.logger.info('ScreenCapture plugin initialized');
  },
  onUpdate: (newProps: any) => {
    console.log('ScreenCapture plugin updated', newProps);
  },
  render: (commonProps: any) => {
    const { ref: nodeRef, item, ...restProps } = commonProps;

    const captureAudio: boolean = item.captureAudio ?? true;
    const muted: boolean = item.muted ?? true;
    const volume: number = item.volume ?? 1;
    const opacity: number = item.opacity ?? 1;
    const showVideo: boolean = item.showVideo ?? true;

    // State for video element and connection status
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
      null,
    );
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isConnected, setIsConnected] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [isCapturing, setIsCapturing] = useState(false);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [error, setError] = useState<string | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const videoRef = useRef<HTMLVideoElement | null>(null);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const streamIdRef = useRef<string>(item.id);

    // Start screen capture - must be triggered by user interaction
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const startCapture = useCallback(async () => {
      try {
        setError(null);
        setIsCapturing(true);

        // Check if we already have a stream for this item
        const cached = streamCache.get(streamIdRef.current);
        if (cached?.stream.active) {
          videoRef.current = cached.video;
          setVideoElement(cached.video);
          setIsConnected(true);
          setIsCapturing(false);
          return;
        }

        // Request screen capture - this will show browser's native picker
        const constraints: MediaStreamConstraints = {
          video: {
            displaySurface: 'monitor',
          } as MediaTrackConstraints,
          audio: captureAudio
            ? {
              echoCancellation: true,
              noiseSuppression: true,
            }
            : false,
        };

        const stream =
          await navigator.mediaDevices.getDisplayMedia(constraints);

        // Get stream title from video track label
        const videoTrack = stream.getVideoTracks()[0];
        const title = videoTrack?.label || 'Screen/Window Capture';

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

        // Cache the stream with title
        streamCache.set(streamIdRef.current, { stream, video, title });

        videoRef.current = video;
        setVideoElement(video);
        setIsConnected(true);

        // Handle stream end (user clicked "Stop sharing")
        stream.getVideoTracks()[0].onended = () => {
          setIsConnected(false);
          setVideoElement(null);
          streamCache.delete(streamIdRef.current);
        };
      } catch (err: any) {
        console.log('Screen capture error:', err);
        setError(err.message || 'Failed to start screen capture');
        setIsConnected(false);
      } finally {
        setIsCapturing(false);
      }
    }, [captureAudio, muted, volume]);

    // Check for cached stream on mount and subscribe to changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const checkCache = () => {
        const cached = streamCache.get(streamIdRef.current);
        if (cached?.stream.active) {
          if (videoRef.current !== cached.video) {
            videoRef.current = cached.video;
            setVideoElement(cached.video);
            setIsConnected(true);
          }
        } else if (isConnected) {
          // Stream was stopped externally
          setIsConnected(false);
          setVideoElement(null);
          videoRef.current = null;
        }
      };

      // Check immediately
      checkCache();

      // Subscribe to cache changes
      const unsubscribe = onStreamCacheChange(streamIdRef.current, checkCache);

      return () => unsubscribe();
    }, [isConnected]);

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
        const cached = streamCache.get(streamIdRef.current);
        if (cached) {
          cached.stream.getTracks().forEach((track) => track.stop());
          streamCache.delete(streamIdRef.current);
        }
      };
    }, []);

    const w: number = restProps.width || 400;
    const h: number = restProps.height || 300;

    // Not connected state - show connect button placeholder
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
            onDblClick={startCapture}
            onDblTap={startCapture}
          />
          <Text
            x={restProps.x}
            y={restProps.y + h / 2 - 30}
            width={w}
            text={
              error
                ? '⚠ Connection Failed'
                : isCapturing
                  ? '⏳ Starting...'
                  : '🖥 Screen Capture'
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
            text={
              error
                ? 'Double-click to retry'
                : isCapturing
                  ? 'Please select screen/window'
                  : 'Double-click to start capturing'
            }
            fontSize={12}
            fill="#666688"
            align="center"
            listening={false}
          />
        </>
      );
    }

    // Handle double click to restart capture
    const handleDblClick = () => {
      // Stop current stream
      const cached = streamCache.get(streamIdRef.current);
      if (cached) {
        cached.stream.getTracks().forEach((track) => track.stop());
        streamCache.delete(streamIdRef.current);
      }
      setIsConnected(false);
      setVideoElement(null);
      videoRef.current = null;
      // Start new capture
      startCapture();
    };

    return (
      <>
        {showVideo ? (
          <>
            <KonvaImage
              {...restProps}
              ref={nodeRef}
              image={videoElement}
              opacity={opacity}
              cornerRadius={item.transform?.borderRadius || 0}
            />
            {/* Re-select button area - positioned at top-right corner */}
            <Rect
              x={restProps.x + w - 80}
              y={restProps.y + 8}
              width={72}
              height={24}
              fill="#22c55e"
              cornerRadius={4}
              opacity={0.85}
              onDblClick={handleDblClick}
              onDblTap={handleDblClick}
            />
            <Text
              x={restProps.x + w - 80}
              y={restProps.y + 8}
              width={72}
              height={24}
              text="↻ 重选"
              fontSize={12}
              fill="#ffffff"
              align="center"
              verticalAlign="middle"
              onDblClick={handleDblClick}
              onDblTap={handleDblClick}
            />
            {/* Source title at bottom */}
            <Text
              x={restProps.x}
              y={restProps.y + h - 20}
              width={w}
              text={(() => {
                const cached = streamCache.get(streamIdRef.current);
                return cached?.title || 'Screen Capture';
              })()}
              fontSize={10}
              fill="#8888aa"
              align="center"
              opacity={0.8}
              listening={false}
            />
          </>
        ) : (
          <>
            <Rect
              {...restProps}
              ref={nodeRef}
              fill="transparent"
              stroke="#4a4a8a"
              strokeWidth={1}
              cornerRadius={8}
              dash={[6, 4]}
              opacity={0.45}
            />
            <Text
              x={restProps.x}
              y={restProps.y}
              width={w}
              height={h}
              text="🖥"
              fontSize={Math.min(w, h) * 0.35}
              fill="#5a5a8a"
              align="center"
              verticalAlign="middle"
              listening={false}
              opacity={0.45}
            />
          </>
        )}
      </>
    );
  },
  onDispose: () => {
    console.log('ScreenCapture plugin disposed');
  },
};
