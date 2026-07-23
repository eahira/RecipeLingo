import { vocabularyService } from '../../services/vocabulary-service.js';

export const vocabularyAdapter = {
  getWords() {
    return vocabularyService.list();
  },

  mark(word, result) {
    vocabularyService.updateStats(word, result);
  }
};
