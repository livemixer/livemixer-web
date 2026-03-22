import type { IPluginI18n } from './i18n-engine';
import type {
  IPluginContext as IPluginContextNew,
  PluginUIConfig,
  PluginPermission,
  PluginTrustLevel,
} from './plugin-context';

export type PluginControlType = 'number' | 'string' | 'color' | 'boolean' | 'select' | 'image' | 'video' | 'group';

export interface PropsSchemaItem {
  label: string;
  /** Translation key for label (optional, falls back to label) */
  labelKey?: string;
  type: PluginControlType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; labelKey?: string; value: any }[];
  group?: string;
  /** Translation key for group (optional) */
  groupKey?: string;
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

  // Internationalization (optional)
  i18n?: IPluginI18n;

  // ============ NEW: Plugin Context Integration ============

  /** Trust level for permission system */
  trustLevel?: PluginTrustLevel;

  /** Permissions required by this plugin */
  permissions?: PluginPermission[];

  /** UI configuration - dialogs, panels, slots */
  ui?: PluginUIConfig;

  /** 
   * Called when plugin context is ready
   * Use this to register slots, subscribe to events, etc.
   */
  onContextReady?: (ctx: IPluginContextNew) => void;

  /** 
   * Public API exposed to other plugins
   * Other plugins can access via ctx.getPluginAPI(pluginId)
   */
  api?: Record<string, any>;

  // ============ Lifecycle ============

  /** @deprecated Use onContextReady instead */
  onInit: (ctx: IPluginContext) => Promise<void> | void;
  onUpdate: (newProps: any) => void;

  /**
  * Return a Konva node to render
  * or run custom rendering logic
   */
  render: (commonProps: any) => React.ReactElement;

  onDispose: () => void;
}

// Re-export for convenience
export type { IPluginContextNew as IPluginContextExtended };
export type { PluginUIConfig, PluginPermission, PluginTrustLevel };
