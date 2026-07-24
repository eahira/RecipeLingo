import { normalizeText } from '../utils/text.js';

export function mapRecipe(meal) {
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
