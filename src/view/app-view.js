import { APP_TITLE } from '../const.js';
import { escapeHtml } from '../utils/text.js';

function recipeCard(meal) {
  const hasTranslatedTitle = meal.translatedTitle && meal.translatedTitle.toLowerCase() !== meal.strMeal.toLowerCase();

  return `
    <article class="recipe-card recipe-card--clickable" data-open-recipe="${escapeHtml(meal.idMeal)}" tabindex="0" role="link" aria-label="Открыть рецепт ${escapeHtml(meal.strMeal)}">
      <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy">
      <div class="recipe-card__body">
        <h2>${escapeHtml(meal.strMeal)}</h2>
        ${hasTranslatedTitle ? `<p>${escapeHtml(meal.translatedTitle)}</p>` : ''}
        <p>${escapeHtml(meal.strCategory || 'Category not specified')} · ${escapeHtml(meal.strArea || 'Cuisine not specified')}</p>
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

  getRecipesTemplate({ state, query, translatedQuery, meals, message }) {
    return `
      <section class="page-head">
        <h1>Поиск рецептов</h1>
        <p>Введите название блюда или ингредиент — на русском или английском.</p>
      </section>
      <form class="search-panel" data-search-form>
        <label for="recipes-query">Поиск</label>
        <div class="search-panel__row">
          <input id="recipes-query" name="query" value="${escapeHtml(query)}" placeholder="Что хотите приготовить?">
          <button type="submit">Искать</button>
        </div>
      </form>
      ${state === 'loading' ? '<div class="state">Ищу рецепты...</div>' : ''}
      ${state === 'error' ? '<div class="state state--error">Не получилось загрузить рецепты. Попробуйте ещё раз.</div>' : ''}
      ${message ? `<p class="notice">${escapeHtml(message)}</p>` : ''}
      ${translatedQuery && translatedQuery !== query ? `<p class="muted">Английский запрос для TheMealDB: ${escapeHtml(translatedQuery)}</p>` : ''}
      ${state === 'empty' ? '<div class="state">Ничего не найдено. Попробуйте другой запрос.</div>' : ''}
      ${meals.length ? `<div class="recipe-grid">${meals.map(recipeCard).join('')}</div>` : ''}
    `;
  }

  getRecipeTemplate({ recipe, translated, state, mode }) {
    if (state === 'loading') {
      return '<div class="state">Загружаю рецепт...</div>';
    }

    if (state === 'error') {
      return '<div class="state state--error">Не получилось открыть рецепт. Вернитесь к поиску и попробуйте ещё раз.</div>';
    }

    if (!recipe) {
      return '<div class="state">Рецепт не найден.</div>';
    }

    const translatedRecipe = translated || recipe;
    const instructionPairs = translatedRecipe.instructionPairs || [];
    const ingredients = translatedRecipe.ingredients.map((item) => `
      <li>
        <span>
          <strong>${escapeHtml(item.translatedName || item.originalName)}</strong>
          <small>${escapeHtml(item.originalName)}${item.originalMeasure ? ` · ${escapeHtml(item.originalMeasure)}` : ''}</small>
        </span>
        ${(item.translatedMeasure || item.originalMeasure) ? `<strong>${escapeHtml(item.translatedMeasure || item.originalMeasure)}</strong>` : ''}
      </li>
    `).join('');
    const translatedInstructions = instructionPairs.map((item) => item.translation).filter(Boolean).join('\n\n');
    const pairedInstructions = instructionPairs.map((item) => `
      <div class="instruction-pair">
        <p class="instruction-pair__label">Оригинал</p>
        <div class="text-block">${escapeHtml(item.original)}</div>
        <p class="instruction-pair__label">Перевод</p>
        <div class="text-block">${escapeHtml(item.translation || 'Перевод временно недоступен.')}</div>
      </div>
    `).join('');

    return `
      <article class="recipe-detail">
        <a class="back-link" href="#/recipes">← К рецептам</a>
        <div class="recipe-detail__hero">
          <img src="${escapeHtml(recipe.thumb)}" alt="${escapeHtml(recipe.title)}">
          <div class="recipe-detail__summary">
            <p class="eyebrow">${escapeHtml(recipe.category)}${recipe.area ? ` · ${escapeHtml(recipe.area)}` : ''}</p>
            <h1>${escapeHtml(recipe.title)}</h1>
            ${translatedRecipe.translatedTitle ? `<p>${escapeHtml(translatedRecipe.translatedTitle)}</p>` : ''}
          </div>
        </div>
        <section class="ingredients">
          <h2>Ингредиенты</h2>
          <ul>${ingredients}</ul>
        </section>
        <section class="instructions">
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
          ${mode === 'translated' ? `<div class="text-block">${escapeHtml(translatedInstructions || 'Перевод временно недоступен.')}</div>` : ''}
          ${mode === 'original' ? `<div class="text-block">${escapeHtml(recipe.instructions)}</div>` : ''}
          ${mode === 'both' ? `<div class="paired-instructions">${pairedInstructions}</div>` : ''}
        </section>
        ${recipe.youtube ? `<a class="video-link" href="${escapeHtml(recipe.youtube)}" target="_blank" rel="noreferrer">Открыть видео рецепта</a>` : ''}
      </article>
    `;
  }

  getPlaceholderTemplate(title) {
    return `
      <section class="page-section">
        <h1>${title}</h1>
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
