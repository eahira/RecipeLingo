const HTML_ENTITIES = {
  '&nbsp;': ' ',
  '&#xA0;': ' ',
  '&#160;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&#039;': "'",
  '&lt;': '<',
  '&gt;': '>'
};

function valueToString(value) {
  return String(value ?? '');
}

export function decodeHtmlEntities(value) {
  return valueToString(value).replace(/&(?:nbsp|amp|quot|lt|gt);|&#(?:039|160);|&#xA0;/gi, (entity) => (
    HTML_ENTITIES[entity] || HTML_ENTITIES[entity.toLowerCase()] || entity
  ));
}

export function normalizeWhitespace(value) {
  return decodeHtmlEntities(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

export function normalizeApiText(value) {
  return normalizeWhitespace(value)
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSearchQuery(value) {
  return normalizeApiText(value);
}

export function normalizeCacheText(value) {
  return normalizeApiText(value).toLocaleLowerCase('en-US');
}

export function normalizeText(value) {
  return normalizeApiText(value);
}

export function normalizeTranslation(value) {
  return normalizeApiText(value)
    .replace(/^["'«»]+|["'«»]+$/g, '')
    .trim();
}

export function normalizeTranslatedWord(value) {
  return normalizeTranslation(value)
    .replace(/^[\s"'“”‘’.,;:!?()[\]{}]+|[\s"'“”‘’.,;:!?()[\]{}]+$/g, '')
    .trim();
}

export function normalizeTranslatedSentence(value) {
  return normalizeApiText(value)
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

export function hasCyrillic(value) {
  return /[а-яё]/i.test(String(value || ''));
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'the', 'then', 'to', 'until',
  'with', 'you', 'your'
]);

export function normalizeClickedWord(value) {
  return normalizeText(value)
    .toLocaleLowerCase('en-US')
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
    .replace(/[.,;:!?]+$/g, '');
}

export function isClickableWord(value) {
  const word = normalizeClickedWord(value);

  return word.length > 2 && !STOP_WORDS.has(word) && /^[a-z][a-z'-]*$/i.test(word);
}

export function findSentence(text, term) {
  const normalizedTerm = normalizeClickedWord(term);
  const sentences = normalizeText(text).match(/[^.!?]+[.!?]*/g) || [];

  return sentences.find((sentence) => sentence.toLocaleLowerCase('en-US').includes(normalizedTerm))
    || normalizeText(text).slice(0, 180);
}

export function clickableText(text) {
  return escapeHtml(text).replace(/[A-Za-z]+(?:['-][A-Za-z]+)?|\d+|[^A-Za-z\d]+/g, (token) => {
    if (!isClickableWord(token)) {
      return token;
    }

    const word = normalizeClickedWord(token);
    return `<button class="word-token" type="button" data-word="${escapeHtml(word)}">${token}</button>`;
  });
}

export function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value));
  } catch (_error) {
    return '';
  }
}

export function splitInstructionBlocks(value) {
  const text = normalizeApiText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((block) => normalizeText(block))
    .filter(Boolean);
}

export function escapeHtml(value) {
  return valueToString(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function isBadTranslation(value, original = '') {
  const text = normalizeApiText(value);
  const source = normalizeApiText(original);

  if (!text) {
    return true;
  }

  if (/QUERY LENGTH LIMIT|MYMEMORY WARNING|INVALID|ERROR|DOCTYPE|<html/i.test(text)) {
    return true;
  }

  if (/([a-zа-яё]{2,})\1{2,}/iu.test(text)) {
    return true;
  }

  if (text.length > 12 && !/\s/.test(text) && /[qwrtpsdfghjklzxcvbnm]{8,}/i.test(text)) {
    return true;
  }

  return text.length > Math.max(240, source.length * 8);
}
