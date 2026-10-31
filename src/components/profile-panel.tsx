"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { formatWhen } from "@/lib/format";

type SessionPayload = {
  user: { id: string; email: string; name: string; createdAt: string };
  counts: { recipes: number; favorites: number; history: number };
};

export function ProfilePanel() {
  const [data, setData] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<SessionPayload>("/api/session")
      .then(setData)
      .catch((caught: unknown) => setError(caught instanceof ApiError ? caught.message : "Профиль не открылся"));
  }, []);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-10 text-[#9a3412]">{error}</p>;
  if (!data) return <div className="mx-auto mt-10 h-48 max-w-3xl animate-pulse rounded-[32px] bg-white" />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Гостевой профиль</p>
      <h1 className="mt-2 font-display text-6xl text-pine">{data.user.name}</h1>
      <p className="mt-3 text-ink/70">Рецепты этого браузера хранятся локально. Вход по почте заложен в модель пользователя и появится следующим шагом.</p>
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Рецепты", data.counts.recipes],
          ["Избранное", data.counts.favorites],
          ["История", data.counts.history],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl bg-white p-5">
            <dt className="text-sm text-ink/50">{label}</dt>
            <dd className="mt-2 font-display text-5xl text-pine">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 space-y-2 rounded-[28px] bg-white p-5 text-sm leading-6">
        <p><span className="font-semibold text-pine">Почта-заготовка:</span> {data.user.email}</p>
        <p><span className="font-semibold text-pine">Создан:</span> {formatWhen(data.user.createdAt)}</p>
        <p>Пароль гостя уже лежит в базе как хеш. Экран входа не входит в эту версию, чтобы не обещать авторизацию, которой ещё нет.</p>
      </div>
    </div>
  );
}
