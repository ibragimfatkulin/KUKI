import { Suspense } from "react";
import { HomeExperience } from "@/components/home-experience";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-16 font-display text-4xl text-pine">Открываем холодильник…</div>}>
      <HomeExperience />
    </Suspense>
  );
}
