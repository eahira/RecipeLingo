import { translationApi } from '../api/translation-api.js';
import { translationCache } from './translation-cache.js';
import {
  hasCyrillic,
  isBadTranslation,
  normalizeApiText,
  normalizeCacheText,
  normalizeSearchQuery,
  normalizeTranslatedSentence,
  normalizeTranslatedWord,
  splitInstructionBlocks
} from '../utils/text.js';

const inflight = new Map();

const MEASURE_REPLACEMENTS = [
  [/\btablespoons?\b/gi, 'ст. л.'],
  [/\btbsps?\b/gi, 'ст. л.'],
  [/\btbs\b/gi, 'ст. л.'],
  [/\bteaspoons?\b/gi, 'ч. л.'],
  [/\btsps?\b/gi, 'ч. л.'],
  [/\bcups?\b/gi, 'стакана'],
  [/\bgrams?\b/gi, 'г'],
  [/\bgrammes?\b/gi, 'г'],
  [/(\d)\s*g\b/gi, '$1 г'],
  [/(\d)\s*kg\b/gi, '$1 кг'],
  [/(\d)\s*ml\b/gi, '$1 мл'],
  [/\bkg\b/gi, 'кг'],
  [/\bml\b/gi, 'мл'],
  [/\boz\b/gi, 'унц.'],
  [/\blbs?\b/gi, 'фунт'],
  [/\bpounds?\b/gi, 'фунт'],
  [/\blitres?\b/gi, 'л'],
  [/\bliters?\b/gi, 'л'],
  [/\bpinch\b/gi, 'щепотка'],
  [/\bto taste\b/gi, 'по вкусу'],
  [/\bbunch\b/gi, 'пучок'],
  [/\bcans?\b/gi, 'банка'],
  [/\btins?\b/gi, 'банка'],
  [/\bpackets?\b/gi, 'упаковка'],
  [/\bpacks?\b/gi, 'упаковка'],
  [/\bslices?\b/gi, 'ломтик'],
  [/\bsprigs?\b/gi, 'веточка'],
  [/\bhandfuls?\b/gi, 'горсть'],
  [/\bdashes?\b/gi, 'немного'],
  [/\bcloves?\b/gi, 'зубчика'],
  [/\bknobs?\b/gi, 'кусочка']
];

function requestKey(text, sourceLanguage, targetLanguage, contentType) {
  return [
    sourceLanguage,
    targetLanguage,
    contentType,
    normalizeCacheText(text)
  ].join('|');
}

function normalizeMeasure(value) {
  let measure = normalizeApiText(value);

  MEASURE_REPLACEMENTS.forEach(([pattern, replacement]) => {
    measure = measure.replace(pattern, replacement);
  });

  return normalizeTranslatedSentence(measure)
    .replace(/\b1 зубчика\b/gi, '1 зубчик')
    .replace(/\b1 кусочка\b/gi, '1 кусочек')
    .replace(/\b1 стакана\b/gi, '1 стакан')
    .trim();
}

function normalizeByContentType(value, contentType) {
  if (contentType === 'word') {
    return normalizeTranslatedWord(value).toLocaleLowerCase('ru-RU');
  }

  return normalizeTranslatedSentence(value);
}

function isSameLatinText(sourceText, translatedText, contentType, sourceLanguage, targetLanguage) {
  return ['word', 'ingredient', 'instruction', 'context'].includes(contentType)
    && sourceLanguage === 'en'
    && targetLanguage === 'ru'
    && normalizeCacheText(sourceText) === normalizeCacheText(translatedText)
    && /[a-z]/i.test(sourceText);
}

async function translate(text, {
  sourceLanguage = 'en',
  targetLanguage = 'ru',
  contentType = 'text',
  fallback = ''
} = {}) {
  const sourceText = normalizeApiText(text);

  if (!sourceText || sourceLanguage === targetLanguage) {
    return sourceText;
  }

  if (contentType === 'measure') {
    return normalizeMeasure(sourceText);
  }

  const cached = translationCache.get(sourceText, sourceLanguage, targetLanguage, contentType);

  if (cached) {
    return cached;
  }

  const key = requestKey(sourceText, sourceLanguage, targetLanguage, contentType);

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const request = translationApi.translate(sourceText, sourceLanguage, targetLanguage)
    .then((value) => {
      if (isBadTranslation(value, sourceText)) {
        return fallback;
      }

      const translated = normalizeByContentType(value, contentType);

      if (isSameLatinText(sourceText, translated, contentType, sourceLanguage, targetLanguage)) {
        return fallback;
      }

      if (!translated) {
        return fallback;
      }

      translationCache.set(sourceText, translated, sourceLanguage, targetLanguage, contentType);
      return translated;
    })
    .catch(() => fallback)
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}

function splitLongBlock(block, maxLength = 450) {
  if (block.length <= maxLength) {
    return [block];
  }

  const chunks = [];
  let current = '';

  block.split(/\s+/).forEach((word) => {
    const next = `${current} ${word}`.trim();

    if (next.length <= maxLength) {
      current = next;
      return;
    }

    if (current) {
      chunks.push(current);
    }

    current = word;
  });

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitForTranslation(text) {
  return splitInstructionBlocks(text).flatMap((block) => splitLongBlock(block));
}

export const translationService = {
  translateSearchQuery(query) {
    const normalizedQuery = normalizeSearchQuery(query);

    if (!hasCyrillic(normalizedQuery)) {
      return normalizedQuery;
    }

    return translate(normalizedQuery, {
      sourceLanguage: 'ru',
      targetLanguage: 'en',
      contentType: 'search',
      fallback: ''
    }).then((translated) => translated || normalizedQuery);
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
      fallback: normalizeApiText(measure)
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
    const blocks = splitForTranslation(instructions);

    return Promise.all(blocks.map(async (original) => ({
      original,
      translation: await translate(original, {
        sourceLanguage: 'en',
        targetLanguage: 'ru',
        contentType: 'instruction',
        fallback: ''
      })
    })));
  },

  clearCache() {
    translationCache.clear();
  }
};
