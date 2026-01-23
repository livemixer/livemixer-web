import type Konva from 'konva';

export type PluginControlType = 'number' | 'string' | 'color' | 'boolean' | 'select' | 'image' | 'video' | 'group';

export interface PropsSchemaItem {
    label: string;
    type: PluginControlType;
    defaultValue: any;
    min?: number;
    max?: number;
    step?: number;
    options?: { label: string; value: any }[];
    group?: string;
}

export interface PropsSchema {
    [key: string]: PropsSchemaItem;
}

export interface IPluginContext {
    canvasWidth: number;
    canvasHeight: number;
    logger: {
        info: (msg: string) => void;
        error: (msg: string) => void;
    };
    assetLoader: {
        loadTexture: (url: string) => Promise<any>;
    };
}

export interface IFrameContext {
    time: number;
    delta: number;
}

export interface ISourcePlugin {
    // 元数据
    id: string;
    version: string;
    name: string;
    icon?: string;
    category: 'media' | 'text' | 'widget' | 'effect';

    // 兼容性声明
    engines: {
        host: string;
        api: string;
    };

    // 属性定义
    propsSchema: PropsSchema;

    // 生命周期
    onInit: (ctx: IPluginContext) => Promise<void> | void;
    onUpdate: (newProps: any) => void;

    /**
     * 返回一个 Konva 节点用于渲染
     * 或者执行自定义渲染逻辑
     */
    render: (commonProps: any) => React.ReactElement;

    onDispose: () => void;
}
