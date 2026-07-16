const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

async function request(endpoint) {
  const response = await fetch(`${BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error('Recipe service request failed');
  }

  const data = await response.json();
  return data.meals || [];
}

export const mealsApi = {
  searchByName(query) {
    return request(`/search.php?s=${encodeURIComponent(query)}`);
  },

  filterByIngredient(ingredient) {
    return request(`/filter.php?i=${encodeURIComponent(ingredient)}`);
  },

  lookupById(id) {
    return request(`/lookup.php?i=${encodeURIComponent(id)}`).then((meals) => meals[0] || null);
  }
};
