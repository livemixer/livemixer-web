import { useI18n } from '../hooks/useI18n';
import type { Scene } from '../types/protocol';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ScenePanelProps {
  scenes: Scene[];
  activeSceneId: string | null;
  onSceneSelect: (sceneId: string) => void;
}

export function ScenePanel({ scenes, activeSceneId, onSceneSelect }: ScenePanelProps) {
  const { t } = useI18n();

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="px-4 py-2 border-b border-neutral-700/30 text-center bg-neutral-900/80 sticky top-0">
          <h3 className="text-sm font-semibold text-white">{t('scene.title')}</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {scenes.map(scene => (
              <Tooltip key={scene.id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onSceneSelect(scene.id)}
                    className={`
                      w-full px-3 py-2 rounded-lg cursor-pointer transition-all text-sm select-none border text-left
                      ${activeSceneId === scene.id
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white border-primary-400 shadow-lg'
                        : 'bg-neutral-800/40 text-neutral-300 hover:bg-neutral-700/40 border-neutral-700/30'
                      }
                    `}
                  >
                    <div className="font-medium">{scene.name}</div>
                    <div className="text-xs opacity-70">{scene.items.length} {t('scene.items')}</div>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-neutral-800 border-neutral-700/50 text-white"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{scene.name}</div>
                    <div className="text-xs text-neutral-400">ID: {scene.id}</div>
                    <div className="text-xs text-neutral-400">{scene.items.length} {t('scene.items')}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
