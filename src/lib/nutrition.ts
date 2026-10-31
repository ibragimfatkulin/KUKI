import { findProduct } from "./catalog";
import type { Nutrition } from "./types";

export function toGrams(name: string, quantity: number | null, unit: string | null) {
  if (quantity == null || quantity <= 0) return 0;
  const normalized = unit ?? "г";
  if (normalized === "кг") return quantity * 1000;
  if (normalized === "г") return quantity;
  if (normalized === "мл") return quantity;
  if (normalized === "л") return quantity * 1000;
  if (normalized === "ст. л.") return quantity * 15;
  if (normalized === "ч. л.") return quantity * 5;
  if (normalized === "зубчик") return quantity * 5;
  if (normalized === "щепотка") return quantity * 0.4;
  if (normalized === "стакан") return quantity * 200;
  if (normalized === "банка") return quantity * 240;
  if (normalized === "пучок") return quantity * 30;
  if (normalized === "шт") {
    const product = findProduct(name);
    return quantity * (product.gramsPerPiece ?? 80);
  }
  return quantity;
}

export function estimateNutrition(
  items: { name: string; quantity: number | null; unit: string | null }[],
  servings: number,
): Nutrition {
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  for (const item of items) {
    const grams = toGrams(item.name, item.quantity, item.unit);
    const product = findProduct(item.name);
    const ratio = grams / 100;
    calories += product.calories * ratio;
    protein += product.protein * ratio;
    fat += product.fat * ratio;
    carbs += product.carbs * ratio;
  }
  const safeServings = Math.max(1, servings);
  return {
    calories: Math.max(1, Math.round(calories / safeServings)),
    protein: Math.max(0, Math.round(protein / safeServings)),
    fat: Math.max(0, Math.round(fat / safeServings)),
    carbs: Math.max(0, Math.round(carbs / safeServings)),
  };
}
