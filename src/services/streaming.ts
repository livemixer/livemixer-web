import { LocalVideoTrack, Room, RoomEvent, Track } from 'livekit-client'

/**
 * LiveKit 推流服务
 */
export class StreamingService {
    private room: Room | null = null
    private videoTrack: LocalVideoTrack | null = null
    private isConnected = false

    /**
     * 连接到 LiveKit 房间并开始推流
     * @param url LiveKit 服务器地址
     * @param token 访问令牌
     * @param mediaStream 要推送的媒体流
     * @param videoBitrate 视频码率（kbps），默认 5000
     * @param videoCodec 视频编码器，默认 'vp8'
     * @param maxFramerate 最大帧率，默认 30
     */
    async connect(
        url: string,
        token: string,
        mediaStream: MediaStream,
        videoBitrate = 5000,
        videoCodec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1' = 'vp8',
        maxFramerate = 30,
    ): Promise<void> {
        if (this.isConnected) {
            throw new Error('已经在推流中')
        }

        if (!url || !token) {
            throw new Error('LiveKit 服务器地址和 Token 不能为空')
        }

        try {
            // 创建房间实例
            this.room = new Room({
                adaptiveStream: true,
                dynacast: true,
                // 设置视频编码默认参数
                videoCaptureDefaults: {
                    resolution: {
                        width: 1920,
                        height: 1080,
                        frameRate: maxFramerate,
                    },
                },
            })

            // 监听连接状态
            this.room.on(RoomEvent.Connected, () => {
                console.log('已连接到 LiveKit 房间')
                this.isConnected = true
            })

            this.room.on(RoomEvent.Disconnected, () => {
                console.log('已断开 LiveKit 连接')
                this.isConnected = false
            })

            this.room.on(RoomEvent.Reconnecting, () => {
                console.log('正在重新连接 LiveKit...')
            })

            this.room.on(RoomEvent.Reconnected, () => {
                console.log('已重新连接到 LiveKit')
            })

            // 连接到房间
            await this.room.connect(url, token)

            // 从 MediaStream 获取视频轨道
            const videoTracks = mediaStream.getVideoTracks()
            if (videoTracks.length === 0) {
                throw new Error('MediaStream 中没有视频轨道')
            }

            const videoTrack = videoTracks[0]

            // 设置视频轨道约束，优化编码质量
            await videoTrack.applyConstraints({
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: maxFramerate },
            })

            // 创建 LocalVideoTrack
            this.videoTrack = new LocalVideoTrack(videoTrack)

            // 发布视频轨道，设置编码参数
            await this.room.localParticipant.publishTrack(this.videoTrack, {
                name: 'canvas-output',
                source: Track.Source.ScreenShare,
                simulcast: false, // 禁用模拟投射以获得更高质量
                videoEncoding: {
                    maxBitrate: videoBitrate * 1000, // 转换为 bps
                    maxFramerate: maxFramerate,
                },
                videoCodec: videoCodec, // 使用设置中的编码器
            })

            console.log('视频轨道已发布到 LiveKit')
            console.log('视频编码参数:', {
                codec: videoCodec,
                maxBitrate: videoBitrate * 1000,
                maxFramerate: maxFramerate,
                resolution: `${videoTrack.getSettings().width}x${videoTrack.getSettings().height}`,
            })

            // 如果有音频轨道也发布
            const audioTracks = mediaStream.getAudioTracks()
            if (audioTracks.length > 0) {
                await this.room.localParticipant.publishTrack(audioTracks[0], {
                    source: Track.Source.Microphone,
                })
                console.log('音频轨道已发布到 LiveKit')
            }
        } catch (error) {
            this.isConnected = false
            this.cleanup()
            throw error
        }
    }

    /**
     * 断开连接并清理资源
     */
    async disconnect(): Promise<void> {
        if (!this.room) {
            return
        }

        try {
            // 取消发布所有轨道
            if (this.videoTrack) {
                await this.room.localParticipant.unpublishTrack(this.videoTrack)
                this.videoTrack.stop()
                this.videoTrack = null
            }

            // 断开房间连接
            await this.room.disconnect()
        } catch (error) {
            console.error('断开连接时出错:', error)
        } finally {
            this.cleanup()
        }
    }

    /**
     * 清理资源
     */
    private cleanup(): void {
        this.room = null
        this.videoTrack = null
        this.isConnected = false
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
}

// 导出单例实例
export const streamingService = new StreamingService()
