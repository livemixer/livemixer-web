import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProtocolData } from '../types/protocol';

// Maximum number of history entries to keep
const MAX_HISTORY_SIZE = 50;

// Create a default empty scene configuration
const createDefaultProtocolData = (sceneName = 'Scene 1'): ProtocolData => ({
  version: '1.0.0',
  metadata: {
    name: 'New Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  canvas: {
    width: 1920,
    height: 1080,
  },
  resources: {
    sources: [],
  },
  scenes: [
    {
      id: 'scene-1',
      name: sceneName,
      active: true,
      items: [],
    },
  ],
});

// Protocol store interface
interface ProtocolState {
  data: ProtocolData;
  past: ProtocolData[];
  future: ProtocolData[];
  canUndo: boolean;
  canRedo: boolean;
  updateData: (data: ProtocolData) => void;
  undo: () => void;
  redo: () => void;
  resetData: (sceneName?: string) => void;
}

// Create Zustand store
export const useProtocolStore = create<ProtocolState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: createDefaultProtocolData(),
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,

      // Update protocol data (pushes current state to history)
      updateData: (data) => {
        const currentData = get().data;
        const updatedData = {
          ...data,
          metadata: {
            ...data.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        const newPast = [...get().past, currentData];
        // Trim history if it exceeds max size
        if (newPast.length > MAX_HISTORY_SIZE) {
          newPast.shift();
        }
        set({
          data: updatedData,
          past: newPast,
          future: [],
          canUndo: true,
          canRedo: false,
        });
      },

      // Undo: restore previous state
      undo: () => {
        const { past, future, data } = get();
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        const newPast = past.slice(0, -1);
        set({
          data: previous,
          past: newPast,
          future: [data, ...future],
          canUndo: newPast.length > 0,
          canRedo: true,
        });
      },

      // Redo: restore next state
      redo: () => {
        const { past, future, data } = get();
        if (future.length === 0) return;
        const next = future[0];
        const newFuture = future.slice(1);
        set({
          data: next,
          past: [...past, data],
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0,
        });
      },

      // Reset protocol data
      resetData: (sceneName) => {
        const currentData = get().data;
        set({
          data: createDefaultProtocolData(sceneName),
          past: [...get().past, currentData],
          future: [],
          canUndo: true,
          canRedo: false,
        });
      },
    }),
    {
      name: 'livemixer-protocol',
      storage: createJSONStorage(() => localStorage),
      // Only persist the data field, not history stacks
      partialize: (state) => ({
        data: state.data,
      }),
    },
  ),
);
