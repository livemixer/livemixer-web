import type { Scene } from '../types/protocol'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'

interface ScenePanelProps {
  scenes: Scene[]
  activeSceneId: string | null
  onSceneSelect: (sceneId: string) => void
}

export function ScenePanel({
  scenes,
  activeSceneId,
  onSceneSelect,
}: ScenePanelProps) {
  return (
    <TooltipProvider>
      <div className="h-full p-4">
        <h3 className="text-sm font-semibold mb-3 text-gray-300">场景</h3>
        <div className="flex gap-3 flex-wrap">
          {scenes.map((scene) => (
            <Tooltip key={scene.id}>
              <TooltipTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSceneSelect(scene.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSceneSelect(scene.id)
                    }
                  }}
                  className={`
                                        relative cursor-pointer rounded-lg overflow-hidden transition-all
                                        ${
                                          activeSceneId === scene.id
                                            ? 'ring-2 ring-red-500 shadow-lg'
                                            : 'ring-1 ring-gray-700 hover:ring-gray-500'
                                        }
                                    `}
                  style={{ width: '160px', height: '90px' }}
                >
                  <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">
                        {scene.items.length} 个元素
                      </div>
                      <div className="text-sm font-medium text-white">
                        {scene.name}
                      </div>
                    </div>
                  </div>
                  {activeSceneId === scene.id && (
                    <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1">
                      活跃
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-[#2d2d30] border-[#3e3e42] text-white"
              >
                <div className="space-y-1">
                  <div className="font-medium">{scene.name}</div>
                  <div className="text-xs text-gray-400">ID: {scene.id}</div>
                  <div className="text-xs text-gray-400">
                    {scene.items.length} 个元素
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
