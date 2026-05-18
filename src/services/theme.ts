export type ThemeMode = 'light' | 'dark';

const SETTINGS_STORAGE_KEY = 'livemixer-settings';

export function normalizeTheme(value: unknown): ThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export function readThemeFromPersistedSettings(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return 'dark';
    const parsed = JSON.parse(raw) as { state?: { theme?: unknown } };
    return normalizeTheme(parsed?.state?.theme);
  } catch {
    return 'dark';
  }
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  root.dataset.theme = theme;
  // Make native form controls/scrollbars follow the active scheme where supported.
  root.style.colorScheme = theme;

  // Optional class hooks (in case future Tailwind `dark:` is adopted).
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}
