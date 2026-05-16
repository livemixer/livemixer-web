import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface MainLayoutProps {
  logo?: ReactNode;
  toolbar?: ReactNode;
  userSection?: ReactNode;
  canvas?: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  bottomBar?: ReactNode;
  statusBar?: ReactNode;
}

// Bottom bar height constraints (px)
const BOTTOM_BAR_DEFAULT_HEIGHT = 224; // h-56 = 14rem
const BOTTOM_BAR_MIN_HEIGHT = 120;
const BOTTOM_BAR_MAX_RATIO = 0.75; // up to 75% of viewport height
const BOTTOM_BAR_HEIGHT_STORAGE_KEY = 'livemixer:bottomBarHeight';

function readStoredBottomBarHeight(): number {
  if (typeof window === 'undefined') return BOTTOM_BAR_DEFAULT_HEIGHT;
  try {
    const raw = window.localStorage.getItem(BOTTOM_BAR_HEIGHT_STORAGE_KEY);
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    if (Number.isFinite(parsed) && parsed >= BOTTOM_BAR_MIN_HEIGHT)
      return parsed;
  } catch {
    // ignore storage errors
  }
  return BOTTOM_BAR_DEFAULT_HEIGHT;
}

function clampBottomBarHeight(value: number): number {
  const max =
    typeof window !== 'undefined'
      ? Math.max(
          BOTTOM_BAR_MIN_HEIGHT,
          Math.floor(window.innerHeight * BOTTOM_BAR_MAX_RATIO),
        )
      : BOTTOM_BAR_DEFAULT_HEIGHT;
  return Math.min(Math.max(value, BOTTOM_BAR_MIN_HEIGHT), max);
}

export function MainLayout({
  logo,
  toolbar,
  userSection,
  canvas,
  leftSidebar,
  rightSidebar,
  bottomBar,
  statusBar,
}: MainLayoutProps) {
  const [bottomBarHeight, setBottomBarHeight] = useState<number>(() =>
    clampBottomBarHeight(readStoredBottomBarHeight()),
  );
  const [isResizing, setIsResizing] = useState(false);
  const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );

  // Persist height to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(
        BOTTOM_BAR_HEIGHT_STORAGE_KEY,
        String(bottomBarHeight),
      );
    } catch {
      // ignore storage errors
    }
  }, [bottomBarHeight]);

  // Re-clamp on viewport resize so the bottom bar never exceeds the window
  useEffect(() => {
    const handleWindowResize = () => {
      setBottomBarHeight((h) => clampBottomBarHeight(h));
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  // Drag-to-resize handlers
  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      const clientY =
        'touches' in e
          ? (e.touches[0]?.clientY ?? state.startY)
          : (e as MouseEvent).clientY;
      // Drag up => bottom bar grows; delta = startY - currentY
      const delta = state.startY - clientY;
      setBottomBarHeight(clampBottomBarHeight(state.startHeight + delta));
      if (e.cancelable) e.preventDefault();
    };
    const handleEnd = () => {
      dragStateRef.current = null;
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isResizing]);

  const handleResizerMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      dragStateRef.current = {
        startY: e.clientY,
        startHeight: bottomBarHeight,
      };
      setIsResizing(true);
      e.preventDefault();
    },
    [bottomBarHeight],
  );

  const handleResizerTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      dragStateRef.current = {
        startY: touch.clientY,
        startHeight: bottomBarHeight,
      };
      setIsResizing(true);
    },
    [bottomBarHeight],
  );

  const handleResizerDoubleClick = useCallback(() => {
    setBottomBarHeight(clampBottomBarHeight(BOTTOM_BAR_DEFAULT_HEIGHT));
  }, []);
  return (
    <div className="flex flex-col w-full h-full bg-linear-to-b from-neutral-900 via-neutral-850 to-neutral-950 text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="px-4 h-14 shrink-0 bg-neutral-900/80 backdrop-blur-sm border-b border-neutral-700/50 flex items-center gap-4 shadow-sm">
        {/* Logo area */}
        {logo && <div className="shrink-0">{logo}</div>}
        <div className="flex-1">{toolbar}</div>
        {/* User info area */}
        {userSection && <div className="shrink-0">{userSection}</div>}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left reserved area */}
        {leftSidebar && (
          <div className="w-80 shrink-0 bg-neutral-900/50 border-r border-neutral-700/30 flex flex-col overflow-hidden backdrop-blur-sm">
            {leftSidebar}
          </div>
        )}

        {/* Center canvas area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Canvas region */}
          <div className="flex-1 bg-linear-to-br from-neutral-900 via-neutral-850 to-neutral-900 flex items-center justify-center overflow-hidden min-h-0 relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 left-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
            </div>
            <div className="absolute inset-0 z-10">{canvas}</div>
          </div>
        </div>

        {/* Right sidebar */}
        {rightSidebar && (
          <div className="w-80 shrink-0 bg-neutral-900/50 border-l border-neutral-700/30 flex flex-col overflow-hidden backdrop-blur-sm">
            {rightSidebar}
          </div>
        )}
      </div>

      {/* Bottom area resizer (drag up/down to resize) */}
      {bottomBar && (
        <div
          onMouseDown={handleResizerMouseDown}
          onTouchStart={handleResizerTouchStart}
          onDoubleClick={handleResizerDoubleClick}
          className={`group relative h-1.5 shrink-0 cursor-ns-resize bg-neutral-700/40 hover:bg-primary-500/60 transition-colors ${
            isResizing ? 'bg-primary-500/80' : ''
          }`}
          title="Drag to resize the bottom panel (double-click to reset)"
        >
          {/* Visible grip handle */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-0.5 rounded-full bg-neutral-500/60 group-hover:bg-white/80" />
        </div>
      )}

      {/* Bottom area */}
      {bottomBar && (
        <div
          style={{ height: bottomBarHeight }}
          className="shrink-0 bg-neutral-900/80 border-t border-neutral-700/50 flex overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {bottomBar}
        </div>
      )}

      {/* Status bar */}
      {statusBar && statusBar}
    </div>
  );
}
