import { STORAGE_KEYS } from '../const.js';
import { isBadTranslation, normalizeApiText, normalizeCacheText } from '../utils/text.js';

const CACHE_VERSION = 2;
const MAX_CACHE_ITEMS = 180;

function readCache() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.translationCache)) || {};
  } catch (_error) {
    return {};
  }
}

function writeCache(cache) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.translationCache, JSON.stringify(cache));
  } catch (_error) {
    void _error;
  }
}

function getKey(text, sourceLanguage, targetLanguage, contentType) {
  return [
    CACHE_VERSION,
    sourceLanguage,
    targetLanguage,
    contentType,
    normalizeCacheText(text)
  ].join('|');
}

function isValidEntry(entry, text, sourceLanguage, targetLanguage, contentType) {
  return entry
    && typeof entry === 'object'
    && entry.version === CACHE_VERSION
    && entry.sourceText === normalizeApiText(text)
    && entry.sourceLanguage === sourceLanguage
    && entry.targetLanguage === targetLanguage
    && entry.contentType === contentType
    && typeof entry.translatedText === 'string'
    && !isBadTranslation(entry.translatedText, text);
}

function trimCache(cache) {
  const entries = Object.entries(cache)
    .filter(([, value]) => value && typeof value === 'object' && value.version === CACHE_VERSION)
    .sort((a, b) => a[1].createdAt - b[1].createdAt);

  while (entries.length > MAX_CACHE_ITEMS) {
    const [key] = entries.shift();
    delete cache[key];
  }

  return cache;
}

export const translationCache = {
  get(text, sourceLanguage, targetLanguage, contentType) {
    const cache = readCache();
    const key = getKey(text, sourceLanguage, targetLanguage, contentType);
    const entry = cache[key];

    if (!isValidEntry(entry, text, sourceLanguage, targetLanguage, contentType)) {
      return '';
    }

    return entry.translatedText;
  },

  set(text, translatedText, sourceLanguage, targetLanguage, contentType) {
    const cache = readCache();
    const key = getKey(text, sourceLanguage, targetLanguage, contentType);

    cache[key] = {
      version: CACHE_VERSION,
      sourceText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      contentType,
      createdAt: Date.now()
    };

    writeCache(trimCache(cache));
  },

  clear() {
    writeCache({});
  }
};
