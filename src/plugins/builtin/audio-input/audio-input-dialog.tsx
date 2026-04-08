import { Mic, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Label } from '../../../components/ui/label';
import { useI18n } from '../../../hooks/useI18n';
import type { AddDialogProps } from '../../../types/plugin-context';
import type { SceneItem } from '../../../types/protocol';
import { setPendingAudioInputStream } from './index';

// ============================================================================
// Types
// ============================================================================

interface LegacyAudioInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    deviceId: string,
    deviceLabel: string,
    stream: MediaStream,
  ) => void;
}

type AudioInputDialogProps = LegacyAudioInputDialogProps | AddDialogProps;

function isLegacyProps(
  props: AudioInputDialogProps,
): props is LegacyAudioInputDialogProps {
  return 'onOpenChange' in props;
}

// ============================================================================
// Audio Level Meter Component
// ============================================================================

interface AudioLevelMeterProps {
  stream: MediaStream | null;
}

function AudioLevelMeter({ stream }: AudioLevelMeterProps) {
  const [level, setLevel] = useState(0);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) {
      setLevel(0);
      return;
    }

    try {
      const audioCtx = new AudioContext();
      // Chrome autoplay policy may suspend AudioContext - must resume
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      ctxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setLevel(Math.min(100, (avg / 128) * 100));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    } catch {
      // AudioContext might not be available
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ctxRef.current?.close();
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [stream]);

  const bars = 20;
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const threshold = (i / bars) * 100;
        const active = level > threshold;
        const color =
          i < bars * 0.6
            ? active
              ? 'bg-green-500'
              : 'bg-green-900/40'
            : i < bars * 0.85
              ? active
                ? 'bg-yellow-500'
                : 'bg-yellow-900/40'
              : active
                ? 'bg-red-500'
                : 'bg-red-900/40';
        return (
          <div
            key={i}
            className={`flex-1 rounded-sm transition-colors duration-75 ${color}`}
            style={{ height: `${40 + (i / bars) * 60}%` }}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Dialog
// ============================================================================

export function AudioInputDialog(props: AudioInputDialogProps) {
  const { open } = props;
  const { t } = useI18n();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    previewStreamRef.current = previewStream;
  }, [previewStream]);

  // Load available audio input devices when dialog opens
  useEffect(() => {
    if (!open) return;

    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSelectedDeviceId('');

        // Request permission first - get device info BEFORE stopping
        const tempStream = await navigator.mediaDevices
          .getUserMedia({
            audio: true,
            video: false,
          })
          .catch((err) => {
            console.error('getUserMedia failed:', err);
            throw err;
          });
        const audioTrack = tempStream.getAudioTracks()[0];
        const trackSettings = audioTrack?.getSettings();
        const trackLabel = audioTrack?.label;

        // Stop the temp stream
        tempStream.getTracks().forEach((track) => track.stop());

        // Enumerate devices after permission grant
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        let audioDevices = allDevices.filter((d) => d.kind === 'audioinput');

        // Fallback: if enumerateDevices returned empty (common on some systems),
        // build a device entry from the stream track info
        if (audioDevices.length === 0 && audioTrack) {
          console.log(
            'No devices from enumerateDevices, using fallback from stream track',
          );
          const fallbackDevice = {
            deviceId: trackSettings?.deviceId || 'default',
            kind: 'audioinput' as MediaDeviceKind,
            label: trackLabel || 'Microphone',
            groupId: '',
            toJSON: () => ({}),
          };
          audioDevices = [fallbackDevice as MediaDeviceInfo];
        }

        if (audioDevices.length === 0) {
          setError(t('plugins.io.livemixer.audioinput.dialog.noDevices'));
        } else {
          // Sort: default and communications first, then physical devices
          audioDevices.sort((a, b) => {
            const priority = (d: MediaDeviceInfo) =>
              d.deviceId === 'default'
                ? 0
                : d.deviceId === 'communications'
                  ? 1
                  : 2;
            return priority(a) - priority(b);
          });
          setDevices(audioDevices);
          setSelectedDeviceId(audioDevices[0].deviceId);
        }
      } catch (err: any) {
        console.log('Failed to enumerate audio devices:', err);
        setError(err.message || 'Failed to access microphone');
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [open, t]);

  // Start preview stream when device is selected
  useEffect(() => {
    if (!open || !selectedDeviceId) return;

    const startPreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Stop previous stream using ref to avoid dependency cycle
        if (previewStreamRef.current) {
          previewStreamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          // Use 'ideal' instead of 'exact' to be more forgiving with fallback deviceIds
          audio: selectedDeviceId
            ? { deviceId: { ideal: selectedDeviceId } }
            : true,
          video: false,
        });

        setPreviewStream(stream);
      } catch (err: any) {
        console.error('Failed to start audio preview:', err);
        setError(err.message || 'Failed to access microphone');
      } finally {
        setIsLoading(false);
      }
    };

    startPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId, open]);

  // Cleanup on dialog close
  useEffect(() => {
    if (!open && previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
      setSelectedDeviceId('');
    }
  }, [open, previewStream]);

  const handleConfirm = () => {
    if (!selectedDeviceId || !previewStream) return;

    const device = devices.find((d) => d.deviceId === selectedDeviceId);
    const label = device?.label || 'Microphone';

    if (isLegacyProps(props)) {
      props.onConfirm(selectedDeviceId, label, previewStream);
      setPreviewStream(null);
      props.onOpenChange(false);
    } else {
      setPendingAudioInputStream({
        stream: previewStream,
        deviceId: selectedDeviceId,
        label,
      });
      setPreviewStream(null);
      props.onConfirm({ deviceId: selectedDeviceId } as Partial<SceneItem>);
      props.onClose();
    }
  };

  const handleCancel = () => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
    }
    if (isLegacyProps(props)) {
      props.onOpenChange(false);
    } else {
      props.onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="bg-linear-to-b from-neutral-850 to-neutral-900 border-neutral-700/50 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-400" />
            {t('plugins.io.livemixer.audioinput.dialog.title')}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {t('plugins.io.livemixer.audioinput.dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Device selector */}
          <div>
            <Label className="text-sm text-gray-300 mb-2 block">
              {t('plugins.io.livemixer.audioinput.dialog.device')}
            </Label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isLoading || devices.length === 0}
              className="w-full py-2.5 px-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
            >
              {devices.length === 0 ? (
                <option value="">
                  {t('plugins.io.livemixer.audioinput.dialog.noDevices')}
                </option>
              ) : (
                devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label ||
                      `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Audio level preview */}
          <div>
            <Label className="text-sm text-gray-300 mb-2 block">
              {t('plugins.io.livemixer.audioinput.dialog.preview')}
            </Label>
            <div className="p-4 bg-[#1a1a2e] border border-[#3e3e42] rounded-lg">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">
                    {t('plugins.io.livemixer.audioinput.dialog.loading')}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-400 py-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {!isLoading && !error && !previewStream && (
                <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                  <Mic className="w-5 h-5" />
                  <span className="text-sm">
                    {t(
                      'plugins.io.livemixer.audioinput.dialog.selectToPreview',
                    )}
                  </span>
                </div>
              )}

              {!isLoading && !error && previewStream && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 text-xs mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    {t('plugins.io.livemixer.audioinput.dialog.listening')}
                  </div>
                  <AudioLevelMeter stream={previewStream} />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              {t('plugins.io.livemixer.audioinput.dialog.cancel')}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedDeviceId || !previewStream || isLoading}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {t('plugins.io.livemixer.audioinput.dialog.confirm')}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
