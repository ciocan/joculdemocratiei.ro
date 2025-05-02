import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { json } from "@tanstack/react-start";
import ky from "ky";

import type { EnvVars } from "env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchData<T>(url: string, params: Record<string, string>): Promise<T> {
  try {
    return await ky
      .get(url, {
        searchParams: params,
        retry: { limit: 1 },
      })
      .json<T>();
  } catch (error) {
    if (error instanceof Error) {
      const kyError = error as { response?: Response };
      if (kyError.response) {
        const errorData = (await kyError.response.json()) as { error?: string };
        throw new Error(errorData.error || "Eroare la încărcarea datelor");
      }
    }
    throw new Error("Eroare la încărcarea datelor");
  }
}

export async function checkRateLimit(request: Request) {
  const { env, cf } = request.context.cloudflare;
  const { city, postalCode } = request.context._platform?.cf || cf;
  const ip = request.headers.get("cf-connecting-ip");
  const key = `${city}-${postalCode}-${ip}`;

  const { success } = await env.RATE_LIMITER.limit({ key });

  if (!success) {
    return json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  return null;
}
