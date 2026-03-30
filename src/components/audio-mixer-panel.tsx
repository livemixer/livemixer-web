import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { mediaStreamManager } from '../services/media-stream-manager';
import type { SceneItem } from '../types/protocol';

// ============================================================================
// Audio Level Meter (vertical bar style, like OBS)
// ============================================================================

function AudioLevelMeter({ itemId }: { itemId: string }) {
    const [level, setLevel] = useState(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const ctxRef = useRef<AudioContext | null>(null);
    const animFrameRef = useRef<number>(0);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startMonitor = useCallback((stream: MediaStream) => {
        // Cleanup previous
        cancelAnimationFrame(animFrameRef.current);
        sourceRef.current?.disconnect();
        ctxRef.current?.close();

        try {
            const audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.3;
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            ctxRef.current = audioCtx;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
                analyser.getByteFrequencyData(dataArray);
                const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setLevel(Math.min(100, (avg / 128) * 100));
                animFrameRef.current = requestAnimationFrame(tick);
            };
            animFrameRef.current = requestAnimationFrame(tick);
        } catch {
            // AudioContext not available
        }
    }, []);

    useEffect(() => {
        const check = () => {
            const entry = mediaStreamManager.getStream(itemId);
            if (entry?.stream?.active) {
                startMonitor(entry.stream);
            } else {
                setLevel(0);
            }
        };
        check();
        const unsub = mediaStreamManager.onStreamChange(itemId, check);
        return () => {
            unsub();
            cancelAnimationFrame(animFrameRef.current);
            sourceRef.current?.disconnect();
            ctxRef.current?.close();
        };
    }, [itemId, startMonitor]);

    // Vertical level bar with green-yellow-red gradient
    const barHeight = 80;
    const filledHeight = (level / 100) * barHeight;
    const barColor = level > 85 ? '#ef4444' : level > 60 ? '#f59e0b' : '#22c55e';

    return (
        <div className="relative w-3 rounded-sm overflow-hidden bg-[#1a1a2e]" style={{ height: barHeight }}>
            <div
                className="absolute bottom-0 w-full rounded-sm transition-all duration-75"
                style={{ height: filledHeight, backgroundColor: barColor }}
            />
        </div>
    );
}

// ============================================================================
// Single Mixer Channel Strip
// ============================================================================

function MixerChannel({
    item,
    onUpdateItem,
}: {
    item: SceneItem;
    onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}) {
    const isMuted = item.muted ?? false;
    const volume = item.volume ?? 1;
    const entry = mediaStreamManager.getStream(item.id);
    const isActive = !!(entry?.stream?.active);
    const deviceLabel = entry?.metadata?.deviceLabel || item.deviceId || 'Mic';

    // Truncate label
    const shortLabel = deviceLabel.length > 16 ? `${deviceLabel.slice(0, 14)}...` : deviceLabel;

    const handleMuteToggle = () => {
        onUpdateItem?.(item.id, { muted: !isMuted });
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number.parseFloat(e.target.value);
        onUpdateItem?.(item.id, { volume: newVolume });
    };

    return (
        <div className="flex flex-col items-center gap-1.5 px-2 py-2 min-w-[56px]">
            {/* Device name */}
            <div className="text-[10px] text-gray-400 truncate w-full text-center" title={deviceLabel}>
                {shortLabel}
            </div>

            {/* Level meter + volume slider row */}
            <div className="flex items-center gap-1.5" style={{ height: 80 }}>
                <AudioLevelMeter itemId={item.id} />

                {/* Vertical volume slider */}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="audio-mixer-slider"
                    style={{
                        writingMode: 'vertical-lr',
                        direction: 'rtl',
                        height: 80,
                        width: 14,
                        accentColor: '#3b82f6',
                    }}
                    title={`${Math.round(volume * 100)}%`}
                />
            </div>

            {/* Volume percentage */}
            <div className="text-[10px] text-gray-500">{Math.round(volume * 100)}%</div>

            {/* Mute button */}
            <button
                type="button"
                onClick={handleMuteToggle}
                className={`p-1 rounded transition-colors ${isMuted
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'hover:bg-[#3e3e42] text-gray-400'
                    }`}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* Active indicator */}
            {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            )}
        </div>
    );
}

// ============================================================================
// Audio Mixer Panel
// ============================================================================

interface AudioMixerPanelProps {
    audioItems: SceneItem[];
    onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}

export function AudioMixerPanel({ audioItems, onUpdateItem }: AudioMixerPanelProps) {
    const { t } = useI18n();
    // Force re-render periodically to update active states
    const [, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setTick(v => v + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="px-4 py-2 border-b border-[#3e3e42] text-center">
                <h3 className="text-sm font-semibold text-gray-300">{t('mixer.title')}</h3>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden p-2">
                {audioItems.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Volume2 className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                            <span className="text-xs text-gray-500">{t('mixer.empty')}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-stretch h-full gap-1">
                        {audioItems.map(item => (
                            <MixerChannel key={item.id} item={item} onUpdateItem={onUpdateItem} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
