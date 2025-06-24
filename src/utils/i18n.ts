import { createSignal, createMemo } from 'solid-js';

// Translation data type
type TranslationData = { [key: string]: any };

// Available languages
export const AVAILABLE_LANGUAGES = {
  en: 'English',
  fr: 'Français',
  es: 'Español'
} as const;

export type Language = keyof typeof AVAILABLE_LANGUAGES;

// Global language state
const [currentLanguage, setCurrentLanguage] = createSignal<Language>('en');
const [translations, setTranslations] = createSignal<TranslationData>({});

// Translation cache
const translationCache = new Map<Language, TranslationData>();

/**
 * Load translation data for a language
 */
async function loadTranslations(language: Language): Promise<TranslationData> {
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    // Dynamic import of translation files
    const module = await import(`../translations/${language}.json`);
    const data = module.default || module;
    translationCache.set(language, data);
    return data;
  } catch (error) {
    console.warn(`Failed to load translations for ${language}:`, error);
    // Fallback to English if available
    if (language !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

/**
 * Change the current language
 */
export async function setLanguage(language: Language): Promise<void> {
  try {
    const translationData = await loadTranslations(language);
    setTranslations(translationData);
    setCurrentLanguage(language);
    
    // Store preference
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('daw-language', language);
    }
  } catch (error) {
    console.error('Failed to set language:', error);
  }
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): Language {
  return currentLanguage();
}

/**
 * Get translation by key path (e.g., 'transport.play')
 */
function getTranslation(key: string): string {
  const keys = key.split('.');
  let value: any = translations();
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

/**
 * Translation function with interpolation support
 */
export function t(key: string, interpolations?: { [key: string]: string | number }): string {
  let translation = getTranslation(key);
  
  // Handle interpolations like {name}, {count}, etc.
  if (interpolations) {
    for (const [placeholder, value] of Object.entries(interpolations)) {
      translation = translation.replace(new RegExp(`{${placeholder}}`, 'g'), String(value));
    }
  }
  
  return translation;
}

/**
 * Reactive translation function for use in components
 */
export function createT() {
  return createMemo(() => ({
    t: (key: string, interpolations?: { [key: string]: string | number }) => 
      t(key, interpolations),
    language: currentLanguage()
  }));
}

/**
 * Initialize i18n system
 */
export async function initializeI18n(defaultLanguage: Language = 'en'): Promise<void> {
  // Try to get saved language preference
  let language = defaultLanguage;
  
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('daw-language') as Language;
    if (saved && saved in AVAILABLE_LANGUAGES) {
      language = saved;
    }
  }
  
  // Try to detect browser language
  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (browserLang in AVAILABLE_LANGUAGES) {
      language = browserLang;
    }
  }
  
  await setLanguage(language);
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): typeof AVAILABLE_LANGUAGES {
  return AVAILABLE_LANGUAGES;
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is Language {
  return language in AVAILABLE_LANGUAGES;
}

/**
 * Format numbers according to current locale
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  const locale = currentLanguage() === 'en' ? 'en-US' : 
                 currentLanguage() === 'fr' ? 'fr-FR' : 
                 'es-ES';
  
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format time according to current locale
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  
  return `${minutes}:${secs.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
}

/**
 * Add translations dynamically (for plugins, widgets, etc.)
 */
export function addTranslations(language: Language, newTranslations: TranslationData): void {
  const existing = translationCache.get(language) || {};
  const merged = mergeDeep(existing, newTranslations);
  translationCache.set(language, merged);
  
  // Update current translations if this is the active language
  if (currentLanguage() === language) {
    setTranslations(merged);
  }
}

/**
 * Deep merge objects for translation data
 */
function mergeDeep(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Get translation data for external use (e.g., exporting)
 */
export function getTranslationData(language?: Language): TranslationData {
  const lang = language || currentLanguage();
  return translationCache.get(lang) || {};
}

/**
 * Language switcher component helper
 */
export function createLanguageSwitcher() {
  return {
    currentLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    setLanguage,
    isSupported: isLanguageSupported
  };
}