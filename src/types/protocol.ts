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
  type: 'color' | 'image' | 'media' | 'text' | 'screen' | 'window' | 'video_input' | 'audio_input' | 'audio_output' | 'container' | 'scene_ref' | 'timer' | 'clock'
  zIndex: number
  layout: Layout
  transform?: Transform
  visible?: boolean // 可见性
  locked?: boolean // 属性锁定
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
    mode: 'countdown' | 'countup' | 'clock' // 倒计时/正计时/时钟
    duration?: number // 倒计时总时长（秒）
    startValue?: number // 正计时起始值（秒）
    format?: string // 显示格式，如 'HH:MM:SS' 或 'MM:SS'
    running?: boolean // 是否运行中
    currentTime?: number // 当前时间值（秒）
    startTime?: number // 开始时间戳（用于精确计时）
    pausedAt?: number // 暂停时的时间值
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
