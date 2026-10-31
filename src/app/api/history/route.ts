import { EQUIPMENT_LABEL } from "@/lib/format";
import { toErrorResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { ensureUser, jsonWithUser } from "@/lib/session";
import type { EquipmentId } from "@/lib/types";
import { parseJson } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user, setCookie } = await ensureUser();
    const history = await prisma.generationHistory.findMany({
      where: { userId: user.id },
      include: { recipe: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return jsonWithUser(
      {
        items: history.map((item) => {
          const equipment = parseJson<EquipmentId[]>(item.equipment, []);
          return {
            id: item.id,
            createdAt: item.createdAt.toISOString(),
            ingredients: parseJson<{ name: string }[]>(item.inputIngredients, []),
            equipment: equipment.map((id) => EQUIPMENT_LABEL[id] ?? id),
            recipe: item.recipe
              ? {
                  id: item.recipe.id,
                  name: item.recipe.name,
                  imageUrl: item.recipe.imageUrl,
                  cookingTime: item.recipe.cookingTime,
                  isExample: item.recipe.isExample,
                }
              : null,
          };
        }),
      },
      user.id,
      setCookie,
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
