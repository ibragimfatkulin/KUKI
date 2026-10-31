import { equipmentViolations, hasHeat, pickMethod, stoveKind, type CookMethod, type StoveKind } from "./equipment";
import { classifyFood, DietConflictError, ingredientsNeedingHeat, splitByDiet, type FoodRole } from "./food";
import { formatQty, joinRu } from "./format";
import { pickImage } from "./images";
import { estimateNutrition } from "./nutrition";
import { allocateTime } from "./time";
import type { GenerateInput, GeneratedRecipe, IngredientInput } from "./types";

type ResolvedIngredient = {
  name: string;
  quantity: number | null;
  unit: string | null;
  available: boolean;
  assumed: boolean;
  role: FoodRole;
};

const METHOD_SUFFIX: Record<CookMethod, string[]> = {
  microwave: ["из микроволновки", "в одной миске", "домашний прогрев"],
  oven: ["из духовки", "к столу из духовки", "домашняя форма"],
  stovetop: ["со сковороды", "на плите", "домашний вариант"],
  grill: ["с гриля", "на решётке", "гриль дома"],
  airfryer: ["из аэрогриля", "в аэрогриле", "хрустящая корзинка"],
  multicooker: ["из мультиварки", "в одной чаше", "домашняя мультиварка"],
  nocook: ["без готовки", "свежая тарелка", "сразу к столу"],
};

function roundAmount(value: number) {
  if (value >= 10) return Math.max(1, Math.round(value));
  return Math.max(1, Math.round(value * 2) / 2);
}

function defaultAmount(name: string, role: FoodRole, servings: number, goal: GenerateInput["goal"], vague: boolean) {
  const scale = (vague ? 0.5 : 1) * (goal === "low_calorie" && (role === "fat" || role === "dairy" || role === "sauce") ? 0.75 : 1);
  const proteinScale = goal === "high_protein" && role === "protein" ? 1.2 : 1;
  if (/чеснок/.test(name.toLowerCase())) {
    return { quantity: Math.max(1, Math.round((servings / 2) * scale)), unit: "зубчик" };
  }
  if (role === "protein" && /яйц/.test(name.toLowerCase())) {
    return { quantity: Math.max(1, Math.round(servings * scale)), unit: "шт" };
  }
  if (role === "protein") return { quantity: roundAmount(150 * servings * scale * proteinScale), unit: "г" };
  if (role === "carb" && /хлеб|лаваш/.test(name.toLowerCase())) {
    return { quantity: Math.max(1, Math.round(servings * scale)), unit: "шт" };
  }
  if (role === "carb") return { quantity: roundAmount(70 * servings * scale), unit: "г" };
  if (role === "veg" && /помидор|огурец|перец|яблок|банан|авокадо/.test(name.toLowerCase())) {
    return { quantity: Math.max(1, Math.round(servings * scale)), unit: "шт" };
  }
  if (role === "veg") return { quantity: roundAmount(80 * servings * scale), unit: "г" };
  if (role === "dairy" || role === "sauce") return { quantity: roundAmount(30 * servings * scale), unit: "г" };
  if (role === "fat") return { quantity: Math.max(1, Math.round(servings * scale)), unit: "ст. л." };
  if (role === "aromatic") return { quantity: 1, unit: "щепотка" };
  return { quantity: roundAmount(50 * servings * scale), unit: "г" };
}

function resolveIngredient(item: IngredientInput, input: GenerateInput, available: boolean): ResolvedIngredient {
  const role = classifyFood(item.name);
  if (item.quantity != null && item.quantity > 0) {
    return {
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      available,
      assumed: false,
      role,
    };
  }
  const fallback = defaultAmount(item.name, role, input.servings, input.goal, Boolean(item.vague));
  return {
    name: item.name,
    quantity: fallback.quantity,
    unit: item.unit ?? fallback.unit,
    available,
    assumed: true,
    role,
  };
}

function describe(items: ResolvedIngredient[]) {
  const names = items.slice(0, 6).map((item) => item.name.toLowerCase());
  if (items.length > 6) names.push("остальные продукты");
  return joinRu(names);
}

function methodPhrase(method: CookMethod, stove: StoveKind) {
  if (method === "microwave") return "микроволновка";
  if (method === "oven") return "духовка";
  if (method === "grill") return "гриль";
  if (method === "airfryer") return "аэрогриль";
  if (method === "multicooker") return "мультиварка";
  if (method === "nocook") return "холодная сборка";
  if (stove === "gas") return "газовая плита";
  if (stove === "electric") return "электрическая плита";
  return "плита";
}

function buildName(items: ResolvedIngredient[], method: CookMethod, input: GenerateInput) {
  const available = items.filter((item) => item.available);
  const protein = available.find((item) => item.role === "protein");
  const cheese = available.find((item) => /сыр/.test(item.name.toLowerCase()));
  const second = available.find((item) => item !== protein && item !== cheese && ["veg", "carb", "dairy"].includes(item.role));
  const main = protein ?? available[0] ?? items[0];
  const suffix = METHOD_SUFFIX[method][input.variation % METHOD_SUFFIX[method].length];
  let name =
    cheese && protein && method !== "nocook" && input.variation % 2 === 0
      ? `${protein.name} под сырной шапкой`
      : second
        ? `${main.name} и ${second.name.toLowerCase()}`
        : main.name;
  name = `${name} — ${suffix}`;
  if (input.avoidNames.some((avoid) => avoid.trim().toLowerCase() === name.toLowerCase())) {
    name = `${name} (${input.variation + 2})`;
  }
  return name;
}

function doneness(items: ResolvedIngredient[]) {
  const risky = items.some((item) => {
    const name = item.name.toLowerCase();
    if (/тунец|колбас|сосиск|ветчин|консерв/.test(name)) return false;
    return /курин|куриц|индей|говяд|свин|фарш|рыб|лосос|кревет|мяс|утк|яйц|бекон/.test(name);
  });
  return risky ? " Птица, мясо, рыба и яйца должны полностью приготовиться: без розового цвета и сырого белка." : "";
}

function buildSteps(method: CookMethod, stove: StoveKind, items: ResolvedIngredient[], input: GenerateInput) {
  const chop = items.filter((item) => ["protein", "veg", "carb", "aromatic"].includes(item.role));
  const finish = items.filter((item) => ["dairy", "sauce", "fat"].includes(item.role));
  const base = chop.length > 0 ? chop : items;
  const baseText = describe(base);
  const finishText = finish.length > 0 ? describe(finish) : "";
  const ready = doneness(items);
  const steps: { text: string; weight: number }[] = [];

  if (method === "microwave") {
    steps.push(
      { text: `Нарежьте небольшими кусочками: ${baseText}. Сложите всё в глубокую посуду для микроволновки.`, weight: 3 },
      {
        text: finishText
          ? `Добавьте: ${finishText}. Перемешайте и накройте крышкой или тарелкой.`
          : "Перемешайте продукты и накройте посуду крышкой или тарелкой.",
        weight: 2,
      },
      {
        text: `Поставьте посуду в микроволновку. Готовьте короткими циклами и перемешайте на середине. Общее время около выбранного лимита.${ready} Не оставляйте прибор без присмотра.`,
        weight: 6,
      },
    );
  } else if (method === "oven") {
    steps.push(
      { text: `Нарежьте: ${baseText}.`, weight: 3 },
      {
        text: finishText
          ? `Выложите продукты в форму для духовки и добавьте: ${finishText}.`
          : "Выложите продукты в форму для духовки.",
        weight: 2,
      },
      { text: `Готовьте в духовке при 180 °C, пока всё не станет мягким и горячим внутри.${ready}`, weight: 6 },
    );
  } else if (method === "stovetop") {
    const stoveName = stove === "gas" ? "газовую плиту" : stove === "electric" ? "электрическую плиту" : "плиту";
    steps.push(
      { text: `Нарежьте: ${baseText}.`, weight: 3 },
      { text: `Включите ${stoveName} и прогрейте сковороду.`, weight: 2 },
      {
        text: `Выложите продукты${finishText ? ` и добавьте: ${finishText}` : ""}. Обжаривайте, помешивая, до мягкости.${ready}`,
        weight: 6,
      },
    );
  } else if (method === "grill") {
    steps.push(
      { text: `Нарежьте крупными кусками: ${baseText}.`, weight: 3 },
      { text: "Разогрейте гриль.", weight: 2 },
      { text: `Выложите продукты на решётку и готовьте, один раз перевернув.${ready}`, weight: 6 },
    );
  } else if (method === "airfryer") {
    steps.push(
      { text: `Нарежьте и обсушите: ${baseText}.`, weight: 3 },
      { text: "Выложите продукты в корзину аэрогриля одним слоем.", weight: 2 },
      { text: `Готовьте в аэрогриле при 180 °C. На середине встряхните корзину.${ready}`, weight: 6 },
    );
  } else if (method === "multicooker") {
    steps.push(
      { text: `Нарежьте: ${baseText}.`, weight: 3 },
      {
        text: finishText
          ? `Сложите всё в чашу мультиварки и добавьте: ${finishText}.`
          : "Сложите продукты в чашу мультиварки.",
        weight: 2,
      },
      { text: `Закройте крышку и включите режим «Тушение».${ready}`, weight: 6 },
    );
  } else {
    steps.push(
      { text: `Промойте и нарежьте: ${baseText}.`, weight: 4 },
      {
        text: finishText ? `Добавьте: ${finishText}. Смешайте в миске.` : "Смешайте продукты в миске.",
        weight: 3,
      },
      { text: "Разложите по тарелкам и подавайте сразу.", weight: 2 },
    );
  }

  if (input.difficulty !== "easy") {
    steps.push({
      text:
        method === "nocook"
          ? "Попробуйте заправку и при необходимости добавьте то, что уже есть дома."
          : "Проверьте середину самого толстого куска и только после этого подавайте.",
      weight: 2,
    });
  }
  if (input.difficulty === "hard" && method !== "nocook") {
    steps.splice(1, 0, {
      text: "Крупные куски сделайте одинаковыми, чтобы они приготовились одновременно.",
      weight: 2,
    });
  }

  const durations = allocateTime(
    steps.map((step) => step.weight),
    input.timeMinutes,
  );
  return steps.map((step, index) => ({
    step: index + 1,
    instruction: step.text,
    duration: durations[index] ?? 1,
  }));
}

function pickMissing(usable: ResolvedIngredient[], input: GenerateInput): IngredientInput | null {
  const hasBase = usable.some((item) => ["protein", "carb", "veg", "dairy"].includes(item.role));
  const needsProtein = input.goal === "high_protein" && !usable.some((item) => item.role === "protein");
  if (hasBase && !needsProtein) return null;

  const extras = splitByDiet(input.extras, input.diets, input.allergens).usable;
  const extraProtein = extras.find((item) => classifyFood(item.name) === "protein");
  if (extraProtein) return extraProtein;
  if (extras[0] && !hasBase) return extras[0];

  const eggFree = input.diets.includes("vegan") || input.diets.includes("egg_free");
  if (needsProtein || !hasBase) {
    if (!eggFree && hasHeat(input.equipment)) return { name: "Яйцо", quantity: null, unit: "шт" };
    if (!input.diets.includes("gluten_free") && !hasHeat(input.equipment)) return { name: "Хлеб", quantity: null, unit: "шт" };
    if (hasHeat(input.equipment)) return { name: "Нут", quantity: null, unit: "г" };
    return { name: "Помидор", quantity: null, unit: "шт" };
  }
  return null;
}

export function composeRecipe(input: GenerateInput): GeneratedRecipe {
  if (!hasHeat(input.equipment)) {
    const raw = ingredientsNeedingHeat(input.ingredients);
    if (raw.length > 0) {
      const error = new DietConflictError(
        `Без нагрева нельзя готовить: ${joinRu(raw)}. Выберите технику с нагревом или уберите эти продукты.`,
      );
      error.code = "needs_heat";
      throw error;
    }
  }

  const { usable, excluded } = splitByDiet(input.ingredients, input.diets, input.allergens);
  if (usable.length === 0) {
    throw new DietConflictError("Выбранные ограничения исключают все продукты. Измените диету или список.");
  }

  const resolved = usable.map((item) => resolveIngredient(item, input, true));
  const missingInput = pickMissing(resolved, input);
  const missing = missingInput ? [resolveIngredient(missingInput, input, false)] : [];
  const items = [...resolved, ...missing];
  const method = pickMethod(input.equipment, input.variation);
  const stove = stoveKind(input.equipment);
  const steps = buildSteps(method, stove, items, input);
  const assumptions = [
    ...items
      .filter((item) => item.assumed)
        .map((item) => `Для «${item.name}» точное количество не указано — взяли примерно ${formatQty(item.quantity, item.unit)}.`),
    "Калории, белки, жиры и углеводы ориентировочные.",
  ];
  if (excluded.length > 0) {
    assumptions.push(`Из списка убраны продукты под ограничение: ${joinRu(excluded.map((item) => item.name))}.`);
  }
  if (missing.length > 0) {
    assumptions.push("Дополнительный продукт не считается тем, что уже лежит дома.");
  }
  if (input.goal === "low_calorie") {
    assumptions.push("Для низкокалорийной цели не увеличивали жирные продукты сверх вашего списка.");
  }
  if (input.goal === "high_protein") {
    assumptions.push("В блюде сделан упор на белковые продукты.");
  }

  const description = `Собрали из того, что уже есть: ${describe(resolved)}. Готовить будем так: ${methodPhrase(method, stove)}.`;
  const problems = equipmentViolations([{ instruction: description }, ...steps], input.equipment);
  if (problems.length > 0) {
    throw new Error(`Рецепт задел запрещённую технику: ${problems.join(", ")}`);
  }

  return {
    name: buildName(items, method, input),
    description,
    cookingTime: input.timeMinutes,
    servings: input.servings,
    difficulty: input.difficulty,
    ingredients: items.map(({ role: _role, ...item }) => item),
    equipment: input.equipment.filter((item, index, list) => list.indexOf(item) === index),
    steps,
    nutrition: estimateNutrition(items, input.servings),
    usagePercent: Math.round((resolved.length / input.ingredients.length) * 100),
    assumptions,
    imageUrl: pickImage(items.map((item) => item.name), input.mealType, method),
    mealType: input.mealType,
    goal: input.goal,
    source: "fallback",
    notice: null,
  };
}
