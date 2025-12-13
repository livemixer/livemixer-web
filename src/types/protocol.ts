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
    type: 'color' | 'video' | 'text' | 'screen' | 'container' | 'scene_ref'
    zIndex: number
    layout: Layout
    transform?: Transform
    // color type
    color?: string
    // text type
    content?: string
    properties?: {
        fontSize?: number
        color?: string
    }
    // video/screen type
    source?: string
    // container type
    children?: SceneItem[]
    // scene_ref type
    refSceneId?: string
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
