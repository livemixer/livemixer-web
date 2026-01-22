import { useEffect, useState } from 'react'
import { Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, User } from 'lucide-react'
import { liveKitPullService, type ParticipantInfo } from '../services/livekit-pull'

interface ParticipantItemProps {
    participant: ParticipantInfo
    onAddToScene: (identity: string, source: 'camera' | 'screen_share') => void
}

/**
 * 单个参会者项
 */
function ParticipantItem({ participant, onAddToScene }: ParticipantItemProps) {
    return (
        <div className="flex flex-col gap-2 rounded bg-[#1e1e1e] p-3 border border-[#3e3e42] hover:border-blue-500 transition-colors">
            {/* 参会者名称 */}
            <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-white font-medium truncate flex-1">
                    {participant.name || participant.identity}
                </span>
                {participant.isSpeaking && (
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
            </div>

            {/* 状态图标 */}
            <div className="flex items-center gap-2">
                {/* 摄像头状态 */}
                <button
                    onClick={() => {
                        if (participant.isCameraEnabled) {
                            onAddToScene(participant.identity, 'camera')
                        }
                    }}
                    disabled={!participant.isCameraEnabled}
                    className={`p-1.5 rounded ${participant.isCameraEnabled
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

                {/* 麦克风状态 */}
                <div
                    className={`p-1.5 rounded ${participant.isMicrophoneEnabled ? 'bg-green-600' : 'bg-gray-700'
                        }`}
                    title={participant.isMicrophoneEnabled ? '麦克风已开启' : '麦克风已关闭'}
                >
                    {participant.isMicrophoneEnabled ? (
                        <Mic className="h-3.5 w-3.5 text-white" />
                    ) : (
                        <MicOff className="h-3.5 w-3.5 text-gray-400" />
                    )}
                </div>

                {/* 屏幕共享状态 */}
                <button
                    onClick={() => {
                        if (participant.isScreenShareEnabled) {
                            onAddToScene(participant.identity, 'screen_share')
                        }
                    }}
                    disabled={!participant.isScreenShareEnabled}
                    className={`p-1.5 rounded ${participant.isScreenShareEnabled
                            ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                            : 'bg-gray-700 cursor-not-allowed'
                        } transition-colors`}
                    title={
                        participant.isScreenShareEnabled
                            ? '点击添加屏幕共享到场景'
                            : '屏幕共享未开启'
                    }
                >
                    {participant.isScreenShareEnabled ? (
                        <Monitor className="h-3.5 w-3.5 text-white" />
                    ) : (
                        <MonitorOff className="h-3.5 w-3.5 text-gray-400" />
                    )}
                </button>
            </div>
        </div>
    )
}

interface ParticipantsPanelProps {
    isConnected: boolean
    onAddToScene: (identity: string, source: 'camera' | 'screen_share') => void
}

/**
 * 参会者面板组件
 * 显示所有参会者及其摄像头、麦克风、屏幕共享状态
 */
export function ParticipantsPanel({ isConnected, onAddToScene }: ParticipantsPanelProps) {
    const [participants, setParticipants] = useState<ParticipantInfo[]>([])

    useEffect(() => {
        if (!isConnected) {
            setParticipants([])
            return
        }

        // 初始化参会者列表
        const initialParticipants = liveKitPullService.getParticipants()
        setParticipants(initialParticipants)

        // 监听参会者变化 - 通过定时轮询实现
        const interval = setInterval(() => {
            const updatedParticipants = liveKitPullService.getParticipants()
            setParticipants(updatedParticipants)
        }, 1000)

        return () => {
            clearInterval(interval)
        }
    }, [isConnected])

    if (!isConnected) {
        return (
            <div className="flex flex-col h-full p-4">
                <h3 className="text-sm font-semibold text-white mb-4">参会者</h3>
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-gray-400">未连接到房间</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full p-4">
            <h3 className="text-sm font-semibold text-white mb-4">
                参会者 ({participants.length})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
                {participants.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-sm text-gray-400">暂无参会者</p>
                    </div>
                ) : (
                    participants.map((participant) => (
                        <ParticipantItem
                            key={participant.identity}
                            participant={participant}
                            onAddToScene={onAddToScene}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
