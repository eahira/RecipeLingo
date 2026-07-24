import { APP_TITLE } from '../const.js';
import { clickableText, escapeHtml, formatDate } from '../utils/text.js';

function recipeCard(meal) {
  const id = meal.idMeal || meal.id;
  const title = meal.strMeal || meal.title;
  const thumb = meal.strMealThumb || meal.thumb;
  const category = meal.strCategory || meal.category || 'Категория не указана';
  const area = meal.strArea || meal.area || 'Кухня не указана';
  const hasTranslatedTitle = meal.translatedTitle && meal.translatedTitle.toLowerCase() !== title.toLowerCase();
  const favoriteLabel = meal.isFavorite ? 'Удалить из избранного' : 'Добавить в избранное';

  return `
    <article class="recipe-card recipe-card--clickable" data-open-recipe="${escapeHtml(id)}" tabindex="0" role="link" aria-label="Открыть рецепт ${escapeHtml(title)}">
      <div class="recipe-card__media">
        <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" loading="lazy">
        <button class="favorite-toggle ${meal.isFavorite ? 'is-active' : ''}" type="button" data-favorite="${escapeHtml(id)}" aria-label="${favoriteLabel}" aria-pressed="${meal.isFavorite ? 'true' : 'false'}" title="${favoriteLabel}">
          <span aria-hidden="true">&#9825;</span>
        </button>
      </div>
      <div class="recipe-card__body">
        <h2>${escapeHtml(title)}</h2>
        ${hasTranslatedTitle ? `<p>${escapeHtml(meal.translatedTitle)}</p>` : ''}
        <p class="meta">
          <button class="meta-link" type="button" data-filter-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
          <span aria-hidden="true">·</span>
          <button class="meta-link" type="button" data-filter-area="${escapeHtml(area)}">${escapeHtml(area)}</button>
        </p>
      </div>
    </article>
  `;
}

export class AppView {
  getLayout(activeRoute, content) {
    const navigation = [
      { route: '#/recipes', label: 'Рецепты' },
      { route: '#/favorites', label: 'Избранное' },
      { route: '#/vocabulary', label: 'Словарь' },
      { route: '#/trainer', label: 'Тренировка' }
    ];

    return `
      <header class="site-header">
        <a class="logo" href="#/" aria-label="На главную">
          <span class="logo__mark">RL</span>
          <span>
            <strong>${APP_TITLE}</strong>
            <small>Cook. Translate. Learn.</small>
          </span>
        </a>
        <nav class="site-nav" aria-label="Основная навигация">
          ${navigation.map((item) => `
            <a class="${activeRoute === item.route ? 'is-active' : ''}" href="${item.route}">
              ${item.label}
            </a>
          `).join('')}
        </nav>
      </header>
      <main class="page" id="app-content">
        ${content}
      </main>
    `;
  }

  getHomeTemplate() {
    return `
      <section class="hero">
        <div class="hero__copy">
          <p class="eyebrow">Готовьте. Переводите. Запоминайте.</p>
          <h1>Изучайте английский по зарубежным рецептам</h1>
          <p>Готовьте по зарубежным рецептам и учите английский на реальных примерах.</p>
          <form class="search-panel" data-search-form>
            <label for="home-query">Что хотите приготовить?</label>
            <div class="search-panel__row">
              <input id="home-query" name="query" value="шоколадный торт" autocomplete="off">
              <button type="submit">Найти рецепты</button>
            </div>
          </form>
        </div>
        <img src="https://www.themealdb.com/images/media/meals/tqtywx1468317395.jpg" alt="Домашний десерт">
      </section>
    `;
  }

  getRecipesTemplate({
    state,
    query,
    translatedQuery,
    meals = [],
    message,
    selectedCategory = '',
    selectedArea = '',
    categories = [],
    areas = [],
    filtersLoading = false
  }) {
    const categoryButtonClass = (item) => (item === selectedCategory ? ' class="is-active" aria-pressed="true"' : ' aria-pressed="false"');
    const areaButtonClass = (item) => (item === selectedArea ? ' class="is-active" aria-pressed="true"' : ' aria-pressed="false"');

    return `
      <section class="page-head">
        <h1>Поиск рецептов</h1>
        <p>Введите название блюда, ингредиент или кухню — на русском или английском. Например: шоколадный торт, chocolate cake, pasta, Italian.</p>
      </section>
      <form class="search-panel" data-search-form>
        <label for="recipes-query">Поиск</label>
        <div class="search-panel__row">
          <input id="recipes-query" name="query" value="${escapeHtml(query)}" placeholder="шоколадный торт, pasta или Italian">
          <button type="submit">Искать</button>
          <button type="button" data-clear-search>Очистить</button>
        </div>
      </form>
      <section class="search-filters" aria-label="Фильтры поиска">
        <div class="filter-group">
          <h2>Категории</h2>
          ${filtersLoading ? '<p class="muted">Загружаю категории...</p>' : ''}
          ${categories.length ? `<div class="filter-row">${categories.map((item) => `<button type="button" data-filter-category="${escapeHtml(item)}"${categoryButtonClass(item)}>${escapeHtml(item)}</button>`).join('')}</div>` : ''}
        </div>
        <div class="filter-group">
          <h2>Кухни</h2>
          ${filtersLoading ? '<p class="muted">Загружаю кухни...</p>' : ''}
          ${areas.length ? `<div class="filter-row">${areas.map((item) => `<button type="button" data-filter-area="${escapeHtml(item)}"${areaButtonClass(item)}>${escapeHtml(item)}</button>`).join('')}</div>` : ''}
        </div>
      </section>
      ${state === 'loading' ? '<div class="state">Ищу рецепты...</div>' : ''}
      ${state === 'error' ? '<div class="state state--error">Не получилось загрузить рецепты. Попробуйте еще раз.</div>' : ''}
      ${message ? `<p class="notice">${escapeHtml(message)}</p>` : ''}
      ${translatedQuery && translatedQuery !== query ? `<p class="muted">Английский запрос для TheMealDB: ${escapeHtml(translatedQuery)}</p>` : ''}
      ${state === 'empty' ? '<div class="state">Ничего не найдено. Попробуйте другой запрос.</div>' : ''}
      ${meals.length ? `<div class="recipe-grid">${meals.map(recipeCard).join('')}</div>` : ''}
    `;
  }

  getRecipeTemplate({ recipe, translated, state, mode, isFavorite }) {
    if (state === 'loading') {
      return '<div class="state">Загружаю рецепт...</div>';
    }

    if (state === 'error') {
      return '<div class="state state--error">Не получилось открыть рецепт. Вернитесь к поиску и попробуйте еще раз.</div>';
    }

    if (!recipe) {
      return '<div class="state">Рецепт не найден.</div>';
    }

    const translatedRecipe = translated || recipe;
    const instructionPairs = translatedRecipe.instructionPairs || [];
    const ingredients = translatedRecipe.ingredients.map((item) => `
      <li>
        <span class="ingredient-primary">
          <strong>${escapeHtml(item.translatedName || item.originalName)}</strong>
          ${(item.translatedMeasure || item.originalMeasure) ? `<strong class="ingredient-amount">${escapeHtml(item.translatedMeasure || item.originalMeasure)}</strong>` : ''}
        </span>
        <small>${escapeHtml(item.originalName)}${item.originalMeasure ? ` · ${escapeHtml(item.originalMeasure)}` : ''}</small>
      </li>
    `).join('');
    const translatedInstructions = instructionPairs.map((item) => item.translation).filter(Boolean).join('\n\n');
    const pairedInstructions = instructionPairs.map((item) => `
      <div class="instruction-pair">
        <p class="instruction-pair__label">Оригинал</p>
        <div class="text-block">${clickableText(item.original)}</div>
        <p class="instruction-pair__label">Перевод</p>
        <div class="text-block">${escapeHtml(item.translation || 'Перевод временно недоступен.')}</div>
      </div>
    `).join('');

    return `
      <article class="recipe-detail">
        <a class="back-link" href="#/recipes">← К результатам</a>
        <div class="recipe-detail__hero">
          <img src="${escapeHtml(recipe.thumb)}" alt="${escapeHtml(recipe.title)}">
          <div class="recipe-detail__summary">
            <p class="eyebrow recipe-tags">
              ${recipe.category ? `<button class="meta-link meta-link--eyebrow" type="button" data-filter-category="${escapeHtml(recipe.category)}">${escapeHtml(recipe.category)}</button>` : ''}
              ${recipe.category && recipe.area ? '<span aria-hidden="true">·</span>' : ''}
              ${recipe.area ? `<button class="meta-link meta-link--eyebrow" type="button" data-filter-area="${escapeHtml(recipe.area)}">${escapeHtml(recipe.area)}</button>` : ''}
            </p>
            <h1>${escapeHtml(recipe.title)}</h1>
            ${translatedRecipe.translatedTitle ? `<p>${escapeHtml(translatedRecipe.translatedTitle)}</p>` : ''}
            <button type="button" data-favorite="${escapeHtml(recipe.id)}">${isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}</button>
          </div>
        </div>
        <section class="ingredients">
          <h2>Ингредиенты</h2>
          <ul>${ingredients}</ul>
        </section>
        <section class="instructions" id="recipe-instructions">
          <h2>Инструкция</h2>
          <p class="muted">Машинный перевод используется как подсказка. Сравнивайте его с английским оригиналом.</p>
          <div class="mode-switch" aria-label="Режим чтения инструкции">
            ${[
              ['translated', 'Перевод'],
              ['original', 'Оригинал'],
              ['both', 'Вместе']
            ].map(([value, label]) => `
              <button class="${mode === value ? 'is-active' : ''}" type="button" data-recipe-mode="${value}">${label}</button>
            `).join('')}
          </div>
          <p class="mode-switch__hint">Выберите режим чтения: перевод, оригинал или сравнение по абзацам.</p>
          ${mode === 'translated' ? `<div class="text-block">${escapeHtml(translatedInstructions || 'Перевод временно недоступен.')}</div>` : ''}
          ${mode === 'original' ? `<div class="text-block">${clickableText(recipe.instructions)}</div>` : ''}
          ${mode === 'both' ? `<div class="paired-instructions">${pairedInstructions}</div>` : ''}
        </section>
        ${recipe.youtube ? `<a class="video-link" href="${escapeHtml(recipe.youtube)}" target="_blank" rel="noreferrer">Открыть видео рецепта</a>` : ''}
      </article>
    `;
  }

  getFavoritesTemplate(favorites) {
    return `
      <section class="page-head">
        <h1>Избранное</h1>
        <p>Рецепты сохраняются в браузере.</p>
      </section>
      ${favorites.length
    ? `<div class="recipe-grid">${favorites.map(recipeCard).join('')}</div>`
    : '<div class="state"><h2>Пока нет избранных рецептов</h2><p>Откройте рецепт и нажмите на сердечко, чтобы сохранить его здесь.</p><a class="button-link" href="#/recipes">Найти рецепт</a></div>'}
    `;
  }

  getVocabularyTemplate(words, query = '') {
    const normalizedQuery = query.toLowerCase();
    const filteredWords = words.filter((item) => [
      item.word,
      item.translation,
      item.context,
      item.recipeTitle
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)));

    return `
      <section class="page-head">
        <h1>Мой словарь</h1>
        <p>Слова, контекст и статистика повторений.</p>
      </section>
      <form class="vocabulary-toolbar" data-vocabulary-form>
        <label for="vocabulary-query">Поиск</label>
        <input id="vocabulary-query" name="query" value="${escapeHtml(query)}" placeholder="слово или перевод" autocomplete="off">
        <a class="button-link ${words.length ? '' : 'is-disabled'}" href="${words.length ? '#/trainer' : '#/vocabulary'}" aria-disabled="${words.length ? 'false' : 'true'}">Запустить тренировку</a>
      </form>
      ${words.length
    ? `<div class="vocabulary-list">${filteredWords.map((item) => `
        <article class="word-card">
          <div>
            <h2>${escapeHtml(item.word)} ${item.phonetic ? `<span>${escapeHtml(item.phonetic)}</span>` : ''}</h2>
            <p><strong>${escapeHtml(item.translation || 'перевод не найден')}</strong>${item.partOfSpeech ? ` · ${escapeHtml(item.partOfSpeech)}` : ''}</p>
            ${item.context ? `<p>${escapeHtml(item.context)}</p>` : ''}
            <p class="muted">${escapeHtml(item.recipeTitle || 'Рецепт не указан')}${item.createdAt ? ` · ${escapeHtml(formatDate(item.createdAt))}` : ''} · тренировок: ${escapeHtml(item.stats?.reviewCount || 0)}</p>
          </div>
          <button type="button" data-remove-word="${escapeHtml(item.word)}">Удалить</button>
        </article>
      `).join('')}</div>`
    : `<div class="state">
        <h2>Здесь появятся сохранённые слова</h2>
        <p>Откройте английский текст рецепта, нажмите на незнакомое слово и добавьте его в словарь.</p>
        <a class="button-link" href="#/recipes">Найти рецепт</a>
      </div>`}
      ${words.length && !filteredWords.length ? '<div class="state">По этому запросу слов не найдено.</div>' : ''}
      <section class="data-panel">
        <h2>Данные приложения</h2>
        <p>Переводы сохраняются в браузере, чтобы не загружать их повторно.</p>
        <button type="button" data-clear-translation-cache>Очистить кеш переводов</button>
      </section>
    `;
  }

  getWordModalTemplate(entry, isSaved) {
    const partsOfSpeech = {
      verb: 'глагол',
      noun: 'существительное',
      adjective: 'прилагательное',
      adverb: 'наречие'
    };
    const partOfSpeech = partsOfSpeech[entry.partOfSpeech] || entry.partOfSpeech || 'часть речи не указана';

    return `
      <div class="modal-backdrop" data-modal-backdrop>
        <section class="modal" role="dialog" aria-modal="true" aria-labelledby="word-modal-title" tabindex="-1">
          <button class="modal__close" type="button" data-close-modal aria-label="Закрыть">×</button>
          <div class="word-modal">
            <h2 id="word-modal-title">${escapeHtml(entry.word)}</h2>
            <p class="muted">Автоматический перевод</p>
            <p class="translation">${escapeHtml(entry.translation || 'перевод не найден')}</p>
            ${entry.phonetic ? `<p>${escapeHtml(entry.phonetic)}</p>` : ''}
            ${entry.audio ? `<button type="button" data-play-audio="${escapeHtml(entry.audio)}" aria-label="Прослушать произношение слова ${escapeHtml(entry.word)}">Прослушать</button>` : ''}
            <p><strong>${escapeHtml(partOfSpeech)}</strong></p>
            <p class="muted">Определение на английском</p>
            <p>${escapeHtml(entry.definition || 'Описание не найдено.')}</p>
            <p class="muted">Оригинальный контекст</p>
            <blockquote>${escapeHtml(entry.context || '')}</blockquote>
            <p class="muted">Перевод контекста</p>
            <blockquote>${escapeHtml(entry.translatedContext || 'Перевод контекста временно недоступен.')}</blockquote>
            <p class="muted">${escapeHtml(entry.recipeTitle || '')}</p>
            <button type="button" data-save-word>${isSaved ? 'Убрать из словаря' : 'Сохранить слово'}</button>
          </div>
        </section>
      </div>
    `;
  }

  getPlaceholderTemplate(title) {
    return `
      <section class="page-section">
        <h1>${title}</h1>
      </section>
    `;
  }

  getTrainerTemplate() {
    return `
      <section class="trainer-shell">
        <div id="trainer-root"></div>
      </section>
    `;
  }

  getNotFoundTemplate() {
    return `
      <section class="page-section">
        <h1>Страница не найдена</h1>
        <p>Вернитесь на главную или откройте раздел рецептов.</p>
      </section>
    `;
  }
}
