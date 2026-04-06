import { Text as KonvaText } from 'react-konva';
import type { ISourcePlugin, IPluginContext } from '../../types/plugin';

export const TextPlugin: ISourcePlugin = {
  id: 'io.livemixer.text',
  version: '1.0.0',
  name: 'Text',
  category: 'text',
  engines: {
    host: '^1.0.0',
    api: '1.0',
  },
  // Source type mapping for add-source-dialog
  sourceType: {
    typeId: 'text',
    nameKey: 'addSource.text.name',
    descriptionKey: 'addSource.text.description',
    icon: 'type',
  },
  // Add dialog configuration - no immediate dialog, configure in property panel
  addDialog: {
    immediate: false,
  },
  // Default layout for text items
  defaultLayout: {
    x: 100,
    y: 100,
    width: 400,
    height: 100,
  },
  propsSchema: {
    content: {
      label: 'Content',
      labelKey: 'plugins.io.livemixer.text.label.content',
      type: 'string',
      defaultValue: 'Text content',
    },
    fontSize: {
      label: 'Font Size',
      labelKey: 'plugins.io.livemixer.text.label.fontSize',
      type: 'number',
      defaultValue: 32,
      min: 8,
      max: 200,
    },
    color: {
      label: 'Color',
      labelKey: 'plugins.io.livemixer.text.label.color',
      type: 'color',
      defaultValue: '#FFFFFF',
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.text': {
          label: {
            content: 'Content',
            fontSize: 'Font Size',
            color: 'Color',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.text': {
          label: {
            content: '内容',
            fontSize: '字号',
            color: '颜色',
          },
        },
      },
    },
  },
  onInit: (ctx: IPluginContext) => {
    ctx.logger.info('Text plugin initialized');
  },
  onUpdate: (newProps: unknown) => {
    console.log('Text plugin updated', newProps);
  },
  render: (commonProps: { ref: React.RefObject<unknown>; item: { content?: string; properties?: { fontSize?: number; color?: string }; fontSize?: number; color?: string } }) => {
    const { ref: nodeRef, item, ...restProps } = commonProps;

    return (
      <KonvaText
        {...restProps}
        ref={nodeRef as React.RefObject<import('konva').default.Text>}
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
