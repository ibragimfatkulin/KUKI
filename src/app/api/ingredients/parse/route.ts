import { hasAiKey, requestIngredientsFromModel } from "@/lib/ai";
import { toErrorResponse } from "@/lib/http";
import { looksLikeSentence, parseIngredientText } from "@/lib/parser";
import { findUnsafeIngredients } from "@/lib/safety";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseTextSchema } from "@/lib/validators";

export const runtime = "nodejs";

const modelSchema = z.object({
  ingredients: z.array(
    z.object({
      name: z.string(),
      quantity: z.number().nullable().optional(),
      unit: z.string().nullable().optional(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const { text } = parseTextSchema.parse(await request.json());
    if (hasAiKey() && looksLikeSentence(text)) {
      try {
        const raw = await requestIngredientsFromModel(text);
        const parsed = modelSchema.safeParse(raw);
        if (parsed.success) {
          const ingredients = parsed.data.ingredients
            .map((item) => ({
              name: item.name.trim(),
              quantity: item.quantity ?? null,
              unit: item.unit?.trim() || null,
            }))
            .filter((item) => item.name.length > 1);
          if (ingredients.length > 0) {
            return NextResponse.json({ ingredients, source: "ai", unsafe: findUnsafeIngredients(ingredients) });
          }
        }
      } catch (error) {
        console.error(error instanceof Error ? error.message : error);
      }
    }

    const ingredients = parseIngredientText(text);
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: "parse_failed", message: "Не удалось найти продукты в этом тексте.", details: null },
        { status: 422 },
      );
    }
    return NextResponse.json({ ingredients, source: "local", unsafe: findUnsafeIngredients(ingredients) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
