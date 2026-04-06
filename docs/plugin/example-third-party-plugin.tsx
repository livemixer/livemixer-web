/**
 * Example Third-Party Plugin
 * 
 * This demonstrates how a third-party plugin can be registered
 * without any modifications to core files.
 * 
 * To register this plugin, simply add to main.tsx:
 * import { ExampleThirdPartyPlugin } from './plugins/example-third-party-plugin';
 * pluginRegistry.register(ExampleThirdPartyPlugin);
 */

import { Rect, Text } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../src/types/plugin';

export const ExampleThirdPartyPlugin: ISourcePlugin = {
    id: 'com.example.customwidget',
    version: '1.0.0',
    name: 'Custom Widget',
    category: 'widget',
    engines: {
        host: '^1.0.0',
        api: '1.0',
    },

    // Source type mapping - makes this plugin appear in add-source-dialog
    sourceType: {
        typeId: 'custom_widget',
        nameKey: 'addSource.customWidget.name',
        descriptionKey: 'addSource.customWidget.description',
        icon: 'puzzle',
    },

    // Add dialog configuration - no immediate dialog
    addDialog: {
        immediate: false,
    },

    // Props schema - defines configurable properties
    propsSchema: {
        title: {
            label: 'Widget Title',
            type: 'string',
            defaultValue: 'My Widget',
        },
        backgroundColor: {
            label: 'Background Color',
            type: 'string',
            defaultValue: '#3b82f6',
        },
        textColor: {
            label: 'Text Color',
            type: 'string',
            defaultValue: '#ffffff',
        },
        fontSize: {
            label: 'Font Size',
            type: 'number',
            defaultValue: 24,
            min: 12,
            max: 72,
            step: 2,
        },
        borderRadius: {
            label: 'Border Radius',
            type: 'number',
            defaultValue: 8,
            min: 0,
            max: 50,
        },
        showBorder: {
            label: 'Show Border',
            type: 'boolean',
            defaultValue: true,
        },
    },

    // i18n resources
    i18n: {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'zh'],
        resources: {
            en: {
                'addSource.customWidget': {
                    name: 'Custom Widget',
                    description: 'A customizable widget with text and styling options',
                },
                'plugins.com.example.customwidget': {
                    label: {
                        title: 'Widget Title',
                        backgroundColor: 'Background Color',
                        textColor: 'Text Color',
                        fontSize: 'Font Size',
                        borderRadius: 'Border Radius',
                        showBorder: 'Show Border',
                    },
                },
            },
            zh: {
                'addSource.customWidget': {
                    name: '自定义组件',
                    description: '可自定义文本和样式的组件',
                },
                'plugins.com.example.customwidget': {
                    label: {
                        title: '组件标题',
                        backgroundColor: '背景颜色',
                        textColor: '文字颜色',
                        fontSize: '字体大小',
                        borderRadius: '圆角',
                        showBorder: '显示边框',
                    },
                },
            },
        },
    },

    // Trust level
    trustLevel: 'community',

    // Lifecycle hooks
    onInit: (ctx: IPluginContext) => {
        ctx.logger.info('Custom Widget plugin initialized');
    },

    onUpdate: (newProps: any) => {
        console.log('Custom Widget updated', newProps);
    },

    // Render function
    render: (commonProps: any) => {
        const { ref: nodeRef, item, ...restProps } = commonProps;

        const title = item.title || 'My Widget';
        const backgroundColor = item.backgroundColor || '#3b82f6';
        const textColor = item.textColor || '#ffffff';
        const fontSize = item.fontSize || 24;
        const borderRadius = item.borderRadius || 8;
        const showBorder = item.showBorder !== false;

        const w = restProps.width || 300;
        const h = restProps.height || 150;

        return (
            <>
                <Rect
                    {...restProps}
                    ref={nodeRef}
                    fill={backgroundColor}
                    stroke={showBorder ? '#ffffff' : undefined}
                    strokeWidth={showBorder ? 2 : 0}
                    cornerRadius={borderRadius}
                    opacity={0.9}
                />
                <Text
                    x={restProps.x}
                    y={restProps.y + h / 2 - fontSize / 2}
                    width={w}
                    text={title}
                    fontSize={fontSize}
                    fill={textColor}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                />
            </>
        );
    },

    onDispose: () => {
        console.log('Custom Widget plugin disposed');
    },
};
