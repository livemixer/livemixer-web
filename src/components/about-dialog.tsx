import lmsLogo from '../assets/lms.svg';
import { useI18n } from '../hooks/useI18n';
import { LWS_APP_VERSION } from '../version';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="sr-only">
          <DialogTitle>{t('about.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <img src={lmsLogo} alt="LiveMixer Web Studio" className="w-16 h-16 mb-3" />
          <h2 className="text-base font-semibold text-[var(--lm-fg)]">LiveMixer Web Studio</h2>
          <p className="text-xs text-[var(--lm-muted-2)] mt-1 text-center">
            {t('about.description')}
          </p>
        </div>

        <div className="border-t border-[var(--lm-border-strong)] pt-3 space-y-2 text-xs text-[var(--lm-muted)]">
          <div className="flex justify-between">
            <span className="text-[var(--lm-muted-2)]">{t('about.version')}</span>
            <span>{LWS_APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--lm-muted-2)]">{t('about.license')}</span>
            <a
              href="https://github.com/livemixer/livemixer-web/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--lm-link)] hover:underline"
            >
              Apache-2.0
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--lm-muted-2)]">{t('about.homepage')}</span>
            <a
              href="https://github.com/livemixer/livemixer-web"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--lm-link)] hover:underline"
            >
              github.com/livemixer/livemixer-web
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
