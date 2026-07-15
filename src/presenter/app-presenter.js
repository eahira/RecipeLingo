import { AppRoute } from '../const.js';
import { render } from '../framework/render.js';

export class AppPresenter {
  constructor({ container, view, model }) {
    this.container = container;
    this.view = view;
    this.model = model;
  }

  renderPage(activeRoute, content) {
    render(this.container, this.view.getLayout(activeRoute, content));
  }

  renderHome() {
    this.renderPage(AppRoute.HOME, this.view.getHomeTemplate());
  }

  renderRecipes() {
    this.renderPage(AppRoute.RECIPES, this.view.getPlaceholderTemplate('Рецепты'));
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

