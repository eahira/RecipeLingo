import { translationApi } from '../api/translation-api.js';
import { translationCache } from './translation-cache.js';
import {
  hasCyrillic,
  normalizeText,
  normalizeTranslation,
  splitInstructionBlocks
} from '../utils/text.js';

function isBrokenTranslation(value) {
  const text = normalizeText(value);

  return !text || /error|html|doctype|query length/i.test(text);
}

async function translate(text, {
  sourceLanguage = 'en',
  targetLanguage = 'ru',
  contentType = 'text',
  fallback = ''
} = {}) {
  const sourceText = normalizeText(text);

  if (!sourceText || sourceLanguage === targetLanguage) {
    return sourceText;
  }

  const cached = translationCache.get(sourceText, sourceLanguage, targetLanguage, contentType);

  if (cached) {
    return cached;
  }

  try {
    const translated = normalizeTranslation(
      await translationApi.translate(sourceText, sourceLanguage, targetLanguage)
    );

    if (isBrokenTranslation(translated)) {
      return fallback;
    }

    translationCache.set(sourceText, translated, sourceLanguage, targetLanguage, contentType);
    return translated;
  } catch (_error) {
    return fallback;
  }
}

export const translationService = {
  translateSearchQuery(query) {
    const normalizedQuery = normalizeText(query);

    if (!hasCyrillic(normalizedQuery)) {
      return normalizedQuery;
    }

    return translate(normalizedQuery, {
      sourceLanguage: 'ru',
      targetLanguage: 'en',
      contentType: 'search',
      fallback: normalizedQuery
    });
  },

  translateTitle(title) {
    return translate(title, {
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      contentType: 'title',
      fallback: ''
    });
  },

  translateIngredient(name) {
    return translate(name, {
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      contentType: 'ingredient',
      fallback: ''
    });
  },

  translateMeasure(measure) {
    return translate(measure, {
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      contentType: 'measure',
      fallback: ''
    });
  },

  translateWord(word) {
    return translate(word, {
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      contentType: 'word',
      fallback: ''
    });
  },

  translateContext(context) {
    return translate(context, {
      sourceLanguage: 'en',
      targetLanguage: 'ru',
      contentType: 'context',
      fallback: ''
    });
  },

  async translateInstructions(instructions) {
    const blocks = splitInstructionBlocks(instructions);

    return Promise.all(blocks.map(async (original) => ({
      original,
      translation: await translate(original, {
        sourceLanguage: 'en',
        targetLanguage: 'ru',
        contentType: 'instruction',
        fallback: ''
      })
    })));
  }
};
