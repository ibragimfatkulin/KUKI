import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeText(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim();
}

export function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function zodEnum<T extends string>(values: readonly T[]) {
  return values as unknown as [T, ...T[]];
}
