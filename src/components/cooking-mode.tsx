"use client";

import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RecipeDTO } from "@/lib/types";

function formatClock(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function beep() {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 880;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.04, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.36);
}

export function CookingMode({ recipe }: { recipe: RecipeDTO }) {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const step = recipe.steps[index];
  const progress = done ? 100 : Math.round((index / Math.max(1, recipe.steps.length)) * 100);

  useEffect(() => {
    setRemaining(step && step.duration > 0 ? step.duration * 60 : null);
    setRunning(false);
  }, [index, step]);

  useEffect(() => {
    if (!running || paused || remaining == null) return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value == null) return value;
        if (value <= 1) {
          setRunning(false);
          try {
            beep();
          } catch {
            // Браузер может запретить звук, пока пользователь сам не нажмёт таймер.
          }
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, paused, remaining == null]);

  if (done || !step) {
    return (
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-4 py-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Готово</p>
        <h1 className="mt-3 font-display text-6xl text-pine">Приятного аппетита</h1>
        <p className="mt-4 text-lg text-ink/70">{recipe.name} можно подавать.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setDone(false); setIndex(0); }}>Ещё раз шаги</Button>
          <Link href={`/recipe/${recipe.id}`} className="inline-flex h-11 items-center rounded-full border border-pine/15 bg-white px-5 font-semibold">
            К рецепту
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-4xl flex-col px-4 py-6">
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
        Шаг {index + 1} из {recipe.steps.length}
      </p>
      <h1 className={`mt-4 font-display text-5xl leading-[1.02] text-pine md:text-7xl ${paused ? "opacity-40" : ""}`}>{step.instruction}</h1>
      {paused && <p className="mt-4 text-lg font-semibold text-accent">Пауза. Кухня подождёт.</p>}

      <div className="mt-8 rounded-[32px] bg-white p-6">
        {remaining == null ? (
          <p className="font-display text-5xl text-pine">Без таймера</p>
        ) : (
          <>
            <p className="font-display text-7xl text-pine">{formatClock(remaining)}</p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={paused}
                onClick={() => {
                  if (!running && remaining === 0 && step.duration > 0) setRemaining(step.duration * 60);
                  setRunning((value) => !value);
                }}
              >
                {running ? <Pause size={16} /> : <Play size={16} />}
                {running ? "Стоп таймер" : remaining === 0 ? "Заново" : "Запустить таймер"}
              </Button>
            </div>
          </>
        )}
      </div>

      <details className="mt-4 rounded-3xl bg-white p-4">
        <summary className="cursor-pointer font-semibold text-pine">Продукты под рукой</summary>
        <ul className="mt-3 space-y-1 text-sm text-ink/75">
          {recipe.ingredients.map((item) => (
            <li key={`${item.name}-${item.available}`}>{item.name}{item.available ? "" : " · докупить"}</li>
          ))}
        </ul>
      </details>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-8">
        <Button type="button" variant="outline" disabled={index === 0} onClick={() => { setPaused(false); setIndex((value) => value - 1); }}>
          <ArrowLeft size={16} />
          Назад
        </Button>
        <Button type="button" variant={paused ? "secondary" : "outline"} onClick={() => setPaused((value) => !value)}>
          {paused ? <Play size={16} /> : <Pause size={16} />}
          {paused ? "Продолжить" : "Пауза"}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setPaused(false);
            if (index === recipe.steps.length - 1) setDone(true);
            else setIndex((value) => value + 1);
          }}
        >
          {index === recipe.steps.length - 1 ? "Готово" : "Дальше"}
          <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}
