import { useCallback, useEffect, useRef, useState } from 'react';

type UseResizablePanelOptions = {
  minHeight?: number;
  maxHeightRatio?: number;
  defaultHeight?: number;
  storageKey?: string;
};

type DragState = {
  startY: number;
  startHeight: number;
  maxHeight: number;
  previousCursor: string;
};

const DEFAULT_MIN_HEIGHT = 220;
const DEFAULT_MAX_HEIGHT_RATIO = 0.4;
const DEFAULT_HEIGHT = 220;
const DEFAULT_STORAGE_KEY = 'livemixer-bottom-bar-height';

export function useResizablePanel(options: UseResizablePanelOptions = {}) {
  const {
    minHeight = DEFAULT_MIN_HEIGHT,
    maxHeightRatio = DEFAULT_MAX_HEIGHT_RATIO,
    defaultHeight = DEFAULT_HEIGHT,
    storageKey = DEFAULT_STORAGE_KEY,
  } = options;

  const contentRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [maxBottomBarHeight, setMaxBottomBarHeight] = useState<number>(minHeight);
  const [bottomBarHeight, setBottomBarHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? Number.parseInt(saved, 10) : defaultHeight;
      const safeValue = Number.isFinite(parsed) ? parsed : defaultHeight;
      return Math.max(minHeight, safeValue);
    } catch {
      return Math.max(minHeight, defaultHeight);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, bottomBarHeight.toString());
    } catch {
      // Ignore storage failures (private mode, denied storage, etc.)
    }
  }, [bottomBarHeight, storageKey]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const safeRatio = Number.isFinite(maxHeightRatio)
      ? Math.min(Math.max(maxHeightRatio, 0), 1)
      : DEFAULT_MAX_HEIGHT_RATIO;

    const updateMaxHeight = () => {
      const nextMax = Math.max(minHeight, Math.floor(element.clientHeight * safeRatio));
      setMaxBottomBarHeight(nextMax);
      setBottomBarHeight(prev => Math.min(Math.max(prev, minHeight), nextMax));
    };

    updateMaxHeight();
    const observer = new ResizeObserver(updateMaxHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [maxHeightRatio, minHeight]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const delta = dragState.startY - event.clientY;
      const nextHeight = Math.min(
        dragState.maxHeight,
        Math.max(minHeight, dragState.startHeight + delta),
      );

      setBottomBarHeight(nextHeight);
    },
    [minHeight],
  );

  const handlePointerUp = useCallback(() => {
    const dragState = dragStateRef.current;
    if (dragState) {
      document.body.style.cursor = dragState.previousCursor;
    }

    dragStateRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;

      const element = contentRef.current;
      if (!element) return;

      event.preventDefault();

      const safeRatio = Number.isFinite(maxHeightRatio)
        ? Math.min(Math.max(maxHeightRatio, 0), 1)
        : DEFAULT_MAX_HEIGHT_RATIO;
      const nextMax = Math.max(minHeight, Math.floor(element.clientHeight * safeRatio));
      setMaxBottomBarHeight(nextMax);

      dragStateRef.current = {
        startY: event.clientY,
        startHeight: bottomBarHeight,
        maxHeight: nextMax,
        previousCursor: document.body.style.cursor,
      };

      document.body.style.cursor = 'row-resize';
      event.currentTarget.setPointerCapture(event.pointerId);
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    },
    [bottomBarHeight, handlePointerMove, handlePointerUp, maxHeightRatio, minHeight],
  );

  return {
    contentRef,
    bottomBarHeight,
    maxBottomBarHeight,
    handlePointerDown,
  };
}
