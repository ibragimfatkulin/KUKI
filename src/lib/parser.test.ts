import assert from "node:assert/strict";
import test from "node:test";
import { parseIngredientText } from "./parser";

test("parses quantities with units", () => {
  const parsed = parseIngredientText("Куриное филе — 300 г\nСыр — 100 г\nПомидор — 2 шт.\nСметана — 3 столовые ложки\nЧеснок — 2 зубчика");
  assert.deepEqual(
    parsed.map((item) => [item.name, item.quantity, item.unit]),
    [
      ["Куриное филе", 300, "г"],
      ["Сыр", 100, "г"],
      ["Помидор", 2, "шт"],
      ["Сметана", 3, "ст. л."],
      ["Чеснок", 2, "зубчик"],
    ],
  );
});

test("parses a spoken sentence", () => {
  const parsed = parseIngredientText("У меня есть курица, сыр, два помидора, сметана и немного чеснока");
  assert.equal(parsed.length, 5);
  assert.equal(parsed[0].name, "Курица");
  assert.equal(parsed[2].name, "Помидор");
  assert.equal(parsed[2].quantity, 2);
  assert.equal(parsed[2].unit, "шт");
  assert.equal(parsed[4].name, "Чеснок");
  assert.equal(parsed[4].vague, true);
  assert.equal(parsed[4].quantity, null);
});
