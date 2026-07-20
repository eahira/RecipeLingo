import { STORAGE_KEYS } from '../const.js';

function readFavorites() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.favorites));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeFavorites(items) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(items));
  } catch (_error) {
    void _error;
  }
}

export const favoritesService = {
  list() {
    return readFavorites();
  },

  has(id) {
    return readFavorites().some((item) => item.idMeal === id);
  },

  toggle(recipe) {
    const favorites = readFavorites();
    const exists = favorites.some((item) => item.idMeal === recipe.idMeal);

    if (exists) {
      writeFavorites(favorites.filter((item) => item.idMeal !== recipe.idMeal));
      return false;
    }

    writeFavorites([recipe, ...favorites]);
    return true;
  }
};
