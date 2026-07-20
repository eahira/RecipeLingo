import { STORAGE_KEYS } from '../const.js';
import { normalizeClickedWord } from '../utils/text.js';

function readVocabulary() {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.vocabulary));
    return Array.isArray(value) ? value : [];
  } catch (_error) {
    return [];
  }
}

function writeVocabulary(items) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.vocabulary, JSON.stringify(items));
  } catch (_error) {
    // The app keeps working even if the browser cannot save local data.
  }
}

export const vocabularyService = {
  list() {
    return readVocabulary();
  },

  has(word) {
    const normalized = normalizeClickedWord(word);
    return this.list().some((item) => item.word === normalized);
  },

  add(entry) {
    const normalized = normalizeClickedWord(entry.word);

    if (!normalized || this.has(normalized)) {
      return this.list();
    }

    const next = [{
      id: `${normalized}-${Date.now()}`,
      word: normalized,
      translation: entry.translation || '',
      phonetic: entry.phonetic || '',
      audio: entry.audio || '',
      partOfSpeech: entry.partOfSpeech || '',
      definition: entry.definition || '',
      context: entry.context || '',
      translatedContext: entry.translatedContext || '',
      recipeId: entry.recipeId || '',
      recipeTitle: entry.recipeTitle || '',
      createdAt: new Date().toISOString(),
      stats: {
        reviewCount: 0,
        correctCount: 0,
        wrongCount: 0
      }
    }, ...this.list()];

    writeVocabulary(next);
    return next;
  },

  remove(idOrWord) {
    const normalized = normalizeClickedWord(idOrWord);
    const next = this.list().filter((item) => item.id !== idOrWord && item.word !== normalized);
    writeVocabulary(next);
    return next;
  }
};
