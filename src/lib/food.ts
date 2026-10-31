import type { Diet, IngredientInput } from "./types";

export type FoodRole = "protein" | "dairy" | "carb" | "veg" | "aromatic" | "sauce" | "fat" | "other";

const ROLE_RULES: { role: FoodRole; re: RegExp }[] = [
  { role: "aromatic", re: /чеснок|укроп|петруш|базилик|кинза|зелень|имбир|лавровый|чёрный перец|черный перец|паприк|специ/i },
  { role: "sauce", re: /майонез|кетчуп|горчиц|соус|томатная паста/i },
  { role: "fat", re: /растительное масло|оливковое масло|сливочное масло|масло/i },
  { role: "protein", re: /курин|куриц|индей|говяд|свин|фарш|рыб|лосос|тунец|кревет|яйц|тофу|(^|[^а-яё])нут([^а-яё]|$)|чечев|фасол|бекон|ветчин|колбас|сосиск|мяс|утк|баранин/i },
  { role: "dairy", re: /сыр|моцарел|фета|пармезан|творог|сметан|йогурт|кефир|молок|сливк/i },
  { role: "carb", re: /рис|греч|макарон|паста|спагет|овсян|хлеб|лаваш|картоф|мука|булгур|киноа|лапша|булк/i },
  { role: "veg", re: /помидор|томат|огурец|перец|лук|морков|кабач|баклаж|капуст|броккол|шпинат|салат|гриб|кукуруз|горох|горош|свекл|редис|авокадо|тыкв/i },
];

const MEAT = /курин|куриц|индей|говяд|свин|фарш|бекон|мяс|утк|баранин/;
const FISH = /рыб|лосос|тунец|кревет|селед|треск|минтай/;
const DAIRY = /сыр|молок|сметан|йогурт|кефир|сливк|творог|моцарел|фета|пармезан|сливочн/;
const EGG = /яйц/;
const GLUTEN = /хлеб|мука|макарон|паста|спагет|лаваш|пшени|булк|сухар|лапша/;
const NUT = /орех|миндал|фундук|арахис|кешью|грецк/;
const NEEDS_HEAT = /курин|куриц|индей|говяд|свин|фарш|рыб|лосос|кревет|мяс|утк|баранин|яйц|бекон/;
const READY_TO_EAT = /консерв|копчен|варён|варен|ветчин|колбас|сосиск|тунец/;

const ALLERGEN_GROUPS: { keys: string[]; re: RegExp }[] = [
  { keys: ["молоко", "лактоза", "молоч"], re: DAIRY },
  { keys: ["глютен", "пшениц"], re: GLUTEN },
  { keys: ["орех", "арахис"], re: NUT },
  { keys: ["яйц"], re: EGG },
  { keys: ["рыба", "морепродукт"], re: FISH },
];

export class DietConflictError extends Error {
  code = "diet_conflict";

  constructor(message: string) {
    super(message);
    this.name = "DietConflictError";
  }
}

export function classifyFood(name: string): FoodRole {
  for (const rule of ROLE_RULES) {
    if (rule.re.test(name)) return rule.role;
  }
  return "other";
}

export function dietConflict(name: string, diets: Diet[], allergens: string) {
  const normalized = name.toLowerCase();
  if (diets.includes("vegan") && (MEAT.test(normalized) || FISH.test(normalized) || DAIRY.test(normalized) || EGG.test(normalized) || /мёд|мед\b/.test(normalized))) {
    return "веганское питание";
  }
  if (diets.includes("vegetarian") && (MEAT.test(normalized) || FISH.test(normalized))) {
    return "вегетарианское питание";
  }
  if (diets.includes("gluten_free") && GLUTEN.test(normalized)) return "меню без глютена";
  if (diets.includes("lactose_free") && DAIRY.test(normalized)) return "меню без лактозы";
  if (diets.includes("nut_free") && NUT.test(normalized)) return "исключение орехов";
  if (diets.includes("egg_free") && EGG.test(normalized)) return "исключение яиц";
  if (diets.includes("fish_free") && FISH.test(normalized)) return "исключение рыбы";

  const tokens = allergens
    .split(/[,;]/)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length > 1);

  for (const token of tokens) {
    const group = ALLERGEN_GROUPS.find((item) => item.keys.some((key) => token.includes(key)));
    if (group?.re.test(normalized) || normalized.includes(token)) return `аллерген «${token}»`;
  }
  return null;
}

export function splitByDiet(items: IngredientInput[], diets: Diet[], allergens: string) {
  const usable: IngredientInput[] = [];
  const excluded: { name: string; reason: string }[] = [];
  for (const item of items) {
    const reason = dietConflict(item.name, diets, allergens);
    if (reason) excluded.push({ name: item.name, reason });
    else usable.push(item);
  }
  return { usable, excluded };
}

export function ingredientsNeedingHeat(items: { name: string }[]) {
  return items
    .filter((item) => {
      const normalized = item.name.toLowerCase();
      if (READY_TO_EAT.test(normalized)) return false;
      return NEEDS_HEAT.test(normalized);
    })
    .map((item) => item.name);
}
