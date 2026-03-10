import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import type { SourceType } from './add-source-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ConfigureTimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceType: SourceType | null;
  onConfirm: (config: TimerConfig) => void;
}

export interface TimerConfig {
  mode: 'countdown' | 'countup' | 'clock';
  duration?: number; // Countdown total duration (seconds)
  startValue?: number; // Count-up start value (seconds)
  format: string; // Display format
  fontSize?: number;
  color?: string;
}

export function ConfigureTimerDialog({
  open,
  onOpenChange,
  sourceType,
  onConfirm,
}: ConfigureTimerDialogProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'countdown' | 'countup' | 'clock'>(
    sourceType === 'clock' ? 'clock' : 'countdown'
  );
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('5');
  const [seconds, setSeconds] = useState('0');
  const [format, setFormat] = useState('HH:MM:SS');
  const [fontSize, setFontSize] = useState('48');
  const [color, setColor] = useState('#FFFFFF');

  const getTitle = () => {
    if (sourceType === 'clock') return t('configureTimer.clockTitle');
    return t('configureTimer.timerTitle');
  };

  const getDescription = () => {
    if (sourceType === 'clock') return t('configureTimer.clockDescription');
    return t('configureTimer.timerDescription');
  };

  const handleConfirm = () => {
    const totalSeconds =
      parseInt(hours || '0') * 3600 + parseInt(minutes || '0') * 60 + parseInt(seconds || '0');

    const config: TimerConfig = {
      mode,
      format,
      fontSize: parseInt(fontSize),
      color,
    };

    if (mode === 'countdown') {
      config.duration = totalSeconds;
    } else if (mode === 'countup') {
      config.startValue = 0;
    }

    onConfirm(config);
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const isValid = () => {
    if (mode === 'clock') return true;
    const totalSeconds =
      parseInt(hours || '0') * 3600 + parseInt(minutes || '0') * 60 + parseInt(seconds || '0');
    return totalSeconds > 0;
  };

  // Only handle timer/clock types
  if (!sourceType || !['timer', 'clock'].includes(sourceType)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#252526] border-[#3e3e42] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-white">{getTitle()}</DialogTitle>
          <DialogDescription className="text-gray-400">{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Mode selection (timer only) */}
          {sourceType === 'timer' && (
            <div className="space-y-2">
              <Label className="text-gray-300">{t('configureTimer.timerMode')}</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('countdown')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === 'countdown'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                    }`}
                >
                  {t('configureTimer.countdown')}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('countup')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${mode === 'countup'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                    }`}
                >
                  {t('configureTimer.countup')}
                </button>
              </div>
            </div>
          )}

          {/* Duration settings (countdown only) */}
          {sourceType === 'timer' && mode === 'countdown' && (
            <div className="space-y-2">
              <Label className="text-gray-300">{t('configureTimer.setDuration')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-gray-400">{t('configureTimer.hours')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">{t('configureTimer.minutes')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={e => setMinutes(e.target.value)}
                    className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">{t('configureTimer.seconds')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={e => setSeconds(e.target.value)}
                    className="bg-[#1e1e1e] border-[#3e3e42] text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Display format */}
          <div className="space-y-2">
            <Label className="text-gray-300">{t('property.displayFormat')}</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormat('HH:MM:SS')}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${format === 'HH:MM:SS'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                  }`}
              >
                HH:MM:SS
              </button>
              <button
                type="button"
                onClick={() => setFormat('MM:SS')}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${format === 'MM:SS'
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                  }`}
              >
                MM:SS
              </button>
              {sourceType === 'clock' && (
                <button
                  type="button"
                  onClick={() => setFormat('HH:MM')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${format === 'HH:MM'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-[#1e1e1e] border-[#3e3e42] text-gray-300 hover:bg-[#2d2d30]'
                    }`}
                >
                  HH:MM
                </button>
              )}
            </div>
          </div>

          {/* Style settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">{t('property.fontSize')}</Label>
              <Input
                type="number"
                min="12"
                max="200"
                value={fontSize}
                onChange={e => setFontSize(e.target.value)}
                className="bg-[#1e1e1e] border-[#3e3e42] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">{t('property.color')}</Label>
              <Input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="bg-[#1e1e1e] border-[#3e3e42] h-10 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2d2d30] text-white rounded-lg transition-colors border border-[#3e3e42]"
          >
            {t('dialog.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isValid()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('dialog.confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
