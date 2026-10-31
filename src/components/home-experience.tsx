"use client";

import { Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EquipmentPicker } from "@/components/equipment-picker";
import { ExampleRail } from "@/components/example-rail";
import { FoodPhoto } from "@/components/food-photo";
import { IngredientEditor, mergeIngredients, type IngredientRow } from "@/components/ingredient-editor";
import { PreferenceFields } from "@/components/preference-fields";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import { findUnsafeIngredients, UNSAFE_MESSAGE } from "@/lib/safety";
import type { Diet, Difficulty, EquipmentId, GenerateInput, Goal, MealType, RecipeDTO, TimeOption } from "@/lib/types";

const DRAFT_KEY = "fridge-draft-v1";
const LOADING_STEPS = ["Смотрим, что уже есть дома", "Сверяем технику на кухне", "Собираем блюдо без лишних покупок", "Считаем порции и БЖУ"];

type Draft = {
  ingredients: IngredientRow[];
  extras: IngredientRow[];
  equipment: EquipmentId[];
  timeMinutes: TimeOption;
  servings: number;
  mealType: MealType;
  difficulty: Difficulty;
  goal: Goal;
  diets: Diet[];
  allergens: string;
};

const INITIAL: Draft = {
  ingredients: [],
  extras: [],
  equipment: [],
  timeMinutes: 30,
  servings: 2,
  mealType: "dinner",
  difficulty: "easy",
  goal: "regular",
  diets: [],
  allergens: "",
};

function rowsFrom(items: GenerateInput["ingredients"]): IngredientRow[] {
  return items.map((item) => ({
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity == null ? "" : String(item.quantity),
    unit: item.unit ?? "",
    vague: item.vague,
  }));
}

function toInput(row: IngredientRow) {
  const quantity = row.quantity.trim() ? Number(row.quantity.replace(",", ".")) : null;
  return {
    name: row.name.trim(),
    quantity,
    unit: row.unit || null,
    vague: !row.quantity.trim() && Boolean(row.vague),
    valid: row.name.trim().length > 0 && (quantity == null || (Number.isFinite(quantity) && quantity > 0)),
  };
}

export function HomeExperience() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from");
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [pending, setPending] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const unsafe = useMemo(() => findUnsafeIngredients(draft.ingredients), [draft.ingredients]);

  useEffect(() => {
    let ignore = false;
    async function hydrate() {
      if (from) {
        try {
          const data = await api<{ recipe: RecipeDTO }>(`/api/recipes/${from}`);
          if (!ignore && data.recipe.request) {
            const request = data.recipe.request;
            setDraft({
              ingredients: rowsFrom(request.ingredients),
              extras: rowsFrom(request.extras),
              equipment: request.equipment,
              timeMinutes: request.timeMinutes,
              servings: request.servings,
              mealType: request.mealType,
              difficulty: request.difficulty,
              goal: request.goal,
              diets: request.diets,
              allergens: request.allergens,
            });
            setRestored(true);
            setHydrated(true);
            return;
          }
        } catch {
          setError("Не удалось вернуть список из рецепта. Можно собрать новый.");
        }
      }
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!ignore && saved) {
        try {
          setDraft({ ...INITIAL, ...JSON.parse(saved) });
        } catch {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
      if (!ignore) setHydrated(true);
    }
    void hydrate();
    return () => {
      ignore = true;
    };
  }, [from]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => setLoadingStep((step) => (step + 1) % LOADING_STEPS.length), 1600);
    return () => window.clearInterval(timer);
  }, [pending]);

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  async function generate() {
    setError(null);
    const ingredients = draft.ingredients.map(toInput);
    const extras = draft.extras.map(toInput);
    if (ingredients.length === 0 || ingredients.some((item) => !item.valid)) {
      setError("Добавьте хотя бы один продукт. Количество можно оставить пустым.");
      return;
    }
    if (extras.some((item) => !item.valid)) {
      setError("Проверьте список продуктов, которые готовы докупить.");
      return;
    }
    if (draft.equipment.length === 0) {
      setError("Выберите технику. Если готовить не на чем, отметьте «Без техники».");
      return;
    }
    if (unsafe.length > 0) {
      setError(UNSAFE_MESSAGE);
      return;
    }
    const body: GenerateInput = {
      ingredients: ingredients.map(({ valid: _valid, ...item }) => item),
      extras: extras.map(({ valid: _valid, ...item }) => item),
      equipment: draft.equipment,
      timeMinutes: draft.timeMinutes,
      servings: draft.servings,
      mealType: draft.mealType,
      difficulty: draft.difficulty,
      goal: draft.goal,
      diets: draft.diets,
      allergens: draft.allergens.trim(),
      variation: 0,
      avoidNames: [],
    };
    setPending(true);
    setLoadingStep(0);
    try {
      const data = await api<{ recipe: RecipeDTO }>("/api/recipes/generate", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/recipe/${data.recipe.id}`);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Не получилось придумать рецепт");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <section className="grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rise">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Ужин без лишнего похода в магазин</p>
          <h1 className="mt-3 max-w-xl font-display text-6xl leading-[0.9] text-pine md:text-8xl">Что сегодня приготовим?</h1>
          <p className="mt-5 max-w-xl text-lg text-ink/70">Расскажи, что есть в холодильнике, а мы придумаем вкусный ужин.</p>
        </div>
        <aside className="relative min-h-[320px] overflow-hidden rounded-[32px] bg-pine shadow-card lg:min-h-[460px]">
          <FoodPhoto src="/images/hero.jpg" alt="Сервированный ужин на тёплом столе" className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-pine via-pine/10 to-transparent" />
          <div className="absolute bottom-0 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.2em] text-white/75">Сначала холодильник</p>
            <p className="mt-2 max-w-sm font-display text-4xl leading-none">Блюдо из остатков, а не из нового списка покупок</p>
          </div>
        </aside>
      </section>

      <form
        className="mt-8 rounded-[32px] bg-white p-5 shadow-card md:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        {restored && <p className="mb-5 rounded-2xl bg-cream px-4 py-3 text-sm text-pine">Список открыт из рецепта. Поправьте его и придумайте другое блюдо.</p>}
        <div className="grid gap-8">
          <IngredientEditor
            rows={draft.ingredients}
            onChange={(ingredients) => patch({ ingredients })}
            unsafeNames={unsafe.map((item) => item.name)}
            label="Что уже есть дома"
            hint="Один продукт, несколько через запятую или фраза вроде «у меня есть курица, сыр и два помидора». Enter тоже добавляет."
            placeholder="Куриное филе — 300 г"
            showQuickAdd
          />
          {unsafe.length > 0 && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#9a3412]">{UNSAFE_MESSAGE}</p>}
          <EquipmentPicker value={draft.equipment} onChange={(equipment) => patch({ equipment })} />
          <PreferenceFields
            timeMinutes={draft.timeMinutes}
            servings={draft.servings}
            mealType={draft.mealType}
            difficulty={draft.difficulty}
            goal={draft.goal}
            diets={draft.diets}
            allergens={draft.allergens}
            onChange={(next) => patch(next)}
          />
          <IngredientEditor
            rows={draft.extras}
            onChange={(extras) => patch({ extras })}
            label="Могу докупить"
            hint="Это отдельный список. Такие продукты не считаются теми, что уже лежат дома, и попадут в рецепт только если без них не обойтись."
            placeholder="Например: хлеб, яйца"
          />
        </div>
        {error && <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-[#9a3412]">{error}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" size="lg" disabled={pending}>
            <Sparkles size={18} />
            Придумать рецепт
          </Button>
          <p className="text-sm text-ink/55">Количество можно не указывать: в рецепте будет пометка, что вес примерный.</p>
        </div>
      </form>

      <section className="mt-10 grid gap-3 md:grid-cols-3">
        {[
          ["01", "Продукты", "Текст, список или подсказка. Лишнее удаляется, количество правится на месте."],
          ["02", "Техника", "Только микроволновка — значит, в шагах не будет сковороды и духовки."],
          ["03", "Рецепт", "Название, фото, шаги, калории и режим готовки с таймером."],
        ].map(([index, title, text]) => (
          <article key={index} className="rounded-[28px] bg-white p-5">
            <p className="font-display text-3xl text-accent">{index}</p>
            <h2 className="mt-2 font-display text-3xl text-pine">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/70">{text}</p>
          </article>
        ))}
      </section>

      <ExampleRail title="Можно начать с примера" text="Это мокап-данные, чтобы посмотреть карточку, избранное и режим готовки до первого своего запроса." />

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-8 text-center shadow-card">
            <Sparkles className="mx-auto text-accent" />
            <p className="mt-4 font-display text-4xl leading-none text-pine">{LOADING_STEPS[loadingStep]}</p>
          </div>
        </div>
      )}
    </div>
  );
}
