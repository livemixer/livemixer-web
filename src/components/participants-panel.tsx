import { Mic, MicOff, Monitor, MonitorOff, User, Video, VideoOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { liveKitPullService, type ParticipantInfo } from '../services/livekit-pull';

interface ParticipantItemProps {
  participant: ParticipantInfo;
  onAddToScene: (identity: string, source: 'camera' | 'screen_share') => void;
}

/**
 * Single participant item
 */
function ParticipantItem({ participant, onAddToScene }: ParticipantItemProps) {
  return (
    <div className="flex flex-col gap-2 rounded bg-[#1e1e1e] p-3 border border-[#3e3e42] hover:border-blue-500 transition-colors">
      {/* Participant name */}
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-white font-medium truncate flex-1">
          {participant.name || participant.identity}
        </span>
        {participant.isSpeaking && (
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-2">
        {/* Camera status */}
        <button
          onClick={() => {
            if (participant.isCameraEnabled) {
              onAddToScene(participant.identity, 'camera');
            }
          }}
          disabled={!participant.isCameraEnabled}
          className={`p-1.5 rounded ${
            participant.isCameraEnabled
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-700 cursor-not-allowed'
          } transition-colors`}
          title={participant.isCameraEnabled ? '点击添加摄像头到场景' : '摄像头未开启'}
        >
          {participant.isCameraEnabled ? (
            <Video className="h-3.5 w-3.5 text-white" />
          ) : (
            <VideoOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>

        {/* Microphone status */}
        <div
          className={`p-1.5 rounded ${
            participant.isMicrophoneEnabled ? 'bg-green-600' : 'bg-gray-700'
          }`}
          title={participant.isMicrophoneEnabled ? '麦克风已开启' : '麦克风已关闭'}
        >
          {participant.isMicrophoneEnabled ? (
            <Mic className="h-3.5 w-3.5 text-white" />
          ) : (
            <MicOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </div>

        {/* Screen share status */}
        <button
          onClick={() => {
            if (participant.isScreenShareEnabled) {
              onAddToScene(participant.identity, 'screen_share');
            }
          }}
          disabled={!participant.isScreenShareEnabled}
          className={`p-1.5 rounded ${
            participant.isScreenShareEnabled
              ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
              : 'bg-gray-700 cursor-not-allowed'
          } transition-colors`}
          title={participant.isScreenShareEnabled ? '点击添加屏幕共享到场景' : '屏幕共享未开启'}
        >
          {participant.isScreenShareEnabled ? (
            <Monitor className="h-3.5 w-3.5 text-white" />
          ) : (
            <MonitorOff className="h-3.5 w-3.5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

interface ParticipantsPanelProps {
  isConnected: boolean;
  onAddToScene: (identity: string, source: 'camera' | 'screen_share') => void;
}

/**
 * Participants panel component
 * Shows all participants and their camera/mic/screen-share state
 */
export function ParticipantsPanel({ isConnected, onAddToScene }: ParticipantsPanelProps) {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);

  useEffect(() => {
    if (!isConnected) {
      setParticipants([]);
      return;
    }

    // Initialize participant list
    const initialParticipants = liveKitPullService.getParticipants();
    setParticipants(initialParticipants);

    // Poll participant changes at a fixed interval
    const interval = setInterval(() => {
      const updatedParticipants = liveKitPullService.getParticipants();
      setParticipants(updatedParticipants);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col h-full p-4">
        <h3 className="text-sm font-semibold text-white mb-4">参会者</h3>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">未连接到房间</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <h3 className="text-sm font-semibold text-white mb-4">参会者 ({participants.length})</h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {participants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">暂无参会者</p>
          </div>
        ) : (
          participants.map(participant => (
            <ParticipantItem
              key={participant.identity}
              participant={participant}
              onAddToScene={onAddToScene}
            />
          ))
        )}
      </div>
    </div>
  );
}
