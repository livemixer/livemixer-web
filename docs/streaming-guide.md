# Streaming Guide

This guide covers the streaming (push) and pulling (pull) capabilities of LiveMixer Web, powered by [LiveKit](https://livekit.io/).

## Prerequisites

- A running [LiveKit server](https://docs.livekit.io/oss/getting-started/installation/) instance
- A valid LiveKit access token for the target room
- The token must have appropriate grants (publish for push, subscribe for pull)

## Push Streaming

Push streaming captures the canvas output and publishes it to a LiveKit room as a WebRTC stream.

### Architecture

```
Konva Canvas
     |
     v
CanvasCaptureService (captureStream)
     |
     v
MediaStream (video + audio tracks)
     |
     v
StreamingService (LiveKit connect + publish)
     |
     v
LiveKit Room (WebRTC)
```

### Configuration

Configure streaming settings in the Settings dialog:

| Setting | Field | Default | Description |
|---------|-------|---------|-------------|
| LiveKit URL | `livekitUrl` | - | Server URL (e.g., `wss://my-server.livekit.cloud`) |
| LiveKit Token | `livekitToken` | - | Access token (not persisted) |
| Video Bitrate | `videoBitrate` | `5000` | Video bitrate in kbps |
| Video Encoder | `videoEncoder` | `vp8` | Video codec |
| FPS | `fps` | `30` | Target frame rate |

### StreamingService API

```ts
import { streamingService } from 'livemixer-web';

// Connect and start streaming
await streamingService.connect(
  url,              // LiveKit server URL
  token,            // Access token
  mediaStream,      // MediaStream from canvas capture
  videoBitrate,     // Video bitrate in kbps (default: 5000)
  videoCodec,       // Video codec (default: 'vp8')
  maxFramerate,     // Max frame rate (default: 30)
);

// Disconnect and stop streaming
await streamingService.disconnect();

// Check connection state
const isStreaming = streamingService.getConnectionState();

// Get the LiveKit Room instance
const room = streamingService.getRoom();
```

### Video Codecs

| Codec | Identifier | Notes |
|-------|-----------|-------|
| VP8 | `vp8` | Default. Good compatibility, low CPU usage |
| VP9 | `vp9` | Better quality at lower bitrate, higher CPU |
| H.264 | `h264` | Best compatibility with SFU recording |
| H.265 | `h265` | Next-gen codec, limited browser support |
| AV1 | `av1` | Open codec, limited browser support |

### Streaming Flow

1. **User clicks Start Streaming**
2. The application validates LiveKit URL and Token
3. The canvas element is obtained via `canvasRef.current.getCanvas()`
4. Continuous rendering is enabled: `canvasRef.current.startContinuousRendering()`
5. A `MediaStream` is captured from the canvas: `canvasCaptureService.captureStream(canvas, fps)`
6. The `StreamingService.connect()` method is called with the stream and encoding parameters
7. The service connects to the LiveKit room and publishes video/audio tracks
8. The streaming state is updated in the UI

### Stopping Streaming

1. **User clicks Stop Streaming**
2. `StreamingService.disconnect()` unpublishes tracks and disconnects
3. `CanvasCaptureService.stopCapture()` stops the capture tracks
4. Continuous rendering is disabled: `canvasRef.current.stopContinuousRendering()`
5. The streaming state is updated in the UI

### CanvasCaptureService

```ts
import { canvasCaptureService } from 'livemixer-web';

// Capture a MediaStream from a canvas element
const stream = canvasCaptureService.captureStream(canvas, 30);

// Stop the capture
canvasCaptureService.stopCapture();

// Get the current stream
const stream = canvasCaptureService.getStream();
```

The `captureStream` method uses the [HTMLCanvasElement.captureStream()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) API. The `fps` parameter controls the maximum frame rate of the captured stream.

## Pull Streaming

Pull streaming connects to a LiveKit room and subscribes to remote participants' audio/video tracks.

### Configuration

Configure pull settings in the Settings dialog:

| Setting | Field | Default | Description |
|---------|-------|---------|-------------|
| LiveKit Pull URL | `livekitPullUrl` | - | Server URL for pulling |
| LiveKit Pull Token | `livekitPullToken` | - | Access token (not persisted) |

### LiveKitPullService API

```ts
import { liveKitPullService } from 'livemixer-web';

// Connect and subscribe
await liveKitPullService.connect(url, token, {
  onParticipantsChanged: (participants) => {
    console.log('Participants:', participants);
  },
});

// Get all participant info
const participants = liveKitPullService.getParticipants();

// Get a specific participant's video track
const videoTrack = liveKitPullService.getParticipantVideoTrack('user-identity', 'camera');

// Get a specific participant's audio track
const audioTrack = liveKitPullService.getParticipantAudioTrack('user-identity');

// Disconnect
await liveKitPullService.disconnect();
```

### ParticipantInfo

```ts
interface ParticipantInfo {
  identity: string;              // Participant identifier
  name?: string;                 // Display name
  isSpeaking: boolean;           // Whether the participant is speaking
  isCameraEnabled: boolean;      // Camera track is active
  isMicrophoneEnabled: boolean;  // Microphone track is active
  isScreenShareEnabled: boolean; // Screen share track is active
  cameraTrack?: RemoteTrack;     // Camera video track
  microphoneTrack?: RemoteTrack; // Microphone audio track
  screenShareTrack?: RemoteTrack; // Screen share video track
}
```

### Callbacks

```ts
interface LiveKitPullServiceCallbacks {
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onTrackSubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
  onTrackUnsubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
  onParticipantsChanged?: (participants: ParticipantInfo[]) => void;
}
```

### Adding a Participant to the Scene

When a remote participant is added to the canvas, a `livekit_stream` SceneItem is created:

```ts
const newItem: SceneItem = {
  id: `livekit_stream-${nextNumber}`,
  type: 'livekit_stream',
  zIndex: activeScene.items.length,
  layout: {
    x: canvasCenterX,
    y: canvasCenterY,
    width: canvasWidth / 3,
    height: (canvasWidth / 3) * 9 / 16,  // 16:9 aspect ratio
  },
  livekitStream: {
    participantIdentity: identity,
    streamSource: 'camera',  // or 'screen_share'
  },
};
```

The stream source size defaults to 1/3 of the canvas width with a 16:9 aspect ratio. Multiple participants are offset to avoid overlapping.

## MediaStreamManager

The `MediaStreamManager` provides centralized management of all media streams used by plugins and the streaming pipeline.

### Stream Management

```ts
import { mediaStreamManager } from 'livemixer-web';

// Register a stream for a scene item
mediaStreamManager.setStream(itemId, {
  stream: mediaStream,
  video: videoElement,       // Optional HTMLVideoElement for video streams
  metadata: {
    deviceId: 'device-1',
    deviceLabel: 'HD Webcam',
    sourceType: 'webcam',
    pluginId: 'io.livemixer.webcam',
  },
});

// Get a stream entry
const entry = mediaStreamManager.getStream(itemId);

// Remove a stream (stops tracks and removes video element from DOM)
mediaStreamManager.removeStream(itemId);

// Check if item has an active stream
const hasStream = mediaStreamManager.hasStream(itemId);

// Get all active streams
const allStreams = mediaStreamManager.getAllStreams();
```

### Stream Change Events

```ts
// Subscribe to stream changes for a specific item
const unsub = mediaStreamManager.onStreamChange(itemId, () => {
  console.log('Stream changed for', itemId);
});

// Unsubscribe
unsub();
```

### Device Enumeration

```ts
// Get video input devices (requests permission if needed)
const videoDevices = await mediaStreamManager.getVideoInputDevices();

// Get audio input devices (requests permission if needed)
const audioDevices = await mediaStreamManager.getAudioInputDevices();

// Get audio output devices
const outputDevices = await mediaStreamManager.getAudioOutputDevices();
```

The device enumeration methods handle permission requests gracefully:
- First attempts to enumerate without requesting permission
- If device labels are empty (permission not granted), requests `getUserMedia` permission
- Re-enumerates after permission is granted to get device labels
- Falls back gracefully if permission is denied

### Pending Stream (Dialog Communication)

The `MediaStreamManager` also provides a mechanism for plugins to pass streams from dialogs to the main application:

```ts
// Set pending stream (called by plugin dialog before closing)
mediaStreamManager.setPendingStream({
  stream: mediaStream,
  sourceType: 'video_input',
  metadata: { deviceId: 'device-1' },
});

// Consume pending stream (called by App when creating item)
const pending = mediaStreamManager.consumePendingStream();
if (pending) {
  // Use pending.stream, pending.sourceType, pending.metadata
}
```

## Cleanup

All streaming resources are cleaned up when the component unmounts:

```ts
useEffect(() => {
  return () => {
    if (isStreaming) {
      streamingService.disconnect();
      canvasCaptureService.stopCapture();
      canvasRef.current?.stopContinuousRendering();
    }
    if (isPulling) {
      liveKitPullService.disconnect();
    }
  };
}, [isStreaming, isPulling]);
```

Additionally, individual stream tracks are cleaned up when their source items are removed, via the `onended` event handler on `MediaStreamTrack`.
