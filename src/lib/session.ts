import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashPassword } from "./password";
import { prisma } from "./prisma";

export const USER_COOKIE = "fridge_uid";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function ensureUser() {
  const jar = await cookies();
  const existingId = jar.get(USER_COOKIE)?.value;
  if (existingId) {
    const user = await prisma.user.findUnique({ where: { id: existingId } });
    if (user) return { user, setCookie: false };
  }
  const user = await prisma.user.create({
    data: {
      email: `guest-${crypto.randomUUID()}@fridge.local`,
      passwordHash: hashPassword(crypto.randomUUID()),
      name: "Гость",
    },
  });
  return { user, setCookie: true };
}

export function jsonWithUser(data: unknown, userId: string, setCookie: boolean, status = 200) {
  const response = NextResponse.json(data, { status });
  if (setCookie) response.cookies.set(USER_COOKIE, userId, cookieOptions);
  return response;
}
