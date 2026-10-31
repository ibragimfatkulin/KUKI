import { requestRecipeFromModel, hasAiKey } from "./ai";
import { composeRecipe } from "./composer";
import { AppError } from "./errors";
import { equipmentViolations, hasHeat, pickMethod } from "./equipment";
import { DietConflictError, dietConflict, ingredientsNeedingHeat, splitByDiet } from "./food";
import { pickImage } from "./images";
import { estimateNutrition } from "./nutrition";
import { findUnsafeIngredients, UNSAFE_MESSAGE } from "./safety";
import { allocateTime } from "./time";
import type { GenerateInput, GeneratedRecipe, RecipeIngredient } from "./types";
import { sanitizeText } from "./utils";
import { aiRecipeSchema } from "./validators";

function sameFood(leftName: string, rightName: string) {
  const left = leftName.toLowerCase().replace(/ё/g, "е");
  const right = rightName.toLowerCase().replace(/ё/g, "е");
  if (left === right) return true;
  if (left.length >= 4 && right.length >= 4) {
    return left.includes(right.slice(0, 5)) || right.includes(left.slice(0, 5));
  }
  return false;
}

function fallback(input: GenerateInput, notice: string) {
  const recipe = composeRecipe(input);
  recipe.source = "fallback";
  recipe.notice = notice;
  return recipe;
}

function normalizeModelRecipe(raw: unknown, input: GenerateInput): GeneratedRecipe {
  const data = aiRecipeSchema.parse(raw);
  const { usable, excluded } = splitByDiet(input.ingredients, input.diets, input.allergens);
  const ingredients: RecipeIngredient[] = data.ingredients
    .map((item) => ({
      name: sanitizeText(item.name),
      quantity: item.quantity,
      unit: item.unit ? sanitizeText(item.unit) : null,
      available: item.available,
      assumed: item.assumed,
    }))
    .filter((item) => item.name && !dietConflict(item.name, input.diets, input.allergens));

  for (const source of usable) {
    const current = ingredients.find((item) => sameFood(item.name, source.name));
    if (!current) {
      ingredients.push({
        name: source.name,
        quantity: source.quantity,
        unit: source.unit,
        available: true,
        assumed: source.quantity == null,
      });
      continue;
    }
    current.available = true;
    if (source.quantity != null) {
      current.quantity = source.quantity;
      current.unit = source.unit ?? current.unit;
      current.assumed = false;
    } else if (current.quantity != null) {
      current.assumed = true;
    }
  }

  for (const name of data.missing_ingredients) {
    const clean = sanitizeText(name);
    if (!clean || ingredients.some((item) => sameFood(item.name, clean))) continue;
    if (dietConflict(clean, input.diets, input.allergens)) continue;
    ingredients.push({ name: clean, quantity: null, unit: null, available: false, assumed: true });
  }

  const mentioned = usable.filter((item) => ingredients.some((ingredient) => sameFood(ingredient.name, item.name)));
  if (mentioned.length / usable.length < 0.6) {
    throw new Error("Модель использовала слишком мало продуктов из холодильника");
  }

  const cookingTime = Math.min(input.timeMinutes, Math.max(1, data.cooking_time));
  const durations = allocateTime(
    data.steps.map((step) => Math.max(1, step.duration)),
    cookingTime,
  );
  const steps = data.steps.map((step, index) => ({
    step: index + 1,
    instruction: sanitizeText(step.instruction),
    duration: durations[index] ?? 1,
  }));
  const description = sanitizeText(data.description);
  const problems = equipmentViolations([{ instruction: description }, ...steps], input.equipment);
  if (problems.length > 0) {
    throw new Error(`Техника не подходит: ${problems.join(", ")}`);
  }
  if (findUnsafeIngredients(ingredients).length > 0) {
    throw new Error("В ответе модели есть небезопасный продукт");
  }

  const estimated = estimateNutrition(ingredients, input.servings);
  const gap = Math.abs(data.nutrition.calories - estimated.calories) / Math.max(1, estimated.calories);
  const nutrition =
    data.nutrition.calories >= 40 && gap < 0.7
      ? {
          calories: Math.round(data.nutrition.calories),
          protein: Math.round(data.nutrition.protein),
          fat: Math.round(data.nutrition.fat),
          carbs: Math.round(data.nutrition.carbs),
        }
      : estimated;
  const used = input.ingredients.filter((item) =>
    ingredients.some((ingredient) => ingredient.available && sameFood(ingredient.name, item.name)),
  ).length;

  return {
    name: sanitizeText(data.recipe_name),
    description,
    cookingTime,
    servings: input.servings,
    difficulty: input.difficulty,
    ingredients,
    equipment: input.equipment,
    steps,
    nutrition,
    usagePercent: Math.round((used / input.ingredients.length) * 100),
    assumptions: [
      ...data.assumptions.map((item) => sanitizeText(item)).filter(Boolean),
      ...ingredients
        .filter((item) => item.assumed)
        .map((item) => `Количество «${item.name}» приблизительное.`),
      ...(excluded.length > 0 ? [`Из списка убраны продукты под ограничение: ${excluded.map((item) => item.name).join(", ")}.`] : []),
      "Калории, белки, жиры и углеводы ориентировочные.",
    ],
    imageUrl: pickImage(
      ingredients.map((item) => item.name),
      input.mealType,
      pickMethod(input.equipment, input.variation),
    ),
    mealType: input.mealType,
    goal: input.goal,
    source: "ai",
    notice: null,
  };
}

export async function generateRecipe(input: GenerateInput) {
  const unsafe = findUnsafeIngredients([...input.ingredients, ...input.extras]);
  if (unsafe.length > 0) {
    throw new AppError(422, UNSAFE_MESSAGE, "unsafe_ingredient", { items: unsafe.map((item) => item.name) });
  }
  if (!hasHeat(input.equipment)) {
    const raw = ingredientsNeedingHeat(input.ingredients);
    if (raw.length > 0) {
      throw new AppError(
        422,
        `Без нагрева нельзя готовить: ${raw.join(", ")}. Выберите технику с нагревом или уберите эти продукты.`,
        "needs_heat",
        { items: raw },
      );
    }
  }

  if (!hasAiKey()) {
    return fallback(input, "Ключ AI не задан. Рецепт собран локальным модулем: техника, диета и безопасность проверяются так же.");
  }

  try {
    let raw = await requestRecipeFromModel(input);
    try {
      return normalizeModelRecipe(raw, input);
    } catch (error) {
      const feedback = error instanceof Error ? error.message : "Исправь рецепт";
      raw = await requestRecipeFromModel(input, feedback);
      return normalizeModelRecipe(raw, input);
    }
  } catch (error) {
    if (error instanceof AppError || error instanceof DietConflictError) throw error;
    console.error(error instanceof Error ? error.message : error);
    return fallback(input, "Сервис AI не ответил подходящим рецептом. Показан локальный вариант для выбранной техники.");
  }
}
