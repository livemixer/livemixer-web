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
    <div className="h-8 flex-shrink-0 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border-t border-neutral-700/50 flex items-center px-4 text-xs text-neutral-400">
      {/* Left: streaming status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" />
          <span
            className={
              isStreaming ? 'text-success-500 font-medium' : 'text-neutral-500'
            }
          >
            {isStreaming ? t('status.streaming') : t('status.notStreaming')}
          </span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">{t('status.duration')}:</span>
            <span className="font-mono text-neutral-300">{streamDuration}</span>
          </div>
        )}
      </div>

      {/* Middle spacer */}
      <div className="flex-1" />

      {/* Right: system info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500">{t('status.output')}:</span>
          <span className="font-mono text-neutral-300">{outputResolution}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono text-neutral-300">
            {cpuUsage.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="font-mono text-neutral-300">{fps} FPS</span>
        </div>
      </div>
    </div>
  );
}
