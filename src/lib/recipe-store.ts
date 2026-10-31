import type { Ingredient, Recipe } from "@prisma/client";
import { USER_COOKIE } from "./session";
import { prisma } from "./prisma";
import type { GenerateInput, GeneratedRecipe, RecipeDTO } from "./types";
import { parseJson } from "./utils";
import { cookies } from "next/headers";

type StoredRecipe = Recipe & { ingredients: Ingredient[] };

export function toRecipeDTO(recipe: StoredRecipe, isFavorite: boolean): RecipeDTO {
  const ingredients = [...recipe.ingredients].sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    cookingTime: recipe.cookingTime,
    servings: recipe.servings,
    difficulty: recipe.difficulty as RecipeDTO["difficulty"],
    ingredients: ingredients.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      available: item.isAvailable,
      assumed: item.assumed,
    })),
    equipment: parseJson(recipe.equipment, []),
    steps: parseJson(recipe.instructions, []),
    nutrition: {
      calories: recipe.calories,
      protein: recipe.protein,
      fat: recipe.fat,
      carbs: recipe.carbs,
    },
    usagePercent: recipe.usagePercent,
    assumptions: parseJson(recipe.assumptions, []),
    imageUrl: recipe.imageUrl,
    mealType: recipe.mealType as RecipeDTO["mealType"],
    goal: recipe.goal as RecipeDTO["goal"],
    source: recipe.source as RecipeDTO["source"],
    notice: recipe.notice,
    exampleKey: recipe.exampleKey,
    isExample: recipe.isExample,
    isFavorite,
    createdAt: recipe.createdAt.toISOString(),
    request: parseJson<GenerateInput | null>(recipe.requestJson, null),
  };
}

export async function saveRecipe(userId: string, recipe: GeneratedRecipe, input: GenerateInput) {
  return prisma.$transaction(async (tx) => {
    if (recipe.exampleKey) {
      const existing = await tx.recipe.findFirst({
        where: { userId, exampleKey: recipe.exampleKey },
        include: { ingredients: true },
      });
      if (existing) {
        const favorite = await tx.favorite.findUnique({
          where: { userId_recipeId: { userId, recipeId: existing.id } },
        });
        return toRecipeDTO(existing, Boolean(favorite));
      }
    }

    const created = await tx.recipe.create({
      data: {
        userId,
        name: recipe.name,
        description: recipe.description,
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        calories: recipe.nutrition.calories,
        protein: recipe.nutrition.protein,
        fat: recipe.nutrition.fat,
        carbs: recipe.nutrition.carbs,
        instructions: JSON.stringify(recipe.steps),
        imageUrl: recipe.imageUrl,
        equipment: JSON.stringify(recipe.equipment),
        mealType: recipe.mealType,
        goal: recipe.goal,
        usagePercent: recipe.usagePercent,
        assumptions: JSON.stringify(recipe.assumptions),
        source: recipe.source,
        notice: recipe.notice,
        requestJson: JSON.stringify(input),
        exampleKey: recipe.exampleKey ?? null,
        isExample: recipe.source === "example",
        ingredients: {
          create: recipe.ingredients.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            isAvailable: item.available,
            assumed: item.assumed,
          })),
        },
      },
      include: { ingredients: true },
    });

    await tx.generationHistory.create({
      data: {
        userId,
        recipeId: created.id,
        inputIngredients: JSON.stringify(input.ingredients),
        equipment: JSON.stringify(input.equipment),
        settings: JSON.stringify({
          timeMinutes: input.timeMinutes,
          servings: input.servings,
          mealType: input.mealType,
          difficulty: input.difficulty,
          goal: input.goal,
          diets: input.diets,
          allergens: input.allergens,
          extras: input.extras,
        }),
      },
    });

    return toRecipeDTO(created, false);
  });
}

export async function getRecipeDTO(id: string) {
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { ingredients: true },
  });
  if (!recipe) return null;
  const jar = await cookies();
  const userId = jar.get(USER_COOKIE)?.value;
  const favorite = userId
    ? await prisma.favorite.findUnique({ where: { userId_recipeId: { userId, recipeId: id } } })
    : null;
  return toRecipeDTO(recipe, Boolean(favorite));
}
