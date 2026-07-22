const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

async function request(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error('Recipe service request failed');
  }

  const data = await response.json();
  return data.meals || [];
}

async function requestData(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error('Recipe service request failed');
  }

  return response.json();
}

export const mealsApi = {
  searchByName(query) {
    return request(`/search.php?s=${encodeURIComponent(query)}`);
  },

  searchByFirstLetter(letter) {
    return request(`/search.php?f=${encodeURIComponent(letter)}`);
  },

  filterByIngredient(ingredient) {
    return request(`/filter.php?i=${encodeURIComponent(ingredient)}`);
  },

  filterByCategory(category) {
    return request(`/filter.php?c=${encodeURIComponent(category)}`);
  },

  filterByArea(area) {
    return request(`/filter.php?a=${encodeURIComponent(area)}`);
  },

  categories() {
    return requestData('/categories.php').then((data) => data.categories || []);
  },

  areas() {
    return requestData('/list.php?a=list').then((data) => data.meals || []);
  },

  lookupById(id) {
    return request(`/lookup.php?i=${encodeURIComponent(id)}`).then((meals) => meals[0] || null);
  }
};
