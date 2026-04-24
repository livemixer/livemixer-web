import { useI18n } from '../hooks/useI18n';
import type { SceneItem } from '../types/protocol';
import { AudioMixerPanel } from './audio-mixer-panel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface AudioMixerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioItems: SceneItem[];
  onUpdateItem?: (itemId: string, updates: Partial<SceneItem>) => void;
}

export function AudioMixerDialog({
  open,
  onOpenChange,
  audioItems,
  onUpdateItem,
}: AudioMixerDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-[#2d2d30] border-[#3e3e42]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {t('toolbar.audioMixer')}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[240px]">
          <AudioMixerPanel
            audioItems={audioItems}
            onUpdateItem={onUpdateItem}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
