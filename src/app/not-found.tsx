import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-6xl text-pine">Такого рецепта нет</h1>
      <p className="mt-3 text-ink/70">Ссылка устарела или блюдо ещё не собрано.</p>
      <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 font-semibold text-white">
        На главную
      </Link>
    </div>
  );
}
