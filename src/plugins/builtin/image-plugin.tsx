import type { Image as KonvaImageType } from 'konva/lib/shapes/Image';
import type React from 'react';
import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type { IPluginContext, ISourcePlugin } from '../../types/plugin';

export const ImagePlugin: ISourcePlugin = {
  id: 'io.livemixer.image',
  version: '1.0.0',
  name: 'Image',
  category: 'media',
  engines: {
    host: '^1.0.0',
    api: '1.0',
  },
  // Source type mapping for add-source-dialog
  sourceType: {
    typeId: 'image',
    nameKey: 'addSource.image.name',
    descriptionKey: 'addSource.image.description',
    icon: 'image',
  },
  // Add dialog configuration - no immediate dialog, configure in property panel
  addDialog: {
    immediate: false,
  },
  // Default layout for image items
  defaultLayout: {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  },
  propsSchema: {
    url: {
      label: 'Image URL',
      labelKey: 'plugins.io.livemixer.image.label.url',
      type: 'image',
      defaultValue: '',
    },
    borderRadius: {
      label: 'Border Radius',
      labelKey: 'plugins.io.livemixer.image.label.borderRadius',
      type: 'number',
      defaultValue: 0,
      min: 0,
      max: 100,
    },
  },
  i18n: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'zh'],
    resources: {
      en: {
        'plugins.io.livemixer.image': {
          label: {
            url: 'Image URL',
            borderRadius: 'Border Radius',
          },
        },
      },
      zh: {
        'plugins.io.livemixer.image': {
          label: {
            url: '图片 URL',
            borderRadius: '圆角',
          },
        },
      },
    },
  },
  onInit: (ctx: IPluginContext) => {
    ctx.logger.info('Image plugin initialized');
  },
  onUpdate: (newProps: unknown) => {
    console.log('Image plugin updated', newProps);
  },
  render: (commonProps: unknown) => {
    const props = commonProps as {
      ref: React.Ref<KonvaImageType>;
      item: {
        url?: string;
        transform?: { borderRadius?: number };
        borderRadius?: number;
      };
      [key: string]: unknown;
    };
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [image] = useImage(props.item.url || '', 'anonymous');
    const { ref: nodeRef, item, ...restProps } = props;

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
