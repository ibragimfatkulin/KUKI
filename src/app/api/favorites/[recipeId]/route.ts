import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ensureUser, jsonWithUser } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ recipeId: string }> }) {
  try {
    const { recipeId } = await context.params;
    const { user, setCookie } = await ensureUser();
    await prisma.favorite.deleteMany({ where: { userId: user.id, recipeId } });
    return jsonWithUser({ ok: true }, user.id, setCookie);
  } catch (error) {
    return toErrorResponse(error);
  }
}
