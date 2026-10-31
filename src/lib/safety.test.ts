import assert from "node:assert/strict";
import test from "node:test";
import { findUnsafeIngredients } from "./safety";

test("flags spoiled food and leaves fresh food alone", () => {
  const hits = findUnsafeIngredients([
    { name: "старая сметана" },
    { name: "просроченное мясо" },
    { name: "запах у курицы" },
    { name: "Сметана" },
    { name: "стакан молока" },
  ]);
  assert.deepEqual(
    hits.map((item) => item.name),
    ["старая сметана", "просроченное мясо", "запах у курицы"],
  );
});
