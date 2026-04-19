# Introduction

<cite>
**Referenced Files in This Document**
- [Readme.md](file://Readme.md)
- [package.json](file://package.json)
- [src/App.tsx](file://src/App.tsx)
- [src/main.tsx](file://src/main.tsx)
- [src/services/streaming.ts](file://src/services/streaming.ts)
- [src/services/livekit-pull.ts](file://src/services/livekit-pull.ts)
- [src/components/konva-canvas.tsx](file://src/components/konva-canvas.tsx)
- [src/plugins/builtin/webcam/index.tsx](file://src/plugins/builtin/webcam/index.tsx)
- [src/plugins/builtin/audio-input/index.tsx](file://src/plugins/builtin/audio-input/index.tsx)
- [src/services/plugin-registry.ts](file://src/services/plugin-registry.ts)
- [src/store/protocol.ts](file://src/store/protocol.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction

LiveMixer Web is an open-source live video mixer and streaming application designed as an alternative to traditional streaming software like OBS. Built on modern web technologies, it provides real-time video mixing capabilities through a browser-based interface powered by LiveKit RTC.

### Mission and Purpose

LiveMixer Web was created to democratize professional-grade video production by bringing it to the web. The project's mission centers on enabling content creators, streamers, and broadcasters to achieve broadcast-quality results without the complexity of desktop applications. By leveraging LiveKit's real-time communication infrastructure, it delivers a seamless streaming experience that works across platforms and devices.

### Target Audience

The application serves several key audiences:
- **Content creators** seeking professional video mixing capabilities
- **Streamers** requiring flexible, web-based streaming solutions
- **Broadcasters** needing scalable, cloud-native broadcasting infrastructure
- **Developers** wanting to integrate streaming capabilities into web applications

### LiveKit Ecosystem Integration

LiveMixer Web is deeply integrated into the LiveKit ecosystem, utilizing LiveKit Client for real-time communication, LiveKit Pull for participant management, and LiveKit Streams for video distribution. This integration ensures compatibility with LiveKit Cloud and self-hosted LiveKit servers, providing flexibility for different deployment scenarios.

### Key Features

- **Real-time video mixing**: Professional-grade video composition and effects
- **Web-based interface**: Runs directly in modern browsers without installation
- **LiveKit integration**: Leverages LiveKit's RTC infrastructure for streaming
- **Plugin architecture**: Extensible system supporting custom video sources and effects
- **Multi-platform support**: Works across desktop, mobile, and tablet devices
- **Open-source licensing**: Apache 2.0 license enabling commercial and personal use

**Section sources**
- [Readme.md:1-26](file://Readme.md#L1-L26)
- [package.json:6-20](file://package.json#L6-L20)

## Project Structure

The LiveMixer Web project follows a modular React architecture with clear separation of concerns:

```mermaid
graph TB
subgraph "Application Layer"
App[App.tsx]
Main[main.tsx]
end
subgraph "Core Services"
Streaming[Streaming Service]
Pull[Pull Service]
Registry[Plugin Registry]
Canvas[Konva Canvas]
end
subgraph "Built-in Plugins"
Webcam[WebCam Plugin]
Audio[Audio Input Plugin]
Image[Image Plugin]
Media[Media Source Plugin]
Screen[Screen Capture Plugin]
Text[Text Plugin]
end
subgraph "State Management"
Protocol[Protocol Store]
Settings[Settings Store]
end
Main --> App
App --> Streaming
App --> Pull
App --> Registry
App --> Canvas
Registry --> Webcam
Registry --> Audio
Registry --> Image
Registry --> Media
Registry --> Screen
Registry --> Text
App --> Protocol
App --> Settings
```

**Diagram sources**
- [src/main.tsx:14-28](file://src/main.tsx#L14-L28)
- [src/App.tsx:38-126](file://src/App.tsx#L38-L126)
- [src/services/plugin-registry.ts:78-167](file://src/services/plugin-registry.ts#L78-L167)

### Component Organization

The project is organized into distinct layers:
- **Entry Point**: Application bootstrap and plugin registration
- **Core Services**: Streaming, pulling, and media management
- **Plugin System**: Extensible video source and effect plugins
- **UI Components**: React-based interface with Konva canvas
- **State Management**: Protocol-driven configuration and settings

**Section sources**
- [src/main.tsx:14-28](file://src/main.tsx#L14-L28)
- [src/App.tsx:38-126](file://src/App.tsx#L38-L126)

## Core Components

### Application Foundation

The application initializes through a structured bootstrapping process that establishes internationalization, plugin systems, and core services. The main entry point registers built-in plugins and provides the foundation for the entire application.

### Streaming Infrastructure

LiveMixer Web provides comprehensive streaming capabilities through its integration with LiveKit Client. The streaming service manages room connections, track publishing, and quality adaptation for optimal streaming performance.

### Plugin Architecture

The plugin system enables extensibility through a well-defined interface. Built-in plugins include webcam capture, audio input, screen sharing, image sources, media players, and text overlays. Each plugin adheres to a standardized API for consistent behavior and integration.

### Canvas Rendering System

Powered by Konva, the canvas system provides real-time video composition with drag-and-drop editing, transformation controls, and layer management. The system supports both traditional video sources and LiveKit streams.

**Section sources**
- [src/App.tsx:38-126](file://src/App.tsx#L38-L126)
- [src/services/streaming.ts:1-49](file://src/services/streaming.ts#L1-L49)
- [src/services/plugin-registry.ts:78-167](file://src/services/plugin-registry.ts#L78-L167)
- [src/components/konva-canvas.tsx:113-176](file://src/components/konva-canvas.tsx#L113-L176)

## Architecture Overview

LiveMixer Web implements a client-side architecture focused on real-time video processing and streaming:

```mermaid
graph TB
subgraph "Client-Side Architecture"
UI[React UI Layer]
Canvas[Konva Canvas Engine]
Plugins[Plugin System]
Media[Media Stream Manager]
end
subgraph "LiveKit Integration"
RTCPeer[RTCPeerConnection]
Room[LiveKit Room]
Tracks[Remote Tracks]
end
subgraph "External Services"
LiveKitCloud[LiveKit Cloud]
SelfHosted[Self-Hosted LiveKit]
end
UI --> Canvas
Canvas --> Plugins
Plugins --> Media
Media --> RTCPeer
RTCPeer --> Room
Room --> Tracks
Room --> LiveKitCloud
Room --> SelfHosted
subgraph "Local Processing"
LocalStreams[Local Media Streams]
CanvasCapture[Canvas Capture]
Encoding[Video Encoding]
end
Media --> LocalStreams
Canvas --> CanvasCapture
CanvasCapture --> Encoding
Encoding --> RTCPeer
```

**Diagram sources**
- [src/services/streaming.ts:20-49](file://src/services/streaming.ts#L20-L49)
- [src/services/livekit-pull.ts:60-179](file://src/services/livekit-pull.ts#L60-L179)
- [src/components/konva-canvas.tsx:145-176](file://src/components/konva-canvas.tsx#L145-L176)

### Data Flow Architecture

The application processes video through a pipeline that captures canvas frames, applies plugin transformations, and publishes streams to LiveKit rooms. This architecture ensures low-latency processing while maintaining high-quality output.

**Section sources**
- [src/services/streaming.ts:20-49](file://src/services/streaming.ts#L20-L49)
- [src/components/konva-canvas.tsx:145-176](file://src/components/konva-canvas.tsx#L145-L176)

## Detailed Component Analysis

### Plugin System Architecture

The plugin system provides a robust framework for extending LiveMixer Web's capabilities:

```mermaid
classDiagram
class PluginRegistry {
+register(plugin)
+getPlugin(id)
+getAllPlugins()
+getSourcePlugins()
+getPluginBySourceType(type)
+getAudioMixerPlugins()
}
class ISourcePlugin {
+id : string
+version : string
+name : string
+category : string
+engines : Engines
+propsSchema : PropsSchema
+sourceType : SourceTypeMapping
+audioMixer : AudioMixerConfig
+canvasRender : CanvasRenderConfig
+propertyPanel : PropertyPanelConfig
+addDialog : AddDialogConfig
+defaultLayout : DefaultLayoutConfig
+streamInit : StreamInitConfig
+onInit(ctx)
+onUpdate(newProps)
+render(commonProps)
+onDispose()
}
class WebCamPlugin {
+id : "io.livemixer.webcam"
+sourceType : SourceTypeMapping
+addDialog : AddDialogConfig
+streamInit : StreamInitConfig
+propsSchema : PropsSchema
+render(commonProps)
}
class AudioInputPlugin {
+id : "io.livemixer.audioinput"
+audioMixer : AudioMixerConfig
+canvasRender : CanvasRenderConfig
+streamInit : StreamInitConfig
+propsSchema : PropsSchema
+render(commonProps)
}
PluginRegistry --> ISourcePlugin : "manages"
ISourcePlugin <|-- WebCamPlugin : "extends"
ISourcePlugin <|-- AudioInputPlugin : "extends"
```

**Diagram sources**
- [src/services/plugin-registry.ts:78-167](file://src/services/plugin-registry.ts#L78-L167)
- [src/plugins/builtin/webcam/index.tsx:110-234](file://src/plugins/builtin/webcam/index.tsx#L110-L234)
- [src/plugins/builtin/audio-input/index.tsx:105-254](file://src/plugins/builtin/audio-input/index.tsx#L105-L254)

### Streaming Workflow

The streaming process involves multiple coordinated steps for capturing, encoding, and publishing video content:

```mermaid
sequenceDiagram
participant User as "User Interface"
participant App as "App Component"
participant Canvas as "Konva Canvas"
participant Capture as "Canvas Capture"
participant Stream as "Streaming Service"
participant LiveKit as "LiveKit Room"
User->>App : Toggle Streaming
App->>Canvas : startContinuousRendering()
Canvas->>Capture : captureStream(canvas, fps)
Capture-->>App : MediaStream
App->>Stream : connect(url, token, mediaStream)
Stream->>LiveKit : publishVideoTrack()
LiveKit-->>Stream : connection established
Stream-->>App : streaming active
App-->>User : streaming indicator
User->>App : Stop Streaming
App->>Stream : disconnect()
Stream->>LiveKit : unpublish tracks
Stream->>Canvas : stopContinuousRendering()
Canvas-->>App : rendering stopped
```

**Diagram sources**
- [src/App.tsx:726-788](file://src/App.tsx#L726-L788)
- [src/components/konva-canvas.tsx:155-175](file://src/components/konva-canvas.tsx#L155-L175)
- [src/services/streaming.ts:20-49](file://src/services/streaming.ts#L20-L49)

### Plugin Registration Process

Built-in plugins are registered during application startup, establishing the foundation for video source creation:

```mermaid
flowchart TD
Start([Application Start]) --> LoadPlugins["Load Built-in Plugins"]
LoadPlugins --> RegisterWebcam["Register Webcam Plugin"]
LoadPlugins --> RegisterAudio["Register Audio Input Plugin"]
LoadPlugins --> RegisterMedia["Register Media Source Plugin"]
LoadPlugins --> RegisterScreen["Register Screen Capture Plugin"]
LoadPlugins --> RegisterImage["Register Image Plugin"]
LoadPlugins --> RegisterText["Register Text Plugin"]
RegisterWebcam --> InitRegistry["Initialize Plugin Registry"]
RegisterAudio --> InitRegistry
RegisterMedia --> InitRegistry
RegisterScreen --> InitRegistry
RegisterImage --> InitRegistry
RegisterText --> InitRegistry
InitRegistry --> Ready([Plugins Ready])
Ready --> UserInterface["User Interface Available"]
```

**Diagram sources**
- [src/main.tsx:14-20](file://src/main.tsx#L14-L20)
- [src/services/plugin-registry.ts:78-118](file://src/services/plugin-registry.ts#L78-L118)

**Section sources**
- [src/main.tsx:14-20](file://src/main.tsx#L14-L20)
- [src/services/plugin-registry.ts:78-118](file://src/services/plugin-registry.ts#L78-L118)
- [src/App.tsx:726-788](file://src/App.tsx#L726-L788)

## Dependency Analysis

LiveMixer Web relies on a carefully selected set of dependencies that balance functionality with performance:

```mermaid
graph TB
subgraph "Core Dependencies"
React[React 19.2.0]
Konva[Konva 10.0.12]
LiveKit[LiveKit Client 2.16.1]
Zustand[Zustand 5.0.9]
end
subgraph "UI Framework"
Radix[Radix UI 1.1.15]
Tailwind[Tailwind CSS 4.1.17]
end
subgraph "Internationalization"
I18n[i18next 25.8.14]
Detector[Language Detector 8.2.1]
end
subgraph "Development Tools"
Vite[Vite 7.2.4]
Biome[Biome 2.3.8]
end
React --> Konva
React --> LiveKit
React --> Zustand
Konva --> LiveKit
I18n --> Detector
Radix --> Tailwind
```

**Diagram sources**
- [package.json:50-76](file://package.json#L50-L76)

### External Integrations

The application integrates with external services through well-defined interfaces:
- **LiveKit Cloud**: Managed streaming infrastructure
- **Self-hosted LiveKit**: On-premises deployment option
- **Browser APIs**: MediaDevices, RTCPeerConnection, Canvas capture
- **Storage**: LocalStorage for configuration persistence

**Section sources**
- [package.json:50-76](file://package.json#L50-L76)

## Performance Considerations

LiveMixer Web is optimized for real-time video processing with several performance-focused design decisions:

- **Canvas-based rendering**: Uses Konva for efficient GPU-accelerated rendering
- **Adaptive streaming**: LiveKit's adaptive stream technology optimizes bandwidth usage
- **Efficient plugin architecture**: Modular design minimizes memory footprint
- **Lazy loading**: Plugins are loaded on-demand to reduce initial bundle size
- **State management**: Zustand provides lightweight state management without unnecessary overhead

## Troubleshooting Guide

Common issues and their solutions:

### Streaming Issues
- **Connection failures**: Verify LiveKit server URL and token configuration
- **Permission errors**: Ensure browser permissions are granted for camera/microphone/screen
- **Quality problems**: Adjust video bitrate and codec settings in streaming configuration

### Plugin Problems
- **Plugin not appearing**: Check plugin registration and source type mapping
- **Stream capture issues**: Verify device availability and permissions
- **Rendering problems**: Confirm plugin compatibility with current LiveMixer version

### Performance Issues
- **High CPU usage**: Reduce canvas resolution or disable unnecessary plugins
- **Memory leaks**: Monitor plugin lifecycle and cleanup procedures
- **Latency problems**: Optimize network connection and LiveKit server proximity

**Section sources**
- [src/services/streaming.ts:32-34](file://src/services/streaming.ts#L32-L34)
- [src/plugins/builtin/webcam/index.tsx:328-335](file://src/plugins/builtin/webcam/index.tsx#L328-L335)

## Conclusion

LiveMixer Web represents a significant advancement in web-based video production, offering professional-grade capabilities through an accessible, browser-native interface. Its integration with the LiveKit ecosystem provides scalability and reliability that traditional desktop applications cannot match.

The project's open-source nature, combined with its modular plugin architecture and real-time streaming capabilities, positions it as a powerful alternative to established streaming software. By focusing on web technologies and modern streaming protocols, LiveMixer Web enables content creators to achieve broadcast-quality results from any device with a modern browser.

The comprehensive plugin system ensures extensibility for specialized use cases, while the clean architecture supports ongoing development and community contributions. As web technologies continue to evolve, LiveMixer Web provides a foundation for innovative video production solutions that leverage the power of the browser platform.