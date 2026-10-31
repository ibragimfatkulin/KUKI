import { prisma } from "@/lib/prisma";
import { ensureUser, jsonWithUser } from "@/lib/session";
import { toErrorResponse } from "@/lib/http";

export const runtime = "nodejs";

async function sessionResponse() {
  const { user, setCookie } = await ensureUser();
  const [recipes, favorites, history] = await Promise.all([
    prisma.recipe.count({ where: { userId: user.id } }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.generationHistory.count({ where: { userId: user.id } }),
  ]);
  return jsonWithUser(
    {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
      },
      counts: { recipes, favorites, history },
    },
    user.id,
    setCookie,
  );
}

export async function GET() {
  try {
    return await sessionResponse();
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST() {
  return GET();
}
