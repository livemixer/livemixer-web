import {
  Link as LinkIcon,
  Lock,
  Mic,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Square,
  Upload,
  Video,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { mediaStreamManager } from '../services/media-stream-manager';
import { pluginRegistry } from '../services/plugin-registry';
import type { SceneItem } from '../types/protocol';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface PropertyPanelProps {
  selectedItem: SceneItem | null;
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}

// Audio Input Panel Component
function AudioInputPanel({
  localItem,
  isLocked,
  updateProperty,
  setLocalItem,
}: {
  localItem: SceneItem;
  isLocked: boolean;
  updateProperty: (updates: Partial<SceneItem>) => void;
  setLocalItem: (item: SceneItem) => void;
}) {
  const { t } = useI18n();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [_deviceChangeFlag, setDeviceChangeFlag] = useState(0);
  const hasManuallyStoppedRef = useRef(false);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // Check if stream is active
  useEffect(() => {
    const checkActive = () => {
      const entry = mediaStreamManager.getStream(localItem.id);
      const actuallyActive = !!entry?.stream?.active;
      setIsActive(actuallyActive);
      // Reset manual stop flag when stream becomes active again
      if (actuallyActive) {
        hasManuallyStoppedRef.current = false;
      }
    };
    checkActive();
    const interval = setInterval(checkActive, 1000);
    return () => clearInterval(interval);
  }, [localItem.id]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      if (!isActive) setDeviceChangeFlag((prev) => prev + 1);
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () =>
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange,
      );
  }, [isActive]);

  const loadDevices = useCallback(
    async (force = false) => {
      // Check actual stream state from mediaStreamManager (not React state which may be stale)
      const entry = mediaStreamManager.getStream(localItem.id);
      const actuallyActive = !!entry?.stream?.active;
      if (actuallyActive) {
        setIsLoadingDevices(false);
        return;
      }
      if (!force && devicesRef.current.length > 0) {
        setIsLoadingDevices(false);
        return;
      }

      // Only show loading spinner on initial load (no devices yet)
      const showLoading = devicesRef.current.length === 0;
      if (showLoading) setIsLoadingDevices(true);

      try {
        let audioDevices = await mediaStreamManager.getAudioInputDevices();

        // Fallback: if still no devices, try getUserMedia directly
        if (audioDevices.length === 0) {
          try {
            const tempStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
            });
            const audioTrack = tempStream.getAudioTracks()[0];

            // Save track info BEFORE stopping
            if (audioTrack) {
              const settings = audioTrack.getSettings();
              const fallbackDevice = {
                deviceId: settings?.deviceId || 'default',
                kind: 'audioinput' as MediaDeviceKind,
                label: audioTrack.label || 'Microphone',
                groupId: '',
                toJSON: () => ({}),
              };
              audioDevices = [fallbackDevice as MediaDeviceInfo];
            }
            tempStream.getTracks().forEach((track) => track.stop());
          } catch {
            // Ignore
          }
        }
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
      } catch (err) {
        console.error('Failed to load audio devices:', err);
      } finally {
        if (showLoading) setIsLoadingDevices(false);
      }
    },
    [localItem.id],
  );

  // Auto load when not active
  useEffect(() => {
    // Check actual stream state, not React state which may be stale after page refresh
    const entry = mediaStreamManager.getStream(localItem.id);
    const actuallyActive = !!entry?.stream?.active;
    if (!actuallyActive) loadDevices(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localItem.id, loadDevices]);

  // Reload devices when device change flag is triggered (e.g., after stopping capture)
  useEffect(() => {
    if (_deviceChangeFlag > 0 && !isActive) {
      loadDevices(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_deviceChangeFlag, isActive, loadDevices]);

  // Handle device change - defined before useEffect that uses it
  const handleDeviceChange = useCallback(
    async (newDeviceId: string) => {
      if (isLocked || isActive) return;

      setIsLoadingDevices(true);
      try {
        // Stop existing stream
        const existingEntry = mediaStreamManager.getStream(localItem.id);
        if (existingEntry) {
          existingEntry.stream.getTracks().forEach((track) => track.stop());
          mediaStreamManager.removeStream(localItem.id);
        }

        // Request new audio stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: newDeviceId ? { deviceId: { ideal: newDeviceId } } : true,
          video: false,
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) throw new Error('No audio track');

        const label =
          devices.find((d) => d.deviceId === newDeviceId)?.label ||
          audioTrack.label ||
          'Microphone';
        const actualDeviceId =
          audioTrack.getSettings()?.deviceId || newDeviceId;

        // Create audio element for monitoring
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.muted = localItem.muted ?? false;
        audio.volume = localItem.volume ?? 1;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        audio.play().catch(() => {});

        mediaStreamManager.setStream(localItem.id, {
          stream,
          metadata: {
            deviceId: actualDeviceId,
            deviceLabel: label,
            sourceType: 'audio_input',
          },
        });

        audioTrack.onended = () => {
          mediaStreamManager.removeStream(localItem.id);
          setIsActive(false);
        };

        updateProperty({ deviceId: actualDeviceId });
        mediaStreamManager.notifyStreamChange(localItem.id);
        setLocalItem({ ...localItem, deviceId: actualDeviceId });
        setIsActive(true);
      } catch (err) {
        console.error('Failed to switch audio device:', err);
      } finally {
        setIsLoadingDevices(false);
      }
    },
    [isLocked, isActive, localItem, devices, updateProperty, setLocalItem],
  );

  // Auto-select single device in dropdown (but don't auto-start capture)
  useEffect(() => {
    if (
      !localItem.deviceId &&
      devices.length === 1 &&
      !isActive &&
      !hasManuallyStoppedRef.current
    ) {
      // Only auto-select the device in dropdown, don't start capture
      const deviceId = devices[0].deviceId;
      updateProperty({ deviceId });
      setLocalItem({ ...localItem, deviceId });
    }
  }, [devices, localItem, isActive, updateProperty, setLocalItem]);

  const handleStopCapture = () => {
    const existingEntry = mediaStreamManager.getStream(localItem.id);
    if (existingEntry) {
      existingEntry.stream.getTracks().forEach((track) => track.stop());
      mediaStreamManager.removeStream(localItem.id);
    }
    setIsActive(false);
    hasManuallyStoppedRef.current = true;
    mediaStreamManager.notifyStreamChange(localItem.id);
    // Force reload devices after stopping
    setDevices([]);
    setDeviceChangeFlag((prev) => prev + 1);
  };

  return (
    <div className="border-t border-[#3e3e42] pt-4">
      <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-blue-500 rounded"></span>
        {t('property.audioInputSource')}
      </h4>

      {/* Current device info - use actual stream state, not React state */}
      {(() => {
        const entry = mediaStreamManager.getStream(localItem.id);
        const actuallyActive = !!entry?.stream?.active;
        return (
          <div className="mb-4 p-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg">
            <div className="text-xs text-gray-400 mb-1">
              {t('property.currentSource')}
            </div>
            <div className="text-sm text-gray-200 flex items-center gap-2">
              <Mic
                className={`w-4 h-4 ${actuallyActive ? 'text-blue-400' : 'text-gray-500'}`}
              />
              <span className="truncate">
                {actuallyActive && entry?.metadata?.deviceLabel
                  ? entry.metadata.deviceLabel
                  : t('property.noActiveCapture')}
              </span>
              {actuallyActive && (
                <span className="ml-auto shrink-0 text-xs text-blue-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {t('property.capturing')}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Device selector (only when not active) */}
      {!isActive && (
        <div className="mb-4">
          <span className="block text-xs text-gray-400 mb-2">
            {t('property.selectDevice')}
          </span>
          {devices.length === 0 ? (
            <p className="text-xs text-gray-500">{t('property.noDevices')}</p>
          ) : (
            <>
              <select
                value={localItem.deviceId || ''}
                onChange={(e) => {
                  const deviceId = e.target.value;
                  updateProperty({ deviceId });
                  setLocalItem({ ...localItem, deviceId });
                }}
                disabled={isLocked || isLoadingDevices}
                className="w-full py-2 px-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                {isLoadingDevices && (
                  <option value="">{t('property.loadingDevices')}</option>
                )}
                {!localItem.deviceId && !isLoadingDevices && (
                  <option value="">{t('property.selectDevice')}</option>
                )}
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>

              {/* Start capture button when device is selected but not active */}
              {localItem.deviceId && !isActive && (
                <button
                  type="button"
                  onClick={() => handleDeviceChange(localItem.deviceId!)}
                  disabled={isLocked}
                  className="w-full mt-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>{t('property.startCapture')}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Stop button when active */}
      {isActive && (
        <button
          type="button"
          onClick={handleStopCapture}
          disabled={isLocked}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <Square className="w-4 h-4" />
          <span>{t('property.stopCapture')}</span>
        </button>
      )}
    </div>
  );
}

// Video Input Panel Component
function VideoInputPanel({
  localItem,
  isLocked,
  updateProperty,
  setLocalItem,
}: {
  localItem: SceneItem;
  isLocked: boolean;
  updateProperty: (updates: Partial<SceneItem>) => void;
  setLocalItem: (item: SceneItem) => void;
}) {
  const { t } = useI18n();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [deviceChangeFlag, setDeviceChangeFlag] = useState(0);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // Check if stream is active
  useEffect(() => {
    const checkActive = () => {
      const entry = mediaStreamManager.getStream(localItem.id);
      setIsActive(!!entry && entry.stream.active);
    };
    checkActive();
    // Check periodically
    const interval = setInterval(checkActive, 1000);
    return () => clearInterval(interval);
  }, [localItem.id]);

  // Listen for device changes (e.g., user plugs in a new device)
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log('Device change detected');
      if (!isActive) {
        setDeviceChangeFlag((prev) => prev + 1); // Trigger reload
      }
    };
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange,
      );
    };
  }, [isActive]);

  const loadDevices = useCallback(
    async (force = false, clearOnFail = false) => {
      if (isActive) return; // Don't load if stream is active
      // Skip if we already have devices and not forcing reload
      if (!force && devicesRef.current.length > 0) {
        console.log(
          'Skipping loadDevices, already have devices:',
          devicesRef.current.length,
        );
        return;
      }
      setIsLoadingDevices(true);
      try {
        let videoDevices = await mediaStreamManager.getVideoInputDevices();

        // If no devices found, try to get one via getUserMedia and extract info
        if (videoDevices.length === 0) {
          try {
            console.log(
              'No devices from enumerateDevices, trying getUserMedia fallback...',
            );
            const tempStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            const videoTrack = tempStream.getVideoTracks()[0];

            if (videoTrack) {
              const settings = videoTrack.getSettings();
              const fallbackDevice = {
                deviceId: settings.deviceId || 'default',
                kind: 'videoinput' as MediaDeviceKind,
                label: videoTrack.label || 'Camera',
                groupId: '',
                toJSON: () => ({}),
              };
              console.log('Using fallback device from stream:', fallbackDevice);
              videoDevices = [fallbackDevice as MediaDeviceInfo];
            }

            // Stop the temp stream
            tempStream.getTracks().forEach((track) => track.stop());
          } catch (fallbackErr) {
            console.warn('Fallback getUserMedia also failed:', fallbackErr);
            // Keep existing devices only if not clearing on fail (e.g., device was unplugged)
            if (!clearOnFail && devicesRef.current.length > 0) {
              console.log('Keeping existing devices');
              setIsLoadingDevices(false);
              return;
            }
            // Device was unplugged, clear the list
            console.log('Clearing devices (device likely unplugged)');
          }
        }

        console.log('Setting devices:', videoDevices.length, videoDevices);
        setDevices(videoDevices);
      } catch (err) {
        console.error('Failed to load devices:', err);
      } finally {
        setIsLoadingDevices(false);
      }
    },
    [isActive],
  );

  // Debug: log devices state changes
  useEffect(() => {
    console.log(
      'Devices state updated:',
      devices.length,
      'isActive:',
      isActive,
    );
  }, [devices, isActive]);

  useEffect(() => {
    if (!isActive) {
      loadDevices(true); // Force reload when stream stops
    }
  }, [isActive, loadDevices]);

  // Reload devices when device change is detected
  useEffect(() => {
    if (deviceChangeFlag > 0 && !isActive) {
      console.log('Reloading devices due to device change...');
      loadDevices(true, true); // Force reload and clear on fail (device may be unplugged)
    }
  }, [deviceChangeFlag, isActive, loadDevices]);

  const handleStopStream = () => {
    const entry = mediaStreamManager.getStream(localItem.id);
    if (entry) {
      mediaStreamManager.removeStream(localItem.id);
      setIsActive(false);
      // Clear deviceId so user can select again
      updateProperty({ deviceId: '' });
      setLocalItem({ ...localItem, deviceId: '' });
    }
  };

  const handleDeviceChange = async (newDeviceId: string) => {
    if (!newDeviceId || isActive) return;

    try {
      // Request new stream with selected device
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: newDeviceId } },
        audio: true,
      });
      const videoTrack = stream.getVideoTracks()[0];
      const label = videoTrack?.label || 'Webcam';

      // Create video element and cache
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = localItem.muted ?? true;
      video.volume = localItem.volume ?? 1;
      video.style.display = 'none';
      document.body.appendChild(video);
      video.play().catch(() => {});
      mediaStreamManager.setStream(localItem.id, {
        stream,
        video,
        metadata: {
          deviceId: newDeviceId,
          deviceLabel: label,
          sourceType: 'webcam',
        },
      });

      // Handle stream end
      videoTrack.onended = () => {
        mediaStreamManager.removeStream(localItem.id);
        setIsActive(false);
      };

      // Update item and notify plugin
      updateProperty({ deviceId: newDeviceId });
      mediaStreamManager.notifyStreamChange(localItem.id);
      setLocalItem({ ...localItem, deviceId: newDeviceId });
      setIsActive(true);
    } catch (err) {
      console.error('Failed to start device:', err);
    }
  };

  const entry = mediaStreamManager.getStream(localItem.id);

  return (
    <div className="border-t border-[#3e3e42] pt-4">
      <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-purple-500 rounded"></span>
        {t('property.videoInputSource')}
      </h4>

      {/* Current source info */}
      <div className="mb-4 p-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg">
        <div className="text-xs text-gray-400 mb-1">
          {t('property.currentSource')}
        </div>
        <div className="text-sm text-gray-200 flex items-center gap-2">
          <Video
            className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-gray-500'}`}
          />
          <span className="truncate flex-1">
            {isActive && entry?.metadata?.deviceLabel
              ? entry.metadata.deviceLabel
              : t('property.noActiveCapture')}
          </span>
          {isActive && (
            <span className="text-xs text-green-500 bg-green-500/20 px-2 py-0.5 rounded">
              Live
            </span>
          )}
        </div>
      </div>

      {/* Stop button - only show when active */}
      {isActive && (
        <button
          type="button"
          onClick={handleStopStream}
          disabled={isLocked}
          className="w-full mb-4 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Square className="w-4 h-4" />
          <span>{t('property.stopCapture')}</span>
        </button>
      )}

      {/* Device selector */}
      <div className="mb-4">
        <Label className="text-xs text-gray-400 mb-2 block">
          {t('property.selectDevice')}
        </Label>
        <select
          value={localItem.deviceId || ''}
          onChange={(e) => handleDeviceChange(e.target.value)}
          onFocus={() => loadDevices()}
          disabled={isLocked || isLoadingDevices || isActive}
          className={`w-full py-2 px-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 ${isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {isActive
              ? t('property.stopToChangeDevice')
              : isLoadingDevices
                ? 'Loading...'
                : devices.length === 0
                  ? 'No devices found'
                  : t('property.selectDevice')}
          </option>
          {!isActive &&
            devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Device ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
        </select>
        {isActive && (
          <p className="text-xs text-yellow-500 mt-1">
            {t('property.stopToChangeDevice')}
          </p>
        )}
      </div>
    </div>
  );
}

export function PropertyPanel({
  selectedItem,
  onUpdateItem,
}: PropertyPanelProps) {
  const { t } = useI18n();
  const [localItem, setLocalItem] = useState<SceneItem | null>(selectedItem);
  const [urlInputMethod, setUrlInputMethod] = useState<'file' | 'url'>('url');

  // Keep localItem in sync with any changes to selectedItem
  useEffect(() => {
    setLocalItem(selectedItem);
  }, [selectedItem]);

  // Auto-detect input method based on URL type
  useEffect(() => {
    if (localItem?.url?.startsWith('blob:')) {
      setUrlInputMethod('file');
    } else {
      setUrlInputMethod('url');
    }
  }, [localItem?.url]);

  if (!selectedItem || !localItem) {
    return (
      <div className="h-full p-4 flex items-center justify-center text-gray-500 text-sm">
        {t('property.noSelection')}
      </div>
    );
  }

  const isLocked = localItem.locked === true;

  const updateProperty = (updates: Partial<SceneItem>) => {
    // Disallow edits while locked
    if (isLocked) return;

    const newItem = {
      ...localItem,
      ...updates,
      layout: updates.layout
        ? { ...localItem.layout, ...updates.layout }
        : localItem.layout,
      transform: updates.transform
        ? { ...localItem.transform, ...updates.transform }
        : localItem.transform,
    };
    setLocalItem(newItem);
    onUpdateItem?.(selectedItem.id, updates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateProperty({ url });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-neutral-900 to-neutral-850">
      <div className="p-4 border-b border-neutral-700/50 bg-neutral-900/80 sticky top-0 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-white">
          {t('property.title')}
        </h3>
      </div>

      {/* Locked item notice */}
      {isLocked && (
        <div className="mx-4 mt-4 p-3 bg-error-500/10 border border-error-500/30 rounded-lg flex items-center gap-2 text-sm text-error-400">
          <Lock className="w-4 h-4" />
          <span>{t('property.locked')}</span>
        </div>
      )}

      <div className="p-4 space-y-6">
        {/* Basic info */}
        <div className="space-y-4">
          <div>
            <Label className="block mb-2">{t('property.elementId')}</Label>
            <div className="text-sm text-neutral-300 bg-neutral-800/50 px-3 py-2 rounded-lg border border-neutral-700/50">
              {localItem.id}
            </div>
          </div>

          <div>
            <Label className="block mb-2">{t('property.type')}</Label>
            <div className="text-sm text-neutral-300 bg-neutral-800/50 px-3 py-2 rounded-lg border border-neutral-700/50 capitalize">
              {localItem.type}
            </div>
          </div>

          <div>
            <Label htmlFor="zIndex" className="block mb-2">
              {t('property.zIndex')}
            </Label>
            <Input
              id="zIndex"
              type="number"
              value={localItem.zIndex}
              onChange={(e) =>
                updateProperty({
                  zIndex: Number.parseInt(e.target.value, 10) || 0,
                })
              }
              disabled={isLocked}
            />
          </div>
        </div>

        {/* Position and size */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            {t('property.positionAndSize')}
          </h4>

          <div className="grid grid-cols-2 gap-x-3 gap-y-4">
            <div>
              <Label htmlFor="x" className="block mb-2">
                {t('property.x')}
              </Label>
              <Input
                id="x"
                type="number"
                value={Math.round(localItem.layout.x)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      x: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="y" className="block mb-2">
                {t('property.y')}
              </Label>
              <Input
                id="y"
                type="number"
                value={Math.round(localItem.layout.y)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      y: Number.parseFloat(e.target.value) || 0,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="width" className="block mb-2">
                {t('property.width')}
              </Label>
              <Input
                id="width"
                type="number"
                value={Math.round(localItem.layout.width)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      width: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
            <div>
              <Label htmlFor="height" className="block mb-2">
                {t('property.height')}
              </Label>
              <Input
                id="height"
                type="number"
                value={Math.round(localItem.layout.height)}
                onChange={(e) =>
                  updateProperty({
                    layout: {
                      ...localItem.layout,
                      height: Number.parseFloat(e.target.value) || 1,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>
          </div>
        </div>

        {/* Transform */}
        <div className="border-t border-[#3e3e42] pt-4">
          <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-500 rounded"></span>
            {t('property.transform')}
          </h4>

          <div className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="opacity" className="text-xs">
                  {t('property.opacity')}
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {((localItem.transform?.opacity ?? 1) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={1}
                step={0.01}
                value={[localItem.transform?.opacity ?? 1]}
                onValueChange={(value) =>
                  updateProperty({ transform: { opacity: value[0] } })
                }
                disabled={isLocked}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label htmlFor="rotation" className="text-xs">
                  {t('property.rotation')}
                </Label>
                <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                  {Math.round(localItem.transform?.rotation ?? 0)}°
                </span>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[localItem.transform?.rotation ?? 0]}
                onValueChange={(value) =>
                  updateProperty({ transform: { rotation: value[0] } })
                }
                disabled={isLocked}
              />
            </div>

            {(localItem.type === 'window' ||
              localItem.type === 'scene_ref' ||
              localItem.type === 'color') && (
              <div>
                <Label htmlFor="borderRadius" className="block mb-2">
                  {t('property.borderRadius')}
                </Label>
                <Input
                  id="borderRadius"
                  type="number"
                  value={localItem.transform?.borderRadius ?? 0}
                  onChange={(e) =>
                    updateProperty({
                      transform: {
                        borderRadius: Number.parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="0"
                  disabled={isLocked}
                />
              </div>
            )}
          </div>
        </div>

        {/* --- Plugin: dynamically render plugin props --- */}
        {(() => {
          const plugin = pluginRegistry.getPluginBySourceType(localItem.type);

          if (plugin?.propsSchema) {
            // Get excluded keys from plugin config or use defaults
            const defaultExcludes = ['url', 'deviceId'];
            const pluginExcludes =
              plugin.propertyPanel?.excludeSchemaKeys ?? [];
            const excludedKeys = [...defaultExcludes, ...pluginExcludes];

            const schemaEntries = Object.entries(plugin.propsSchema).filter(
              ([key]) => !excludedKeys.includes(key),
            );
            if (schemaEntries.length === 0) return null;

            return (
              <div className="border-t border-[#3e3e42] pt-4">
                <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
                  <span className="w-1 h-4 bg-purple-500 rounded"></span>
                  {t('property.pluginProps', { name: plugin.name })}
                </h4>
                <div className="space-y-4">
                  {schemaEntries.map(([key, schema]) => {
                    if (schema.type === 'number') {
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-3">
                            <Label className="text-xs">
                              {schema.labelKey
                                ? t(schema.labelKey)
                                : schema.label}
                            </Label>
                            <span className="text-xs text-gray-300 font-mono bg-[#1e1e1e] px-2 py-1 rounded border border-[#3e3e42]">
                              {localItem[key as keyof SceneItem] ||
                                schema.defaultValue}
                            </span>
                          </div>
                          <Slider
                            min={schema.min ?? 0}
                            max={schema.max ?? 100}
                            step={schema.step ?? 1}
                            value={[
                              Number(
                                localItem[key as keyof SceneItem] ??
                                  schema.defaultValue,
                              ),
                            ]}
                            onValueChange={(value) =>
                              updateProperty({ [key]: value[0] })
                            }
                            disabled={isLocked}
                          />
                        </div>
                      );
                    }
                    if (
                      schema.type === 'image' ||
                      schema.type === 'string' ||
                      schema.type === 'video'
                    ) {
                      return (
                        <div key={key}>
                          <Label className="block mb-2">
                            {schema.labelKey
                              ? t(schema.labelKey)
                              : schema.label}
                          </Label>
                          <Input
                            type="text"
                            value={
                              localItem[key as keyof SceneItem] ||
                              schema.defaultValue
                            }
                            onChange={(e) =>
                              updateProperty({ [key]: e.target.value })
                            }
                            disabled={isLocked}
                          />
                        </div>
                      );
                    }
                    if (schema.type === 'boolean') {
                      const boolVal =
                        localItem[key as keyof SceneItem] ??
                        schema.defaultValue;
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between"
                        >
                          <Label className="text-xs">
                            {schema.labelKey
                              ? t(schema.labelKey)
                              : schema.label}
                          </Label>
                          <button
                            type="button"
                            onClick={() =>
                              !isLocked && updateProperty({ [key]: !boolVal })
                            }
                            disabled={isLocked}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              boolVal ? 'bg-primary-500' : 'bg-[#3e3e42]'
                            } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                boolVal ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          }
          return null;
        })()}
        {/* ------------------------------------ */}

        {/* Screen Capture control panel */}
        {localItem.type === 'screen_capture' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-green-500 rounded"></span>
              {t('property.screenCaptureSource')}
            </h4>

            {/* Current source info */}
            <div className="mb-4 p-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg">
              <div className="text-xs text-gray-400 mb-1">
                {t('property.currentSource')}
              </div>
              <div className="text-sm text-gray-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-green-500" />
                <span className="truncate">
                  {(() => {
                    const entry = mediaStreamManager.getStream(localItem.id);
                    if (entry?.metadata?.deviceLabel) {
                      return entry.metadata.deviceLabel;
                    }
                    return t('property.noActiveCapture');
                  })()}
                </span>
              </div>
            </div>

            {/* Re-select button */}
            <button
              type="button"
              onClick={async () => {
                if (isLocked) return;
                try {
                  // Stop current stream if exists
                  const existingEntry = mediaStreamManager.getStream(
                    localItem.id,
                  );
                  if (existingEntry) {
                    mediaStreamManager.removeStream(localItem.id);
                  }
                  // Request new screen capture
                  const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                      displaySurface: 'monitor',
                    } as MediaTrackConstraints,
                    audio: false,
                  });
                  const videoTrack = stream.getVideoTracks()[0];
                  const title = videoTrack?.label || 'Screen/Window Capture';
                  // Create video element and cache
                  const video = document.createElement('video');
                  video.srcObject = stream;
                  video.playsInline = true;
                  video.muted = true;
                  video.style.display = 'none';
                  document.body.appendChild(video);
                  video.play().catch(() => {});
                  mediaStreamManager.setStream(localItem.id, {
                    stream,
                    video,
                    metadata: { sourceType: 'screen', deviceLabel: title },
                  });
                  // Handle stream end
                  videoTrack.onended = () => {
                    mediaStreamManager.removeStream(localItem.id);
                  };
                  // Notify plugin to update
                  mediaStreamManager.notifyStreamChange(localItem.id);
                  // Force refresh
                  setLocalItem({ ...localItem });
                } catch (_err) {
                  console.log('Screen capture selection cancelled');
                }
              }}
              disabled={isLocked}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              <span>{t('property.reselectSource')}</span>
            </button>
          </div>
        )}

        {/* Video Input control panel */}
        {localItem.type === 'video_input' && (
          <VideoInputPanel
            localItem={localItem}
            isLocked={isLocked}
            updateProperty={updateProperty}
            setLocalItem={setLocalItem}
          />
        )}

        {/* Audio Input control panel */}
        {localItem.type === 'audio_input' && (
          <AudioInputPanel
            localItem={localItem}
            isLocked={isLocked}
            updateProperty={updateProperty}
            setLocalItem={setLocalItem}
          />
        )}

        {/* Image and media source URL editor - moved above plugin props for better UX */}
        {(localItem.type === 'image' || localItem.type === 'media') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {localItem.type === 'image'
                ? t('property.imageSource')
                : t('property.mediaSource')}
            </h4>

            {/* Input method selection */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setUrlInputMethod('url')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                  urlInputMethod === 'url'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
              <button
                type="button"
                onClick={() => setUrlInputMethod('file')}
                disabled={isLocked}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm flex items-center justify-center gap-2 ${
                  urlInputMethod === 'file'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{t('property.localFile')}</span>
              </button>
            </div>

            {/* URL input */}
            {urlInputMethod === 'url' && (
              <div>
                <Label htmlFor="url" className="block mb-2">
                  {localItem.type === 'image'
                    ? t('property.imageUrl')
                    : t('property.mediaUrl')}
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={localItem.url || ''}
                  onChange={(e) => updateProperty({ url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLocked}
                />
              </div>
            )}

            {/* File upload */}
            {urlInputMethod === 'file' && (
              <div>
                {/* Current file display - moved above select button */}
                {localItem.url && (
                  <div className="mb-3 p-2.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg">
                    <div className="text-xs text-gray-400 mb-1">
                      {t('property.current')}
                    </div>
                    <div className="text-xs text-blue-400 font-mono break-all">
                      {localItem.url.startsWith('blob:')
                        ? `${localItem.url.substring(0, 30)}... (Local File)`
                        : localItem.url.length > 50
                          ? `${localItem.url.substring(0, 50)}...`
                          : localItem.url}
                    </div>
                  </div>
                )}
                <Label htmlFor="file-upload" className="block mb-2">
                  {t('property.selectFile')}
                </Label>
                <div className="relative">
                  <Input
                    id="file-upload"
                    type="file"
                    accept={
                      localItem.type === 'image' ? 'image/*' : 'video/*,audio/*'
                    }
                    onChange={handleFileChange}
                    disabled={isLocked}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg transition-colors text-sm text-gray-300 ${
                      isLocked
                        ? 'cursor-not-allowed opacity-50'
                        : 'cursor-pointer hover:bg-[#2d2d30]'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {t('property.clickToSelect', {
                        type:
                          localItem.type === 'image'
                            ? t('property.image')
                            : t('property.media'),
                      })}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Type-specific props */}
        {localItem.type === 'color' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {t('property.color')}
            </h4>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={localItem.color || '#000000'}
                onChange={(e) => updateProperty({ color: e.target.value })}
                className="w-14 h-10 p-1 cursor-pointer"
                disabled={isLocked}
              />
              <Input
                type="text"
                value={localItem.color || '#000000'}
                onChange={(e) => updateProperty({ color: e.target.value })}
                className="flex-1"
                placeholder="#000000"
                disabled={isLocked}
              />
            </div>
          </div>
        )}

        {localItem.type === 'text' && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {t('property.text')}
            </h4>

            <div className="space-y-4">
              <div>
                <Label htmlFor="content" className="block mb-2">
                  {t('property.content')}
                </Label>
                <textarea
                  id="content"
                  value={localItem.content || ''}
                  onChange={(e) => updateProperty({ content: e.target.value })}
                  placeholder={t('property.contentPlaceholder')}
                  className="flex min-h-[80px] w-full rounded-md border border-[#3e3e42] bg-[#1e1e1e] px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  rows={3}
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="fontSize" className="block mb-2">
                  {t('property.fontSize')}
                </Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={localItem.properties?.fontSize || 16}
                  onChange={(e) =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        fontSize: Number.parseFloat(e.target.value) || 16,
                      },
                    })
                  }
                  placeholder="16"
                  disabled={isLocked}
                />
              </div>

              <div>
                <Label htmlFor="textColor" className="block mb-2">
                  {t('property.textColor')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={(e) =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="w-14 h-10 p-1 cursor-pointer"
                    disabled={isLocked}
                  />
                  <Input
                    type="text"
                    value={localItem.properties?.color || '#FFFFFF'}
                    onChange={(e) =>
                      updateProperty({
                        properties: {
                          ...localItem.properties,
                          color: e.target.value,
                        },
                      })
                    }
                    className="flex-1"
                    placeholder="#FFFFFF"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {(localItem.type === 'window' || localItem.type === 'screen') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {t('property.mediaSource')}
            </h4>
            <Label htmlFor="source" className="block mb-2">
              {t('property.sourceUrl')}
            </Label>
            <Input
              id="source"
              type="text"
              value={localItem.source || ''}
              onChange={(e) => updateProperty({ source: e.target.value })}
              placeholder={t('property.sourceUrlPlaceholder')}
              disabled={isLocked}
            />
          </div>
        )}

        {/* 定时器/时钟控制 */}
        {(localItem.type === 'timer' || localItem.type === 'clock') && (
          <div className="border-t border-[#3e3e42] pt-4">
            <h4 className="text-xs font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-500 rounded"></span>
              {localItem.type === 'timer'
                ? t('property.timerControls')
                : t('property.clockSettings')}
            </h4>

            {localItem.type === 'timer' && localItem.timerConfig && (
              <>
                {/* Control buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      const config = localItem.timerConfig!;
                      if (config.running) {
                        // Pause
                        const now = performance.now() / 1000;
                        let pausedAt = 0;

                        if (
                          config.mode === 'countdown' &&
                          config.startTime &&
                          config.duration
                        ) {
                          const elapsed = now - config.startTime;
                          pausedAt = Math.max(0, config.duration - elapsed);
                        } else if (
                          config.mode === 'countup' &&
                          config.startTime
                        ) {
                          pausedAt =
                            now - config.startTime + (config.startValue || 0);
                        }

                        updateProperty({
                          timerConfig: {
                            ...config,
                            running: false,
                            pausedAt,
                            startTime: undefined,
                          },
                        });
                      } else {
                        // Start or resume
                        const now = performance.now() / 1000;
                        let startTime = now;

                        if (
                          config.mode === 'countdown' &&
                          config.pausedAt !== undefined
                        ) {
                          // Resume from paused position
                          startTime = now;
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              duration: config.pausedAt,
                              pausedAt: undefined,
                            },
                          });
                        } else if (
                          config.mode === 'countup' &&
                          config.pausedAt !== undefined
                        ) {
                          // Count-up resume from pause
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              startValue: config.pausedAt,
                              pausedAt: undefined,
                            },
                          });
                        } else {
                          updateProperty({
                            timerConfig: {
                              ...config,
                              running: true,
                              startTime,
                              pausedAt: undefined,
                            },
                          });
                        }
                      }
                    }}
                    disabled={isLocked}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {localItem.timerConfig.running ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>{t('property.pause')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>{t('property.start')}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const config = localItem.timerConfig!;
                      updateProperty({
                        timerConfig: {
                          ...config,
                          running: false,
                          currentTime:
                            config.mode === 'countdown'
                              ? config.duration
                              : config.startValue,
                          startTime: undefined,
                          pausedAt: undefined,
                        },
                      });
                    }}
                    disabled={isLocked}
                    className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2d2d30] disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-[#3e3e42] flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('property.reset')}</span>
                  </button>
                </div>

                {/* Mode display */}
                <div className="mb-4">
                  <Label className="block mb-2">{t('property.mode')}</Label>
                  <div className="text-sm text-gray-300 bg-[#1e1e1e] px-3 py-2 rounded border border-[#3e3e42] capitalize">
                    {localItem.timerConfig.mode === 'countdown'
                      ? t('property.countdown')
                      : t('property.countup')}
                  </div>
                </div>

                {/* Countdown duration */}
                {localItem.timerConfig.mode === 'countdown' && (
                  <div className="mb-4">
                    <Label htmlFor="duration" className="block mb-2">
                      {t('property.durationSeconds')}
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={localItem.timerConfig.duration || 0}
                      onChange={(e) =>
                        updateProperty({
                          timerConfig: {
                            ...localItem.timerConfig!,
                            duration: Number.parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      disabled={isLocked || localItem.timerConfig.running}
                    />
                  </div>
                )}
              </>
            )}

            {/* Display format */}
            <div className="mb-4">
              <Label htmlFor="format" className="block mb-2">
                {t('property.displayFormat')}
              </Label>
              <select
                id="format"
                value={localItem.timerConfig?.format || 'HH:MM:SS'}
                onChange={(e) =>
                  updateProperty({
                    timerConfig: {
                      ...localItem.timerConfig!,
                      format: e.target.value,
                    },
                  })
                }
                disabled={isLocked}
                className="w-full bg-[#1e1e1e] border border-[#3e3e42] text-white px-3 py-2 rounded"
              >
                <option value="HH:MM:SS">HH:MM:SS</option>
                <option value="MM:SS">MM:SS</option>
                {localItem.type === 'clock' && (
                  <option value="HH:MM">HH:MM</option>
                )}
              </select>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <Label htmlFor="timer-fontSize" className="block mb-2">
                {t('property.fontSize')}
              </Label>
              <Input
                id="timer-fontSize"
                type="number"
                min="12"
                max="200"
                value={localItem.properties?.fontSize || 48}
                onChange={(e) =>
                  updateProperty({
                    properties: {
                      ...localItem.properties,
                      fontSize: Number.parseInt(e.target.value, 10) || 48,
                    },
                  })
                }
                disabled={isLocked}
              />
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="timer-color" className="block mb-2">
                {t('property.color')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="timer-color"
                  type="color"
                  value={localItem.properties?.color || '#FFFFFF'}
                  onChange={(e) =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        color: e.target.value,
                      },
                    })
                  }
                  className="w-14 h-10 p-1 cursor-pointer"
                  disabled={isLocked}
                />
                <Input
                  type="text"
                  value={localItem.properties?.color || '#FFFFFF'}
                  onChange={(e) =>
                    updateProperty({
                      properties: {
                        ...localItem.properties,
                        color: e.target.value,
                      },
                    })
                  }
                  className="flex-1"
                  placeholder="#FFFFFF"
                  disabled={isLocked}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
