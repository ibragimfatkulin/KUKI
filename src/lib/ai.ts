import type { GenerateInput } from "./types";

const SYSTEM_PROMPT = `Ты кулинарный помощник. Отвечай только JSON по схеме.
Правила:
- Пиши по-русски.
- Готовь из продуктов пользователя и максимально используй их.
- Не выдумывай точные граммы, если количество не задано: поставь разумную бытовую порцию и assumed=true.
- Если количество задано, сохрани его и поставь assumed=false.
- Не предлагай докупать продукты без нужды. Если без добавки блюдо не собрать, добавь минимум и пометь available=false.
- Рецепт можно готовить только на переданной технике.
- Только микроволновка: никакой сковороды, духовки, гриля, аэрогриля, мультиварки, жарки и варки на плите.
- Без техники: только холодное блюдо, без нагрева.
- Газовая плита без электрической: не пиши про электрическую, и наоборот.
- Не включай испорченные, просроченные, тухлые продукты и продукты с запахом порчи. Нагрев не делает их безопасными.
- Сырую курицу, мясо, рыбу и яйца нельзя подавать холодными.
- Время шагов уложи в запрошенный лимит.
- КБЖУ укажи примерно на одну порцию.
- Название блюда должно быть аппетитным.`;

const RECIPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    recipe_name: { type: "string" },
    description: { type: "string" },
    cooking_time: { type: "integer" },
    servings: { type: "integer" },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: ["number", "null"] },
          unit: { type: ["string", "null"] },
          available: { type: "boolean" },
          assumed: { type: "boolean" },
        },
        required: ["name", "quantity", "unit", "available", "assumed"],
      },
    },
    equipment: { type: "array", items: { type: "string" } },
    steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          step: { type: "integer" },
          instruction: { type: "string" },
          duration: { type: "integer" },
        },
        required: ["step", "instruction", "duration"],
      },
    },
    nutrition: {
      type: "object",
      additionalProperties: false,
      properties: {
        calories: { type: "number" },
        protein: { type: "number" },
        fat: { type: "number" },
        carbs: { type: "number" },
      },
      required: ["calories", "protein", "fat", "carbs"],
    },
    missing_ingredients: { type: "array", items: { type: "string" } },
    available_ingredients_usage: { type: "number" },
    assumptions: { type: "array", items: { type: "string" } },
  },
  required: [
    "recipe_name",
    "description",
    "cooking_time",
    "servings",
    "difficulty",
    "ingredients",
    "equipment",
    "steps",
    "nutrition",
    "missing_ingredients",
    "available_ingredients_usage",
    "assumptions",
  ],
} as const;

export function hasAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function redact(value: string) {
  const key = process.env.OPENAI_API_KEY;
  return key ? value.split(key).join("[key]") : value;
}

function parseContent(content: string) {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "");
  return JSON.parse(trimmed) as unknown;
}

async function postChat(payload: Record<string, unknown>) {
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000),
  });
  if (!response.ok) {
    const body = redact(await response.text());
    throw new Error(`AI ${response.status}: ${body.slice(0, 280)}`);
  }
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Пустой ответ модели");
  return parseContent(content);
}

export async function requestRecipeFromModel(input: GenerateInput, feedback?: string) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify({ request: input, repair: feedback ?? null }) },
  ];
  const basePayload = { model, messages, temperature: 0.7 };
  try {
    return await postChat({
      ...basePayload,
      response_format: {
        type: "json_schema",
        json_schema: { name: "recipe", strict: true, schema: RECIPE_SCHEMA },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("AI 400")) throw error;
    return postChat({
      ...basePayload,
      response_format: { type: "json_object" },
    });
  }
}

export async function requestIngredientsFromModel(text: string) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const data = await postChat({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Извлеки продукты из текста пользователя. Верни JSON {\"ingredients\":[{\"name\":\"\",\"quantity\":null,\"unit\":null}]}. Названия на русском в именительном падеже. Слова о порче оставь в названии. Не выбрасывай продукты.",
      },
      { role: "user", content: text },
    ],
    response_format: { type: "json_object" },
  });
  return data;
}
