import { Moon, Sun } from 'lucide-react';
import { useMemo } from 'react';
import { useI18n } from '../hooks/useI18n';
import { normalizeTheme, type ThemeMode } from '../services/theme';
import { useSettingsStore } from '../store/setting';
import { cn } from '../utils/utils';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useI18n();
  const theme = useSettingsStore((s) => normalizeTheme(s.theme));
  const updatePersistentSettings = useSettingsStore(
    (s) => s.updatePersistentSettings,
  );

  const nextTheme: ThemeMode = useMemo(
    () => (theme === 'dark' ? 'light' : 'dark'),
    [theme],
  );

  const label =
    theme === 'dark' ? t('settings.theme.dark') : t('settings.theme.light');
  const nextLabel =
    nextTheme === 'dark' ? t('settings.theme.dark') : t('settings.theme.light');

  return (
    <button
      type="button"
      onClick={() => updatePersistentSettings({ theme: nextTheme })}
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors text-[var(--lm-muted)] hover:text-[var(--lm-fg)] hover:bg-[var(--lm-hover)]',
        className,
      )}
      aria-label={`${t('settings.theme.title')}: ${label} → ${nextLabel}`}
      title={`${t('settings.theme.title')}: ${label} → ${nextLabel}`}
    >
      {theme === 'dark' ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
