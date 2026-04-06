/**
 * Plugin Context React Components and Hooks
 *
 * Provides React integration for the plugin context system:
 * - PluginContextProvider - Wraps the app and provides context
 * - usePluginContext - Hook to access plugin context
 * - usePluginState - Hook to subscribe to specific state
 * - Slot - Component to render plugin-registered UI
 */

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { pluginContextManager } from '../services/plugin-context';
import type {
  IPluginContext,
  PluginContextEvent,
  PluginContextState,
  SlotComponentProps,
  SlotContent,
  SlotName,
} from '../types/plugin-context';

// ============================================================================
// React Context
// ============================================================================

interface PluginContextValue {
  /** Get context for a specific plugin */
  getContext: (pluginId: string) => IPluginContext | null;
  /** Current application state */
  state: PluginContextState;
  /** Manager instance (for advanced usage) */
  manager: typeof pluginContextManager;
}

const PluginContextReact = createContext<PluginContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface PluginContextProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes and provides the plugin context system
 */
export function PluginContextProvider({
  children,
}: PluginContextProviderProps) {
  // Track state changes to trigger re-renders
  const [state, setState] = useState<PluginContextState>(() =>
    pluginContextManager.getState(),
  );

  // Map of plugin contexts
  const [contexts] = useState(() => new Map<string, IPluginContext>());

  // Subscribe to state changes from manager
  useEffect(() => {
    // For now, we'll poll state changes
    // In production, you'd want a more efficient subscription mechanism
    const interval = setInterval(() => {
      const currentState = pluginContextManager.getState();
      setState((prev) => {
        // Simple shallow compare - in production use deep compare or immer
        if (JSON.stringify(prev) !== JSON.stringify(currentState)) {
          return currentState;
        }
        return prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Get or create context for a plugin
  const getContext = useCallback(
    (pluginId: string): IPluginContext | null => {
      if (!contexts.has(pluginId)) {
        // In production, you'd look up the plugin's trust level from registry
        const ctx = pluginContextManager.createContextForPlugin(
          pluginId,
          '1.0.0',
          'builtin', // Default to builtin for now
        );
        contexts.set(pluginId, ctx);
      }
      return contexts.get(pluginId) || null;
    },
    [contexts],
  );

  const value = useMemo<PluginContextValue>(
    () => ({
      getContext,
      state,
      manager: pluginContextManager,
    }),
    [getContext, state],
  );

  return (
    <PluginContextReact.Provider value={value}>
      {children}
    </PluginContextReact.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the plugin context system
 */
export function usePluginContextSystem(): PluginContextValue {
  const context = useContext(PluginContextReact);
  if (!context) {
    throw new Error(
      'usePluginContextSystem must be used within a PluginContextProvider',
    );
  }
  return context;
}

/**
 * Hook to get a plugin's context instance
 */
export function usePluginContext(pluginId: string): IPluginContext | null {
  const { getContext } = usePluginContextSystem();
  return useMemo(() => getContext(pluginId), [getContext, pluginId]);
}

/**
 * Hook to subscribe to specific state with selector
 */
export function usePluginState<T>(
  selector: (state: PluginContextState) => T,
  deps: any[] = [],
): T {
  const { state } = usePluginContextSystem();
  return useMemo(() => selector(state), [state, ...deps, selector]);
}

/**
 * Hook to subscribe to plugin events
 */
export function usePluginEvent<E extends PluginContextEvent>(
  pluginId: string,
  event: E,
  callback: (data: any) => void,
): void {
  const context = usePluginContext(pluginId);

  useEffect(() => {
    if (!context) return;
    return context.subscribe(event, callback);
  }, [context, event, callback]);
}

// ============================================================================
// Slot Component
// ============================================================================

interface SlotProps {
  /** Slot name */
  name: SlotName;
  /** CSS class name */
  className?: string;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Fallback content when slot is empty */
  fallback?: ReactNode;
  /** Gap between items */
  gap?: number;
  /** Additional props passed to all slot components */
  slotProps?: Record<string, any>;
}

/**
 * Component that renders all contents registered to a specific slot
 */
export function Slot({
  name,
  className,
  direction = 'horizontal',
  fallback,
  gap = 4,
  slotProps = {},
}: SlotProps) {
  const { state, manager, getContext } = usePluginContextSystem();
  const [contents, setContents] = useState<SlotContent[]>([]);

  // Subscribe to slot changes
  useEffect(() => {
    const updateContents = () => {
      setContents(manager.getSlotContents(name));
    };

    // Initial load
    updateContents();

    // Subscribe to changes
    return manager.subscribeToSlots(updateContents);
  }, [name, manager]);

  // Filter visible contents
  const visibleContents = useMemo(() => {
    return contents.filter((content) => {
      if (!content.visible) return true;
      try {
        return content.visible(state);
      } catch (err) {
        console.error(
          `[Slot] Error in visibility check for ${content.id}:`,
          err,
        );
        return false;
      }
    });
  }, [contents, state]);

  // Render nothing or fallback if empty
  if (visibleContents.length === 0) {
    return fallback ? fallback : null;
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        gap: `${gap}px`,
      }}
    >
      {visibleContents.map((content) => {
        const context = getContext(content.pluginId);
        if (!context) return null;

        const Component = content.component;
        const props: SlotComponentProps = {
          context,
          props: { ...content.props, ...slotProps },
        };

        return (
          <SlotContentWrapper key={content.id} content={content}>
            <Component {...props} />
          </SlotContentWrapper>
        );
      })}
    </div>
  );
}

/**
 * Wrapper component for slot content with error boundary
 */
interface SlotContentWrapperProps {
  content: SlotContent;
  children: ReactNode;
}

class SlotContentWrapper extends React.Component<
  SlotContentWrapperProps,
  { hasError: boolean }
> {
  constructor(props: SlotContentWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[Slot] Error rendering content ${this.props.content.id} from plugin ${this.props.content.pluginId}:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      // Render nothing on error to prevent UI breakage
      return null;
    }
    return this.props.children;
  }
}

// ============================================================================
// Dialog Slot Component
// ============================================================================

interface DialogSlotProps {
  /** Currently active dialog ID */
  activeDialog: string | null;
  /** Dialog props */
  dialogProps?: Record<string, any>;
  /** Callback when dialog closes */
  onClose: () => void;
}

/**
 * Special slot for rendering plugin dialogs
 */
export function DialogSlot({
  activeDialog,
  dialogProps,
  onClose,
}: DialogSlotProps) {
  const { manager, getContext } = usePluginContextSystem();
  const [contents, setContents] = useState<SlotContent[]>([]);

  useEffect(() => {
    const updateContents = () => {
      // Get both 'dialogs' and 'add-source-dialog' slots
      const dialogContents = [
        ...manager.getSlotContents('dialogs'),
        ...manager.getSlotContents('add-source-dialog'),
      ];
      setContents(dialogContents);
    };

    updateContents();
    return manager.subscribeToSlots(updateContents);
  }, [manager]);

  if (!activeDialog) return null;

  // Find the matching dialog content
  const dialogContent = contents.find((c) => c.id === activeDialog);
  if (!dialogContent) return null;

  const context = getContext(dialogContent.pluginId);
  if (!context) return null;

  const Component = dialogContent.component;
  const props: SlotComponentProps = {
    context,
    props: {
      ...dialogContent.props,
      ...dialogProps,
      open: true,
      onClose,
    },
  };

  return <Component {...props} />;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if a slot has any content
 */
export function useSlotHasContent(slotName: SlotName): boolean {
  const { manager, state } = usePluginContextSystem();
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    const check = () => {
      const contents = manager.getSlotContents(slotName);
      const visible = contents.some((c) => !c.visible || c.visible(state));
      setHasContent(visible);
    };

    check();
    return manager.subscribeToSlots(check);
  }, [manager, slotName, state]);

  return hasContent;
}

/**
 * Hook to get slot content count
 */
export function useSlotContentCount(slotName: SlotName): number {
  const { manager, state } = usePluginContextSystem();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const check = () => {
      const contents = manager.getSlotContents(slotName);
      const visible = contents.filter((c) => !c.visible || c.visible(state));
      setCount(visible.length);
    };

    check();
    return manager.subscribeToSlots(check);
  }, [manager, slotName, state]);

  return count;
}
