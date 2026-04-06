import {
  type Participant,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';

/**
 * Participant info
 */
export interface ParticipantInfo {
  identity: string;
  name?: string;
  isSpeaking: boolean;
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenShareEnabled: boolean;
  cameraTrack?: RemoteTrack;
  microphoneTrack?: RemoteTrack;
  screenShareTrack?: RemoteTrack;
}

/**
 * LiveKit pull service callbacks
 */
export interface LiveKitPullServiceCallbacks {
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onTrackSubscribed?: (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => void;
  onTrackUnsubscribed?: (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant,
  ) => void;
  onParticipantsChanged?: (participants: ParticipantInfo[]) => void;
}

/**
 * LiveKit pull service
 * Connects to a LiveKit room and subscribes to other participants' AV streams
 */
export class LiveKitPullService {
  private room: Room | null = null;
  private isConnected = false;
  private callbacks: LiveKitPullServiceCallbacks = {};

  /**
   * Connect to a LiveKit room
   * @param url LiveKit server URL
   * @param token Access token
   * @param callbacks Callback handlers
   */
  async connect(
    url: string,
    token: string,
    callbacks?: LiveKitPullServiceCallbacks,
  ): Promise<void> {
    if (this.isConnected) {
      throw new Error('Already connected to the room');
    }

    if (!url || !token) {
      throw new Error('LiveKit server URL and token are required');
    }

    this.callbacks = callbacks || {};

    try {
      // Create room instance
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Listen for connection state
      this.room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room (pulling)');
        this.isConnected = true;
      });

      this.room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit (pulling)');
        this.isConnected = false;
      });

      this.room.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to LiveKit (pulling)...');
      });

      this.room.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to LiveKit (pulling)');
      });

      // Listen for participants joining
      this.room.on(
        RoomEvent.ParticipantConnected,
        (participant: RemoteParticipant) => {
          console.log('Participant joined:', participant.identity);
          this.callbacks.onParticipantConnected?.(participant);
          this.notifyParticipantsChanged();
        },
      );

      // Listen for participants leaving
      this.room.on(
        RoomEvent.ParticipantDisconnected,
        (participant: RemoteParticipant) => {
          console.log('Participant left:', participant.identity);
          this.callbacks.onParticipantDisconnected?.(participant);
          this.notifyParticipantsChanged();
        },
      );

      // Listen for track subscriptions
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
          });
          this.callbacks.onTrackSubscribed?.(track, publication, participant);
          this.notifyParticipantsChanged();
        },
      );

      // Listen for track unsubscriptions
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
          });
          this.callbacks.onTrackUnsubscribed?.(track, publication, participant);
          this.notifyParticipantsChanged();
        },
      );

      // Listen for track mute/unmute
      this.room.on(RoomEvent.TrackMuted, () => {
        this.notifyParticipantsChanged();
      });

      this.room.on(RoomEvent.TrackUnmuted, () => {
        this.notifyParticipantsChanged();
      });

      // Connect to room
      await this.room.connect(url, token);

      console.log('LiveKit pull service connected');
      console.log('Room name:', this.room.name);
      console.log(
        'Current participant count:',
        this.room.remoteParticipants.size,
      );
    } catch (error) {
      this.isConnected = false;
      this.cleanup();
      throw error;
    }
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    if (!this.room) {
      return;
    }

    try {
      await this.room.disconnect();
    } catch (error) {
      console.error('Error disconnecting pull service:', error);
    } finally {
      this.cleanup();
    }
  }

  /**
   * Get all participant info
   */
  getParticipants(): ParticipantInfo[] {
    if (!this.room) {
      return [];
    }

    const participants: ParticipantInfo[] = [];

    // Traverse all remote participants
    this.room.remoteParticipants.forEach((participant) => {
      participants.push(this.getParticipantInfo(participant));
    });

    return participants;
  }

  /**
   * Get participant info
   */
  getParticipantInfo(
    participant: RemoteParticipant | Participant,
  ): ParticipantInfo {
    const info: ParticipantInfo = {
      identity: participant.identity,
      name: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      isCameraEnabled: false,
      isMicrophoneEnabled: false,
      isScreenShareEnabled: false,
    };

    // Check camera state
    const cameraPublication = participant.getTrackPublication(
      Track.Source.Camera,
    );
    if (cameraPublication) {
      info.isCameraEnabled = !cameraPublication.isMuted;
      if (cameraPublication.track) {
        info.cameraTrack = cameraPublication.track as RemoteTrack;
      }
    }

    // Check microphone state
    const microphonePublication = participant.getTrackPublication(
      Track.Source.Microphone,
    );
    if (microphonePublication) {
      info.isMicrophoneEnabled = !microphonePublication.isMuted;
      if (microphonePublication.track) {
        info.microphoneTrack = microphonePublication.track as RemoteTrack;
      }
    }

    // Check screen share state
    const screenSharePublication = participant.getTrackPublication(
      Track.Source.ScreenShare,
    );
    if (screenSharePublication) {
      info.isScreenShareEnabled = !screenSharePublication.isMuted;
      if (screenSharePublication.track) {
        info.screenShareTrack = screenSharePublication.track as RemoteTrack;
      }
    }

    return info;
  }

  /**
   * Get a participant's video track by identity
   */
  getParticipantVideoTrack(
    identity: string,
    source: 'camera' | 'screen_share' = 'camera',
  ): RemoteTrack | null {
    if (!this.room) {
      return null;
    }

    const participant = Array.from(this.room.remoteParticipants.values()).find(
      (p) => p.identity === identity,
    );

    if (!participant) {
      return null;
    }

    const trackSource =
      source === 'camera' ? Track.Source.Camera : Track.Source.ScreenShare;
    const publication = participant.getTrackPublication(trackSource);

    return publication?.track as RemoteTrack | null;
  }

  /**
   * Get a participant's audio track by identity
   */
  getParticipantAudioTrack(identity: string): RemoteTrack | null {
    if (!this.room) {
      return null;
    }

    const participant = Array.from(this.room.remoteParticipants.values()).find(
      (p) => p.identity === identity,
    );

    if (!participant) {
      return null;
    }

    const publication = participant.getTrackPublication(
      Track.Source.Microphone,
    );

    return publication?.track as RemoteTrack | null;
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

  /**
   * Notify when participant list changes
   */
  private notifyParticipantsChanged(): void {
    if (this.callbacks.onParticipantsChanged) {
      const participants = this.getParticipants();
      this.callbacks.onParticipantsChanged(participants);
    }
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.room = null;
    this.isConnected = false;
    this.callbacks = {};
  }
}

// Export singleton instance
export const liveKitPullService = new LiveKitPullService();
