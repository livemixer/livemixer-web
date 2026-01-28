export interface CanvasConfig {
  width: number
  height: number
}

export interface Layout {
  x: number
  y: number
  width: number
  height: number
}

export interface Transform {
  opacity?: number
  rotation?: number
  filters?: { name: string; value: number }[]
  borderRadius?: number
}

export interface SceneItem {
  id: string
  type: 'color' | 'image' | 'media' | 'text' | 'screen' | 'window' | 'video_input' | 'audio_input' | 'audio_output' | 'container' | 'scene_ref' | 'timer' | 'clock' | 'livekit_stream' | string
  zIndex: number
  layout: Layout
  transform?: Transform
  visible?: boolean // Visibility
  locked?: boolean // Property locked
  // color type
  color?: string
  // text type
  content?: string
  properties?: {
    fontSize?: number
    color?: string
  }
  // image/media type
  url?: string
  // video/screen/window type
  source?: string
  // container type
  children?: SceneItem[]
  // scene_ref type
  refSceneId?: string
  // timer/clock type
  timerConfig?: {
    mode: 'countdown' | 'countup' | 'clock' // Countdown/Countup/Clock
    duration?: number // Total countdown duration (seconds)
    startValue?: number // Count-up start value (seconds)
    format?: string // Display format, e.g. 'HH:MM:SS' or 'MM:SS'
    running?: boolean // Whether running
    currentTime?: number // Current time value (seconds)
    startTime?: number // Start timestamp (for precision)
    pausedAt?: number // Time value when paused
  }
  // livekit_stream type
  livekitStream?: {
    participantIdentity: string // Participant ID
    streamSource: 'camera' | 'screen_share' // Stream source: camera or screen share
  }
}

export interface Scene {
  id: string
  name: string
  active?: boolean
  items: SceneItem[]
}

export interface Source {
  id: string
  type: string
  name: string
  config?: Record<string, string>
  url?: string
}

export interface Resources {
  sources: Source[]
}

export interface ProtocolData {
  version: string
  metadata: {
    name: string
    createdAt: string
    updatedAt: string
  }
  canvas: CanvasConfig
  resources?: Resources
  scenes: Scene[]
}
