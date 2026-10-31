import { composeRecipe } from "@/lib/composer";
import { EXAMPLE_INPUTS } from "@/lib/example-inputs";
import { toErrorResponse } from "@/lib/http";
import { saveRecipe } from "@/lib/recipe-store";
import { ensureUser, jsonWithUser } from "@/lib/session";
import { exampleKeySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { key } = exampleKeySchema.parse(await request.json());
    const input = EXAMPLE_INPUTS[key];
    const recipe = composeRecipe(input);
    recipe.source = "example";
    recipe.exampleKey = key;
    recipe.notice = "Это пример на мокап-данных. Свой ужин можно собрать на главной из продуктов, которые есть дома.";
    const { user, setCookie } = await ensureUser();
    const saved = await saveRecipe(user.id, recipe, input);
    return jsonWithUser({ recipe: saved }, user.id, setCookie);
  } catch (error) {
    return toErrorResponse(error);
  }
}
