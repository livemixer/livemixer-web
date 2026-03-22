import { Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';

interface VideoInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (deviceId: string, deviceLabel: string, stream: MediaStream) => void;
}

export function VideoInputDialog({ open, onOpenChange, onConfirm }: VideoInputDialogProps) {
    const { t } = useI18n();
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Load available devices when dialog opens
    useEffect(() => {
        if (!open) return;

        const loadDevices = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setSelectedDeviceId(''); // Reset selection

                // First, check what devices are available before permission
                const devicesBefore = await navigator.mediaDevices.enumerateDevices();
                console.log('All devices before permission:', devicesBefore);
                console.log('Video devices before permission:', devicesBefore.filter(d => d.kind === 'videoinput'));

                // Request permission - use constraints that work with most devices
                console.log('Requesting camera permission...');
                const tempStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                });
                console.log('Got stream:', tempStream);
                console.log('Video tracks:', tempStream.getVideoTracks());

                // Get device info from the stream
                const videoTrack = tempStream.getVideoTracks()[0];
                if (videoTrack) {
                    const settings = videoTrack.getSettings();
                    console.log('Current device from stream:', settings.deviceId, videoTrack.label);
                }

                // Stop the temp stream immediately
                tempStream.getTracks().forEach(track => track.stop());

                // Now enumerate devices again - should have labels
                const allDevices = await navigator.mediaDevices.enumerateDevices();
                console.log('All devices after permission:', allDevices);
                const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
                console.log('Found video devices:', videoDevices);

                // If no devices found but we got a stream, create a device entry from the stream info
                if (videoDevices.length === 0 && videoTrack) {
                    const settings = videoTrack.getSettings();
                    const fallbackDevice = {
                        deviceId: settings.deviceId || 'default',
                        kind: 'videoinput' as MediaDeviceKind,
                        label: videoTrack.label || 'Camera',
                        groupId: '',
                        toJSON: () => ({})
                    };
                    console.log('Using fallback device from stream:', fallbackDevice);
                    setDevices([fallbackDevice as MediaDeviceInfo]);
                    setSelectedDeviceId(fallbackDevice.deviceId);
                } else {
                    setDevices(videoDevices);
                    if (videoDevices.length > 0) {
                        setSelectedDeviceId(videoDevices[0].deviceId);
                    }
                }
            } catch (err: any) {
                console.error('Failed to enumerate devices:', err);
                setError(err.message || 'Failed to access camera');
            } finally {
                setIsLoading(false);
            }
        };

        loadDevices();
    }, [open]);

    // Start preview when device is selected
    useEffect(() => {
        if (!open || !selectedDeviceId) return;

        const startPreview = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Stop previous stream
                if (previewStream) {
                    previewStream.getTracks().forEach(track => track.stop());
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { deviceId: { exact: selectedDeviceId } },
                    audio: true,
                });

                setPreviewStream(stream);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
            } catch (err: any) {
                console.error('Failed to start preview:', err);
                setError(err.message || 'Failed to access camera');
            } finally {
                setIsLoading(false);
            }
        };

        startPreview();

        return () => {
            // Don't stop stream here - it will be reused or stopped on dialog close
        };
    }, [selectedDeviceId, open]);

    // Cleanup on dialog close
    useEffect(() => {
        if (!open && previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
            setPreviewStream(null);
            setSelectedDeviceId('');
        }
    }, [open]);

    const handleConfirm = () => {
        if (!selectedDeviceId || !previewStream) return;

        const device = devices.find(d => d.deviceId === selectedDeviceId);
        const label = device?.label || 'Webcam';

        // Pass the stream to parent - don't stop it
        onConfirm(selectedDeviceId, label, previewStream);
        setPreviewStream(null); // Clear reference without stopping
        onOpenChange(false);
    };

    const handleCancel = () => {
        if (previewStream) {
            previewStream.getTracks().forEach(track => track.stop());
            setPreviewStream(null);
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="bg-linear-to-b from-neutral-850 to-neutral-900 border-neutral-700/50 text-white max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-500" />
                        {t('videoInputDialog.title')}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        {t('videoInputDialog.description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Device selector */}
                    <div>
                        <Label className="text-sm text-gray-300 mb-2 block">
                            {t('videoInputDialog.device')}
                        </Label>
                        <select
                            value={selectedDeviceId}
                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                            disabled={isLoading || devices.length === 0}
                            className="w-full py-2.5 px-3 bg-[#1e1e1e] border border-[#3e3e42] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        >
                            {devices.length === 0 ? (
                                <option value="">{t('videoInputDialog.noDevices')}</option>
                            ) : (
                                devices.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Preview area */}
                    <div className="relative">
                        <Label className="text-sm text-gray-300 mb-2 block">
                            {t('videoInputDialog.preview')}
                        </Label>
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#3e3e42]">
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                    <div className="text-gray-400 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm">{t('videoInputDialog.loading')}</span>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                                    <div className="text-red-400 flex flex-col items-center gap-2 p-4 text-center">
                                        <X className="w-8 h-8" />
                                        <span className="text-sm">{error}</span>
                                    </div>
                                </div>
                            )}

                            {!isLoading && !error && !previewStream && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-gray-500 flex flex-col items-center gap-2">
                                        <Video className="w-12 h-12" />
                                        <span className="text-sm">{t('videoInputDialog.selectToPreview')}</span>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain"
                                style={{ transform: 'scaleX(-1)' }} // Mirror by default
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex-1 py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                        >
                            {t('videoInputDialog.cancel')}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={!selectedDeviceId || !previewStream || isLoading}
                            className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            {t('videoInputDialog.confirm')}
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
