# Changelog

All notable changes to LiveMixer Web Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2026-04-19

### Added

- Initialize project with Vite + React + TypeScript
- Add LiveMixer Studio layout with sidebar, canvas, and bottom bar
- Add Konva.js-powered visual canvas for video mixing
- Add scene management: create, delete, reorder, and switch scenes
- Add source management: add, delete, reorder, visibility toggle, and lock
- Add drag, resize, and selection highlighting for source controls on canvas
- Add property panel for editing source properties (position, size, etc.)
- Add image source support
- Add text source support with configurable font size and color
- Add timer and clock source
- Add webcam source plugin with device selection
- Add screen capture and window capture plugins
- Add media source plugin (URL-based video playback)
- Add audio input source with audio mixer panel
- Add settings dialog with streaming configuration (LiveKit URL, token, FPS, video bitrate, encoder)
- Add LiveKit WebRTC streaming: publish the mixed canvas to a LiveKit room
- Add LiveKit stream pulling: consume remote participant streams and add them to the canvas
- Add participants panel for viewing and adding remote participants to the scene
- Add config import and export (JSON-based scene configuration)
- Add protocol store with Zustand for state management
- Add settings store with Zustand for streaming preferences
- Add protocol v1.0.0 data model definition
- Add plugin system with extensible architecture
  - Plugin registry for registering and discovering plugins
  - Plugin context API for plugin-to-app communication
  - Dialog slot system for plugin UI injection
  - Props schema for declarative property definitions
  - Stream initialization hooks for media device plugins
- Add built-in plugins: webcam, audio input, screen capture, media source, image, text
- Add internationalization (i18n) support with i18next (English and Chinese)
- Add library mode export (ES module + UMD builds) with TypeScript type declarations
- Add GitHub repository link to the UI
- Add Apache-2.0 license
- Add Biome code formatting and linting configuration
- Add GitHub Actions format check workflow
- Add project logo (lms.svg)

### Changed

- Refactor UI components to use Radix UI primitives
- Refactor plugin system: moved webcam to plugin/webcam with plugin interface
- Refactor plugin system: removed hard-coded references to plugin interface in the App component
- Refactor plugin implementation: removed internal hard-coded calls
- Refactor ID generation rules for scenes and sources
- Refactor CSS layout: adjusted page layout and removed unexpected global styles
- Remove audio output plugin and add switch audio in screen capture plugin

### Fixed

- Fix image source flickering when the KonvaCanvas re-renders
- Fix video track published as ScreenShare instead of regular video
- Fix media source URL validation (check if URL is available before playing)
- Fix video-input and audio-input plugin failing to open devices

[0.0.1]: https://github.com/livemixer/livemixer-web/releases/tag/v0.0.1
