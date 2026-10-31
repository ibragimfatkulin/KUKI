import assert from "node:assert/strict";
import test from "node:test";
import { composeRecipe } from "./composer";
import { equipmentViolations } from "./equipment";
import { EXAMPLE_INPUTS } from "./example-inputs";
import type { GenerateInput } from "./types";

function input(patch: Partial<GenerateInput>): GenerateInput {
  return {
    ingredients: [{ name: "Огурец", quantity: 1, unit: "шт" }],
    equipment: ["microwave"],
    timeMinutes: 20,
    servings: 2,
    mealType: "dinner",
    difficulty: "easy",
    goal: "regular",
    diets: [],
    allergens: "",
    extras: [],
    variation: 0,
    avoidNames: [],
    ...patch,
  };
}

test("microwave recipe stays inside the microwave", () => {
  const recipe = composeRecipe(EXAMPLE_INPUTS["microwave-chicken"]);
  const problems = equipmentViolations([{ instruction: recipe.description }, ...recipe.steps], ["microwave"]);
  assert.deepEqual(problems, []);
  assert.equal(recipe.usagePercent, 100);
  assert.equal(recipe.cookingTime, 20);
  assert.equal(
    recipe.steps.reduce((sum, step) => sum + step.duration, 0),
    20,
  );
  assert.ok(recipe.nutrition.calories > 0);
  assert.ok(recipe.nutrition.protein > 0);
  assert.equal(recipe.ingredients.every((item) => item.available), true);
  assert.match(recipe.steps.map((step) => step.instruction).join(" "), /микроволнов/i);
  assert.doesNotMatch(recipe.steps.map((step) => step.instruction).join(" "), /сковор|духов|жарь|обжар|аэрогриль|мультивар/i);
});

test("cold mode refuses raw chicken", () => {
  assert.throws(() =>
    composeRecipe(
      input({
        equipment: ["none"],
        ingredients: [{ name: "Курица", quantity: 200, unit: "г" }],
      }),
    ),
  );
});

test("ten-minute hard recipe still fits the timer", () => {
  const recipe = composeRecipe(
    input({
      timeMinutes: 10,
      difficulty: "hard",
      ingredients: [
        { name: "Яйцо", quantity: 2, unit: "шт" },
        { name: "Сыр", quantity: 30, unit: "г" },
      ],
    }),
  );
  assert.equal(
    recipe.steps.reduce((sum, step) => sum + step.duration, 0),
    10,
  );
  assert.ok(recipe.steps.every((step) => step.duration >= 1));
});
