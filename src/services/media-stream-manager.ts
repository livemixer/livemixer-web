/**
 * MediaStreamManager - Unified media stream management service
 * 
 * This service provides a central place to manage all media streams
 * used by plugins, avoiding direct coupling between App/Panel and
 * plugin internal implementations.
 * 
 * Design goals:
 * - Decouple: App.tsx and property-panel.tsx don't need to import plugin files
 * - Unified API: All plugins use the same interface to register/manage streams
 * - Extensible: Third-party plugins can also use stream management
 */

// ============================================================================
// Types
// ============================================================================

export interface MediaStreamEntry {
    stream: MediaStream;
    video?: HTMLVideoElement;
    metadata?: {
        deviceId?: string;
        deviceLabel?: string;
        sourceType: 'webcam' | 'screen' | 'media' | string;
        pluginId?: string;
    };
}

export interface PendingStreamData {
    stream: MediaStream;
    sourceType: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// MediaStreamManager Class
// ============================================================================

class MediaStreamManagerImpl {
    // Stream storage: itemId -> MediaStreamEntry
    private streams = new Map<string, MediaStreamEntry>();

    // Change listeners: itemId -> Set of callbacks
    private listeners = new Map<string, Set<() => void>>();

    // Pending stream for dialog -> app communication
    private pendingStream: PendingStreamData | null = null;

    // ============================================================================
    // Stream Management
    // ============================================================================

    /**
     * Register or update a stream for an item
     */
    setStream(itemId: string, entry: MediaStreamEntry): void {
        // Clean up old stream if exists
        const existing = this.streams.get(itemId);
        if (existing && existing.stream !== entry.stream) {
            // Don't stop the old stream - let the caller handle that
        }

        this.streams.set(itemId, entry);
        this.notifyStreamChange(itemId);
    }

    /**
     * Get stream entry for an item
     */
    getStream(itemId: string): MediaStreamEntry | null {
        return this.streams.get(itemId) || null;
    }

    /**
     * Remove stream for an item
     */
    removeStream(itemId: string): void {
        const entry = this.streams.get(itemId);
        if (entry) {
            // Stop all tracks
            entry.stream.getTracks().forEach(track => track.stop());

            // Remove video element from DOM if attached
            if (entry.video && entry.video.parentNode) {
                entry.video.parentNode.removeChild(entry.video);
            }

            this.streams.delete(itemId);
            this.notifyStreamChange(itemId);
        }
    }

    /**
     * Check if item has an active stream
     */
    hasStream(itemId: string): boolean {
        const entry = this.streams.get(itemId);
        return !!entry && entry.stream.active;
    }

    /**
     * Get all active streams
     */
    getAllStreams(): Map<string, MediaStreamEntry> {
        return new Map(this.streams);
    }

    // ============================================================================
    // Event System
    // ============================================================================

    /**
     * Subscribe to stream changes for an item
     * @returns Unsubscribe function
     */
    onStreamChange(itemId: string, callback: () => void): () => void {
        if (!this.listeners.has(itemId)) {
            this.listeners.set(itemId, new Set());
        }
        this.listeners.get(itemId)!.add(callback);

        return () => {
            this.listeners.get(itemId)?.delete(callback);
        };
    }

    /**
     * Notify listeners of stream change
     */
    notifyStreamChange(itemId: string): void {
        this.listeners.get(itemId)?.forEach(cb => {
            try {
                cb();
            } catch (err) {
                console.error('[MediaStreamManager] Error in stream change callback:', err);
            }
        });
    }

    // ============================================================================
    // Device Enumeration (Unified Entry Point)
    // ============================================================================

    /**
     * Get available video input devices with permission handling
     */
    async getVideoInputDevices(): Promise<MediaDeviceInfo[]> {
        try {
            // First try to enumerate without requesting permission
            let devices = await navigator.mediaDevices.enumerateDevices();
            let videoDevices = devices.filter(device => device.kind === 'videoinput');

            // Check if we have labels (indicates permission was granted)
            const hasLabels = videoDevices.some(d => d.label && d.label.length > 0);

            if (!hasLabels && videoDevices.length > 0) {
                // Permission not granted yet, request it
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    tempStream.getTracks().forEach(track => track.stop());

                    // Re-enumerate to get labels
                    devices = await navigator.mediaDevices.enumerateDevices();
                    videoDevices = devices.filter(device => device.kind === 'videoinput');
                } catch (permErr) {
                    console.warn('[MediaStreamManager] Could not get camera permission:', permErr);
                }
            }

            return videoDevices;
        } catch (err) {
            console.error('[MediaStreamManager] Error getting video devices:', err);
            return [];
        }
    }

    /**
     * Get available audio input devices with permission handling
     * Only requests getUserMedia permission when necessary
     */
    async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
        try {
            // First, try enumerate without requesting permission
            let devices = await navigator.mediaDevices.enumerateDevices();
            let audioDevices = devices.filter(device => device.kind === 'audioinput');

            // Check if we already have permission (devices have labels)
            const hasLabels = audioDevices.some(d => d.label && d.label.length > 0);

            // Only request permission if:
            // 1. We have devices but no labels (permission not granted yet)
            // 2. No devices found (might be hidden due to no permission)
            const needsPermission = (audioDevices.length > 0 && !hasLabels) || audioDevices.length === 0;

            if (needsPermission) {
                try {
                    const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const audioTrack = tempStream.getAudioTracks()[0];

                    // Save track info BEFORE stopping (for fallback)
                    const trackInfo = audioTrack ? {
                        deviceId: audioTrack.getSettings()?.deviceId || 'default',
                        label: audioTrack.label || 'Microphone'
                    } : null;

                    tempStream.getTracks().forEach(track => track.stop());

                    // Re-enumerate after permission grant
                    devices = await navigator.mediaDevices.enumerateDevices();
                    audioDevices = devices.filter(device => device.kind === 'audioinput');

                    // Fallback: if still no devices from enumerateDevices, use track info
                    if (audioDevices.length === 0 && trackInfo) {
                        const fallbackDevice = {
                            deviceId: trackInfo.deviceId,
                            kind: 'audioinput' as MediaDeviceKind,
                            label: trackInfo.label,
                            groupId: '',
                            toJSON: () => ({})
                        };
                        audioDevices = [fallbackDevice as MediaDeviceInfo];
                    }
                } catch (permErr) {
                    console.warn('[MediaStreamManager] Could not get microphone permission:', permErr);
                }
            }

            return audioDevices;
        } catch (err) {
            console.error('[MediaStreamManager] Error getting audio devices:', err);
            return [];
        }
    }

    /**
     * Get available audio output devices
     */
    async getAudioOutputDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audiooutput');
        } catch (err) {
            console.error('[MediaStreamManager] Error getting audio output devices:', err);
            return [];
        }
    }

    // ============================================================================
    // Pending Stream (Dialog -> App Communication)
    // ============================================================================

    /**
     * Set pending stream data (called by dialog before closing)
     */
    setPendingStream(data: PendingStreamData): void {
        this.pendingStream = data;
    }

    /**
     * Consume pending stream data (called by App when creating item)
     * Returns the data and clears it
     */
    consumePendingStream(): PendingStreamData | null {
        const data = this.pendingStream;
        this.pendingStream = null;
        return data;
    }

    /**
     * Check if there's a pending stream
     */
    hasPendingStream(): boolean {
        return this.pendingStream !== null;
    }

    // ============================================================================
    // Cleanup
    // ============================================================================

    /**
     * Stop and remove all streams
     */
    clearAll(): void {
        for (const [itemId] of this.streams) {
            this.removeStream(itemId);
        }
        this.pendingStream = null;
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const mediaStreamManager = new MediaStreamManagerImpl();
