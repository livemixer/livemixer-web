import type { IPluginI18n } from './i18n-engine';
import type {
  IPluginContext as IPluginContextNew,
  PluginPermission,
  PluginTrustLevel,
  PluginUIConfig,
} from './plugin-context';
import type { SceneItem } from './protocol';

export type PluginControlType =
  | 'number'
  | 'string'
  | 'color'
  | 'boolean'
  | 'select'
  | 'image'
  | 'video'
  | 'group';

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

/**
 * Source type mapping - plugin can specify its source type identifier
 * This is used for backward compatibility with existing SceneItem.type
 */
export interface SourceTypeMapping {
  /** The source type identifier used in SceneItem.type */
  typeId: string;
  /** Display name key for the add source dialog */
  nameKey?: string;
  /** Description key for the add source dialog */
  descriptionKey?: string;
  /** Icon component or identifier */
  icon?: string;
}

/**
 * Audio mixer configuration for plugins that support audio
 */
export interface AudioMixerConfig {
  /** Whether this plugin type supports audio mixing */
  enabled: boolean;
  /** Property key for volume (default: 'volume') */
  volumeKey?: string;
  /** Property key for muted state (default: 'muted') */
  mutedKey?: string;
  /** Default volume value */
  defaultVolume?: number;
}

/**
 * Canvas render configuration
 */
export interface CanvasRenderConfig {
  /**
   * Whether this item should be filtered from canvas
   * Return true to exclude from rendering (e.g., audio-only items)
   */
  shouldFilter?: (item: SceneItem) => boolean;
  /**
   * Whether this item can be selected/transformed on canvas
   * Return false to disable selection (e.g., invisible items)
   */
  isSelectable?: (item: SceneItem) => boolean;
}

/**
 * Property panel configuration
 */
export interface PropertyPanelConfig {
  /** Custom property panel component */
  component?: React.ComponentType<any>;
  /** If true, replaces the default property panel completely */
  replaceDefault?: boolean;
  /**
   * Additional property keys to exclude from default schema rendering
   * (beyond url, deviceId which are always excluded)
   */
  excludeSchemaKeys?: string[];
}

/**
 * Add source dialog configuration
 */
export interface AddDialogConfig {
  /**
   * Dialog component to show when adding this source
   * If not provided, source is added immediately
   */
  component?: React.ComponentType<any>;
  /**
   * Whether to show dialog immediately or let user configure after adding
   * true = show dialog first (like video_input, audio_input)
   * false = add immediately, configure in property panel (like image, text)
   */
  immediate?: boolean;
  /**
   * Whether this plugin needs to request browser permission immediately on add
   * This triggers getUserMedia or getDisplayMedia before creating the item
   * The obtained stream will be passed to createItem
   */
  needsBrowserPermission?: 'camera' | 'microphone' | 'screen';
}

/**
 * Default layout configuration for items created by this plugin
 */
export interface DefaultLayoutConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

/**
 * Stream initialization configuration
 */
export interface StreamInitConfig {
  /** Whether this plugin needs stream initialization on create */
  needsStream?: boolean;
  /** Stream type identifier */
  streamType?: string;
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

  // ============ NEW: Source Type & UI Integration ============

  /**
   * Source type mapping - defines how this plugin appears in add source dialog
   * If not provided, plugin won't appear as a selectable source type
   */
  sourceType?: SourceTypeMapping;

  /**
   * Audio mixer configuration
   * If provided, items of this type will appear in the audio mixer panel
   */
  audioMixer?: AudioMixerConfig;

  /**
   * Canvas render configuration
   * Controls how items of this type are rendered on canvas
   */
  canvasRender?: CanvasRenderConfig;

  /**
   * Property panel configuration
   * Defines custom property panel behavior
   */
  propertyPanel?: PropertyPanelConfig;

  /**
   * Add source dialog configuration
   * Defines how the add source flow works for this plugin
   */
  addDialog?: AddDialogConfig;

  /**
   * Default layout for items created by this plugin
   */
  defaultLayout?: DefaultLayoutConfig;

  /**
   * Stream initialization configuration
   */
  streamInit?: StreamInitConfig;

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
