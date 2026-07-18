const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single';

export const translationApi = {
  async translate(text, sourceLanguage = 'en', targetLanguage = 'ru') {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLanguage,
      tl: targetLanguage,
      dt: 't',
      q: text
    });

    const response = await fetch(`${TRANSLATE_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Translation request failed');
    }

    const data = await response.json();

    return (data[0] || [])
      .map((part) => part[0] || '')
      .join('');
  }
};
