import { LocalVideoTrack, Room, RoomEvent, Track } from 'livekit-client';

/**
 * LiveKit streaming service
 */
export class StreamingService {
  private room: Room | null = null;
  private videoTrack: LocalVideoTrack | null = null;
  private isConnected = false;

  /**
   * Connect to a LiveKit room and start streaming
   * @param url LiveKit server URL
   * @param token Access token
   * @param mediaStream MediaStream to publish
   * @param videoBitrate Video bitrate (kbps), default 5000
   * @param videoCodec Video codec, default 'vp8'
   * @param maxFramerate Max frame rate, default 30
   * @param outputWidth Output video width, default 1920
   * @param outputHeight Output video height, default 1080
   */
  async connect(
    url: string,
    token: string,
    mediaStream: MediaStream,
    videoBitrate = 5000,
    videoCodec: 'h264' | 'h265' | 'vp8' | 'vp9' | 'av1' = 'vp8',
    maxFramerate = 30,
    outputWidth = 1920,
    outputHeight = 1080,
  ): Promise<void> {
    if (this.isConnected) {
      throw new Error('Already streaming');
    }

    if (!url || !token) {
      throw new Error('LiveKit server URL and token are required');
    }

    try {
      // Create room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        // Set default video capture parameters to output resolution
        videoCaptureDefaults: {
          resolution: {
            width: outputWidth,
            height: outputHeight,
            frameRate: maxFramerate,
          },
        },
      });

      // Listen for connection state
      this.room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        this.isConnected = true;
      });

      this.room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit');
        this.isConnected = false;
      });

      this.room.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to LiveKit...');
      });

      this.room.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to LiveKit');
      });

      // Connect to room
      await this.room.connect(url, token);

      // Get video track from MediaStream
      const videoTracks = mediaStream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video track found in MediaStream');
      }

      const videoTrack = videoTracks[0];

      // Apply track constraints to optimize encoding quality
      await videoTrack.applyConstraints({
        width: { ideal: outputWidth },
        height: { ideal: outputHeight },
        frameRate: { ideal: maxFramerate },
      });

      // Create LocalVideoTrack
      this.videoTrack = new LocalVideoTrack(videoTrack);

      // Publish video track with encoding params
      await this.room.localParticipant.publishTrack(this.videoTrack, {
        name: 'canvas-output',
        source: Track.Source.ScreenShare,
        simulcast: false, // Disable simulcast for higher quality
        videoEncoding: {
          maxBitrate: videoBitrate * 1000, // Convert to bps
          maxFramerate: maxFramerate,
        },
        videoCodec: videoCodec, // Use selected codec
      });

      console.log('Video track published to LiveKit');
      console.log('Video encoding parameters:', {
        codec: videoCodec,
        maxBitrate: videoBitrate * 1000,
        maxFramerate: maxFramerate,
        resolution: `${videoTrack.getSettings().width}x${videoTrack.getSettings().height}`,
      });

      // Publish audio track if present
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        await this.room.localParticipant.publishTrack(audioTracks[0], {
          source: Track.Source.Microphone,
        });
        console.log('Audio track published to LiveKit');
      }
    } catch (error) {
      this.isConnected = false;
      this.cleanup();
      throw error;
    }
  }

  /**
   * Disconnect and clean up
   */
  async disconnect(): Promise<void> {
    if (!this.room) {
      return;
    }

    try {
      // Unpublish all tracks
      if (this.videoTrack) {
        await this.room.localParticipant.unpublishTrack(this.videoTrack);
        this.videoTrack.stop();
        this.videoTrack = null;
      }

      // Disconnect from room
      await this.room.disconnect();
    } catch (error) {
      console.error('Error while disconnecting:', error);
    } finally {
      this.cleanup();
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.room = null;
    this.videoTrack = null;
    this.isConnected = false;
  }

  /**
   * Get connection state
   */
  getConnectionState(): boolean {
    return this.isConnected;
  }

  /**
   * Get room instance
   */
  getRoom(): Room | null {
    return this.room;
  }
}

// Export singleton instance
export const streamingService = new StreamingService();
