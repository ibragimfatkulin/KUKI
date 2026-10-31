import { generateRecipe } from "@/lib/generate";
import { toErrorResponse } from "@/lib/http";
import { saveRecipe } from "@/lib/recipe-store";
import { ensureUser, jsonWithUser } from "@/lib/session";
import { generateInputSchema, toGenerateInput } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = toGenerateInput(generateInputSchema.parse(await request.json()));
    const recipe = await generateRecipe(input);
    const { user, setCookie } = await ensureUser();
    const saved = await saveRecipe(user.id, recipe, input);
    return jsonWithUser({ recipe: saved }, user.id, setCookie);
  } catch (error) {
    return toErrorResponse(error);
  }
}
