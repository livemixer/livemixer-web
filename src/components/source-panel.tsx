import { Video, Mic, Music } from 'lucide-react'
import type { Source } from '../types/protocol'

interface SourcePanelProps {
    sources: Source[]
}

export function SourcePanel({ sources }: SourcePanelProps) {
    const getSourceIcon = (type: string) => {
        switch (type) {
            case 'video_input':
                return <Video className="w-4 h-4" />
            case 'audio_input':
                return <Mic className="w-4 h-4" />
            case 'audio_file':
                return <Music className="w-4 h-4" />
            default:
                return null
        }
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4 border-b border-[#3e3e42]">
                <h3 className="text-sm font-semibold text-gray-300">源</h3>
            </div>

            <div className="p-3 space-y-2">
                {sources.map((source) => (
                    <div
                        key={source.id}
                        className="p-3 bg-[#2d2d30] rounded-lg hover:bg-[#3e3e42] transition-colors cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="text-gray-400">
                                {getSourceIcon(source.type)}
                            </div>
                            <div className="text-sm font-medium text-white truncate">
                                {source.name}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {source.type.replace('_', ' ')}
                        </div>
                    </div>
                ))}

                {sources.length === 0 && (
                    <div className="text-sm text-gray-500 text-center py-8">
                        暂无源
                    </div>
                )}
            </div>
        </div>
    )
}
