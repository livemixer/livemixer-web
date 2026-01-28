import { Cpu, HardDrive, Wifi } from 'lucide-react';

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
  return (
    <div className="h-7 flex-shrink-0 bg-[#1e1e1e] border-t border-[#3e3e42] flex items-center px-4 text-xs text-gray-400">
      {/* Left: streaming status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5" />
          <span className={isStreaming ? 'text-green-500' : 'text-gray-500'}>
            {isStreaming ? '直播中' : '未直播'}
          </span>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">时长:</span>
            <span className="font-mono">{streamDuration}</span>
          </div>
        )}
      </div>

      {/* Middle spacer */}
      <div className="flex-1" />

      {/* Right: system info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">输出:</span>
          <span className="font-mono">{outputResolution}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          <span className="font-mono">{cpuUsage.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="font-mono">{fps} FPS</span>
        </div>
      </div>
    </div>
  );
}
