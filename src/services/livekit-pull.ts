import {
    Room,
    RoomEvent,
    Track,
    RemoteParticipant,
    RemoteTrack,
    RemoteTrackPublication,
    Participant,
} from 'livekit-client'

/**
 * 参会者信息
 */
export interface ParticipantInfo {
    identity: string
    name?: string
    isSpeaking: boolean
    isCameraEnabled: boolean
    isMicrophoneEnabled: boolean
    isScreenShareEnabled: boolean
    cameraTrack?: RemoteTrack
    microphoneTrack?: RemoteTrack
    screenShareTrack?: RemoteTrack
}

/**
 * LiveKit 拉流服务回调接口
 */
export interface LiveKitPullServiceCallbacks {
    onParticipantConnected?: (participant: RemoteParticipant) => void
    onParticipantDisconnected?: (participant: RemoteParticipant) => void
    onTrackSubscribed?: (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) => void
    onTrackUnsubscribed?: (
        track: RemoteTrack,
        publication: RemoteTrackPublication,
        participant: RemoteParticipant,
    ) => void
    onParticipantsChanged?: (participants: ParticipantInfo[]) => void
}

/**
 * LiveKit 拉流服务
 * 用于连接 LiveKit 房间并订阅其他参会者的音视频流
 */
export class LiveKitPullService {
    private room: Room | null = null
    private isConnected = false
    private callbacks: LiveKitPullServiceCallbacks = {}

    /**
     * 连接到 LiveKit 房间
     * @param url LiveKit 服务器地址
     * @param token 访问令牌
     * @param callbacks 回调函数
     */
    async connect(
        url: string,
        token: string,
        callbacks?: LiveKitPullServiceCallbacks,
    ): Promise<void> {
        if (this.isConnected) {
            throw new Error('已经连接到房间')
        }

        if (!url || !token) {
            throw new Error('LiveKit 服务器地址和 Token 不能为空')
        }

        this.callbacks = callbacks || {}

        try {
            // 创建房间实例
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
            })

            // 监听连接状态
            this.room.on(RoomEvent.Connected, () => {
                console.log('Connected to LiveKit room (pulling)')
                this.isConnected = true
            })

            this.room.on(RoomEvent.Disconnected, () => {
                console.log('Disconnected from LiveKit (pulling)')
                this.isConnected = false
            })

            this.room.on(RoomEvent.Reconnecting, () => {
                console.log('Reconnecting to LiveKit (pulling)...')
            })

            this.room.on(RoomEvent.Reconnected, () => {
                console.log('Reconnected to LiveKit (pulling)')
            })

            // 监听参会者加入
            this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
                console.log('Participant joined:', participant.identity)
                this.callbacks.onParticipantConnected?.(participant)
                this.notifyParticipantsChanged()
            })

            // 监听参会者离开
            this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
                console.log('Participant left:', participant.identity)
                this.callbacks.onParticipantDisconnected?.(participant)
                this.notifyParticipantsChanged()
            })

            // 监听轨道订阅
            this.room.on(
                RoomEvent.TrackSubscribed,
                (
                    track: RemoteTrack,
                    publication: RemoteTrackPublication,
                    participant: RemoteParticipant,
                ) => {
                    console.log('Track subscribed:', {
                        participant: participant.identity,
                        trackType: track.kind,
                        source: track.source,
                    })
                    this.callbacks.onTrackSubscribed?.(track, publication, participant)
                    this.notifyParticipantsChanged()
                },
            )

            // 监听轨道取消订阅
            this.room.on(
                RoomEvent.TrackUnsubscribed,
                (
                    track: RemoteTrack,
                    publication: RemoteTrackPublication,
                    participant: RemoteParticipant,
                ) => {
                    console.log('Track unsubscribed:', {
                        participant: participant.identity,
                        trackType: track.kind,
                    })
                    this.callbacks.onTrackUnsubscribed?.(track, publication, participant)
                    this.notifyParticipantsChanged()
                },
            )

            // 监听轨道静音/取消静音
            this.room.on(RoomEvent.TrackMuted, () => {
                this.notifyParticipantsChanged()
            })

            this.room.on(RoomEvent.TrackUnmuted, () => {
                this.notifyParticipantsChanged()
            })

            // 连接到房间
            await this.room.connect(url, token)

            console.log('LiveKit pull service connected')
            console.log('Room name:', this.room.name)
            console.log('Current participant count:', this.room.remoteParticipants.size)
        } catch (error) {
            this.isConnected = false
            this.cleanup()
            throw error
        }
    }

    /**
     * 断开连接
     */
    async disconnect(): Promise<void> {
        if (!this.room) {
            return
        }

        try {
            await this.room.disconnect()
        } catch (error) {
            console.error('Error disconnecting pull service:', error)
        } finally {
            this.cleanup()
        }
    }

    /**
     * 获取所有参会者信息
     */
    getParticipants(): ParticipantInfo[] {
        if (!this.room) {
            return []
        }

        const participants: ParticipantInfo[] = []

        // 遍历所有远程参会者
        this.room.remoteParticipants.forEach((participant) => {
            participants.push(this.getParticipantInfo(participant))
        })

        return participants
    }

    /**
     * 获取单个参会者信息
     */
    getParticipantInfo(participant: RemoteParticipant | Participant): ParticipantInfo {
        const info: ParticipantInfo = {
            identity: participant.identity,
            name: participant.name || participant.identity,
            isSpeaking: participant.isSpeaking,
            isCameraEnabled: false,
            isMicrophoneEnabled: false,
            isScreenShareEnabled: false,
        }

        // 检查摄像头状态
        const cameraPublication = participant.getTrackPublication(Track.Source.Camera)
        if (cameraPublication) {
            info.isCameraEnabled = !cameraPublication.isMuted
            if (cameraPublication.track) {
                info.cameraTrack = cameraPublication.track as RemoteTrack
            }
        }

        // 检查麦克风状态
        const microphonePublication = participant.getTrackPublication(Track.Source.Microphone)
        if (microphonePublication) {
            info.isMicrophoneEnabled = !microphonePublication.isMuted
            if (microphonePublication.track) {
                info.microphoneTrack = microphonePublication.track as RemoteTrack
            }
        }

        // 检查屏幕共享状态
        const screenSharePublication = participant.getTrackPublication(Track.Source.ScreenShare)
        if (screenSharePublication) {
            info.isScreenShareEnabled = !screenSharePublication.isMuted
            if (screenSharePublication.track) {
                info.screenShareTrack = screenSharePublication.track as RemoteTrack
            }
        }

        return info
    }

    /**
     * 根据 identity 获取参会者的视频轨道
     */
    getParticipantVideoTrack(
        identity: string,
        source: 'camera' | 'screen_share' = 'camera',
    ): RemoteTrack | null {
        if (!this.room) {
            return null
        }

        const participant = Array.from(this.room.remoteParticipants.values()).find(
            (p) => p.identity === identity,
        )

        if (!participant) {
            return null
        }

        const trackSource = source === 'camera' ? Track.Source.Camera : Track.Source.ScreenShare
        const publication = participant.getTrackPublication(trackSource)

        return publication?.track as RemoteTrack | null
    }

    /**
     * 根据 identity 获取参会者的音频轨道
     */
    getParticipantAudioTrack(identity: string): RemoteTrack | null {
        if (!this.room) {
            return null
        }

        const participant = Array.from(this.room.remoteParticipants.values()).find(
            (p) => p.identity === identity,
        )

        if (!participant) {
            return null
        }

        const publication = participant.getTrackPublication(Track.Source.Microphone)

        return publication?.track as RemoteTrack | null
    }

    /**
     * 获取连接状态
     */
    getConnectionState(): boolean {
        return this.isConnected
    }

    /**
     * 获取房间实例
     */
    getRoom(): Room | null {
        return this.room
    }

    /**
     * 通知参会者列表变化
     */
    private notifyParticipantsChanged(): void {
        if (this.callbacks.onParticipantsChanged) {
            const participants = this.getParticipants()
            this.callbacks.onParticipantsChanged(participants)
        }
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        this.room = null
        this.isConnected = false
        this.callbacks = {}
    }
}

// 导出单例实例
export const liveKitPullService = new LiveKitPullService()
