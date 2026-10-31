import type { Difficulty, EquipmentId, Goal, MealType } from "./types";

export function joinRu(items: string[]) {
  const clean = items.map((item) => item.trim()).filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(", ")} и ${clean[clean.length - 1]}`;
}

export function formatQty(quantity: number | null, unit: string | null) {
  if (quantity == null) return "по вкусу";
  const rounded = Math.round(quantity * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", ",");
  return unit ? `${text} ${unit}` : text;
}

export function formatWhen(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const MEAL_LABEL: Record<MealType, string> = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Легко",
  medium: "Средне",
  hard: "Сложно",
};

export const GOAL_LABEL: Record<Goal, string> = {
  regular: "Обычное",
  low_calorie: "Низкокалорийное",
  high_protein: "Высокобелковое",
};

export const EQUIPMENT_LABEL: Record<EquipmentId, string> = {
  microwave: "Микроволновка",
  oven: "Духовка",
  gas_stove: "Газовая плита",
  electric_stove: "Электрическая плита",
  multicooker: "Мультиварка",
  airfryer: "Аэрогриль",
  grill: "Гриль",
  none: "Без техники",
};

export const DIET_LABEL = {
  vegetarian: "Вегетарианское",
  vegan: "Веган",
  gluten_free: "Без глютена",
  lactose_free: "Без лактозы",
  nut_free: "Без орехов",
  egg_free: "Без яиц",
  fish_free: "Без рыбы",
} as const;
