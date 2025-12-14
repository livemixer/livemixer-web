import { Mic, Music, Video } from 'lucide-react'
import type { Source } from '../types/protocol'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

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
    <TooltipProvider>
      <div className="h-full overflow-y-auto">
        <div className="p-4 border-b border-[#3e3e42]">
          <h3 className="text-sm font-semibold text-gray-300">源</h3>
        </div>

        <div className="p-3 space-y-2">
          {sources.map((source) => (
            <Tooltip key={source.id}>
              <TooltipTrigger asChild>
                <div className="p-3 bg-[#2d2d30] rounded-lg hover:bg-[#3e3e42] transition-colors cursor-pointer">
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
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-[#2d2d30] border-[#3e3e42] text-white"
              >
                <div className="space-y-1">
                  <div className="font-medium">{source.name}</div>
                  <div className="text-xs text-gray-400">ID: {source.id}</div>
                  <div className="text-xs text-gray-400">
                    类型: {source.type}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {sources.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-8">暂无源</div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
