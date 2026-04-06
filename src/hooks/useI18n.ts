import { useContext } from 'react';
import { I18nContext } from '../contexts/I18nContext';

/**
 * Hook to access i18n functionality
 * @returns I18nEngine instance and utility functions
 */
export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}
