import { AppRoute } from '../const.js';
import { mealsApi } from '../api/meals-api.js';
import { render } from '../framework/render.js';
import { normalizeText } from '../utils/text.js';

export class AppPresenter {
  constructor({ container, view, model }) {
    this.container = container;
    this.view = view;
    this.model = model;
    this.searchState = {
      state: 'initial',
      query: '',
      meals: [],
      message: ''
    };
  }

  renderPage(activeRoute, content) {
    render(this.container, this.view.getLayout(activeRoute, content));
    this.bindCommon();
  }

  bindCommon() {
    document.querySelectorAll('[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        this.search(data.get('query'));
      });
    });
  }

  renderHome() {
    this.renderPage(AppRoute.HOME, this.view.getHomeTemplate());
  }

  renderRecipes() {
    this.renderPage(AppRoute.RECIPES, this.view.getRecipesTemplate(this.searchState));
  }

  async search(query) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      this.searchState = { state: 'initial', query: '', meals: [], message: '' };
      this.renderRecipes();
      return;
    }

    window.location.hash = AppRoute.RECIPES;
    this.searchState = {
      state: 'loading',
      query: normalizedQuery,
      meals: [],
      message: ''
    };
    this.renderRecipes();

    try {
      let meals = await mealsApi.searchByName(normalizedQuery);
      let message = `По запросу «${normalizedQuery}» найдено ${meals.length} рецептов.`;

      if (!meals.length) {
        const ingredient = normalizedQuery.split(' ')[0];
        const refs = await mealsApi.filterByIngredient(ingredient);
        const loadedMeals = await Promise.all(refs.slice(0, 8).map((item) => mealsApi.lookupById(item.idMeal)));
        meals = loadedMeals.filter(Boolean);
        message = `По названию ничего не найдено, поэтому поиск выполнен по ингредиенту: «${ingredient}».`;
      }

      this.searchState = {
        state: meals.length ? 'success' : 'empty',
        query: normalizedQuery,
        meals,
        message
      };
      this.renderRecipes();
    } catch (_error) {
      this.searchState = {
        state: 'error',
        query: normalizedQuery,
        meals: [],
        message: ''
      };
      this.renderRecipes();
    }
  }

  renderFavorites() {
    this.renderPage(AppRoute.FAVORITES, this.view.getPlaceholderTemplate('Избранное'));
  }

  renderVocabulary() {
    this.renderPage(AppRoute.VOCABULARY, this.view.getPlaceholderTemplate('Словарь'));
  }

  renderTrainer() {
    this.renderPage(AppRoute.TRAINER, this.view.getPlaceholderTemplate('Тренировка'));
  }

  renderNotFound() {
    this.renderPage('', this.view.getNotFoundTemplate());
  }
}
