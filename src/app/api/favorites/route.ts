import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toRecipeDTO } from "@/lib/recipe-store";
import { ensureUser, jsonWithUser } from "@/lib/session";
import { z } from "zod";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user, setCookie } = await ensureUser();
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: { recipe: { include: { ingredients: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonWithUser(
      { items: favorites.map((item) => ({ id: item.id, createdAt: item.createdAt.toISOString(), recipe: toRecipeDTO(item.recipe, true) })) },
      user.id,
      setCookie,
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { recipeId } = z.object({ recipeId: z.string().min(1) }).parse(await request.json());
    const { user, setCookie } = await ensureUser();
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      return jsonWithUser({ error: "not_found", message: "Рецепт не найден.", details: null }, user.id, setCookie, 404);
    }
    await prisma.favorite.upsert({
      where: { userId_recipeId: { userId: user.id, recipeId } },
      update: {},
      create: { userId: user.id, recipeId },
    });
    return jsonWithUser({ ok: true }, user.id, setCookie);
  } catch (error) {
    return toErrorResponse(error);
  }
}
