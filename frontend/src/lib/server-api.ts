/**
 * server-api.ts — Server-side only helpers.
 * Calls Apps Script directly (not through /api/proxy).
 * Used by SSR pages like the public storefront.
 * Never import this in client components.
 */

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;
const API_SECRET = process.env.API_SECRET || '';

interface ServerResult {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

/** Build a GET URL to Apps Script */
function buildGetUrl(params: Record<string, string>): string {
  if (!SCRIPT_URL) throw new Error('APPS_SCRIPT_URL env var is not set');
  const url = new URL(SCRIPT_URL);
  if (API_SECRET) url.searchParams.set('secret', API_SECRET);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

/** GET request to Apps Script */
async function serverGet(params: Record<string, string>): Promise<ServerResult> {
  try {
    const url = buildGetUrl(params);
    const res = await fetch(url, {
      next: { revalidate: 60 }, // Cache 60 seconds for public data
    });
    if (!res.ok) return { success: false, message: `HTTP ${res.status}` };
    return await res.json();
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

// ── PUBLIC STORE ────────────────────────────────────────────
export async function serverGetPublicStore(slug: string) {
  return serverGet({ action: 'getPublicStore', slug });
}
