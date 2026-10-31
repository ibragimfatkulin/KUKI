"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FoodPhoto } from "@/components/food-photo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { EXAMPLES } from "@/lib/examples";

export function ExampleRail({ title, text }: { title: string; text: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openExample(key: string) {
    setBusy(key);
    setError(null);
    try {
      const data = await api<{ recipe: { id: string } }>("/api/recipes/examples", {
        method: "POST",
        body: JSON.stringify({ key }),
      });
      router.push(`/recipe/${data.recipe.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не удалось открыть пример");
      setBusy(null);
    }
  }

  return (
    <section className="mt-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Примеры</p>
          <h2 className="mt-2 font-display text-4xl text-pine">{title}</h2>
          <p className="mt-2 max-w-2xl text-ink/70">{text}</p>
        </div>
      </div>
      {error && <p className="mb-4 rounded-2xl bg-white px-4 py-3 text-sm text-[#9a3412]">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {EXAMPLES.map((example) => (
          <article key={example.key} className="overflow-hidden rounded-[28px] bg-white shadow-card">
            <FoodPhoto src={example.image} alt="" className="h-44 w-full" />
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap gap-2">
                <Badge>Пример</Badge>
                {example.tags.map((tag) => (
                  <Badge key={tag} className="bg-pine/5">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h3 className="font-display text-3xl leading-none text-pine">{example.title}</h3>
              <p className="text-sm leading-6 text-ink/70">{example.text}</p>
              <Button className="w-full" disabled={busy === example.key} onClick={() => openExample(example.key)}>
                {busy === example.key ? "Открываем…" : "Открыть пример"}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
