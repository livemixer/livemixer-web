# Getting Started

LiveMixer Web Studio is an open-source live video mixer and streaming application built with React, Konva.js, and LiveKit WebRTC.

It provides a browser-based video mixing experience similar to OBS Studio, enabling users to compose live video scenes with multiple sources (webcam, screen capture, media files, text, images) and stream them in real time via LiveKit.

## Features

- **Visual Canvas Editor** - Drag, resize, and layer video sources on a Konva.js-powered canvas
- **Scene Management** - Create, reorder, and switch between multiple scenes
- **Built-in Source Plugins**
  - Webcam capture
  - Screen / window capture
  - Media source (URL-based video)
  - Image overlay
  - Text overlay
  - Timer & clock
  - Audio input with mixer panel
- **Live Streaming** - Publish the mixed canvas to a LiveKit room via WebRTC
- **Stream Pulling** - Consume remote participant streams and add them to the canvas
- **Plugin System** - Extensible architecture with a built-in plugin registry, context API, and dialog slots
- **Internationalization** - Multilingual support via i18next (English & Chinese out of the box)
- **Config Persistence** - Import and export scene configurations as JSON
- **Library Mode** - Can be used as an embeddable React component (ES + UMD builds)

## Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended package manager)

## Install

```sh
pnpm install
```

## Development

Start the development server with hot module replacement:

```sh
pnpm run dev
```

The app will be available at `http://localhost:5173` by default.

## Build

```sh
# Build as a standalone web application
pnpm run build

# Build as a library (ES Module + UMD)
pnpm run build:lib
```

Build output:

| Command | Output Directory | Description |
|---------|-----------------|-------------|
| `pnpm run build` | `dist/` | Standalone web application |
| `pnpm run build:lib` | `dist-lib/` | Embeddable library (ES + UMD + type declarations) |

## Preview

Preview the production build locally:

```sh
pnpm run preview
```

## Online Demo

Try the live demo: [LiveMixer Web Studio Demo](https://livemixer.github.io/livemixer-web/)

## Next Steps

- [User Guide](./user-guide.md) - Learn how to use LiveMixer Web Studio
- [Integration Guide](./integration-guide.md) - Embed LiveMixer Web into your application
- [Architecture](./architecture.md) - Understand the project architecture and tech stack
- [Plugin Development](./plugin-development.md) - Build custom source plugins
