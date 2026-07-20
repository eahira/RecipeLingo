import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { vocabularyAdapter } from './vocabulary-adapter.js';

let root = null;

const modeInfo = {
  cards: {
    title: 'Карточки',
    description: 'Вспомните перевод, откройте ответ и оцените себя.'
  },
  quiz: {
    title: 'Тест',
    description: 'Выберите правильный перевод из четырёх вариантов.'
  }
};

function getPartOfSpeech(value) {
  const parts = {
    verb: 'глагол',
    noun: 'существительное',
    adjective: 'прилагательное',
    adverb: 'наречие'
  };

  return parts[value] || value || 'часть речи не указана';
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getTranslation(word) {
  return word.translation || word.userTranslation || word.automaticTranslation || 'перевод не найден';
}

function getQuizOptions(words, currentWord) {
  const correct = getTranslation(currentWord);
  const otherOptions = words
    .filter((word) => word.word !== currentWord.word)
    .map(getTranslation)
    .filter((value) => value && value !== correct);
  const uniqueOptions = Array.from(new Set(otherOptions));

  return shuffle([correct, ...shuffle(uniqueOptions).slice(0, 3)]);
}

function Progress({ current, total, onExit }) {
  const width = total ? `${Math.round((current / total) * 100)}%` : '0%';

  return React.createElement('div', { className: 'trainer-progress' },
    React.createElement('div', { className: 'trainer-progress__top' },
      React.createElement('strong', null, `${current} из ${total}`),
      React.createElement('button', { type: 'button', className: 'button-secondary', onClick: onExit }, 'Выйти')
    ),
    React.createElement('div', { className: 'trainer-progress__bar', 'aria-hidden': 'true' },
      React.createElement('span', { style: { width } })
    )
  );
}

function StartScreen({ words, mode, setMode, onStart }) {
  const testDisabled = words.length < 4;

  return React.createElement('section', { className: 'trainer-start' },
    React.createElement('div', { className: 'page-head' },
      React.createElement('h1', null, 'Тренировка'),
      React.createElement('p', null, `${words.length} сохранённых слов. Выберите режим и повторите лексику из рецептов.`)
    ),
    words.length
      ? React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'trainer-mode-grid' },
          ['cards', 'quiz'].map((item) => React.createElement('button', {
            key: item,
            type: 'button',
            className: mode === item ? 'trainer-mode is-active' : 'trainer-mode',
            onClick: () => setMode(item),
            disabled: item === 'quiz' && testDisabled
          },
          React.createElement('span', null, modeInfo[item].title),
          React.createElement('small', null, item === 'quiz' && testDisabled ? 'Нужно минимум 4 слова.' : modeInfo[item].description)
          ))
        ),
        React.createElement('button', {
          type: 'button',
          className: 'trainer-start__button',
          onClick: onStart,
          disabled: mode === 'quiz' && testDisabled
        }, 'Начать')
      )
      : React.createElement('div', { className: 'state' },
        React.createElement('h2', null, 'Слов пока нет'),
        React.createElement('p', null, 'Откройте рецепт, нажмите на английское слово и сохраните его в словарь.'),
        React.createElement('a', { className: 'button-link', href: '#/recipes' }, 'Найти рецепт')
      )
  );
}

function CardMode({ words, index, onAnswer, onExit }) {
  const [isOpen, setIsOpen] = useState(false);
  const word = words[index];

  function handleOpen(event) {
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) {
      return;
    }

    event.preventDefault();
    setIsOpen(true);
  }

  function answer(result) {
    vocabularyAdapter.mark(word.word, result);
    setIsOpen(false);
    onAnswer(result === 'known');
  }

  return React.createElement('section', { className: 'trainer-session' },
    React.createElement(Progress, { current: index + 1, total: words.length, onExit }),
    React.createElement('div', {
      className: isOpen ? 'trainer-card is-open' : 'trainer-card',
      role: 'button',
      tabIndex: 0,
      onClick: handleOpen,
      onKeyDown: handleOpen
    },
    !isOpen
      ? React.createElement(React.Fragment, null,
        React.createElement('p', { className: 'eyebrow' }, 'Вспомните перевод'),
        React.createElement('h2', null, word.word),
        word.phonetic ? React.createElement('p', null, word.phonetic) : null,
        word.audio ? React.createElement('button', {
          type: 'button',
          onClick: (event) => {
            event.stopPropagation();
            new window.Audio(word.audio).play();
          },
          'aria-label': `Прослушать произношение слова ${word.word}`
        }, 'Прослушать') : null,
        React.createElement('p', { className: 'muted' }, 'Нажмите, чтобы показать перевод')
      )
      : React.createElement(React.Fragment, null,
        React.createElement('p', { className: 'eyebrow' }, 'Перевод'),
        React.createElement('h2', null, getTranslation(word)),
        React.createElement('p', null, getPartOfSpeech(word.partOfSpeech)),
        word.context ? React.createElement('p', null, React.createElement('strong', null, 'Контекст: '), word.context) : null,
        word.translatedContext ? React.createElement('p', null, React.createElement('strong', null, 'Перевод контекста: '), word.translatedContext) : null,
        word.recipeTitle ? React.createElement('p', { className: 'muted' }, word.recipeTitle) : null
      )
    ),
    isOpen ? React.createElement('div', { className: 'trainer-actions' },
      React.createElement('button', { type: 'button', className: 'button-secondary', onClick: () => answer('missed') }, 'Не помню'),
      React.createElement('button', { type: 'button', onClick: () => answer('known') }, 'Знаю')
    ) : null
  );
}

function QuizMode({ words, index, onAnswer, onExit }) {
  const word = words[index];
  const options = useMemo(() => getQuizOptions(words, word), [words, word]);
  const [selected, setSelected] = useState('');
  const correct = getTranslation(word);

  useEffect(() => {
    setSelected('');
  }, [word.word]);

  function choose(option) {
    if (selected) {
      return;
    }

    setSelected(option);
    vocabularyAdapter.mark(word.word, option === correct ? 'known' : 'missed');
  }

  return React.createElement('section', { className: 'trainer-session' },
    React.createElement(Progress, { current: index + 1, total: words.length, onExit }),
    React.createElement('div', { className: 'trainer-card trainer-card--quiz' },
      React.createElement('p', { className: 'eyebrow' }, 'Выберите перевод'),
      React.createElement('h2', null, word.word),
      word.phonetic ? React.createElement('p', null, word.phonetic) : null,
      React.createElement('div', { className: 'quiz-options' },
        options.map((option) => {
          const isCorrect = selected && option === correct;
          const isWrong = selected === option && option !== correct;
          const className = [
            'quiz-option',
            isCorrect ? 'is-correct' : '',
            isWrong ? 'is-wrong' : ''
          ].filter(Boolean).join(' ');

          return React.createElement('button', {
            key: option,
            type: 'button',
            className,
            onClick: () => choose(option)
          },
          option,
          isCorrect ? React.createElement('span', null, 'Правильно') : null,
          isWrong ? React.createElement('span', null, 'Неверно') : null
          );
        })
      ),
      selected ? React.createElement('p', { className: 'trainer-feedback' }, selected === correct ? 'Верно. Можно двигаться дальше.' : `Правильный ответ: ${correct}`) : null,
      selected ? React.createElement('button', { type: 'button', onClick: () => onAnswer(selected === correct) }, 'Продолжить') : null
    )
  );
}

function ResultScreen({ words, mode, answers, wrongWords, restart, repeatWrong, backToStart }) {
  const correctCount = answers.filter(Boolean).length;
  const wrongCount = answers.length - correctCount;
  const percent = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;

  return React.createElement('section', { className: 'trainer-result' },
    React.createElement('h1', null, 'Тренировка завершена'),
    React.createElement('div', { className: 'trainer-result__stats' },
      React.createElement('p', null, React.createElement('strong', null, words.length), ' заданий'),
      React.createElement('p', null, React.createElement('strong', null, correctCount), ' правильных'),
      React.createElement('p', null, React.createElement('strong', null, wrongCount), ' ошибок'),
      React.createElement('p', null, React.createElement('strong', null, `${percent}%`), ' результат')
    ),
    wrongWords.length ? React.createElement('div', { className: 'trainer-mistakes' },
      React.createElement('h2', null, 'Слова с ошибками'),
      React.createElement('ul', null, wrongWords.map((word) => React.createElement('li', { key: word.word }, `${word.word} — ${getTranslation(word)}`)))
    ) : null,
    React.createElement('div', { className: 'trainer-actions' },
      wrongWords.length ? React.createElement('button', { type: 'button', onClick: repeatWrong }, 'Повторить ошибки') : null,
      React.createElement('button', { type: 'button', onClick: () => restart(mode) }, 'Пройти ещё раз'),
      React.createElement('button', { type: 'button', className: 'button-secondary', onClick: backToStart }, 'К выбору режима'),
      React.createElement('a', { className: 'button-link', href: '#/vocabulary' }, 'Вернуться в словарь')
    )
  );
}

function TrainerApp() {
  const [words] = useState(() => vocabularyAdapter.getWords());
  const [mode, setMode] = useState('cards');
  const [phase, setPhase] = useState('start');
  const [sessionWords, setSessionWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [wrongWords, setWrongWords] = useState([]);

  function start(nextMode = mode, sourceWords = words) {
    setMode(nextMode);
    setSessionWords(shuffle(sourceWords));
    setIndex(0);
    setAnswers([]);
    setWrongWords([]);
    setPhase(nextMode);
  }

  function answer(isCorrect) {
    const word = sessionWords[index];
    const nextAnswers = [...answers, isCorrect];
    const nextWrongWords = isCorrect ? wrongWords : [...wrongWords, word];
    setAnswers(nextAnswers);
    setWrongWords(nextWrongWords);

    if (index + 1 >= sessionWords.length) {
      setPhase('result');
      return;
    }

    setIndex(index + 1);
  }

  function exitSession() {
    setPhase('start');
    setIndex(0);
    setAnswers([]);
    setWrongWords([]);
  }

  if (phase === 'start') {
    return React.createElement(StartScreen, { words, mode, setMode, onStart: () => start(mode) });
  }

  if (phase === 'cards') {
    return React.createElement(CardMode, { words: sessionWords, index, onAnswer: answer, onExit: exitSession });
  }

  if (phase === 'quiz') {
    return React.createElement(QuizMode, { words: sessionWords, index, onAnswer: answer, onExit: exitSession });
  }

  return React.createElement(ResultScreen, {
    words: sessionWords,
    mode,
    answers,
    wrongWords,
    restart: start,
    repeatWrong: () => start(mode, wrongWords),
    backToStart: exitSession
  });
}

export function mountTrainer(selector) {
  const container = document.querySelector(selector);

  if (!container) {
    return;
  }

  root = createRoot(container);
  root.render(React.createElement(TrainerApp));
}

export function unmountTrainer() {
  if (!root) {
    return;
  }

  root.unmount();
  root = null;
}
