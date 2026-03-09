import type { LanguageResource } from '../types/i18n-engine';
import { en } from './en';
import { zh } from './zh';

export const coreResources: Record<string, LanguageResource> = {
    en,
    zh,
};

export const supportedLanguages = ['en', 'zh'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export { en, zh };
