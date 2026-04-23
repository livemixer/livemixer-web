import type { SceneItem } from '../types/protocol';

interface ClipboardData {
    item: SceneItem;
    timestamp: number;
}

// Module-level clipboard (not persisted across sessions)
let clipboard: ClipboardData | null = null;

export const clipboardService = {
    /** Copy a scene item to the clipboard */
    copy(item: SceneItem): void {
        clipboard = {
            item: structuredClone(item),
            timestamp: Date.now(),
        };
    },

    /** Get the clipboard content (returns a deep clone) */
    get(): SceneItem | null {
        if (!clipboard) return null;
        return structuredClone(clipboard.item);
    },

    /** Check if clipboard has content */
    hasContent(): boolean {
        return clipboard !== null;
    },

    /** Clear the clipboard */
    clear(): void {
        clipboard = null;
    },
};
