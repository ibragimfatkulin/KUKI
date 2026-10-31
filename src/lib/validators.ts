import { z } from "zod";
import { DIETS, DIFFICULTIES, EQUIPMENT_IDS, GOALS, MEAL_TYPES, TIME_OPTIONS, type GenerateInput, type IngredientInput } from "./types";
import { zodEnum } from "./utils";

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.number().positive().max(10000).nullable().optional(),
  unit: z.string().trim().max(20).nullable().optional(),
  vague: z.boolean().optional(),
});

export const generateInputSchema = z.object({
  ingredients: z.array(ingredientSchema).min(1).max(40),
  equipment: z.array(z.enum(zodEnum(EQUIPMENT_IDS))).min(1).max(8),
  timeMinutes: z
    .number()
    .int()
    .refine((value) => (TIME_OPTIONS as readonly number[]).includes(value)),
  servings: z.number().int().min(1).max(8),
  mealType: z.enum(zodEnum(MEAL_TYPES)),
  difficulty: z.enum(zodEnum(DIFFICULTIES)),
  goal: z.enum(zodEnum(GOALS)),
  diets: z.array(z.enum(zodEnum(DIETS))).max(7).optional().default([]),
  allergens: z.string().trim().max(200).optional().default(""),
  extras: z.array(ingredientSchema).max(15).optional().default([]),
  variation: z.number().int().min(0).max(20).optional().default(0),
  avoidNames: z.array(z.string().trim().max(140)).max(6).optional().default([]),
});

export const parseTextSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

export const exampleKeySchema = z.object({
  key: z.enum(["microwave-chicken", "fresh-salad", "quick-breakfast"]),
});

export const aiRecipeSchema = z.object({
  recipe_name: z.string().min(2).max(140),
  description: z.string().min(2).max(500),
  cooking_time: z.number().int().min(1).max(180),
  servings: z.number().int().min(1).max(8),
  difficulty: z.enum(zodEnum(DIFFICULTIES)),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        quantity: z.number().nullable(),
        unit: z.string().max(20).nullable(),
        available: z.boolean(),
        assumed: z.boolean().optional().default(false),
      }),
    )
    .min(1)
    .max(40),
  equipment: z.array(z.string()).optional().default([]),
  steps: z
    .array(
      z.object({
        step: z.number().int(),
        instruction: z.string().min(3).max(600),
        duration: z.number().int().min(0).max(180),
      }),
    )
    .min(2)
    .max(12),
  nutrition: z.object({
    calories: z.number().min(0).max(5000),
    protein: z.number().min(0).max(500),
    fat: z.number().min(0).max(500),
    carbs: z.number().min(0).max(500),
  }),
  missing_ingredients: z.array(z.string()).optional().default([]),
  available_ingredients_usage: z.number().min(0).max(100),
  assumptions: z.array(z.string().max(300)).optional().default([]),
});

function toIngredient(item: z.infer<typeof ingredientSchema>): IngredientInput {
  return {
    name: item.name.trim(),
    quantity: item.quantity ?? null,
    unit: item.unit?.trim() || null,
    vague: item.vague,
  };
}

export function toGenerateInput(data: z.infer<typeof generateInputSchema>): GenerateInput {
  return {
    ingredients: data.ingredients.map(toIngredient),
    extras: data.extras.map(toIngredient),
    equipment: data.equipment,
    timeMinutes: data.timeMinutes as GenerateInput["timeMinutes"],
    servings: data.servings,
    mealType: data.mealType,
    difficulty: data.difficulty,
    goal: data.goal,
    diets: data.diets,
    allergens: data.allergens,
    variation: data.variation,
    avoidNames: data.avoidNames,
  };
}
