import assert from "node:assert/strict";
import test from "node:test";
import { equipmentViolations } from "./equipment";

test("microwave-only recipe cannot fry or bake", () => {
  const problems = equipmentViolations(
    [{ instruction: "Обжарьте курицу на сковороде и запеките в духовке." }],
    ["microwave"],
  );
  assert.ok(problems.includes("плита"));
  assert.ok(problems.includes("духовка"));
  assert.ok(problems.includes("жарка"));
});

test("gas stove text does not complain about a skillet", () => {
  const problems = equipmentViolations(
    [{ instruction: "Прогрейте сковороду на газовой плите." }],
    ["gas_stove"],
  );
  assert.deepEqual(problems, []);
});
