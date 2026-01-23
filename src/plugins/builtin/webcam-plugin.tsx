import React, { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

export const WebCamPlugin: ISourcePlugin = {
    id: 'io.livemixer.webcam',
    version: '1.0.0',
    name: '摄像头',
    category: 'media',
    engines: {
        host: '^1.0.0',
        api: '1.0',
    },
    propsSchema: {
        deviceId: {
            label: '设备 ID',
            type: 'string',
            defaultValue: '',
        },
        opacity: {
            label: '不透明度',
            type: 'number',
            defaultValue: 1,
            min: 0,
            max: 1,
            step: 0.1,
        },
    },
    onInit: (ctx: IPluginContext) => {
        ctx.logger.info('WebCam plugin initialized');
    },
    onUpdate: (newProps: any) => {
        console.log('WebCam plugin updated', newProps);
    },
    render: (commonProps: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const videoRef = useRef<HTMLVideoElement>(null);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [stream, setStream] = useState<MediaStream | null>(null);
        const { ref: nodeRef, item, ...restProps } = commonProps;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            const startVideo = async () => {
                try {
                    const constraints = {
                        video: item.deviceId ? { deviceId: { exact: item.deviceId } } : true,
                    };
                    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
                    setStream(newStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = newStream;
                        videoRef.current.play();
                    }
                } catch (err) {
                    console.error('Error accessing webcam:', err);
                }
            };

            startVideo();

            return () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
            };
        }, [item.deviceId]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [imageNode, setImageNode] = useState<HTMLVideoElement | null>(null);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
            if (videoRef.current) {
                setImageNode(videoRef.current);
            }
        }, [videoRef.current]);

        return (
            <>
                {/* Hidden video element to feed Konva */}
                <video
                    ref={videoRef}
                    style={{ display: 'none' }}
                    playsInline
                    muted
                />
                <KonvaImage
                    {...restProps}
                    ref={nodeRef}
                    image={imageNode as any}
                    opacity={item.opacity ?? 1}
                />
            </>
        );
    },
    onDispose: () => {
        console.log('WebCam plugin disposed');
    },
};
