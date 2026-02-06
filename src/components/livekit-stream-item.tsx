import type { RemoteTrack, RemoteVideoTrack } from 'livekit-client';
import { useEffect, useRef, useState } from 'react';
import { liveKitPullService } from '../services/livekit-pull';

interface LiveKitStreamItemProps {
  participantIdentity: string;
  streamSource: 'camera' | 'screen_share';
  width: number;
  height: number;
}

/**
 * LiveKit video stream component
 * Displays participant camera or screen-share tracks
 */
export function LiveKitStreamItem({
  participantIdentity,
  streamSource,
  width,
  height,
}: LiveKitStreamItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    let track: RemoteTrack | null = null;
    let mounted = true;

    const attachTrack = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get the video track for this participant/source
        track = liveKitPullService.getParticipantVideoTrack(participantIdentity, streamSource);

        if (!track) {
          if (mounted) {
            setError('视频流不可用');
            setIsLoading(false);
          }
          return;
        }

        // Attach the track to the video element
        const remoteVideoTrack = track as RemoteVideoTrack;
        remoteVideoTrack.attach(videoElement);

        if (mounted) {
          setIsLoading(false);
        }

        console.log('已附加视频轨道:', {
          participant: participantIdentity,
          source: streamSource,
        });
      } catch (err) {
        console.error('附加视频轨道失败:', err);
        if (mounted) {
          setError('加载视频流失败');
          setIsLoading(false);
        }
      }
    };

    attachTrack();

    // Periodically check track state (once per second)
    const checkInterval = setInterval(() => {
      const currentTrack = liveKitPullService.getParticipantVideoTrack(
        participantIdentity,
        streamSource
      );

      // Re-attach if the track changes
      if (currentTrack !== track) {
        track = currentTrack;
        if (track && videoElement) {
          const remoteVideoTrack = track as RemoteVideoTrack;
          remoteVideoTrack.attach(videoElement);
          if (mounted) {
            setIsLoading(false);
            setError(null);
          }
        } else if (!track && mounted) {
          setError('视频流不可用');
        }
      }
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(checkInterval);

      // Cleanup video element
      if (track && videoElement) {
        const remoteVideoTrack = track as RemoteVideoTrack;
        remoteVideoTrack.detach(videoElement);
      }
    };
  }, [participantIdentity, streamSource]);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: isLoading || error ? 'none' : 'block',
        }}
      />
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          加载中...
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ff6b6b',
            fontSize: '14px',
            textAlign: 'center',
            padding: '10px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
