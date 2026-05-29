import type { User } from './api';

const SESSION_KEY  = 'aic_session_v1';
const COOKIE_TOKEN = 'aic_token';  // used by middleware (no sensitive data)
const COOKIE_ROLE  = 'aic_role';

export interface Session {
  token: string;
  user:  User;
}

// ── COOKIE helpers (client-side only) ──────────────────────
function setCookie(name: string, value: string, days = 3) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

// ── SESSION ─────────────────────────────────────────────────
export function getSession(): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Set cookies so middleware can read them
  setCookie(COOKIE_TOKEN, session.token, 3);
  setCookie(COOKIE_ROLE,  session.user.role || 'user', 3);
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  deleteCookie(COOKIE_TOKEN);
  deleteCookie(COOKIE_ROLE);
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

export function getUser(): User | null {
  return getSession()?.user ?? null;
}

export function isLoggedIn(): boolean {
  return !!getSession();
}

export function isPro(): boolean {
  const plan = getSession()?.user.subscription_plan;
  return plan === 'pro' || plan === 'admin';
}

export function isAdmin(): boolean {
  return getSession()?.user.role === 'admin';
}

/** Merge partial user data into the stored session */
export function updateSessionUser(partial: Partial<User>): void {
  const session = getSession();
  if (!session) return;
  session.user = { ...session.user, ...partial };
  setSession(session);
}

/** Persistent visitor ID for analytics tracking */
export function getVisitorId(): string {
  const KEY = 'aic_vid';
  let vid = localStorage.getItem(KEY);
  if (!vid) {
    vid = 'v-' + Math.random().toString(36).slice(2) + '-' + Date.now();
    localStorage.setItem(KEY, vid);
  }
  return vid;
}
