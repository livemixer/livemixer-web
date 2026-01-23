import React from 'react';
import { Text as KonvaText } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

export const TextPlugin: ISourcePlugin = {
    id: 'io.livemixer.text',
    version: '1.0.0',
    name: '文本',
    category: 'text',
    engines: {
        host: '^1.0.0',
        api: '1.0',
    },
    propsSchema: {
        content: {
            label: '内容',
            type: 'string',
            defaultValue: '文本内容',
        },
        fontSize: {
            label: '字号',
            type: 'number',
            defaultValue: 32,
            min: 8,
            max: 200,
        },
        color: {
            label: '颜色',
            type: 'color',
            defaultValue: '#FFFFFF',
        },
    },
    onInit: (ctx: IPluginContext) => {
        ctx.logger.info('Text plugin initialized');
    },
    onUpdate: (newProps: any) => {
        console.log('Text plugin updated', newProps);
    },
    render: (commonProps: any) => {
        const { ref: nodeRef, item, ...restProps } = commonProps;

        return (
            <KonvaText
                {...restProps}
                ref={nodeRef}
                text={item.content || ''}
                fontSize={item.properties?.fontSize || item.fontSize || 16}
                fill={item.properties?.color || item.color || '#FFFFFF'}
                align="left"
                verticalAlign="top"
            />
        );
    },
    onDispose: () => {
        console.log('Text plugin disposed');
    },
};
