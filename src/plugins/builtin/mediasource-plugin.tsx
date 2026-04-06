import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage, Rect, Text } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

// Global video element cache to persist across re-renders
const videoCache = new Map<string, HTMLVideoElement>();

// ─── Media Source Plugin ──────────────────────────────────────────────────────
// Handles video/audio files. When showVideo is true (default) the video frame is
// rendered on the canvas. When showVideo is false only the audio track plays and
// the canvas shows a lightweight ghost indicator so the item can still be
// selected and repositioned in the editor.
export const MediaSourcePlugin: ISourcePlugin = {
    id: 'io.livemixer.mediasource',
    version: '1.0.0',
    name: 'Media Source',
    category: 'media',
    engines: { host: '^1.0.0', api: '1.0' },
    // Source type mapping for add-source-dialog
    sourceType: {
        typeId: 'media',
        nameKey: 'addSource.media.name',
        descriptionKey: 'addSource.media.description',
        icon: 'video',
    },
    // Add dialog configuration - no immediate dialog, configure in property panel
    addDialog: {
        immediate: false,
    },
    // Default layout for media items
    defaultLayout: {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
    },
    propsSchema: {
        url: {
            label: 'Media URL',
            labelKey: 'plugins.io.livemixer.mediasource.label.url',
            type: 'video',
            defaultValue: '',
        },
        showVideo: {
            label: 'Show Video',
            labelKey: 'plugins.io.livemixer.mediasource.label.showVideo',
            type: 'boolean',
            defaultValue: true,
        },
        loop: {
            label: 'Loop',
            labelKey: 'plugins.io.livemixer.mediasource.label.loop',
            type: 'boolean',
            defaultValue: true,
        },
        muted: {
            label: 'Muted',
            labelKey: 'plugins.io.livemixer.mediasource.label.muted',
            type: 'boolean',
            defaultValue: false,
        },
        volume: {
            label: 'Volume',
            labelKey: 'plugins.io.livemixer.mediasource.label.volume',
            type: 'number',
            defaultValue: 1,
            min: 0,
            max: 1,
            step: 0.05,
        },
        opacity: {
            label: 'Opacity',
            labelKey: 'plugins.io.livemixer.mediasource.label.opacity',
            type: 'number',
            defaultValue: 1,
            min: 0,
            max: 1,
            step: 0.05,
        },
    },
    i18n: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'zh'],
        resources: {
            en: {
                'plugins.io.livemixer.mediasource': {
                    label: {
                        url: 'Media URL',
                        showVideo: 'Show Video',
                        loop: 'Loop',
                        muted: 'Muted',
                        volume: 'Volume',
                        opacity: 'Opacity',
                    },
                },
            },
            zh: {
                'plugins.io.livemixer.mediasource': {
                    label: {
                        url: '媒体 URL',
                        showVideo: '显示视频画面',
                        loop: '循环播放',
                        muted: '静音',
                        volume: '音量',
                        opacity: '不透明度',
                    },
                },
            },
        },
    },
    onInit: (ctx: IPluginContext) => {
        ctx.logger.info('MediaSource plugin initialized');
    },
    onUpdate: (newProps: any) => {
        console.log('MediaSource plugin updated', newProps);
    },
    render: (commonProps: any) => {
        const { ref: nodeRef, item, ...restProps } = commonProps;

        const url: string = item.url || item.sourceUrl || '';
        const showVideo: boolean = item.showVideo ?? true;
        const loop: boolean = item.loop ?? true;
        const muted: boolean = item.muted ?? false;
        const volume: number = item.volume ?? 1;
        const opacity: number = item.opacity ?? 1;

        // Use state to hold the video element
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const videoRef = useRef<HTMLVideoElement | null>(null);

        // Initialize or get cached video element
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            if (!url || url.trim() === '') {
                setVideoElement(null);
                videoRef.current = null;
                return;
            }

            // Check cache first
            let video = videoCache.get(url);

            if (!video) {
                // Create new video element
                video = document.createElement('video');
                video.crossOrigin = 'anonymous';
                video.playsInline = true;
                video.style.display = 'none';
                document.body.appendChild(video);
                videoCache.set(url, video);
            }

            // Store ref
            videoRef.current = video;

            // Handle video ready state
            const handleCanPlay = () => {
                console.log('MediaSource: canplay event');
                setVideoElement(video);
            };

            const handleError = () => {
                console.error('MediaSource: video error', video?.error);
                setVideoElement(null);
            };

            video.addEventListener('canplay', handleCanPlay);
            video.addEventListener('error', handleError);

            // Only set src and load if URL changed (not for mute/volume changes)
            if (video.src !== url) {
                video.src = url;
                video.loop = loop;
                video.muted = muted;
                video.volume = volume;
                // Load and play
                video.load();
                video.play().catch(err => {
                    console.warn('MediaSource: autoplay failed', err);
                    // Don't set videoElement to null on autoplay failure
                    // The video might still be playable after user interaction
                });
            }

            // If already ready, set immediately
            if (video.readyState >= 3) {
                setVideoElement(video);
            }

            return () => {
                video?.removeEventListener('canplay', handleCanPlay);
                video?.removeEventListener('error', handleError);
            };
        }, [url]);

        // Update playback settings without reloading video
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            const video = videoRef.current;
            if (!video) return;

            // Update settings without interrupting playback
            video.loop = loop;
            video.muted = muted;
            video.volume = volume;
        }, [loop, muted, volume]);

        // Cleanup on unmount
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            return () => {
                // Clean up blob URLs from cache
                for (const [key, video] of videoCache.entries()) {
                    if (key.startsWith('blob:')) {
                        video.pause();
                        video.src = '';
                        videoCache.delete(key);
                    }
                }
            };
        }, []);

        const w: number = restProps.width || 120;
        const h: number = restProps.height || 80;

        return (
            <>
                {showVideo ? (
                    videoElement ? (
                        /* ── Video mode: render video frame onto canvas ── */
                        <KonvaImage
                            {...restProps}
                            ref={nodeRef}
                            image={videoElement}
                            opacity={opacity}
                            cornerRadius={item.transform?.borderRadius || item.borderRadius || 0}
                        />
                    ) : (
                        /* ── Loading/Empty state: show placeholder ── */
                        <>
                            <Rect
                                {...restProps}
                                ref={nodeRef}
                                fill="#1a1a2e"
                                stroke={url ? "#4a4a8a" : "#ef4444"}
                                strokeWidth={1}
                                cornerRadius={8}
                                opacity={0.8}
                            />
                            <Text
                                x={restProps.x}
                                y={restProps.y}
                                width={w}
                                height={h}
                                text={url ? "Loading..." : "No media URL\nConfigure in properties"}
                                fontSize={Math.min(w, h) * 0.12}
                                fill={url ? "#8888aa" : "#ef4444"}
                                align="center"
                                verticalAlign="middle"
                                listening={false}
                            />
                        </>
                    )
                ) : (
                    /* ── Audio-only mode: ghost indicator, not visible in final output ── */
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
                            text="♪"
                            fontSize={Math.min(w, h) * 0.45}
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
        console.log('MediaSource plugin disposed');
    },
};
