import {
  Clock,
  Image,
  Mic,
  Monitor,
  Puzzle,
  Timer,
  Type,
  Video,
  Volume2,
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { pluginRegistry } from '../services/plugin-registry';
import type { ISourcePlugin } from '../types/plugin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

export type SourceType =
  | 'image'
  | 'media'
  | 'text'
  | 'screen'
  | 'window'
  | 'video_input'
  | 'audio_input'
  | 'audio_output'
  | 'timer'
  | 'clock'
  | string;

interface SourceTypeOption {
  type: SourceType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSourceType: (type: SourceType) => void;
}

// Icon mapping for plugin icons
const iconMap: Record<string, React.ReactNode> = {
  image: <Image className="w-6 h-6" />,
  video: <Video className="w-6 h-6" />,
  type: <Type className="w-6 h-6" />,
  monitor: <Monitor className="w-6 h-6" />,
  mic: <Mic className="w-6 h-6" />,
  volume: <Volume2 className="w-6 h-6" />,
  timer: <Timer className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
};

// Legacy source types not yet migrated to plugins
const legacySourceTypes = (t: (key: string) => string): SourceTypeOption[] => [
  {
    type: 'audio_output',
    name: t('addSource.audioOutput.name'),
    description: t('addSource.audioOutput.description'),
    icon: <Volume2 className="w-6 h-6" />,
  },
  {
    type: 'timer',
    name: t('addSource.timer.name'),
    description: t('addSource.timer.description'),
    icon: <Timer className="w-6 h-6" />,
  },
  {
    type: 'clock',
    name: t('addSource.clock.name'),
    description: t('addSource.clock.description'),
    icon: <Clock className="w-6 h-6" />,
  },
];

// Convert plugin to source type option
const pluginToSourceOption = (
  plugin: ISourcePlugin,
  t: (key: string) => string,
): SourceTypeOption | null => {
  if (!plugin.sourceType) return null;

  return {
    type: plugin.sourceType.typeId,
    name: plugin.sourceType.nameKey
      ? t(plugin.sourceType.nameKey)
      : plugin.name,
    description: plugin.sourceType.descriptionKey
      ? t(plugin.sourceType.descriptionKey)
      : '',
    icon: iconMap[plugin.sourceType.icon || ''] || (
      <Puzzle className="w-6 h-6" />
    ),
  };
};

export function AddSourceDialog({
  open,
  onOpenChange,
  onSelectSourceType,
}: AddSourceDialogProps) {
  const { t } = useI18n();

  // Get source plugins from registry
  const sourcePlugins = pluginRegistry.getSourcePlugins();

  // Convert plugins to source type options
  const pluginSourceTypes = sourcePlugins
    .map((p) => pluginToSourceOption(p, t))
    .filter((p): p is SourceTypeOption => p !== null);

  // Combine with legacy source types
  const sourceTypes: SourceTypeOption[] = [
    ...pluginSourceTypes,
    ...legacySourceTypes(t),
  ];

  const handleSelectType = (type: SourceType) => {
    onSelectSourceType(type);
    onOpenChange(false);
  };

  // External plugins are those without sourceType mapping (pure extensions)
  const externalPlugins = pluginRegistry
    .getAllPlugins()
    .filter((p) => !p.sourceType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-linear-to-b from-neutral-850 to-neutral-900 border-neutral-700/50 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">
            {t('addSource.title')}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {t('addSource.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t('addSource.builtin')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {sourceTypes.map((sourceType) => (
                <button
                  key={sourceType.type}
                  type="button"
                  onClick={() => handleSelectType(sourceType.type)}
                  className="flex items-start gap-4 p-4 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg transition-all text-left hover:border-primary-500/50 group"
                >
                  <div className="shrink-0 text-primary-400 mt-1 group-hover:scale-110 transition-transform">
                    {sourceType.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm mb-1">
                      {sourceType.name}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-2">
                      {sourceType.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {externalPlugins.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                {t('addSource.installedPlugins')}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {externalPlugins.map((plugin) => (
                  <button
                    key={plugin.id}
                    type="button"
                    onClick={() => handleSelectType(plugin.id)}
                    className="flex items-start gap-4 p-4 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 rounded-lg transition-all text-left hover:border-primary-500/50 group"
                  >
                    <div className="shrink-0 text-warning-500 mt-1 group-hover:scale-110 transition-transform">
                      <Puzzle className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm mb-1">
                        {plugin.name}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-1">
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
  );
}
