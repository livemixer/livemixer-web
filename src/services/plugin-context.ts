/**
 * Plugin Context Manager
 *
 * Core service that manages the plugin context system:
 * - Maintains application state
 * - Creates secure context instances for each plugin
 * - Handles event subscriptions
 * - Validates and executes actions with permission checks
 */

import type {
  EventCallback,
  EventDataMap,
  IPluginContext,
  PluginContextActions,
  PluginContextEvent,
  PluginContextState,
  PluginPermission,
  PluginPermissionConfig,
  PluginTrustLevel,
  SlotContent,
} from '../types/plugin-context';
import type { SceneItem } from '../types/protocol';

// ============================================================================
// Types
// ============================================================================

type AnyEventCallback = (data: any) => void;

interface PluginInstance {
  id: string;
  version: string;
  permissions: PluginPermissionConfig;
  unsubscribers: Array<() => void>;
}

// ============================================================================
// Default Permissions
// ============================================================================

const DEFAULT_PERMISSIONS_MAP: Record<PluginTrustLevel, PluginPermission[]> = {
  builtin: [
    'scene:read',
    'scene:write',
    'playback:read',
    'playback:control',
    'devices:read',
    'devices:access',
    'storage:read',
    'storage:write',
    'ui:dialog',
    'ui:toast',
    'ui:slot',
    'plugin:communicate',
  ],
  verified: [
    'scene:read',
    'scene:write',
    'playback:read',
    'devices:read',
    'storage:read',
    'storage:write',
    'ui:dialog',
    'ui:toast',
    'ui:slot',
  ],
  community: [
    'scene:read',
    'playback:read',
    'storage:read',
    'storage:write',
    'ui:toast',
  ],
  untrusted: ['scene:read', 'playback:read'],
};

// ============================================================================
// Plugin Context Manager Class
// ============================================================================

export class PluginContextManager {
  // Application state
  private state: PluginContextState;

  // Event listeners by event type
  private listeners = new Map<PluginContextEvent, Set<AnyEventCallback>>();

  // Plugin APIs for inter-plugin communication
  private pluginAPIs = new Map<string, any>();

  // Registered slots
  private slots = new Map<string, SlotContent[]>();
  private slotListeners = new Set<() => void>();

  // Active plugin instances
  private pluginInstances = new Map<string, PluginInstance>();

  // Action handlers (set by host application)
  private actionHandlers: {
    scene?: {
      addItem?: (item: Partial<SceneItem>) => Promise<SceneItem>;
      removeItem?: (itemId: string) => Promise<void>;
      updateItem?: (
        itemId: string,
        updates: Partial<SceneItem>,
      ) => Promise<void>;
      selectItem?: (itemId: string | null) => void;
      reorderItems?: (itemIds: string[]) => void;
      duplicateItem?: (itemId: string) => Promise<SceneItem>;
    };
    playback?: {
      play?: () => void;
      pause?: () => void;
      stop?: () => void;
      toggle?: () => void;
    };
    ui?: {
      showDialog?: <T>(dialogId: string, props?: T) => void;
      closeDialog?: (dialogId: string) => void;
      showToast?: (
        message: string,
        type?: 'info' | 'success' | 'warning' | 'error',
      ) => void;
      setTheme?: (theme: 'light' | 'dark') => void;
      setLanguage?: (language: string) => void;
    };
  } = {};

  // Storage backend
  private storageBackend?: {
    get: (pluginId: string, key: string) => Promise<any>;
    set: (pluginId: string, key: string, value: any) => Promise<void>;
    remove: (pluginId: string, key: string) => Promise<void>;
    clear: (pluginId: string) => Promise<void>;
  };

  constructor() {
    // Initialize with default state
    this.state = this.createInitialState();
  }

  // ============================================================================
  // State Management
  // ============================================================================

  private createInitialState(): PluginContextState {
    return {
      scene: {
        currentId: null,
        items: [],
        selectedItemId: null,
        selectedItem: null,
      },
      playback: {
        isPlaying: false,
        isRecording: false,
        isPreviewing: false,
      },
      output: {
        width: 1920,
        height: 1080,
        fps: 30,
      },
      ui: {
        theme: 'dark',
        language: 'en',
        sidebarVisible: true,
        propertyPanelVisible: true,
      },
      devices: {
        videoInputs: [],
        audioInputs: [],
        audioOutputs: [],
      },
      user: {
        id: null,
        name: null,
        role: 'anonymous',
      },
    };
  }

  /**
   * Update state (called by host application)
   */
  updateState(
    updater:
      | Partial<PluginContextState>
      | ((state: PluginContextState) => Partial<PluginContextState>),
  ): void {
    const updates =
      typeof updater === 'function' ? updater(this.state) : updater;

    // Deep merge updates
    this.state = {
      ...this.state,
      ...updates,
      scene: updates.scene
        ? { ...this.state.scene, ...updates.scene }
        : this.state.scene,
      playback: updates.playback
        ? { ...this.state.playback, ...updates.playback }
        : this.state.playback,
      output: updates.output
        ? { ...this.state.output, ...updates.output }
        : this.state.output,
      ui: updates.ui ? { ...this.state.ui, ...updates.ui } : this.state.ui,
      devices: updates.devices
        ? { ...this.state.devices, ...updates.devices }
        : this.state.devices,
      user: updates.user
        ? { ...this.state.user, ...updates.user }
        : this.state.user,
    };
  }

  /**
   * Get current state (for host application)
   */
  getState(): PluginContextState {
    return this.state;
  }

  // ============================================================================
  // Action Handlers Configuration
  // ============================================================================

  /**
   * Set action handlers (called by host application)
   */
  setActionHandlers(handlers: typeof this.actionHandlers): void {
    this.actionHandlers = { ...this.actionHandlers, ...handlers };
  }

  /**
   * Set storage backend
   */
  setStorageBackend(backend: typeof this.storageBackend): void {
    this.storageBackend = backend;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Emit an event to all listeners
   */
  emit<E extends PluginContextEvent>(event: E, data: EventDataMap[E]): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(
            `[PluginContext] Error in event listener for ${event}:`,
            err,
          );
        }
      });
    }
  }

  private subscribe<E extends PluginContextEvent>(
    event: E,
    callback: EventCallback<E>,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as AnyEventCallback);

    return () => {
      this.listeners.get(event)?.delete(callback as AnyEventCallback);
    };
  }

  // ============================================================================
  // Slot System
  // ============================================================================

  private registerSlot(content: SlotContent): () => void {
    const slot = content.slot;
    if (!this.slots.has(slot)) {
      this.slots.set(slot, []);
    }

    const slotContents = this.slots.get(slot)!;
    slotContents.push(content);
    // Sort by priority (higher first)
    slotContents.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    // Notify listeners
    this.notifySlotChange();

    return () => {
      const idx = slotContents.indexOf(content);
      if (idx !== -1) {
        slotContents.splice(idx, 1);
        this.notifySlotChange();
      }
    };
  }

  private notifySlotChange(): void {
    this.slotListeners.forEach((cb) => cb());
  }

  /**
   * Get contents for a specific slot
   */
  getSlotContents(slot: string): SlotContent[] {
    return this.slots.get(slot) || [];
  }

  /**
   * Subscribe to slot changes
   */
  subscribeToSlots(callback: () => void): () => void {
    this.slotListeners.add(callback);
    return () => this.slotListeners.delete(callback);
  }

  // ============================================================================
  // Plugin Context Creation
  // ============================================================================

  /**
   * Create a context instance for a plugin
   */
  createContextForPlugin(
    pluginId: string,
    pluginVersion: string,
    trustLevel: PluginTrustLevel = 'community',
  ): IPluginContext {
    // Create permission config
    const permissions: PluginPermissionConfig = {
      granted: [...DEFAULT_PERMISSIONS_MAP[trustLevel]],
      trustLevel,
      userApproved: trustLevel === 'builtin',
    };

    // Track plugin instance
    const instance: PluginInstance = {
      id: pluginId,
      version: pluginVersion,
      permissions,
      unsubscribers: [],
    };
    this.pluginInstances.set(pluginId, instance);

    // Create readonly state proxy
    const readonlyState = this.createReadonlyStateProxy();

    // Create scoped logger
    const logger = this.createScopedLogger(pluginId);

    // Create actions with permission checks
    const actions = this.createActionsForPlugin(pluginId, permissions);

    // Helper to check permission
    const hasPermission = (permission: PluginPermission): boolean => {
      return permissions.granted.includes(permission);
    };

    // Create context object
    const context: IPluginContext = {
      // Readonly state
      state: readonlyState,

      // Event subscription
      subscribe: <E extends PluginContextEvent>(
        event: E,
        callback: EventCallback<E>,
      ) => {
        const unsub = this.subscribe(event, callback);
        instance.unsubscribers.push(unsub);
        return unsub;
      },

      subscribeMany: (events, callback) => {
        const unsubs = events.map((event) =>
          this.subscribe(event, (data) => callback(event, data)),
        );
        instance.unsubscribers.push(...unsubs);
        return () => unsubs.forEach((u) => u());
      },

      // Actions
      actions,

      // Plugin communication
      getPluginAPI: <T>(targetPluginId: string): T | null => {
        if (!hasPermission('plugin:communicate')) {
          logger.warn(`Permission denied: plugin:communicate`);
          return null;
        }
        return this.pluginAPIs.get(targetPluginId) as T | null;
      },

      registerAPI: <T>(api: T) => {
        if (!hasPermission('plugin:communicate')) {
          logger.warn(`Permission denied: plugin:communicate`);
          return;
        }
        this.pluginAPIs.set(pluginId, api);
      },

      // Slot registration
      registerSlot: <T>(content: Omit<SlotContent<T>, 'pluginId'>) => {
        if (!hasPermission('ui:slot')) {
          logger.warn(`Permission denied: ui:slot`);
          return () => {};
        }
        const fullContent: SlotContent<T> = { ...content, pluginId };
        const unsub = this.registerSlot(fullContent);
        instance.unsubscribers.push(unsub);
        return unsub;
      },

      // Plugin info
      plugin: {
        id: pluginId,
        version: pluginVersion,
        permissions,
      },

      // Permission helpers
      hasPermission,

      requestPermission: async (requestedPermissions: PluginPermission[]) => {
        // In production, this would show a permission dialog to the user
        // For now, auto-grant for builtin plugins
        if (trustLevel === 'builtin') {
          requestedPermissions.forEach((p) => {
            if (!permissions.granted.includes(p)) {
              permissions.granted.push(p);
            }
          });
          return true;
        }
        // For other plugins, would need user approval
        logger.warn(
          `Permission request not implemented for non-builtin plugins`,
        );
        return false;
      },

      // Logger
      logger,
    };

    return context;
  }

  /**
   * Dispose a plugin context
   */
  disposePlugin(pluginId: string): void {
    const instance = this.pluginInstances.get(pluginId);
    if (instance) {
      // Unsubscribe all
      instance.unsubscribers.forEach((unsub) => unsub());
      this.pluginInstances.delete(pluginId);
    }

    // Remove registered API
    this.pluginAPIs.delete(pluginId);

    // Remove all slots registered by this plugin
    for (const [slot, contents] of this.slots) {
      this.slots.set(
        slot,
        contents.filter((c) => c.pluginId !== pluginId),
      );
    }
    this.notifySlotChange();

    // Emit dispose event
    this.emit('plugin:dispose', { pluginId });
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private createReadonlyStateProxy(): PluginContextState {
    const self = this;

    const createDeepReadonlyProxy = <T extends object>(obj: T): T => {
      return new Proxy(obj, {
        get(_target, prop) {
          // Always return fresh data from manager's state
          const value = (self.state as any)[prop];
          if (typeof value === 'object' && value !== null) {
            return createDeepReadonlyProxy(value);
          }
          return value;
        },
        set() {
          console.warn(
            '[PluginContext] Cannot directly modify state. Use actions instead.',
          );
          return false;
        },
        deleteProperty() {
          console.warn('[PluginContext] Cannot delete state properties.');
          return false;
        },
      });
    };

    return createDeepReadonlyProxy(this.state);
  }

  private createScopedLogger(pluginId: string) {
    const prefix = `[Plugin:${pluginId}]`;
    return {
      debug: (message: string, ...args: any[]) =>
        console.debug(prefix, message, ...args),
      info: (message: string, ...args: any[]) =>
        console.info(prefix, message, ...args),
      warn: (message: string, ...args: any[]) =>
        console.warn(prefix, message, ...args),
      error: (message: string, ...args: any[]) =>
        console.error(prefix, message, ...args),
    };
  }

  private createActionsForPlugin(
    pluginId: string,
    permissions: PluginPermissionConfig,
  ): PluginContextActions {
    const hasPermission = (p: PluginPermission) =>
      permissions.granted.includes(p);
    const logger = this.createScopedLogger(pluginId);
    const handlers = this.actionHandlers;
    const storage = this.storageBackend;

    return {
      scene: {
        addItem: async (item) => {
          if (!hasPermission('scene:write')) {
            throw new Error('Permission denied: scene:write');
          }
          if (!handlers.scene?.addItem) {
            throw new Error('Action handler not configured: scene.addItem');
          }
          return handlers.scene.addItem(item);
        },
        removeItem: async (itemId) => {
          if (!hasPermission('scene:write')) {
            throw new Error('Permission denied: scene:write');
          }
          if (!handlers.scene?.removeItem) {
            throw new Error('Action handler not configured: scene.removeItem');
          }
          return handlers.scene.removeItem(itemId);
        },
        updateItem: async (itemId, updates) => {
          if (!hasPermission('scene:write')) {
            throw new Error('Permission denied: scene:write');
          }
          if (!handlers.scene?.updateItem) {
            throw new Error('Action handler not configured: scene.updateItem');
          }
          return handlers.scene.updateItem(itemId, updates);
        },
        selectItem: (itemId) => {
          if (!hasPermission('scene:read')) {
            logger.warn('Permission denied: scene:read');
            return;
          }
          handlers.scene?.selectItem?.(itemId);
        },
        reorderItems: (itemIds) => {
          if (!hasPermission('scene:write')) {
            logger.warn('Permission denied: scene:write');
            return;
          }
          handlers.scene?.reorderItems?.(itemIds);
        },
        duplicateItem: async (itemId) => {
          if (!hasPermission('scene:write')) {
            throw new Error('Permission denied: scene:write');
          }
          if (!handlers.scene?.duplicateItem) {
            throw new Error(
              'Action handler not configured: scene.duplicateItem',
            );
          }
          return handlers.scene.duplicateItem(itemId);
        },
      },
      playback: {
        play: () => {
          if (!hasPermission('playback:control')) {
            logger.warn('Permission denied: playback:control');
            return;
          }
          handlers.playback?.play?.();
        },
        pause: () => {
          if (!hasPermission('playback:control')) {
            logger.warn('Permission denied: playback:control');
            return;
          }
          handlers.playback?.pause?.();
        },
        stop: () => {
          if (!hasPermission('playback:control')) {
            logger.warn('Permission denied: playback:control');
            return;
          }
          handlers.playback?.stop?.();
        },
        toggle: () => {
          if (!hasPermission('playback:control')) {
            logger.warn('Permission denied: playback:control');
            return;
          }
          handlers.playback?.toggle?.();
        },
      },
      ui: {
        showDialog: (dialogId, props) => {
          if (!hasPermission('ui:dialog')) {
            logger.warn('Permission denied: ui:dialog');
            return;
          }
          handlers.ui?.showDialog?.(dialogId, props);
        },
        closeDialog: (dialogId) => {
          if (!hasPermission('ui:dialog')) {
            logger.warn('Permission denied: ui:dialog');
            return;
          }
          handlers.ui?.closeDialog?.(dialogId);
        },
        showToast: (message, type) => {
          if (!hasPermission('ui:toast')) {
            logger.warn('Permission denied: ui:toast');
            return;
          }
          handlers.ui?.showToast?.(message, type);
        },
        setTheme: (theme) => {
          // Theme change might require higher permission in production
          handlers.ui?.setTheme?.(theme);
        },
        setLanguage: (language) => {
          handlers.ui?.setLanguage?.(language);
        },
      },
      storage: {
        get: async (key) => {
          if (!hasPermission('storage:read')) {
            throw new Error('Permission denied: storage:read');
          }
          if (!storage) {
            logger.warn('Storage backend not configured');
            return null;
          }
          return storage.get(pluginId, key);
        },
        set: async (key, value) => {
          if (!hasPermission('storage:write')) {
            throw new Error('Permission denied: storage:write');
          }
          if (!storage) {
            logger.warn('Storage backend not configured');
            return;
          }
          return storage.set(pluginId, key, value);
        },
        remove: async (key) => {
          if (!hasPermission('storage:write')) {
            throw new Error('Permission denied: storage:write');
          }
          if (!storage) {
            logger.warn('Storage backend not configured');
            return;
          }
          return storage.remove(pluginId, key);
        },
        clear: async () => {
          if (!hasPermission('storage:write')) {
            throw new Error('Permission denied: storage:write');
          }
          if (!storage) {
            logger.warn('Storage backend not configured');
            return;
          }
          return storage.clear(pluginId);
        },
      },
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const pluginContextManager = new PluginContextManager();
