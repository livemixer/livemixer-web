import { Image, Monitor, ScreenShare, Type, Video, Mic, Volume2, Timer, Clock, Puzzle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { pluginRegistry } from '../services/plugin-registry'

export type SourceType = 'image' | 'media' | 'text' | 'screen' | 'window' | 'video_input' | 'audio_input' | 'audio_output' | 'timer' | 'clock' | string

interface SourceTypeOption {
    type: SourceType
    name: string
    description: string
    icon: React.ReactNode
}

interface AddSourceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectSourceType: (type: SourceType) => void
}

export function AddSourceDialog({
    open,
    onOpenChange,
    onSelectSourceType,
}: AddSourceDialogProps) {
    const sourceTypes: SourceTypeOption[] = [
        {
            type: 'image',
            name: '图像',
            description: '添加图片文件',
            icon: <Image className="w-6 h-6" />,
        },
        {
            type: 'media',
            name: '媒体源',
            description: '添加视频或音频文件',
            icon: <Video className="w-6 h-6" />,
        },
        {
            type: 'text',
            name: '文本',
            description: '添加文本内容',
            icon: <Type className="w-6 h-6" />,
        },
        {
            type: 'screen',
            name: '显示器采集',
            description: '捕获整个显示器画面',
            icon: <Monitor className="w-6 h-6" />,
        },
        {
            type: 'window',
            name: '窗口采集',
            description: '捕获指定窗口画面',
            icon: <ScreenShare className="w-6 h-6" />,
        },
        {
            type: 'video_input',
            name: '视频采集设备',
            description: '使用摄像头或视频设备',
            icon: <Video className="w-6 h-6" />,
        },
        {
            type: 'audio_input',
            name: '音频输入采集',
            description: '捕获麦克风或其他音频输入',
            icon: <Mic className="w-6 h-6" />,
        },
        {
            type: 'audio_output',
            name: '音频输出采集',
            description: '捕获系统音频输出',
            icon: <Volume2 className="w-6 h-6" />,
        },
        {
            type: 'timer',
            name: '定时器',
            description: '添加倒计时或正计时',
            icon: <Timer className="w-6 h-6" />,
        },
        {
            type: 'clock',
            name: '时钟',
            description: '显示实时时钟',
            icon: <Clock className="w-6 h-6" />,
        },
    ]

    const handleSelectType = (type: SourceType) => {
        onSelectSourceType(type)
        onOpenChange(false)
    }

    const externalPlugins = pluginRegistry.getAllPlugins().filter(p =>
        !['io.livemixer.image', 'io.livemixer.webcam', 'io.livemixer.text'].includes(p.id)
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-white">
                        添加源
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        选择要添加的源类型
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">内置源</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {sourceTypes.map((sourceType) => (
                                <button
                                    key={sourceType.type}
                                    type="button"
                                    onClick={() => handleSelectType(sourceType.type)}
                                    className="flex items-start gap-4 p-4 bg-[#1e1e1e] hover:bg-[#2d2d30] border border-[#3e3e42] rounded-lg transition-colors text-left"
                                >
                                    <div className="flex-shrink-0 text-blue-400 mt-1">
                                        {sourceType.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-white text-sm mb-1">
                                            {sourceType.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 line-clamp-2">
                                            {sourceType.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {externalPlugins.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">已安装插件</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {externalPlugins.map((plugin) => (
                                    <button
                                        key={plugin.id}
                                        type="button"
                                        onClick={() => handleSelectType(plugin.id)}
                                        className="flex items-start gap-4 p-4 bg-[#1e1e1e] hover:bg-[#2d2d30] border border-[#3e3e42] rounded-lg transition-colors text-left"
                                    >
                                        <div className="flex-shrink-0 text-purple-400 mt-1">
                                            <Puzzle className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-white text-sm mb-1">
                                                {plugin.name}
                                            </h4>
                                            <p className="text-xs text-gray-400 line-clamp-1">
                                                {plugin.id}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
