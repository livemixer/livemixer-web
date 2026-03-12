import {
  Clock,
  Image,
  Mic,
  Monitor,
  Puzzle,
  ScreenShare,
  Timer,
  Type,
  Video,
  Volume2,
} from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { pluginRegistry } from '../services/plugin-registry';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

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

export function AddSourceDialog({ open, onOpenChange, onSelectSourceType }: AddSourceDialogProps) {
  const { t } = useI18n();

  const sourceTypes: SourceTypeOption[] = [
    {
      type: 'image',
      name: t('addSource.image.name'),
      description: t('addSource.image.description'),
      icon: <Image className="w-6 h-6" />,
    },
    {
      type: 'media',
      name: t('addSource.media.name'),
      description: t('addSource.media.description'),
      icon: <Video className="w-6 h-6" />,
    },
    {
      type: 'text',
      name: t('addSource.text.name'),
      description: t('addSource.text.description'),
      icon: <Type className="w-6 h-6" />,
    },
    {
      type: 'screen',
      name: t('addSource.screen.name'),
      description: t('addSource.screen.description'),
      icon: <Monitor className="w-6 h-6" />,
    },
    {
      type: 'window',
      name: t('addSource.window.name'),
      description: t('addSource.window.description'),
      icon: <ScreenShare className="w-6 h-6" />,
    },
    {
      type: 'video_input',
      name: t('addSource.videoInput.name'),
      description: t('addSource.videoInput.description'),
      icon: <Video className="w-6 h-6" />,
    },
    {
      type: 'audio_input',
      name: t('addSource.audioInput.name'),
      description: t('addSource.audioInput.description'),
      icon: <Mic className="w-6 h-6" />,
    },
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

  const handleSelectType = (type: SourceType) => {
    onSelectSourceType(type);
    onOpenChange(false);
  };

  const externalPlugins = pluginRegistry
    .getAllPlugins()
    .filter(
      p => !['io.livemixer.image', 'io.livemixer.mediasource', 'io.livemixer.webcam', 'io.livemixer.text'].includes(p.id),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-linear-to-b from-neutral-850 to-neutral-900 border-neutral-700/50 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">{t('addSource.title')}</DialogTitle>
          <DialogDescription className="text-neutral-400">{t('addSource.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              {t('addSource.builtin')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {sourceTypes.map(sourceType => (
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
                    <h4 className="font-medium text-white text-sm mb-1">{sourceType.name}</h4>
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
                {externalPlugins.map(plugin => (
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
                      <h4 className="font-medium text-white text-sm mb-1">{plugin.name}</h4>
                      <p className="text-xs text-neutral-400 line-clamp-1">{plugin.id}</p>
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
