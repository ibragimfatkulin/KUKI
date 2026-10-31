import { SUGGESTIONS } from "./catalog";
import type { IngredientInput } from "./types";

const UNIT_PATTERN =
  /^(килограмм(?:а|ов)?|кг|грамм(?:а|ов)?|гр\.?|г|миллилитр(?:а|ов)?|мл|литр(?:а|ов)?|л|штук[аи]?|шт\.?|столовых\s+ложек|столовые\s+ложки|столовая\s+ложка|ст\.?\s*л\.?|чайных\s+ложек|чайные\s+ложки|чайная\s+ложка|ч\.?\s*л\.?|зубчиков|зубчика|зубчик|пучка|пучок|щепотку|щепотка|стаканов|стакана|стакан|банку|банки|банка)(?=\s|$)/i;

const WORD_NUMBERS: Record<string, number> = {
  один: 1,
  одна: 1,
  одно: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  пару: 2,
  пара: 2,
  несколько: 3,
};

const NAME_RULES: [RegExp, string][] = [
  [/^(куриное|куриного|куриным|курином)\s+филе$/, "куриное филе"],
  [/^куриц[аыуеой]+$/, "курица"],
  [/^помидор[а-я]*$/, "помидор"],
  [/^огурц[а-я]*$/, "огурец"],
  [/^яйц[а-я]*$/, "яйцо"],
  [/^яиц$/, "яйцо"],
  [/^сыр[аоуем]*$/, "сыр"],
  [/^сметан[а-я]*$/, "сметана"],
  [/^чеснок[а-я]*$/, "чеснок"],
  [/^лук[аеуом]*$/, "лук"],
  [/^морков[а-я]*$/, "морковь"],
  [/^картоф[а-я]*$/, "картофель"],
  [/^рис[аеу]?$/, "рис"],
  [/^гречк[а-я]*$/, "гречка"],
  [/^макарон[а-я]*$/, "макароны"],
];

const STOP_WORDS = new Set(["есть", "дома", "еще", "ещё", "только", "просто", "немного", "уже"]);

export function canonUnit(raw: string) {
  const value = raw.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  if (value.startsWith("кг") || value.startsWith("кило")) return "кг";
  if (value.startsWith("г")) return "г";
  if (value.startsWith("мл") || value.startsWith("милли")) return "мл";
  if (value === "л" || value.startsWith("литр")) return "л";
  if (value.startsWith("шт") || value.startsWith("штук")) return "шт";
  if (value.startsWith("ст") || value.startsWith("стол")) return "ст. л.";
  if (value.startsWith("ч") || value.startsWith("чайн")) return "ч. л.";
  if (value.startsWith("зуб")) return "зубчик";
  if (value.startsWith("пуч")) return "пучок";
  if (value.startsWith("щеп")) return "щепотка";
  if (value.startsWith("стак")) return "стакан";
  if (value.startsWith("бан")) return "банка";
  return raw.trim();
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function cleanName(raw: string) {
  let value = raw
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/^(немного|чуть-чуть|чуть)\s+/, "")
    .replace(/[.«»"!(),]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!value || STOP_WORDS.has(value)) return "";
  for (const [pattern, name] of NAME_RULES) {
    if (pattern.test(value)) value = name;
  }
  const known = SUGGESTIONS.find((item) => item.toLowerCase() === value);
  if (known) return known;
  if (!/[а-яa-z]/i.test(value) || value.length < 2) return "";
  return titleCase(value);
}

function consumeUnit(text: string) {
  const match = UNIT_PATTERN.exec(text.trim());
  if (!match) return null;
  return {
    unit: canonUnit(match[1]),
    rest: text.trim().slice(match[0].length).trim(),
  };
}

function parseQuantityPrefix(text: string) {
  const match = text.trim().match(/^(\d+(?:[.,]\d+)?)(?:\s+(.*))?$/);
  if (!match) return null;
  const quantity = Number(match[1].replace(",", "."));
  const rest = (match[2] ?? "").trim();
  if (!rest) return { quantity, unit: null as string | null, name: "" };
  const unit = consumeUnit(rest);
  if (unit) return { quantity, unit: unit.unit, name: cleanName(unit.rest) };
  return { quantity, unit: /[а-яёa-z]/i.test(rest) ? "шт" : null, name: cleanName(rest) };
}

function parseChunk(chunk: string): IngredientInput | null {
  const normalized = chunk.replace(/\s*[—–-]\s*/g, " - ").replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const vague = /^(немного|чуть-чуть|чуть)\s+/i.test(normalized);
  const dash = normalized.match(/^(.+?)\s+-\s+(.+)$/);
  if (dash && /^\d/.test(dash[2])) {
    const quantity = parseQuantityPrefix(dash[2]);
    const name = cleanName(quantity?.name ? `${dash[1]} ${quantity.name}` : dash[1]);
    if (!name) return null;
    return { name, quantity: quantity?.quantity ?? null, unit: quantity?.unit ?? null, vague };
  }

  const word = normalized.match(/^(один|одна|одно|два|две|три|четыре|пять|пару|пара|несколько)\s+(.+)$/i);
  if (word) {
    const amount = WORD_NUMBERS[word[1].toLowerCase()];
    const unit = consumeUnit(word[2]);
    if (unit?.rest) {
      return { name: cleanName(unit.rest), quantity: amount, unit: unit.unit, vague: false };
    }
    const name = cleanName(word[2]);
    if (!name) return null;
    return { name, quantity: amount, unit: "шт", vague: word[1].toLowerCase() === "несколько" };
  }

  if (vague) {
    const name = cleanName(normalized);
    return name ? { name, quantity: null, unit: null, vague: true } : null;
  }

  const leading = parseQuantityPrefix(normalized);
  if (leading?.name) {
    return { name: leading.name, quantity: leading.quantity, unit: leading.unit, vague: false };
  }

  const name = cleanName(normalized);
  return name ? { name, quantity: null, unit: null, vague: false } : null;
}

function splitChunks(text: string) {
  const cleaned = text
    .replace(/[«»"]/g, " ")
    .replace(/у меня есть/gi, " ")
    .replace(/в холодильнике/gi, " ")
    .replace(/имеется/gi, " ")
    .trim();
  const chunks: string[] = [];
  for (const line of cleaned.split(/[\n;]+/)) {
    for (const part of line.split(",")) {
      for (const piece of part.split(/\s+и\s+/i)) {
        const value = piece.trim().replace(/^[-–—]\s*/, "");
        if (value) chunks.push(value);
      }
    }
  }
  return chunks;
}

export function parseIngredientText(text: string): IngredientInput[] {
  const parsed = splitChunks(text)
    .map(parseChunk)
    .filter((item): item is IngredientInput => Boolean(item));
  if (parsed.length > 0) return parsed;
  const single = parseChunk(text);
  return single ? [single] : [];
}

export function looksLikeSentence(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length >= 5 || text.includes(",") || /\sи\s/i.test(text);
}
