"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function FoodPhoto({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [current, setCurrent] = useState(src);
  return (
    // Food photos are local demonstration assets; next/image is unnecessary for this static set.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={current} alt={alt} className={cn("object-cover", className)} onError={() => setCurrent("/images/fallback.svg")} />
  );
}
