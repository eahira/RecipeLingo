import { APP_TITLE } from '../const.js';

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
        <p class="eyebrow">Готовьте. Переводите. Запоминайте.</p>
        <h1>Изучайте английский по зарубежным рецептам</h1>
        <p>Готовьте по зарубежным рецептам и учите английский на реальных примерах.</p>
      </section>
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
