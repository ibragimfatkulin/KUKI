import { notFound } from "next/navigation";
import { CookingMode } from "@/components/cooking-mode";
import { getRecipeDTO } from "@/lib/recipe-store";

export const dynamic = "force-dynamic";

export default async function CookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeDTO(id);
  if (!recipe) notFound();
  return <CookingMode recipe={recipe} />;
}
