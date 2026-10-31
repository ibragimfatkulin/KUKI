"use client";

import { ChefHat, Heart, Pencil, Share2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FoodPhoto } from "@/components/food-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { DIFFICULTY_LABEL, EQUIPMENT_LABEL, formatQty, MEAL_LABEL } from "@/lib/format";
import type { RecipeDTO } from "@/lib/types";

export function RecipeView({ recipe }: { recipe: RecipeDTO }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(recipe.isFavorite);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const missing = recipe.ingredients.filter((item) => !item.available);
  const owned = recipe.ingredients.filter((item) => item.available);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    setError(null);
    try {
      if (next) {
        await api("/api/favorites", { method: "POST", body: JSON.stringify({ recipeId: recipe.id }) });
      } else {
        await api(`/api/favorites/${recipe.id}`, { method: "DELETE" });
      }
    } catch (caught) {
      setFavorite(!next);
      setError(caught instanceof ApiError ? caught.message : "Не удалось обновить избранное");
    }
  }

  async function another() {
    if (!recipe.request) return;
    setBusy("another");
    setError(null);
    try {
      const data = await api<{ recipe: RecipeDTO }>("/api/recipes/generate", {
        method: "POST",
        body: JSON.stringify({
          ...recipe.request,
          variation: Math.min(20, (recipe.request.variation ?? 0) + 1),
          avoidNames: [...recipe.request.avoidNames, recipe.name].slice(-6),
        }),
      });
      router.push(`/recipe/${data.recipe.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось собрать другой рецепт");
      setBusy(null);
    }
  }

  async function share() {
    const url = `${window.location.origin}/recipe/${recipe.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, text: recipe.description, url });
        return;
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
    }
    await navigator.clipboard.writeText(url);
    setMessage("Ссылка скопирована");
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <FoodPhoto src={recipe.imageUrl} alt={recipe.name} className="h-72 w-full rounded-[32px] md:h-[440px]" />
      <div className="mt-6 flex flex-wrap gap-2">
        {recipe.isExample && <Badge className="bg-accent text-white">Пример</Badge>}
        <Badge>{MEAL_LABEL[recipe.mealType]}</Badge>
        <Badge>{recipe.equipment.map((item) => EQUIPMENT_LABEL[item]).join(" · ")}</Badge>
        {recipe.source === "ai" ? <Badge>AI</Badge> : <Badge>Локальный модуль</Badge>}
      </div>
      <h1 className="mt-4 font-display text-5xl leading-[0.95] text-pine md:text-7xl">{recipe.name}</h1>
      <p className="mt-4 max-w-3xl text-lg text-ink/75">{recipe.description}</p>
      {recipe.notice && <p className="mt-4 rounded-3xl bg-white px-5 py-4 text-sm leading-6 text-pine">{recipe.notice}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => router.push(`/cook/${recipe.id}`)}>
          <ChefHat size={16} />
          Приготовить
        </Button>
        <Button variant="outline" disabled={!recipe.request || busy === "another"} onClick={() => void another()}>
          <Sparkles size={16} />
          {busy === "another" ? "Думаем…" : "Другой рецепт"}
        </Button>
        <Button variant="outline" onClick={() => router.push(recipe.request ? `/?from=${recipe.id}` : "/")}>
          <Pencil size={16} />
          Изменить ингредиенты
        </Button>
        <Button variant={favorite ? "secondary" : "outline"} onClick={() => void toggleFavorite()}>
          <Heart size={16} fill={favorite ? "currentColor" : "none"} />
          {favorite ? "В избранном" : "В избранное"}
        </Button>
        <Button variant="ghost" onClick={() => void share()}>
          <Share2 size={16} />
          Поделиться
        </Button>
      </div>
      {message && <p className="mt-3 text-sm text-pine">{message}</p>}
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#9a3412]">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Время", `${recipe.cookingTime} мин`],
          ["Порции", String(recipe.servings)],
          ["Сложность", DIFFICULTY_LABEL[recipe.difficulty]],
          ["Из дома", `${recipe.usagePercent}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-ink/45">{label}</p>
            <p className="mt-2 font-display text-4xl text-pine">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Ккал", recipe.nutrition.calories],
          ["Белки", recipe.nutrition.protein],
          ["Жиры", recipe.nutrition.fat],
          ["Углеводы", recipe.nutrition.carbs],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl bg-pine p-4 text-white">
            <p className="text-xs uppercase tracking-wider text-white/60">{label}</p>
            <p className="mt-2 font-display text-4xl">{value}</p>
            <p className="text-xs text-white/60">на порцию, примерно</p>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-[32px] bg-white p-5 md:p-7">
        <h2 className="font-display text-4xl text-pine">Ингредиенты</h2>
        <ul className="mt-4 divide-y divide-pine/10">
          {owned.map((item) => (
            <li key={`${item.name}-${item.unit}`} className="flex items-center justify-between gap-3 py-3">
              <span>{item.name}</span>
              <span className="text-sm text-ink/60">
                {formatQty(item.quantity, item.unit)}
                {item.assumed ? " · примерно" : ""} · дома
              </span>
            </li>
          ))}
        </ul>
        {missing.length > 0 && (
          <div className="mt-4 rounded-3xl bg-[#fff1e8] p-4">
            <h3 className="font-semibold text-accent">Нужно докупить</h3>
            <ul className="mt-2 space-y-2">
              {missing.map((item) => (
                <li key={item.name} className="flex justify-between gap-3 text-sm">
                  <span>{item.name}</span>
                  <span>{formatQty(item.quantity, item.unit)}{item.assumed ? " · примерно" : ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[32px] bg-white p-5 md:p-7">
        <h2 className="font-display text-4xl text-pine">Как готовить</h2>
        <ol className="mt-4 space-y-4">
          {recipe.steps.map((step) => (
            <li key={step.step} className="grid grid-cols-[auto_1fr] gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream font-semibold text-accent">{step.step}</span>
              <div>
                <p className="leading-7">{step.instruction}</p>
                <p className="mt-1 text-sm text-ink/50">{step.duration > 0 ? `${step.duration} мин` : "без таймера"}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {recipe.assumptions.length > 0 && (
        <section className="mt-4 rounded-[32px] bg-cream p-5">
          <h2 className="font-semibold text-pine">Что мы предположили</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-ink/75">
            {recipe.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-6 text-sm text-ink/50">
        <Link href="/" className="font-semibold text-pine">
          Собрать другой ужин
        </Link>
      </p>
    </article>
  );
}
