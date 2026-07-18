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
