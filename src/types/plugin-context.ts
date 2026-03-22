/**
 * Plugin Context API - Type Definitions
 * 
 * Provides a secure, controlled way for plugins to:
 * - Read application state (readonly)
 * - Subscribe to state changes
 * - Request state modifications through actions
 * - Communicate with other plugins
 */

import type { SceneItem } from './protocol';

// ============================================================================
// Permission System
// ============================================================================

/** Available permissions that plugins can request */
export type PluginPermission =
    | 'scene:read'           // Read scene data
    | 'scene:write'          // Modify scene items
    | 'playback:read'        // Read playback state
    | 'playback:control'     // Control playback
    | 'devices:read'         // Read device list
    | 'devices:access'       // Access media devices
    | 'storage:read'         // Read plugin storage
    | 'storage:write'        // Write plugin storage
    | 'ui:dialog'            // Show dialogs
    | 'ui:toast'             // Show toast notifications
    | 'ui:slot'              // Register UI slots
    | 'plugin:communicate';  // Communicate with other plugins

/** Permission levels for different plugin types */
export type PluginTrustLevel = 'builtin' | 'verified' | 'community' | 'untrusted';

/** Permission configuration */
export interface PluginPermissionConfig {
    /** Permissions granted to this plugin */
    granted: PluginPermission[];
    /** Trust level of the plugin */
    trustLevel: PluginTrustLevel;
    /** Whether user has explicitly approved permissions */
    userApproved: boolean;
}

/** Default permissions by trust level */
export const DEFAULT_PERMISSIONS: Record<PluginTrustLevel, PluginPermission[]> = {
    builtin: [
        'scene:read', 'scene:write',
        'playback:read', 'playback:control',
        'devices:read', 'devices:access',
        'storage:read', 'storage:write',
        'ui:dialog', 'ui:toast', 'ui:slot',
        'plugin:communicate',
    ],
    verified: [
        'scene:read', 'scene:write',
        'playback:read',
        'devices:read',
        'storage:read', 'storage:write',
        'ui:dialog', 'ui:toast', 'ui:slot',
    ],
    community: [
        'scene:read',
        'playback:read',
        'storage:read', 'storage:write',
        'ui:toast',
    ],
    untrusted: [
        'scene:read',
        'playback:read',
    ],
};

// ============================================================================
// State Definitions (Readonly)
// ============================================================================

/** Scene state */
export interface SceneState {
    readonly currentId: string | null;
    readonly items: readonly SceneItem[];
    readonly selectedItemId: string | null;
    readonly selectedItem: SceneItem | null;
}

/** Playback state */
export interface PlaybackState {
    readonly isPlaying: boolean;
    readonly isRecording: boolean;
    readonly isPreviewing: boolean;
}

/** Output configuration */
export interface OutputState {
    readonly width: number;
    readonly height: number;
    readonly fps: number;
}

/** UI state */
export interface UIState {
    readonly theme: 'light' | 'dark';
    readonly language: string;
    readonly sidebarVisible: boolean;
    readonly propertyPanelVisible: boolean;
}

/** Media devices state */
export interface DevicesState {
    readonly videoInputs: readonly MediaDeviceInfo[];
    readonly audioInputs: readonly MediaDeviceInfo[];
    readonly audioOutputs: readonly MediaDeviceInfo[];
}

/** User state */
export interface UserState {
    readonly id: string | null;
    readonly name: string | null;
    readonly role: 'anonymous' | 'user' | 'admin';
}

/** Complete application state (readonly) */
export interface PluginContextState {
    readonly scene: SceneState;
    readonly playback: PlaybackState;
    readonly output: OutputState;
    readonly ui: UIState;
    readonly devices: DevicesState;
    readonly user: UserState;
}

// ============================================================================
// Events
// ============================================================================

/** Event types that plugins can subscribe to */
export type PluginContextEvent =
    // Scene events
    | 'scene:change'
    | 'scene:item:add'
    | 'scene:item:remove'
    | 'scene:item:update'
    | 'scene:item:select'
    | 'scene:item:reorder'
    // Playback events
    | 'playback:start'
    | 'playback:stop'
    | 'playback:pause'
    // Device events
    | 'devices:change'
    | 'devices:videoInput:change'
    | 'devices:audioInput:change'
    // UI events
    | 'ui:theme:change'
    | 'ui:language:change'
    // Lifecycle events
    | 'plugin:ready'
    | 'plugin:dispose';

/** Event data types */
export interface EventDataMap {
    'scene:change': { sceneId: string };
    'scene:item:add': { item: SceneItem };
    'scene:item:remove': { itemId: string };
    'scene:item:update': { itemId: string; updates: Partial<SceneItem> };
    'scene:item:select': { itemId: string | null };
    'scene:item:reorder': { itemIds: string[] };
    'playback:start': undefined;
    'playback:stop': undefined;
    'playback:pause': undefined;
    'devices:change': { devices: DevicesState };
    'devices:videoInput:change': { devices: readonly MediaDeviceInfo[] };
    'devices:audioInput:change': { devices: readonly MediaDeviceInfo[] };
    'ui:theme:change': { theme: 'light' | 'dark' };
    'ui:language:change': { language: string };
    'plugin:ready': { pluginId: string };
    'plugin:dispose': { pluginId: string };
}

/** Event callback type */
export type EventCallback<E extends PluginContextEvent> = (
    data: EventDataMap[E]
) => void;

// ============================================================================
// Actions
// ============================================================================

/** Scene actions */
export interface SceneActions {
    /** Add a new item to the scene */
    addItem(item: Partial<SceneItem>): Promise<SceneItem>;
    /** Remove an item from the scene */
    removeItem(itemId: string): Promise<void>;
    /** Update an item's properties */
    updateItem(itemId: string, updates: Partial<SceneItem>): Promise<void>;
    /** Select an item (or deselect if null) */
    selectItem(itemId: string | null): void;
    /** Reorder items */
    reorderItems(itemIds: string[]): void;
    /** Duplicate an item */
    duplicateItem(itemId: string): Promise<SceneItem>;
}

/** Playback actions */
export interface PlaybackActions {
    /** Start playback */
    play(): void;
    /** Pause playback */
    pause(): void;
    /** Stop playback */
    stop(): void;
    /** Toggle playback */
    toggle(): void;
}

/** UI actions */
export interface UIActions {
    /** Show a dialog */
    showDialog<T = any>(dialogId: string, props?: T): void;
    /** Close a dialog */
    closeDialog(dialogId: string): void;
    /** Show a toast notification */
    showToast(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;
    /** Set the theme */
    setTheme(theme: 'light' | 'dark'): void;
    /** Set the language */
    setLanguage(language: string): void;
}

/** Plugin-specific storage actions */
export interface StorageActions {
    /** Get a value from storage */
    get<T = any>(key: string): Promise<T | null>;
    /** Set a value in storage */
    set<T = any>(key: string, value: T): Promise<void>;
    /** Remove a value from storage */
    remove(key: string): Promise<void>;
    /** Clear all plugin storage */
    clear(): Promise<void>;
}

/** All available actions */
export interface PluginContextActions {
    scene: SceneActions;
    playback: PlaybackActions;
    ui: UIActions;
    storage: StorageActions;
}

// ============================================================================
// Slot System
// ============================================================================

/** Predefined UI slots */
export type PredefinedSlot =
    | 'toolbar-left'
    | 'toolbar-center'
    | 'toolbar-right'
    | 'sidebar-top'
    | 'sidebar-bottom'
    | 'property-panel-top'
    | 'property-panel-bottom'
    | 'canvas-overlay'
    | 'status-bar-left'
    | 'status-bar-center'
    | 'status-bar-right'
    | 'dialogs'
    | 'context-menu'
    | 'add-source-dialog';

/** Allow custom slots with prefix */
export type SlotName = PredefinedSlot | `custom:${string}`;

/** Props passed to slot components */
export interface SlotComponentProps<T = any> {
    /** Plugin context */
    context: IPluginContext;
    /** Additional props */
    props?: T;
}

/** Slot content registration */
export interface SlotContent<T = any> {
    /** Unique identifier */
    id: string;
    /** Owner plugin ID */
    pluginId: string;
    /** Target slot */
    slot: SlotName;
    /** React component to render */
    component: React.ComponentType<SlotComponentProps<T>>;
    /** Additional props to pass */
    props?: T;
    /** Priority (higher = rendered first) */
    priority?: number;
    /** Condition for visibility */
    visible?: (state: PluginContextState) => boolean;
}

// ============================================================================
// Main Plugin Context Interface
// ============================================================================

/** The main context interface provided to plugins */
export interface IPluginContext {
    // ---- State (Readonly) ----
    /** 
     * Application state - READONLY
     * Use actions to modify state
     */
    readonly state: PluginContextState;

    // ---- Events ----
    /**
     * Subscribe to an event
     * @returns Unsubscribe function
     */
    subscribe<E extends PluginContextEvent>(
        event: E,
        callback: EventCallback<E>
    ): () => void;

    /**
     * Subscribe to multiple events
     * @returns Unsubscribe function
     */
    subscribeMany(
        events: PluginContextEvent[],
        callback: (event: PluginContextEvent, data: any) => void
    ): () => void;

    // ---- Actions ----
    /**
     * Actions to modify application state
     * All modifications go through here for security
     */
    readonly actions: PluginContextActions;

    // ---- Plugin Communication ----
    /**
     * Get another plugin's public API
     * Requires 'plugin:communicate' permission
     */
    getPluginAPI<T = any>(pluginId: string): T | null;

    /**
     * Register a public API for other plugins
     */
    registerAPI<T = any>(api: T): void;

    // ---- Slot Registration ----
    /**
     * Register a UI component to a slot
     * Requires 'ui:slot' permission
     */
    registerSlot<T = any>(content: Omit<SlotContent<T>, 'pluginId'>): () => void;

    // ---- Plugin Info ----
    /** Current plugin information */
    readonly plugin: {
        readonly id: string;
        readonly version: string;
        readonly permissions: PluginPermissionConfig;
    };

    // ---- Permission Checking ----
    /**
     * Check if plugin has a specific permission
     */
    hasPermission(permission: PluginPermission): boolean;

    /**
     * Request additional permissions from user
     * Returns true if granted
     */
    requestPermission(permissions: PluginPermission[]): Promise<boolean>;

    // ---- Logging ----
    /** Scoped logger */
    readonly logger: {
        debug(message: string, ...args: any[]): void;
        info(message: string, ...args: any[]): void;
        warn(message: string, ...args: any[]): void;
        error(message: string, ...args: any[]): void;
    };
}

// ============================================================================
// Plugin UI Configuration
// ============================================================================

/** Add dialog props */
export interface AddDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (item: Partial<SceneItem>) => void;
}

/** Property panel props */
export interface PropertyPanelProps {
    item: SceneItem;
    onUpdate: (updates: Partial<SceneItem>) => void;
    isLocked: boolean;
}

/** Plugin UI configuration in plugin definition */
export interface PluginUIConfig {
    /** Component shown when adding this source type */
    addDialog?: React.ComponentType<AddDialogProps>;

    /** Custom property panel (replaces or extends default) */
    propertyPanel?: {
        component: React.ComponentType<PropertyPanelProps>;
        /** If true, completely replaces default panel */
        replaceDefault?: boolean;
    };

    /** Static slot registrations (alternative to dynamic registerSlot) */
    slots?: Array<Omit<SlotContent, 'pluginId'>>;
}
