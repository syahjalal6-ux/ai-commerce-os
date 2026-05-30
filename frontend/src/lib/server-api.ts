/**
 * server-api.ts — Server-side only. Calls Apps Script directly.
 * Used by SSR pages like public storefront.
 */

const SCRIPT_URL = (process.env.APPS_SCRIPT_URL || '').trim();
const API_SECRET = (process.env.API_SECRET || '').trim();

interface ServerResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

async function serverGet(params: Record<string, string>): Promise<ServerResult> {
  if (!SCRIPT_URL) {
    return { success: false, message: 'APPS_SCRIPT_URL not configured' };
  }

  try {
    const url = new URL(SCRIPT_URL);
    if (API_SECRET) url.searchParams.set('secret', API_SECRET);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url.toString(), {
      next:   { revalidate: 60 },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function serverGetPublicStore(slug: string) {
  return serverGet({ action: 'getPublicStore', slug });
}
