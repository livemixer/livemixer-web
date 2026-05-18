import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useSettingsStore } from '../store/setting';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';

type TransitionType = 'cut' | 'fade' | 'dissolve' | 'swipe' | 'stinger';

const TRANSITION_TYPES: TransitionType[] = ['cut', 'fade', 'dissolve', 'swipe', 'stinger'];

interface SceneTransitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SceneTransitionDialog({ open, onOpenChange }: SceneTransitionDialogProps) {
  const { t } = useI18n();
  const { transitionType, transitionDuration, updatePersistentSettings } = useSettingsStore();

  const [pendingType, setPendingType] = useState<TransitionType>(transitionType);
  const [pendingDuration, setPendingDuration] = useState(transitionDuration);

  // Sync local state when dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setPendingType(transitionType);
      setPendingDuration(transitionDuration);
    }
    onOpenChange(nextOpen);
  };

  const handleApply = () => {
    updatePersistentSettings({
      transitionType: pendingType,
      transitionDuration: pendingDuration,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t('sceneTransition.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <p className="text-sm text-[var(--lm-muted-2)]">{t('sceneTransition.description')}</p>

          {/* Transition Type */}
          <div className="space-y-2">
            <Label className="text-sm text-[var(--lm-muted)]">{t('sceneTransition.type')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {TRANSITION_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPendingType(type)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    pendingType === type
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-[var(--lm-surface-1)] border-[var(--lm-border)] text-[var(--lm-muted-2)] hover:border-[var(--lm-border-strong)] hover:text-[var(--lm-fg)]'
                  }`}
                >
                  {t(`sceneTransition.${type}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          {pendingType !== 'cut' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-[var(--lm-muted)]">
                  {t('sceneTransition.duration')}
                </Label>
                <span className="text-xs text-[var(--lm-muted-2)]">
                  {t('sceneTransition.durationMs', {
                    value: pendingDuration,
                  })}
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={pendingDuration}
                onChange={e => setPendingDuration(Number.parseInt(e.target.value, 10))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-[var(--lm-muted-2)]">
                <span>50ms</span>
                <span>2000ms</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 text-sm text-[var(--lm-muted-2)] hover:text-[var(--lm-fg)] hover:bg-[var(--lm-hover)] rounded-md transition-colors"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {t('sceneTransition.apply')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
