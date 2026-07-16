import { APP_TITLE } from '../const.js';
import { escapeHtml } from '../utils/text.js';

function recipeCard(meal) {
  return `
    <article class="recipe-card">
      <img src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}" loading="lazy">
      <div class="recipe-card__body">
        <h2>${escapeHtml(meal.strMeal)}</h2>
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

  getRecipesTemplate({ state, query, meals, message }) {
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
      ${state === 'empty' ? '<div class="state">Ничего не найдено. Попробуйте другой запрос.</div>' : ''}
      ${meals.length ? `<div class="recipe-grid">${meals.map(recipeCard).join('')}</div>` : ''}
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
