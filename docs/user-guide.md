# User Guide

This guide covers how to use LiveMixer Web Studio to compose live video scenes and stream them in real time.

## Interface Layout

The main interface is divided into the following regions:

```
+----------------------------------------------------------+
|  Logo  |         Toolbar (Menus)           | User Area   |
+--------+-----------------------------------+-------------+
|         |                                   |             |
| Left    |       Canvas (Konva.js)           |   Right     |
| Sidebar |       Visual Scene Editor         |  Sidebar    |
| (Pull)  |                                   | (Properties)|
|         |                                   |             |
+--------+-----------------------------------+-------------+
|  Scenes  |   Sources   |  Audio Mixer  | Stream Controls  |
+----------------------------------------------------------+
|  Status Bar                                              |
+----------------------------------------------------------+
```

- **Toolbar** - Menu bar with File, Edit, View, Tools, and Help menus
- **Left Sidebar** - Participants panel and pull stream controls
- **Canvas** - The main visual editing area powered by Konva.js
- **Right Sidebar** - Property panel for the selected source
- **Bottom Bar** - Scene management, source list, audio mixer, and streaming controls
- **Status Bar** - Displays streaming status, resolution, FPS, and CPU usage

## Scene Management

Scenes are collections of sources arranged on the canvas. You can create multiple scenes and switch between them during a live session.

### Create a Scene

Click the **+** button in the Scenes panel (bottom-left) to add a new scene. Scenes are named sequentially (Scene 1, Scene 2, etc.).

### Switch Scenes

Click on a scene tab in the Scenes panel to switch to it. The canvas will update to show the selected scene's sources.

### Reorder Scenes

Use the up/down arrow buttons next to each scene to change the display order.

### Delete a Scene

Click the delete button next to a scene. At least one scene must always remain.

## Source Types

Sources are the visual and audio elements placed on the canvas. The following source types are available:

| Source Type | Plugin | Description |
|-------------|--------|-------------|
| `video_input` | Webcam | Capture video from a webcam device |
| `audio_input` | Audio Input | Capture audio from a microphone with mixer controls |
| `screen` | Screen Capture | Capture the entire screen |
| `window` | Screen Capture | Capture a specific application window |
| `mediasource` | Media Source | Play a video from a URL |
| `image` | Image | Display an image overlay |
| `text` | Text | Render a text overlay |
| `timer` | - | Countdown or count-up timer |
| `clock` | - | Real-time clock display |
| `livekit_stream` | - | Remote participant stream from LiveKit |

### Adding a Source

1. Click the **+** button in the Sources panel (bottom-center)
2. Select a source type from the dialog
3. Depending on the source type:
   - **Webcam/Audio**: A device selection dialog appears first
   - **Screen Capture**: Browser permission prompt appears immediately
   - **Media Source**: Add first, then configure the URL in the property panel
   - **Image/Text**: Added directly, configure in the property panel
   - **Timer/Clock**: A configuration dialog appears

### Removing a Source

Select a source in the list and click the delete button, or select it on the canvas and press the `Delete` key.

## Canvas Operations

The canvas is the central editing area where you arrange your sources visually.

### Select

Click on a source on the canvas to select it. The selected source will display transform handles.

### Move

Click and drag a source to reposition it on the canvas.

### Resize

Drag the corner or edge handles of a selected source to resize it. Hold `Shift` to maintain the aspect ratio.

### Layer Order

Use the up/down arrow buttons in the Sources panel to change the z-order of sources. Sources higher in the list are rendered on top.

### Lock

Click the lock icon next to a source to prevent accidental movement or resizing. Locked sources display a lock indicator on the canvas.

### Visibility

Click the eye icon next to a source to toggle its visibility. Hidden sources still exist in the scene but are not rendered on the canvas or included in the stream.

## Property Panel

The right sidebar displays the property panel for the currently selected source. Available properties vary by source type:

- **Layout** - Position (X, Y) and size (Width, Height)
- **Transform** - Opacity, rotation, border radius
- **Source-specific** - Device selection, URL, text content, font size, color, etc.
- **Audio** - Volume slider and mute toggle (for audio-enabled sources)

Changes in the property panel are applied immediately to the scene.

## Audio Mixer

The audio mixer panel in the bottom bar allows you to control audio levels for sources that support audio:

- **Volume Slider** - Adjust the volume level for each audio source
- **Mute Toggle** - Quickly mute/unmute an audio source

Audio-enabled sources (e.g., `audio_input`, `video_input`, `mediasource`) automatically appear in the audio mixer.

## Participants Panel

The left sidebar contains the participants panel, which shows remote participants when connected to a LiveKit room for stream pulling.

### Pull Stream

1. Configure the LiveKit Pull URL and Token in **Settings > Pull**
2. Click the **Connect** button in the left sidebar
3. Remote participants will appear in the list

### Add Participant to Scene

Click the camera or screen share icon next to a participant to add their stream to the current scene as a `livekit_stream` source.

## Settings Dialog

Open the settings dialog via the gear icon or **File > Settings**. The dialog contains the following tabs:

### Video Settings

- **Base Resolution** - The canvas base resolution (default: 1920x1080)
- **Output Resolution** - The output stream resolution
- **FPS** - Target frame rate (default: 30)
- **Scale Filter** - Scaling algorithm (bilinear)

### Audio Settings

- **Audio Device** - Default audio device
- **Sample Rate** - Audio sample rate (default: 48000)
- **Channels** - Audio channel configuration (stereo/mono)

### Stream Settings (Push)

- **Stream Service** - Streaming service type
- **LiveKit URL** - LiveKit server URL
- **LiveKit Token** - Access token (not persisted for security)
- **Video Bitrate** - Video bitrate in kbps (default: 5000)
- **Video Encoder** - Video codec (vp8, h264, vp9, av1, h265)

### Pull Settings

- **LiveKit Pull URL** - LiveKit server URL for pulling
- **LiveKit Pull Token** - Access token for pulling (not persisted)

### View Settings

- **Show Grid** - Display a grid overlay on the canvas
- **Show Guides** - Display alignment guides when moving sources

### Scene Transition

- **Transition Type** - Switch animation between scenes (cut, fade, dissolve, swipe, stinger)
- **Transition Duration** - Duration in milliseconds (default: 300)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+C` | Copy selected source |
| `Ctrl+V` | Paste copied source |
| `Delete` / `Backspace` | Delete selected source |

> Shortcuts are disabled when a text input field is focused.

## Config Import/Export

Scene configurations can be imported and exported as JSON files:

- **Export** - Save the current scene layout to a JSON file
- **Import** - Load a previously saved scene layout from a JSON file

The JSON format follows the [Protocol v1.0.0 specification](./protocol.md).
