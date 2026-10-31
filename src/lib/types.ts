export const EQUIPMENT_IDS = [
  "microwave",
  "oven",
  "gas_stove",
  "electric_stove",
  "multicooker",
  "airfryer",
  "grill",
  "none",
] as const;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const GOALS = ["regular", "low_calorie", "high_protein"] as const;
export const DIETS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "lactose_free",
  "nut_free",
  "egg_free",
  "fish_free",
] as const;
export const TIME_OPTIONS = [10, 20, 30, 45, 60] as const;

export type EquipmentId = (typeof EQUIPMENT_IDS)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];
export type Goal = (typeof GOALS)[number];
export type Diet = (typeof DIETS)[number];
export type TimeOption = (typeof TIME_OPTIONS)[number];

export type IngredientInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
  vague?: boolean;
};

export type GenerateInput = {
  ingredients: IngredientInput[];
  equipment: EquipmentId[];
  timeMinutes: TimeOption;
  servings: number;
  mealType: MealType;
  difficulty: Difficulty;
  goal: Goal;
  diets: Diet[];
  allergens: string;
  extras: IngredientInput[];
  variation: number;
  avoidNames: string[];
};

export type RecipeIngredient = {
  id?: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  available: boolean;
  assumed: boolean;
};

export type RecipeStep = {
  step: number;
  instruction: string;
  duration: number;
};

export type Nutrition = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type GeneratedRecipe = {
  name: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: Difficulty;
  ingredients: RecipeIngredient[];
  equipment: EquipmentId[];
  steps: RecipeStep[];
  nutrition: Nutrition;
  usagePercent: number;
  assumptions: string[];
  imageUrl: string;
  mealType: MealType;
  goal: Goal;
  source: "ai" | "fallback" | "example";
  notice: string | null;
  exampleKey?: string | null;
};

export type RecipeDTO = GeneratedRecipe & {
  id: string;
  isExample: boolean;
  isFavorite: boolean;
  createdAt: string;
  request: GenerateInput | null;
};
