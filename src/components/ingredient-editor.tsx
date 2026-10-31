"use client";

import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api-client";
import { QUICK_ADD, suggestProducts } from "@/lib/catalog";
import { looksLikeSentence, parseIngredientText } from "@/lib/parser";
import type { IngredientInput } from "@/lib/types";
import { cn } from "@/lib/utils";

export type IngredientRow = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  vague?: boolean;
};

const UNITS = ["", "г", "кг", "мл", "л", "шт", "ст. л.", "ч. л.", "зубчик", "пучок", "щепотка", "стакан", "банка"];

function rowFrom(item: IngredientInput): IngredientRow {
  return {
    id: crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity == null ? "" : String(item.quantity),
    unit: item.unit ?? "",
    vague: item.vague,
  };
}

export function mergeIngredients(current: IngredientRow[], incoming: IngredientInput[]) {
  const next = [...current];
  for (const item of incoming) {
    const index = next.findIndex((row) => row.name.toLowerCase() === item.name.toLowerCase());
    if (index >= 0) {
      if (item.quantity != null) {
        next[index] = { ...next[index], quantity: String(item.quantity), unit: item.unit ?? next[index].unit, vague: false };
      }
      continue;
    }
    next.push(rowFrom(item));
  }
  return next;
}

export function IngredientEditor({
  rows,
  onChange,
  unsafeNames,
  placeholder,
  label,
  hint,
  showQuickAdd = false,
}: {
  rows: IngredientRow[];
  onChange: (rows: IngredientRow[]) => void;
  unsafeNames?: string[];
  placeholder: string;
  label: string;
  hint: string;
  showQuickAdd?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [active, setActive] = useState(-1);
  const [note, setNote] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const suggestions = useMemo(() => (looksLikeSentence(draft) ? [] : suggestProducts(draft)), [draft]);
  const unsafe = new Set((unsafeNames ?? []).map((name) => name.toLowerCase()));

  async function addText(text: string) {
    const value = text.trim();
    if (!value) return;
    setNote(null);
    let parsed = parseIngredientText(value);
    if (looksLikeSentence(value)) {
      setParsing(true);
      try {
        const data = await api<{ ingredients: IngredientInput[] }>("/api/ingredients/parse", {
          method: "POST",
          body: JSON.stringify({ text: value }),
        });
        if (data.ingredients.length > 0) parsed = data.ingredients;
      } catch (error) {
        if (parsed.length === 0) {
          setNote(error instanceof ApiError ? error.message : "Не удалось разобрать текст");
          setParsing(false);
          return;
        }
      } finally {
        setParsing(false);
      }
    }
    if (parsed.length === 0) {
      setNote("Введите название продукта");
      return;
    }
    onChange(mergeIngredients(rows, parsed));
    setDraft("");
    setActive(-1);
  }

  function update(id: string, patch: Partial<IngredientRow>) {
    onChange(rows.map((row) => (row.id === id ? { ...row, ...patch, vague: patch.quantity ? false : row.vague } : row)));
  }

  return (
    <div>
      <label className="text-sm font-semibold text-pine" htmlFor={`${label}-input`}>
        {label}
      </label>
      <p className="mt-1 text-sm text-ink/60">{hint}</p>
      <div className="relative mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          id={`${label}-input`}
          value={draft}
          placeholder={placeholder}
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          onChange={(event) => {
            setDraft(event.target.value);
            setActive(-1);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, suggestions.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, -1));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (active >= 0 && suggestions[active]) void addText(suggestions[active]);
              else void addText(draft);
            }
          }}
        />
        <Button type="button" variant="secondary" disabled={parsing} onClick={() => void addText(draft)}>
          <Plus size={16} />
          {parsing ? "Распознаём" : "Добавить"}
        </Button>
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-14 z-20 overflow-hidden rounded-2xl border border-pine/10 bg-white shadow-card sm:right-36" role="listbox">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className={cn("block w-full px-4 py-3 text-left text-sm hover:bg-cream", index === active && "bg-cream")}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void addText(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {showQuickAdd && (
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ADD.map((name) => (
            <button key={name} type="button" className="rounded-full bg-white px-3 py-1 text-sm text-pine" onClick={() => onChange(mergeIngredients(rows, [{ name, quantity: null, unit: null }]))}>
              {name}
            </button>
          ))}
        </div>
      )}
      {note && <p className="mt-2 text-sm text-[#9a3412]">{note}</p>}
      <ul className="mt-4 space-y-2">
        {rows.map((row) => {
          const spoiled = unsafe.has(row.name.toLowerCase());
          return (
            <li key={row.id} className={cn("grid gap-2 rounded-3xl border p-3 md:grid-cols-[1fr_88px_120px_44px]", spoiled ? "border-red-300 bg-red-50" : "border-pine/10 bg-white")}>
              <input
                aria-label={`Продукт ${row.name}`}
                value={row.name}
                onChange={(event) => update(row.id, { name: event.target.value })}
                className="h-11 rounded-2xl bg-cream px-3 outline-none"
              />
              <input
                aria-label={`Количество ${row.name}`}
                inputMode="decimal"
                value={row.quantity}
                placeholder="кол-во"
                onChange={(event) => update(row.id, { quantity: event.target.value.replace(/[^\d.,]/g, "") })}
                className="h-11 rounded-2xl bg-cream px-3 outline-none"
              />
              <select
                aria-label={`Единица ${row.name}`}
                value={row.unit}
                onChange={(event) => update(row.id, { unit: event.target.value })}
                className="h-11 rounded-2xl bg-cream px-3 outline-none"
              >
                {UNITS.map((unit) => (
                  <option key={unit || "none"} value={unit}>
                    {unit || "без единицы"}
                  </option>
                ))}
              </select>
              <button type="button" aria-label={`Удалить ${row.name}`} className="flex h-11 items-center justify-center rounded-2xl text-pine" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}>
                <X size={18} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
