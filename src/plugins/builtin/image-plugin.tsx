import React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

export const ImagePlugin: ISourcePlugin = {
    id: 'io.livemixer.image',
    version: '1.0.0',
    name: '图像',
    category: 'media',
    engines: {
        host: '^1.0.0',
        api: '1.0',
    },
    propsSchema: {
        url: {
            label: '图片 URL',
            type: 'image',
            defaultValue: '',
        },
        borderRadius: {
            label: '圆角',
            type: 'number',
            defaultValue: 0,
            min: 0,
            max: 100,
        },
    },
    onInit: (ctx: IPluginContext) => {
        ctx.logger.info('Image plugin initialized');
    },
    onUpdate: (newProps: any) => {
        console.log('Image plugin updated', newProps);
    },
    render: (commonProps: any) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [image] = useImage(commonProps.item.url || '', 'anonymous');
        const { ref: nodeRef, item, ...restProps } = commonProps;

        return (
            <KonvaImage
                {...restProps}
                ref={nodeRef}
                image={image}
                cornerRadius={item.transform?.borderRadius || item.borderRadius || 0}
            />
        );
    },
    onDispose: () => {
        console.log('Image plugin disposed');
    },
};
