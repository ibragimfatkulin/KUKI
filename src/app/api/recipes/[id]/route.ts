import { toErrorResponse } from "@/lib/http";
import { getRecipeDTO } from "@/lib/recipe-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const recipe = await getRecipeDTO(id);
    if (!recipe) {
      return NextResponse.json({ error: "not_found", message: "Рецепт не найден.", details: null }, { status: 404 });
    }
    return NextResponse.json({ recipe });
  } catch (error) {
    return toErrorResponse(error);
  }
}
