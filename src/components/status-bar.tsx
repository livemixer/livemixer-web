import { Cpu, HardDrive, Wifi } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

interface StatusBarProps {
  fps?: number;
  cpuUsage?: number;
  isStreaming?: boolean;
  streamDuration?: string;
  outputResolution?: string;
}

export function StatusBar({
  fps = 60,
  cpuUsage = 0,
  isStreaming = false,
  streamDuration = '00:00:00',
  outputResolution = '1920x1080',
}: StatusBarProps) {
  const { t } = useI18n();

  return (
    <div className="h-8 flex-shrink-0 bg-linear-to-r from-[var(--lm-gradient-to)] via-[var(--lm-gradient-via)] to-[var(--lm-gradient-to)] border-t border-[var(--lm-border)] flex items-center px-4 text-xs text-[var(--lm-muted-2)]">
      {/* Left: streaming status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" />
          <span
            className={isStreaming ? 'text-success-500 font-medium' : 'text-[var(--lm-muted-2)]'}
          >
            {isStreaming ? t('status.streaming') : t('status.notStreaming')}
          </span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--lm-muted-2)]">{t('status.duration')}:</span>
            <span className="font-mono text-[var(--lm-muted)]">{streamDuration}</span>
          </div>
        )}
      </div>

      {/* Middle spacer */}
      <div className="flex-1" />

      {/* Right: system info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--lm-muted-2)]">{t('status.output')}:</span>
          <span className="font-mono text-[var(--lm-muted)]">{outputResolution}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono text-[var(--lm-muted)]">{cpuUsage.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="font-mono text-[var(--lm-muted)]">{fps} FPS</span>
        </div>
      </div>
    </div>
  );
}
