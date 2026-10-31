import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecipeView } from "@/components/recipe-view";
import { getRecipeDTO } from "@/lib/recipe-store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeDTO(id);
  return { title: recipe ? recipe.name : "Рецепт" };
}

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await getRecipeDTO(id);
  if (!recipe) notFound();
  return <RecipeView recipe={recipe} />;
}
