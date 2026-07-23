import { AppRoute } from '../const.js';
import { dictionaryApi } from '../api/dictionary-api.js';
import { mealsApi } from '../api/meals-api.js';
import { render } from '../framework/render.js';
import { findSentence, normalizeClickedWord, normalizeText } from '../utils/text.js';
import { translationService } from '../services/translation-service.js';
import { favoritesService } from '../services/favorites-service.js';
import { vocabularyService } from '../services/vocabulary-service.js';

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
      message: '',
      selectedCategory: '',
      selectedArea: '',
      categories: [],
      areas: [],
      filtersLoading: false
    };
    this.recipeState = {
      state: 'initial',
      recipe: null,
      translated: null,
      mode: 'translated'
    };
    this.vocabularyQuery = '';
    this.wordEntry = null;
    this.lastWordButton = null;
    this.filtersPromise = null;
  }

  renderPage(activeRoute, content) {
    render(this.container, this.view.getLayout(activeRoute, content));
    this.bindCommon();
  }

  bindCommon() {
    document.querySelectorAll('[data-favorite]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.toggleFavorite(button.dataset.favorite);
      });
    });

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

    document.querySelector('[data-clear-search]')?.addEventListener('click', () => {
      this.clearSearch();
    });

    document.querySelectorAll('[data-filter-category]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectCategory(button.dataset.filterCategory);
      });
    });

    document.querySelectorAll('[data-filter-area]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.selectArea(button.dataset.filterArea);
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

    document.querySelectorAll('.word-token').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.openWordModal(button.dataset.word, button);
      });
    });
  }

  renderHome() {
    this.renderPage(AppRoute.HOME, this.view.getHomeTemplate());
  }

  renderRecipes() {
    if (!this.searchState.filtersLoading && !this.searchState.categories.length && !this.searchState.areas.length) {
      window.setTimeout(() => this.loadRecipeFilters(), 0);
    }

    this.renderPage(AppRoute.RECIPES, this.view.getRecipesTemplate(this.searchState));
  }

  async loadRecipeFilters() {
    if (this.searchState.categories.length && this.searchState.areas.length) {
      return this.searchState;
    }

    if (this.filtersPromise) {
      return this.filtersPromise;
    }

    this.searchState = {
      ...this.searchState,
      filtersLoading: true
    };
    this.renderRecipes();

    this.filtersPromise = this.fetchRecipeFilters();
    return this.filtersPromise;
  }

  async fetchRecipeFilters() {
    try {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
      const mealsByLetter = await Promise.all(alphabet.map((letter) => mealsApi.searchByFirstLetter(letter)));
      const meals = mealsByLetter.flat();
      const categories = [...new Set(meals.map((item) => normalizeText(item.strCategory)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'en'));
      const areas = [...new Set(meals.map((item) => normalizeText(item.strArea)).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'en'));

      this.searchState = {
        ...this.searchState,
        categories,
        areas,
        filtersLoading: false
      };
      this.renderRecipes();
    } catch (_error) {
      this.searchState = {
        ...this.searchState,
        filtersLoading: false
      };
      this.renderRecipes();
    } finally {
      this.filtersPromise = null;
    }

    return this.searchState;
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
      translatedTitle: await translationService.translateTitle(meal.strMeal),
      isFavorite: favoritesService.has(meal.idMeal)
    })));
  }

  async lookupRecipeRefs(refs, limit = 12) {
    const loadedMeals = await Promise.all((refs || []).slice(0, limit).map((item) => mealsApi.lookupById(item.idMeal)));
    return loadedMeals.filter(Boolean);
  }

  intersectRecipeRefs(firstRefs, secondRefs) {
    const secondIds = new Set((secondRefs || []).map((item) => item.idMeal).filter(Boolean));
    return (firstRefs || []).filter((item) => secondIds.has(item.idMeal));
  }

  filterMealsByQuery(meals, query) {
    const normalizedQuery = normalizeText(query).toLocaleLowerCase('en-US');

    if (!normalizedQuery) {
      return meals;
    }

    const terms = normalizedQuery.split(' ').filter(Boolean);
    return meals.filter((meal) => {
      const recipe = this.mapRecipe(meal);
      const searchableText = [
        recipe.title,
        recipe.category,
        recipe.area,
        ...recipe.ingredients.map((item) => item.originalName)
      ].join(' ').toLocaleLowerCase('en-US');

      return terms.every((term) => searchableText.includes(term));
    });
  }

  normalizeFilterValue(value) {
    return normalizeText(value).toLocaleLowerCase('en-US');
  }

  findFilterMatch(query) {
    const normalizedQuery = this.normalizeFilterValue(query);

    if (!normalizedQuery) {
      return null;
    }

    const selectedCategory = this.searchState.categories.find((item) => (
      this.normalizeFilterValue(item) === normalizedQuery
    ));

    if (selectedCategory) {
      return { selectedCategory, selectedArea: '' };
    }

    const selectedArea = this.searchState.areas.find((item) => (
      this.normalizeFilterValue(item) === normalizedQuery
    ));

    if (selectedArea) {
      return { selectedCategory: '', selectedArea };
    }

    return null;
  }

  selectCategory(category) {
    const selectedCategory = this.searchState.selectedCategory === category ? '' : category;
    this.searchWithFilters({ selectedCategory });
  }

  selectArea(area) {
    const selectedArea = this.searchState.selectedArea === area ? '' : area;
    this.searchWithFilters({ selectedArea });
  }

  clearSearch() {
    this.searchState = {
      ...this.searchState,
      state: 'initial',
      query: '',
      translatedQuery: '',
      meals: [],
      message: '',
      selectedCategory: '',
      selectedArea: ''
    };
    window.location.hash = AppRoute.RECIPES;
    this.renderRecipes();
  }

  async searchWithFilters({
    query = this.searchState.query,
    selectedCategory = this.searchState.selectedCategory,
    selectedArea = this.searchState.selectedArea
  } = {}) {
    const normalizedQuery = normalizeText(query);

    if (!selectedCategory && !selectedArea) {
      await this.search(normalizedQuery);
      return;
    }

    window.location.hash = AppRoute.RECIPES;
    this.searchState = {
      ...this.searchState,
      state: 'loading',
      query: normalizedQuery,
      translatedQuery: '',
      meals: [],
      message: '',
      selectedCategory,
      selectedArea
    };
    this.renderRecipes();

    try {
      let meals = [];

      if (selectedCategory && selectedArea) {
        const [categoryRefs, areaRefs] = await Promise.all([
          mealsApi.filterByCategory(selectedCategory),
          mealsApi.filterByArea(selectedArea)
        ]);
        meals = await this.lookupRecipeRefs(this.intersectRecipeRefs(categoryRefs, areaRefs));
      } else if (selectedCategory) {
        meals = await this.lookupRecipeRefs(await mealsApi.filterByCategory(selectedCategory));
      } else {
        meals = await this.lookupRecipeRefs(await mealsApi.filterByArea(selectedArea));
      }

      meals = this.filterMealsByQuery(meals, normalizedQuery);
      const translatedMeals = await this.translateMealCards(meals);
      const filterParts = [];

      if (selectedCategory) {
        filterParts.push(`категория: ${selectedCategory}`);
      }
      if (selectedArea) {
        filterParts.push(`кухня: ${selectedArea}`);
      }
      if (normalizedQuery) {
        filterParts.push(`поиск: «${normalizedQuery}»`);
      }

      this.searchState = {
        ...this.searchState,
        state: meals.length ? 'success' : 'empty',
        query: normalizedQuery,
        translatedQuery: '',
        meals: translatedMeals,
        message: `${meals.length ? 'Найдено' : 'Не найдено'} ${meals.length} рецептов. Фильтры: ${filterParts.join(', ')}.`,
        selectedCategory,
        selectedArea
      };
      this.renderRecipes();
    } catch (_error) {
      this.searchState = {
        ...this.searchState,
        state: 'error',
        meals: [],
        message: ''
      };
      this.renderRecipes();
    }
  }

  getRecipeFavoriteData(recipe, translated) {
    return {
      idMeal: recipe.id,
      strMeal: recipe.title,
      strMealThumb: recipe.thumb,
      strCategory: recipe.category,
      strArea: recipe.area,
      translatedTitle: translated?.translatedTitle || ''
    };
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
        mode: 'translated',
        isFavorite: favoritesService.has(recipe.id)
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

    if (this.searchState.selectedCategory || this.searchState.selectedArea) {
      await this.searchWithFilters({ query: normalizedQuery });
      return;
    }

    if (!normalizedQuery) {
      this.searchState = { ...this.searchState, state: 'initial', query: '', translatedQuery: '', meals: [], message: '', selectedCategory: '', selectedArea: '' };
      this.renderRecipes();
      return;
    }

    window.location.hash = AppRoute.RECIPES;
    this.searchState = {
      ...this.searchState,
      state: 'loading',
      query: normalizedQuery,
      translatedQuery: '',
      meals: [],
      message: '',
      selectedCategory: '',
      selectedArea: ''
    };
    this.renderRecipes();

    try {
      const translatedQuery = await translationService.translateSearchQuery(normalizedQuery);

      await this.loadRecipeFilters();
      const filterMatch = this.findFilterMatch(translatedQuery || normalizedQuery);

      if (filterMatch) {
        await this.searchWithFilters({
          query: '',
          selectedCategory: filterMatch.selectedCategory,
          selectedArea: filterMatch.selectedArea
        });
        return;
      }

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
        ...this.searchState,
        state: meals.length ? 'success' : 'empty',
        query: normalizedQuery,
        translatedQuery,
        meals: translatedMeals,
        message,
        selectedCategory: '',
        selectedArea: ''
      };
      this.renderRecipes();
    } catch (_error) {
      this.searchState = {
        ...this.searchState,
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
    const favorites = favoritesService.list().map((item) => ({
      ...item,
      isFavorite: true
    }));

    this.renderPage(AppRoute.FAVORITES, this.view.getFavoritesTemplate(favorites));
  }

  toggleFavorite(id) {
    const fromSearch = this.searchState.meals.find((item) => item.idMeal === id);
    const fromRecipe = this.recipeState.recipe?.id === id
      ? this.getRecipeFavoriteData(this.recipeState.recipe, this.recipeState.translated)
      : null;
    const fromFavorites = favoritesService.list().find((item) => item.idMeal === id);
    const recipe = fromSearch || fromRecipe || fromFavorites;

    if (!recipe) {
      return;
    }

    favoritesService.toggle(recipe);

    this.searchState = {
      ...this.searchState,
      meals: this.searchState.meals.map((item) => (
        item.idMeal === id ? { ...item, isFavorite: favoritesService.has(id) } : item
      ))
    };

    if (this.recipeState.recipe?.id === id) {
      this.recipeState = {
        ...this.recipeState,
        isFavorite: favoritesService.has(id)
      };
      this.renderRecipePage();
      return;
    }

    if (window.location.hash === AppRoute.FAVORITES) {
      this.renderFavorites();
      return;
    }

    if (window.location.hash === AppRoute.RECIPES) {
      this.renderRecipes();
    }
  }

  renderVocabulary() {
    this.renderPage(AppRoute.VOCABULARY, this.view.getVocabularyTemplate(vocabularyService.list(), this.vocabularyQuery));

    document.querySelector('[data-vocabulary-form]')?.addEventListener('input', (event) => {
      if (event.target?.name !== 'query') {
        return;
      }

      this.vocabularyQuery = event.target.value;
      this.renderVocabulary();
    });

    document.querySelectorAll('[data-remove-word]').forEach((button) => {
      button.addEventListener('click', () => {
        vocabularyService.remove(button.dataset.removeWord);
        this.renderVocabulary();
      });
    });
  }

  renderModal(content) {
    this.closeModal();
    document.body.insertAdjacentHTML('beforeend', content);
    document.querySelector('[data-close-modal]')?.addEventListener('click', () => this.closeModal());
    document.querySelector('[data-modal-backdrop]')?.addEventListener('click', (event) => {
      if (event.target === event.currentTarget) {
        this.closeModal();
      }
    });
    document.addEventListener('keydown', this.handleModalKeydown);
    document.querySelector('.modal')?.focus();
  }

  handleModalKeydown = (event) => {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  };

  closeModal() {
    document.querySelector('[data-modal-backdrop]')?.remove();
    document.removeEventListener('keydown', this.handleModalKeydown);
    this.lastWordButton?.focus();
  }

  bindModalActions() {
    document.querySelector('[data-play-audio]')?.addEventListener('click', (event) => {
      const audio = new window.Audio(event.currentTarget.dataset.playAudio);
      audio.play();
    });

    document.querySelector('[data-save-word]')?.addEventListener('click', () => {
      if (!this.wordEntry) {
        return;
      }

      if (vocabularyService.has(this.wordEntry.word)) {
        vocabularyService.remove(this.wordEntry.word);
      } else {
        vocabularyService.add(this.wordEntry);
      }

      this.closeModal();
    });
  }

  async openWordModal(word, sourceButton) {
    const normalizedWord = normalizeClickedWord(word);

    if (!normalizedWord || /^\d+$/.test(normalizedWord)) {
      return;
    }

    this.lastWordButton = sourceButton;
    this.renderModal('<div class="modal-backdrop" data-modal-backdrop><section class="modal" role="dialog" aria-modal="true"><button class="modal__close" type="button" data-close-modal aria-label="Закрыть">×</button><div class="state">Загружаю слово...</div></section></div>');

    const context = findSentence(this.recipeState.recipe?.instructions || '', normalizedWord);
    const [translation, translatedContext, dictionary] = await Promise.all([
      translationService.translateWord(normalizedWord),
      translationService.translateContext(context),
      dictionaryApi.lookup(normalizedWord)
    ]);

    this.wordEntry = {
      word: normalizedWord,
      translation,
      phonetic: dictionary?.phonetic || '',
      audio: dictionary?.audio || '',
      partOfSpeech: dictionary?.partOfSpeech || '',
      definition: dictionary?.definition || '',
      context,
      translatedContext,
      recipeId: this.recipeState.recipe?.id || '',
      recipeTitle: this.recipeState.recipe?.title || ''
    };

    this.renderModal(this.view.getWordModalTemplate(this.wordEntry, vocabularyService.has(normalizedWord)));
    this.bindModalActions();
  }

  renderTrainer() {
    this.renderPage(AppRoute.TRAINER, this.view.getTrainerTemplate());
  }

  renderNotFound() {
    this.renderPage('', this.view.getNotFoundTemplate());
  }
}
