import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

export const WebCamPlugin: ISourcePlugin = {
  id: 'io.livemixer.webcam',
  version: '1.0.0',
  name: 'Webcam',
  category: 'media',
  engines: {
    host: '^1.0.0',
    api: '1.0',
  },
  propsSchema: {
    deviceId: {
      label: 'Device ID',
      labelKey: 'plugins.io.livemixer.webcam.label.deviceId',
      type: 'string',
      defaultValue: '',
    },
    opacity: {
      label: 'Opacity',
      labelKey: 'plugins.io.livemixer.webcam.label.opacity',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      step: 0.1,
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.webcam': {
          label: {
            deviceId: 'Device ID',
            opacity: 'Opacity',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.webcam': {
          label: {
            deviceId: '设备 ID',
            opacity: '不透明度',
          },
        },
      },
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
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
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
