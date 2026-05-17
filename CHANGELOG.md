# Changelog

All notable changes to LiveMixer Web Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-05-17

### Added

- Add resizable bottom bar in main layout (#47)
- Set up Vitest unit testing infrastructure with jsdom env, example tests for `cn` util and PluginRegistry, and a GitHub Actions workflow to run unit tests on PRs (#49)

### Changed

- Tighten main canvas spacing: reduce KonvaCanvas auto-fit margin, soften canvas border and shadow, and move the canvas size indicator into the bottom-left corner as a translucent overlay (#51)
- Translate all hardcoded Chinese comments and UI strings to English (#48)

### Fixed

- Preserve empty string in plugin string fields by replacing `||` short-circuit with `??` so clearing a text input no longer falls back to schema default value (#52)
- Clamp frameRatio to prevent CPU usage showing 0 on high refresh rate displays (#50)
- Fix z-index stacking inconsistency in main canvas (#46)
- Fix the awk regex in release.yml to get the correct version update history (#45)

## [0.2.0] - 2026-04-26

### Added

- Implement Edit menu operations: undo, redo, copy, paste, and delete (#31)
- Implement View menu actions: fullscreen toggle via Fullscreen API, show grid, and show guides (center crosshair dashed lines) (#33)
- Implement Help menu placeholder actions (#35)
- Add Audio Mixer dialog with volume control (#34)
- Add Scene Transition dialog (#34)
- Add Plugin Manager dialog for managing plugins (#34)
- Composite LiveKit video frames into output canvas for mixed streaming (#40)
- Add background rendering with Web Worker timer for page-hidden scenario (#41)

### Changed

- Update logo and preview image (#43)
- Update documentation (#38)
- Add logo and online demo link to Readme header (#30)
- Format code and fix format workflow (#32)

### Fixed

- Fix LiveKit stream overlays blocking canvas interaction (#42)
- Fix rendering output canvas at full resolution using Konva toCanvas API (#39)
- Fix rendering performance issues across multiple components (#37)
- Fix canvas controls not scaling with browser window resize (#36)

## [0.0.1-rc1] - 2026-04-19

### Changed

- Use pnpm exec in deploy.yml (#28)
- Add `--base /livemixer-web/` to deploy.yml for GitHub Pages sub-path (#27)

### Fixed

- Separate lib build output to dist-lib and fix README.md case mismatch (#26)

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

[0.3.0]: https://github.com/livemixer/livemixer-web/releases/tag/v0.3.0
[0.2.0]: https://github.com/livemixer/livemixer-web/releases/tag/v0.2.0
[0.0.1-rc1]: https://github.com/livemixer/livemixer-web/releases/tag/v0.0.1-rc1
[0.0.1]: https://github.com/livemixer/livemixer-web/releases/tag/v0.0.1
