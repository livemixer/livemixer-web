import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { I18nEngine } from '../types/i18n-engine';

interface I18nContextValue {
  /** The i18n engine instance */
  engine: I18nEngine;
  /** Current language code */
  language: string;
  /** Translate function */
  t: (key: string, options?: Record<string, unknown>) => string;
  /** Change language */
  changeLanguage: (lang: string) => Promise<void>;
  /** Check if key exists */
  exists: (key: string) => boolean;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

// Re-export for convenience
export type { I18nContextValue };

interface I18nProviderProps {
  engine: I18nEngine;
  children: ReactNode;
}

/**
 * Provider component for i18n functionality
 */
export function I18nProvider({ engine, children }: I18nProviderProps) {
  const [language, setLanguage] = useState(engine.getCurrentLanguage());

  // Subscribe to language changes
  useEffect(() => {
    const unsubscribe = engine.onLanguageChange((lang) => {
      setLanguage(lang);
    });
    return unsubscribe;
  }, [engine]);

  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => {
      return engine.t(key, options);
    },
    [engine],
  );

  const changeLanguage = useCallback(
    async (lang: string) => {
      await engine.changeLanguage(lang);
    },
    [engine],
  );

  const exists = useCallback(
    (key: string) => {
      return engine.exists(key);
    },
    [engine],
  );

  const value: I18nContextValue = useMemo(
    () => ({
      engine,
      language,
      t,
      changeLanguage,
      exists,
    }),
    [engine, language, t, changeLanguage, exists],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
