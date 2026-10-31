"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ExampleRail } from "@/components/example-rail";
import { FoodPhoto } from "@/components/food-photo";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { formatWhen } from "@/lib/format";
import type { RecipeDTO } from "@/lib/types";

type FavoriteItem = { id: string; createdAt: string; recipe: RecipeDTO };
type HistoryItem = {
  id: string;
  createdAt: string;
  ingredients: { name: string }[];
  equipment: string[];
  recipe: { id: string; name: string; imageUrl: string; cookingTime: number; isExample: boolean } | null;
};

export function LibraryScreen({ mode }: { mode: "favorites" | "history" }) {
  const [favorites, setFavorites] = useState<FavoriteItem[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      if (mode === "favorites") {
        const data = await api<{ items: FavoriteItem[] }>("/api/favorites");
        setFavorites(data.items);
      } else {
        const data = await api<{ items: HistoryItem[] }>("/api/history");
        setHistory(data.items);
      }
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось загрузить список");
    }
  }

  useEffect(() => {
    void load();
  }, [mode]);

  async function removeFavorite(recipeId: string) {
    setFavorites((items) => items?.filter((item) => item.recipe.id !== recipeId) ?? null);
    try {
      await api(`/api/favorites/${recipeId}`, { method: "DELETE" });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось убрать рецепт");
      void load();
    }
  }

  async function removeHistory(id: string) {
    setHistory((items) => items?.filter((item) => item.id !== id) ?? null);
    try {
      await api(`/api/history/${id}`, { method: "DELETE" });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось удалить запись");
      void load();
    }
  }

  const title = mode === "favorites" ? "Избранное" : "История";
  const ready = mode === "favorites" ? favorites : history;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-6xl text-pine">{title}</h1>
      <p className="mt-3 max-w-2xl text-ink/70">
        {mode === "favorites" ? "Сюда попадают рецепты, которые захотелось оставить." : "Каждая генерация остаётся здесь, её можно открыть снова."}
      </p>
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#9a3412]">{error}</p>}
      {ready == null ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-[28px] bg-white" />
          <div className="h-48 animate-pulse rounded-[28px] bg-white" />
        </div>
      ) : mode === "favorites" && favorites?.length === 0 ? (
        <ExampleRail title="Пока здесь пусто" text="Откройте пример или сохраните свой рецепт кнопкой «В избранное»." />
      ) : mode === "history" && history?.length === 0 ? (
        <ExampleRail title="История начнётся с первого блюда" text="Можно открыть пример: он тоже попадёт в историю и его шаги можно пройти." />
      ) : mode === "favorites" ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {favorites?.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[28px] bg-white shadow-card">
              <FoodPhoto src={item.recipe.imageUrl} alt="" className="h-44 w-full" />
              <div className="p-5">
                <h2 className="font-display text-3xl text-pine">{item.recipe.name}</h2>
                <p className="mt-2 text-sm text-ink/55">{formatWhen(item.createdAt)} · {item.recipe.cookingTime} мин</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/recipe/${item.recipe.id}`} className="inline-flex h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white">Открыть</Link>
                  <Link href={`/cook/${item.recipe.id}`} className="inline-flex h-10 items-center rounded-full border border-pine/15 px-4 text-sm font-semibold">Готовить</Link>
                  <Button variant="ghost" size="sm" onClick={() => void removeFavorite(item.recipe.id)}>
                    <Trash2 size={14} />
                    Убрать
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {history?.map((item) => (
            <li key={item.id} className="flex flex-col gap-4 rounded-[28px] bg-white p-4 shadow-card sm:flex-row">
              {item.recipe && <FoodPhoto src={item.recipe.imageUrl} alt="" className="h-28 w-full rounded-2xl sm:w-40" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink/50">{formatWhen(item.createdAt)}</p>
                <h2 className="mt-1 font-display text-3xl text-pine">{item.recipe?.name ?? "Рецепт удалён"}</h2>
                <p className="mt-2 text-sm text-ink/70">{item.ingredients.map((ingredient) => ingredient.name).join(", ")}</p>
                <p className="mt-1 text-sm text-ink/50">{item.equipment.join(", ")}{item.recipe?.isExample ? " · пример" : ""}</p>
                <div className="mt-3 flex gap-2">
                  {item.recipe && (
                    <Link href={`/recipe/${item.recipe.id}`} className="inline-flex h-10 items-center rounded-full bg-pine px-4 text-sm font-semibold text-white">
                      Открыть
                    </Link>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => void removeHistory(item.id)}>
                    <Trash2 size={14} />
                    Удалить
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
