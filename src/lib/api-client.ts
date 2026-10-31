export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const data = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
    details?: unknown;
  };
  if (!response.ok) {
    throw new ApiError(data.message || "Не получилось выполнить запрос", response.status, data.error, data.details);
  }
  return data as T;
}
