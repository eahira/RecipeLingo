import './styles/main.scss';
import { AppModel } from './model/app-model.js';
import { AppPresenter } from './presenter/app-presenter.js';
import { Router } from './framework/router.js';
import { AppView } from './view/app-view.js';

const appContainer = document.querySelector('#app');
const appModel = new AppModel();
const appView = new AppView();
const appPresenter = new AppPresenter({
  container: appContainer,
  view: appView,
  model: appModel
});

const router = new Router([
  { path: '#/', handler: () => appPresenter.renderHome() },
  { path: '#/recipes', handler: () => appPresenter.renderRecipes() },
  { path: '#/recipe/:id', handler: (params) => appPresenter.renderRecipe(params) },
  { path: '#/favorites', handler: () => appPresenter.renderFavorites() },
  { path: '#/vocabulary', handler: () => appPresenter.renderVocabulary() },
  { path: '#/trainer', handler: () => appPresenter.renderTrainer() }
], () => appPresenter.renderNotFound());

router.start();
