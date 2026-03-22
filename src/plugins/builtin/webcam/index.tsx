import { useCallback, useEffect, useRef, useState } from 'react';
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../../types/plugin';
import { VideoInputDialog } from './video-input-dialog';

// Global stream cache to persist across re-renders
export const webcamStreamCache = new Map<string, { stream: MediaStream; video: HTMLVideoElement; deviceId?: string; label?: string }>();

// Temporary stream holder for dialog -> app communication
// When VideoInputDialog confirms, it stores stream here before calling onConfirm
// App.tsx retrieves it when creating the item
export let pendingWebcamStream: {
    stream: MediaStream;
    deviceId: string;
    label: string;
} | null = null;

export function setPendingWebcamStream(data: typeof pendingWebcamStream) {
    pendingWebcamStream = data;
}

export function consumePendingWebcamStream() {
    const data = pendingWebcamStream;
    pendingWebcamStream = null;
    return data;
}

// Callbacks for cache change notifications
const cacheCallbacks = new Map<string, Set<() => void>>();

export function onWebcamStreamCacheChange(itemId: string, callback: () => void) {
    if (!cacheCallbacks.has(itemId)) {
        cacheCallbacks.set(itemId, new Set());
    }
    cacheCallbacks.get(itemId)!.add(callback);
    return () => {
        cacheCallbacks.get(itemId)?.delete(callback);
    };
}

export function notifyWebcamStreamCacheChange(itemId: string) {
    cacheCallbacks.get(itemId)?.forEach(cb => cb());
}

// Get available video input devices
export async function getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
    try {
        // First try to enumerate without requesting permission
        // If permission was already granted, we'll get labels
        let devices = await navigator.mediaDevices.enumerateDevices();
        let videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Check if we have labels (indicates permission was granted)
        const hasLabels = videoDevices.some(d => d.label && d.label.length > 0);

        if (!hasLabels && videoDevices.length > 0) {
            // Permission not granted yet, request it
            try {
                const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                tempStream.getTracks().forEach(track => track.stop());

                // Re-enumerate to get labels
                devices = await navigator.mediaDevices.enumerateDevices();
                videoDevices = devices.filter(device => device.kind === 'videoinput');
            } catch (permErr) {
                console.warn('Could not get camera permission:', permErr);
                // Return devices without labels
            }
        }

        console.log('getVideoInputDevices found:', videoDevices);
        return videoDevices;
    } catch (err) {
        console.error('Error getting video devices:', err);
        return [];
    }
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
        const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
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
        const startCapture = useCallback(async (targetDeviceId?: string) => {
            try {
                setError(null);
                setIsStarting(true);

                const did = targetDeviceId || deviceId;

                // Check if we already have a stream for this item with same device
                const cached = webcamStreamCache.get(streamIdRef.current);
                if (cached && cached.stream.active && cached.deviceId === did) {
                    videoRef.current = cached.video;
                    setVideoElement(cached.video);
                    setIsConnected(true);
                    setIsStarting(false);
                    return;
                }

                // Stop old stream if exists
                if (cached) {
                    cached.stream.getTracks().forEach(track => track.stop());
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
                webcamStreamCache.set(streamIdRef.current, { stream, video, deviceId: actualDeviceId, label });

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
        }, [deviceId, muted, volume]);

        // Check for cached stream on mount and subscribe to changes
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            const checkCache = () => {
                const cached = webcamStreamCache.get(streamIdRef.current);
                if (cached && cached.stream.active) {
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
            const unsubscribe = onWebcamStreamCacheChange(streamIdRef.current, checkCache);
            return () => unsubscribe();
        }, [isConnected]);

        // Start capture when deviceId is set
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            if (deviceId) {
                startCapture(deviceId);
            }
            return () => { };
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
                    cached.stream.getTracks().forEach(track => track.stop());
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
                        stroke={error ? "#ef4444" : "#4a4a8a"}
                        strokeWidth={2}
                        cornerRadius={8}
                        opacity={0.9}
                    />
                    <Text
                        x={restProps.x}
                        y={restProps.y + h / 2 - 30}
                        width={w}
                        text={error ? "⚠ Camera Error" : (isStarting ? "⏳ Starting..." : "📹 Video Input")}
                        fontSize={16}
                        fill={error ? "#ef4444" : "#8888aa"}
                        align="center"
                        listening={false}
                    />
                    <Text
                        x={restProps.x}
                        y={restProps.y + h / 2}
                        width={w}
                        text={error ? "Check permissions" : "Select device in properties"}
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
                <Group
                    {...restProps}
                    ref={nodeRef}
                >
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
