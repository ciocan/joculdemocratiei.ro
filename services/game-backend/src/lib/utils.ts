import type { Env } from "../index";

interface AnalyticsQueryResult {
  data: Array<Record<string, unknown>>;
  rows: number;
  rows_before_limit_at_least: number;
}

export async function queryAnalyticsEngine(env: Env, query: string): Promise<AnalyticsQueryResult> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        "content-type": "application/json;charset=UTF-8",
        "X-Source": "Cloudflare-Workers",
      },
      body: query,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analytics Engine query failed: ${response.statusText}. Details: ${errorText}`);
  }

  return response.json();
}
