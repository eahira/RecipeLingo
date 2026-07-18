import { STORAGE_KEYS } from '../const.js';

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
    // If localStorage is full or unavailable, the app can still work without cache.
  }
}

function getKey(text, sourceLanguage, targetLanguage, contentType) {
  return [
    sourceLanguage,
    targetLanguage,
    contentType,
    text.trim().toLowerCase()
  ].join('|');
}

export const translationCache = {
  get(text, sourceLanguage, targetLanguage, contentType) {
    const cache = readCache();
    const key = getKey(text, sourceLanguage, targetLanguage, contentType);
    const entry = cache[key];

    if (!entry || entry.sourceText !== text || typeof entry.translatedText !== 'string') {
      return '';
    }

    return entry.translatedText;
  },

  set(text, translatedText, sourceLanguage, targetLanguage, contentType) {
    const cache = readCache();
    const key = getKey(text, sourceLanguage, targetLanguage, contentType);

    cache[key] = {
      sourceText: text,
      translatedText,
      sourceLanguage,
      targetLanguage,
      contentType,
      createdAt: Date.now()
    };

    writeCache(cache);
  }
};
