import './styles/main.scss';
import { AppModel } from './model/app-model.js';
import { AppPresenter } from './presenter/app-presenter.js';
import { Router } from './framework/router.js';
import { AppView } from './view/app-view.js';

let trainerModule = null;

const appContainer = document.querySelector('#app');
const appModel = new AppModel();
const appView = new AppView();
const appPresenter = new AppPresenter({
  container: appContainer,
  view: appView,
  model: appModel
});

function renderVanilla(handler) {
  trainerModule?.unmountTrainer();
  handler();
}

const router = new Router([
  { path: '#/', handler: () => renderVanilla(() => appPresenter.renderHome()) },
  { path: '#/recipes', handler: () => renderVanilla(() => appPresenter.renderRecipes()) },
  { path: '#/recipe/:id', handler: (params) => renderVanilla(() => appPresenter.renderRecipe(params)) },
  { path: '#/favorites', handler: () => renderVanilla(() => appPresenter.renderFavorites()) },
  { path: '#/vocabulary', handler: () => renderVanilla(() => appPresenter.renderVocabulary()) },
  {
    path: '#/trainer',
    handler: () => {
      appPresenter.renderTrainer();
      import('./react/vocabulary-trainer/Trainer.jsx').then((module) => {
        if (window.location.hash !== '#/trainer') {
          return;
        }

        trainerModule = module;
        module.mountTrainer('#trainer-root');
      });
    }
  }
], () => renderVanilla(() => appPresenter.renderNotFound()));

router.start();
