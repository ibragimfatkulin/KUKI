import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { DietConflictError } from "./food";

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details ?? null },
      { status: error.status },
    );
  }
  if (error instanceof DietConflictError) {
    return NextResponse.json({ error: error.code, message: error.message, details: null }, { status: 422 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "invalid_input", message: "Проверьте продукты, технику и настройки.", details: null },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json(
    { error: "internal", message: "Не получилось обработать запрос. Попробуйте ещё раз.", details: null },
    { status: 500 },
  );
}
