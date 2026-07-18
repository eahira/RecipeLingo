import { AppRoute } from '../const.js';
import { mealsApi } from '../api/meals-api.js';
import { render } from '../framework/render.js';
import { normalizeText } from '../utils/text.js';
import { translationService } from '../model/translation-service.js';

export class AppPresenter {
  constructor({ container, view, model }) {
    this.container = container;
    this.view = view;
    this.model = model;
    this.searchState = {
      state: 'initial',
      query: '',
      translatedQuery: '',
      meals: [],
      message: ''
    };
    this.recipeState = {
      state: 'initial',
      recipe: null,
      translated: null,
      mode: 'translated'
    };
  }

  renderPage(activeRoute, content) {
    render(this.container, this.view.getLayout(activeRoute, content));
    this.bindCommon();
  }

  bindCommon() {
    document.querySelectorAll('[data-recipe-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        this.recipeState = {
          ...this.recipeState,
          mode: button.dataset.recipeMode
        };
        this.renderRecipePage();
      });
    });

    document.querySelectorAll('[data-search-form]').forEach((form) => {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        this.search(data.get('query'));
      });
    });

    document.querySelectorAll('[data-open-recipe]').forEach((card) => {
      const openRecipe = () => {
        window.location.hash = `#/recipe/${card.dataset.openRecipe}`;
      };

      card.addEventListener('click', openRecipe);
      card.addEventListener('keydown', (event) => {
        if (!['Enter', ' '].includes(event.key)) {
          return;
        }

        event.preventDefault();
        openRecipe();
      });
    });
  }

  renderHome() {
    this.renderPage(AppRoute.HOME, this.view.getHomeTemplate());
  }

  renderRecipes() {
    this.renderPage(AppRoute.RECIPES, this.view.getRecipesTemplate(this.searchState));
  }

  mapRecipe(meal) {
    const ingredients = [];

    for (let index = 1; index <= 20; index += 1) {
      const name = normalizeText(meal[`strIngredient${index}`]);
      const measure = normalizeText(meal[`strMeasure${index}`]);

      if (!name) {
        continue;
      }

      ingredients.push({
        id: index,
        originalName: name,
        originalMeasure: measure,
        translatedName: '',
        translatedMeasure: ''
      });
    }

    return {
      id: meal.idMeal,
      title: meal.strMeal,
      category: meal.strCategory || '',
      area: meal.strArea || '',
      thumb: meal.strMealThumb || '',
      instructions: meal.strInstructions || '',
      youtube: meal.strYoutube || '',
      ingredients
    };
  }

  async translateRecipe(recipe) {
    const [translatedTitle, translatedIngredients, translatedInstructions] = await Promise.all([
      translationService.translateTitle(recipe.title),
      Promise.all(recipe.ingredients.map(async (item) => ({
        ...item,
        translatedName: await translationService.translateIngredient(item.originalName),
        translatedMeasure: await translationService.translateMeasure(item.originalMeasure)
      }))),
      translationService.translateInstructions(recipe.instructions)
    ]);

    return {
      ...recipe,
      translatedTitle,
      ingredients: translatedIngredients,
      instructionPairs: translatedInstructions
    };
  }

  async translateMealCards(meals) {
    return Promise.all(meals.map(async (meal) => ({
      ...meal,
      translatedTitle: await translationService.translateTitle(meal.strMeal)
    })));
  }

  renderRecipePage() {
    this.renderPage('#/recipe', this.view.getRecipeTemplate(this.recipeState));
  }

  async renderRecipe(params) {
    this.recipeState = {
      state: 'loading',
      recipe: null,
      translated: null,
      mode: 'translated'
    };
    this.renderRecipePage();

    try {
      const meal = await mealsApi.lookupById(params.id);

      if (!meal) {
        this.recipeState = {
          state: 'empty',
          recipe: null,
          translated: null,
          mode: 'translated'
        };
        this.renderRecipePage();
        return;
      }

      const recipe = this.mapRecipe(meal);
      const translated = await this.translateRecipe(recipe);

      this.recipeState = {
        state: 'success',
        recipe,
        translated,
        mode: 'translated'
      };
      this.renderRecipePage();
    } catch (_error) {
      this.recipeState = {
        state: 'error',
        recipe: null,
        translated: null,
        mode: 'translated'
      };
      this.renderRecipePage();
    }
  }

  async search(query) {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) {
      this.searchState = { state: 'initial', query: '', translatedQuery: '', meals: [], message: '' };
      this.renderRecipes();
      return;
    }

    window.location.hash = AppRoute.RECIPES;
    this.searchState = {
      state: 'loading',
      query: normalizedQuery,
      translatedQuery: '',
      meals: [],
      message: ''
    };
    this.renderRecipes();

    try {
      const translatedQuery = await translationService.translateSearchQuery(normalizedQuery);
      let meals = await mealsApi.searchByName(translatedQuery);
      let message = translatedQuery && translatedQuery !== normalizedQuery
        ? `По запросу «${normalizedQuery}» найдено ${meals.length} рецептов. Поиск выполнен по английскому запросу «${translatedQuery}».`
        : `По запросу «${normalizedQuery}» найдено ${meals.length} рецептов.`;

      if (!meals.length) {
        const ingredient = translatedQuery.split(' ')[0] || normalizedQuery.split(' ')[0];
        const refs = await mealsApi.filterByIngredient(ingredient);
        const loadedMeals = await Promise.all(refs.slice(0, 8).map((item) => mealsApi.lookupById(item.idMeal)));
        meals = loadedMeals.filter(Boolean);
        message = `По названию ничего не найдено, поэтому поиск выполнен по ингредиенту: «${ingredient}».`;
      }

      const translatedMeals = await this.translateMealCards(meals);

      this.searchState = {
        state: meals.length ? 'success' : 'empty',
        query: normalizedQuery,
        translatedQuery,
        meals: translatedMeals,
        message
      };
      this.renderRecipes();
    } catch (_error) {
      this.searchState = {
        state: 'error',
        query: normalizedQuery,
        translatedQuery: '',
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
