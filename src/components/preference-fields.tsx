"use client";

import { Minus, Plus } from "lucide-react";
import { DIET_LABEL, DIFFICULTY_LABEL, GOAL_LABEL, MEAL_LABEL } from "@/lib/format";
import { DIETS, DIFFICULTIES, GOALS, MEAL_TYPES, TIME_OPTIONS, type Diet, type Difficulty, type Goal, type MealType, type TimeOption } from "@/lib/types";
import { cn } from "@/lib/utils";

function Pills<T extends string | number>({
  label,
  value,
  options,
  render,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  render: (option: T) => string;
  onChange: (option: T) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-pine">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option)}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={cn("rounded-full px-4 py-2 text-sm font-semibold", value === option ? "bg-pine text-white" : "bg-white text-pine")}
          >
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PreferenceFields({
  timeMinutes,
  servings,
  mealType,
  difficulty,
  goal,
  diets,
  allergens,
  onChange,
}: {
  timeMinutes: TimeOption;
  servings: number;
  mealType: MealType;
  difficulty: Difficulty;
  goal: Goal;
  diets: Diet[];
  allergens: string;
  onChange: (patch: Partial<{ timeMinutes: TimeOption; servings: number; mealType: MealType; difficulty: Difficulty; goal: Goal; diets: Diet[]; allergens: string }>) => void;
}) {
  function toggleDiet(diet: Diet) {
    onChange({ diets: diets.includes(diet) ? diets.filter((item) => item !== diet) : [...diets, diet] });
  }

  return (
    <div className="space-y-5">
      <Pills label="Время" value={timeMinutes} options={TIME_OPTIONS} render={(option) => `${option} мин`} onChange={(option) => onChange({ timeMinutes: option })} />
      <div>
        <p className="text-sm font-semibold text-pine">Порции</p>
        <div className="mt-2 inline-flex items-center gap-3 rounded-full bg-white px-2 py-1">
          <button type="button" aria-label="Меньше порций" className="flex h-10 w-10 items-center justify-center rounded-full bg-cream" onClick={() => onChange({ servings: Math.max(1, servings - 1) })}>
            <Minus size={16} />
          </button>
          <span className="w-6 text-center font-semibold">{servings}</span>
          <button type="button" aria-label="Больше порций" className="flex h-10 w-10 items-center justify-center rounded-full bg-cream" onClick={() => onChange({ servings: Math.min(8, servings + 1) })}>
            <Plus size={16} />
          </button>
        </div>
      </div>
      <Pills label="Тип блюда" value={mealType} options={MEAL_TYPES} render={(option) => MEAL_LABEL[option]} onChange={(option) => onChange({ mealType: option })} />
      <Pills label="Сложность" value={difficulty} options={DIFFICULTIES} render={(option) => DIFFICULTY_LABEL[option]} onChange={(option) => onChange({ difficulty: option })} />
      <Pills label="Цель" value={goal} options={GOALS} render={(option) => GOAL_LABEL[option]} onChange={(option) => onChange({ goal: option })} />
      <div>
        <p className="text-sm font-semibold text-pine">Диета и аллергены</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIETS.map((diet) => (
            <button key={diet} type="button" aria-pressed={diets.includes(diet)} onClick={() => toggleDiet(diet)} className={cn("rounded-full px-4 py-2 text-sm font-semibold", diets.includes(diet) ? "bg-accent text-white" : "bg-white text-pine")}>
              {DIET_LABEL[diet]}
            </button>
          ))}
        </div>
        <input
          value={allergens}
          onChange={(event) => onChange({ allergens: event.target.value })}
          placeholder="Аллергены через запятую: орехи, молоко"
          className="mt-3 h-12 w-full rounded-2xl border border-pine/10 bg-white px-4 outline-none focus:border-accent"
        />
      </div>
    </div>
  );
}
