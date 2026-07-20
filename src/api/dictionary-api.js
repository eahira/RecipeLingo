const DICTIONARY_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const VERB_WORDS = new Set([
  'add', 'bake', 'beat', 'blend', 'boil', 'chop', 'combine', 'cook', 'cover',
  'cut', 'drain', 'fry', 'grate', 'heat', 'make', 'mix', 'peel', 'pour',
  'preheat', 'remove', 'roll', 'season', 'serve', 'simmer', 'slice', 'stir',
  'toss', 'whisk'
]);

export const dictionaryApi = {
  async lookup(word) {
    try {
      const response = await fetch(`${DICTIONARY_URL}/${encodeURIComponent(word)}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const entry = Array.isArray(data) ? data[0] : null;

      if (!entry) {
        return null;
      }

      const meaning = VERB_WORDS.has(word)
        ? entry.meanings?.find((item) => item.partOfSpeech === 'verb') || entry.meanings?.[0]
        : entry.meanings?.[0];
      const definition = meaning?.definitions?.[0];
      const phoneticItem = entry.phonetics?.find((item) => item.text) || {};
      const audioItem = entry.phonetics?.find((item) => item.audio) || {};

      return {
        phonetic: entry.phonetic || phoneticItem.text || '',
        audio: audioItem.audio || '',
        partOfSpeech: meaning?.partOfSpeech || '',
        definition: definition?.definition || ''
      };
    } catch (_error) {
      return null;
    }
  }
};
