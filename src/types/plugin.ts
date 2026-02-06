import type Konva from 'konva';

export type PluginControlType = 'number' | 'string' | 'color' | 'boolean' | 'select' | 'image' | 'video' | 'group';

export interface PropsSchemaItem {
  label: string;
  type: PluginControlType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  group?: string;
}

export interface PropsSchema {
  [key: string]: PropsSchemaItem;
}

export interface IPluginContext {
  canvasWidth: number;
  canvasHeight: number;
  logger: {
    info: (msg: string) => void;
    error: (msg: string) => void;
  };
  assetLoader: {
    loadTexture: (url: string) => Promise<any>;
  };
}

export interface IFrameContext {
  time: number;
  delta: number;
}

export interface ISourcePlugin {
  // Metadata
  id: string;
  version: string;
  name: string;
  icon?: string;
  category: 'media' | 'text' | 'widget' | 'effect';

  // Compatibility declaration
  engines: {
    host: string;
    api: string;
  };

  // Property definitions
  propsSchema: PropsSchema;

  // Lifecycle
  onInit: (ctx: IPluginContext) => Promise<void> | void;
  onUpdate: (newProps: any) => void;

  /**
  * Return a Konva node to render
  * or run custom rendering logic
   */
  render: (commonProps: any) => React.ReactElement;

  onDispose: () => void;
}
