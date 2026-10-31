import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ensureUser, jsonWithUser } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { user, setCookie } = await ensureUser();
    await prisma.generationHistory.deleteMany({ where: { id, userId: user.id } });
    return jsonWithUser({ ok: true }, user.id, setCookie);
  } catch (error) {
    return toErrorResponse(error);
  }
}
