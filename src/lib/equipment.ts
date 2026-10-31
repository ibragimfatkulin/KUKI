import type { EquipmentId } from "./types";

export type CookMethod = "microwave" | "oven" | "stovetop" | "multicooker" | "airfryer" | "grill" | "nocook";

export function allowedMethods(equipment: EquipmentId[]) {
  const methods = new Set<CookMethod>();
  for (const item of equipment) {
    if (item === "microwave") methods.add("microwave");
    if (item === "oven") methods.add("oven");
    if (item === "gas_stove" || item === "electric_stove") methods.add("stovetop");
    if (item === "multicooker") methods.add("multicooker");
    if (item === "airfryer") methods.add("airfryer");
    if (item === "grill") methods.add("grill");
  }
  if (methods.size === 0) methods.add("nocook");
  return methods;
}

export function hasHeat(equipment: EquipmentId[]) {
  return [...allowedMethods(equipment)].some((method) => method !== "nocook");
}

export function pickMethod(equipment: EquipmentId[], variation = 0): CookMethod {
  const available = [...allowedMethods(equipment)];
  return available[variation % available.length] ?? "nocook";
}

export type StoveKind = "gas" | "electric" | "any";

export function stoveKind(equipment: EquipmentId[]): StoveKind {
  const gas = equipment.includes("gas_stove");
  const electric = equipment.includes("electric_stove");
  if (gas && !electric) return "gas";
  if (electric && !gas) return "electric";
  return "any";
}

export function equipmentViolations(steps: { instruction: string }[], equipment: EquipmentId[]) {
  const allowed = allowedMethods(equipment);
  const text = steps.map((step) => step.instruction).join("\n");
  const problems: string[] = [];
  const checks: { method: CookMethod; re: RegExp; label: string }[] = [
    { method: "microwave", re: /микроволнов/i, label: "микроволновка" },
    { method: "oven", re: /духов|запек/i, label: "духовка" },
    { method: "stovetop", re: /сковор|кастрюл|(^|[^а-яё])плит/i, label: "плита" },
    { method: "grill", re: /(?<!аэро)грил/i, label: "гриль" },
    { method: "airfryer", re: /аэрогриль/i, label: "аэрогриль" },
    { method: "multicooker", re: /мультивар/i, label: "мультиварка" },
  ];

  for (const check of checks) {
    if (!allowed.has(check.method) && check.re.test(text)) problems.push(check.label);
  }

  const heat = [...allowed].some((method) => method !== "nocook");
  if (!heat && /жарь|обжар|вари|кипят|запек|духов|микроволн|сковор|аэрогриль|мультивар|грил|нагре/i.test(text)) {
    problems.push("нагрев");
  }
  if (!allowed.has("stovetop") && !allowed.has("grill") && !allowed.has("airfryer") && /жарь|обжар/i.test(text)) {
    problems.push("жарка");
  }
  if (allowed.has("stovetop") && equipment.includes("gas_stove") && !equipment.includes("electric_stove") && /электрическ/i.test(text)) {
    problems.push("электрическая плита");
  }
  if (allowed.has("stovetop") && equipment.includes("electric_stove") && !equipment.includes("gas_stove") && /газов/i.test(text)) {
    problems.push("газовая плита");
  }
  return [...new Set(problems)];
}
