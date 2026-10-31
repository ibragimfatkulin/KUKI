const RULES: { re: RegExp; reason: string }[] = [
  { re: /просроч/i, reason: "срок годности уже вышел" },
  { re: /испорч/i, reason: "есть признаки порчи" },
  { re: /протух|тухл/i, reason: "запах порчи" },
  { re: /плесен|плесень/i, reason: "плесень" },
  { re: /запах/i, reason: "подозрительный запах" },
  { re: /воня/i, reason: "запах порчи" },
  { re: /ослиз|слизь/i, reason: "слизь на продукте" },
  { re: /прогорк/i, reason: "прогорклый вкус или запах" },
  { re: /вздут/i, reason: "упаковка вздулась" },
  { re: /прокис/i, reason: "продукт прокис" },
  { re: /стар(?:ая|ое|ый|ые)\s+/i, reason: "продукт описан как старый" },
  { re: /зелен(?:ый|ая|ое)\s+нал[её]т/i, reason: "налёт на продукте" },
  { re: /подозрительн/i, reason: "продукт вызывает сомнение" },
];

export type UnsafeHit = { name: string; reason: string };

export function findUnsafeIngredients(items: { name: string }[]): UnsafeHit[] {
  const hits: UnsafeHit[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const name = item.name.trim();
    if (!name) continue;
    const rule = RULES.find((entry) => entry.re.test(name));
    const key = name.toLowerCase();
    if (rule && !seen.has(key)) {
      seen.add(key);
      hits.push({ name, reason: rule.reason });
    }
  }
  return hits;
}

export const UNSAFE_MESSAGE =
  "Похоже, среди продуктов есть испорченные. Нагрев не сделает их безопасными — уберите их из списка.";
