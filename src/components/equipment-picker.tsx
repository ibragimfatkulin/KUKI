"use client";

import { Beef, CookingPot, Fan, Flame, Microwave, Salad, Utensils, Zap } from "lucide-react";
import type { EquipmentId } from "@/lib/types";
import { EQUIPMENT_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const ITEMS: { id: EquipmentId; hint: string; icon: typeof Microwave }[] = [
  { id: "microwave", hint: "Прогрев в подходящей посуде", icon: Microwave },
  { id: "oven", hint: "Форма и жар духовки", icon: Utensils },
  { id: "gas_stove", hint: "Сковорода на газе", icon: Flame },
  { id: "electric_stove", hint: "Сковорода на электричестве", icon: Zap },
  { id: "multicooker", hint: "Чаша и режим тушения", icon: CookingPot },
  { id: "airfryer", hint: "Корзина и горячий воздух", icon: Fan },
  { id: "grill", hint: "Решётка", icon: Beef },
  { id: "none", hint: "Только холодные блюда", icon: Salad },
];

export function EquipmentPicker({ value, onChange }: { value: EquipmentId[]; onChange: (value: EquipmentId[]) => void }) {
  function toggle(id: EquipmentId) {
    if (id === "none") {
      onChange(value.length === 1 && value[0] === "none" ? [] : ["none"]);
      return;
    }
    const withoutNone = value.filter((item) => item !== "none");
    onChange(withoutNone.includes(id) ? withoutNone.filter((item) => item !== id) : [...withoutNone, id]);
  }

  const summary = value.length === 0 ? "Выберите всё, чем можно пользоваться." : value.map((item) => EQUIPMENT_LABEL[item]).join(", ");

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-pine">Кухонная техника</legend>
      <p className="mt-1 text-sm text-ink/60">Рецепт будет только с тем, что отмечено. Можно выбрать несколько вариантов.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {ITEMS.map((item) => {
          const active = value.includes(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(item.id)}
              className={cn(
                "rounded-3xl border px-3 py-3 text-left transition",
                active ? "border-accent bg-accent text-white" : "border-pine/10 bg-cream hover:border-accent/50",
              )}
            >
              <Icon size={18} />
              <span className="mt-3 block text-sm font-semibold">{EQUIPMENT_LABEL[item.id]}</span>
              <span className={cn("mt-1 block text-xs", active ? "text-white/80" : "text-ink/50")}>{item.hint}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-pine">{summary}</p>
    </fieldset>
  );
}
