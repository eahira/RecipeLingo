export function normalizeText(value) {
  return String(value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTranslation(value) {
  return normalizeText(value)
    .replace(/^["'«»]+|["'«»]+$/g, '')
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
  const text = normalizeText(value);

  if (!text) {
    return [];
  }

  return text
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((block) => normalizeText(block))
    .filter(Boolean);
}

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
