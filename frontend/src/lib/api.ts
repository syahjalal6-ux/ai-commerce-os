// ============================================================
// API Client — Calls Next.js proxy → Apps Script
// ============================================================

const BASE = '/api/proxy';

// ─── CORE FETCH ─────────────────────────────────────────────
async function apiFetch<T = Record<string, unknown>>(
  params: Record<string, string>,
  options?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const url = new URL(BASE, window.location.origin);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res  = await fetch(url.toString(), options);
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, message: 'Koneksi gagal. Periksa internet Anda.' };
  }
}

async function apiPost<T = Record<string, unknown>>(
  body: Record<string, unknown>
): Promise<ApiResult<T>> {
  try {
    const res  = await fetch(BASE, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    return { success: false, message: 'Koneksi gagal. Periksa internet Anda.' };
  }
}

// ─── TYPES ──────────────────────────────────────────────────
export interface ApiResult<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  code?: number;
  [key: string]: unknown;
}

export interface User {
  user_id:           string;
  email:             string;
  store_name:        string;
  whatsapp:          string;
  subscription_plan: 'free' | 'pro' | 'admin' | 'banned';
  slug:              string;
  role:              string;
}

export interface Product {
  product_id:   string;
  user_id:      string;
  product_name: string;
  price:        number;
  description:  string;
  image_urls:   string[];
  stock:        number;
  category:     string;
  is_active:    boolean;
  created_at:   string;
}

export interface Store {
  store_id:          string;
  user_id:           string;
  slug:              string;
  theme_color:       string;
  store_description: string;
  logo_url:          string;
  banner_url:        string;
  store_name?:       string;
  whatsapp?:         string;
}

export interface Analytics {
  total_views:     number;
  unique_visitors: number;
  total_wa_clicks: number;
  conversion_rate: number;
  top_products:    { name: string; clicks: number }[];
  referrers:       { source: string; count: number }[];
  daily_chart:     { date: string; visitors: number }[];
}

// ─── AUTH API ───────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; whatsapp: string; store_name: string }) =>
    apiPost({ action: 'register', ...data }),

  login: (data: { email: string; password: string }) =>
    apiPost({ action: 'login', ...data }),

  logout: (token: string) =>
    apiPost({ action: 'logout', token }),

  getProfile: (token: string) =>
    apiFetch({ action: 'getProfile', token }),
};

// ─── PRODUCTS API ───────────────────────────────────────────
export const productsApi = {
  getAll: (token: string) =>
    apiFetch({ action: 'getProducts', token }),

  create: (token: string, data: Omit<Product, 'product_id' | 'user_id' | 'created_at'>) =>
    apiPost({ action: 'createProduct', token, ...data }),

  update: (token: string, data: Partial<Product> & { product_id: string }) =>
    apiPost({ action: 'updateProduct', token, ...data }),

  delete: (token: string, product_id: string) =>
    apiPost({ action: 'deleteProduct', token, product_id }),
};

// ─── STORE API ──────────────────────────────────────────────
export const storeApi = {
  get: (token: string) =>
    apiFetch({ action: 'getStore', token }),

  getPublic: (slug: string) =>
    apiFetch({ action: 'getPublicStore', slug }),

  update: (token: string, data: Partial<Store>) =>
    apiPost({ action: 'updateStore', token, ...data }),
};

// ─── ANALYTICS API ──────────────────────────────────────────
export const analyticsApi = {
  get: (token: string) =>
    apiFetch({ action: 'getAnalytics', token }),

  track: (data: {
    slug: string;
    visitor_id: string;
    clicked_product?: string;
    whatsapp_click?: boolean;
    referrer?: string;
  }) => apiPost({ action: 'trackVisit', ...data }),
};

// ─── AI API ─────────────────────────────────────────────────
export const aiApi = {
  generateDescription: (token: string, data: { product_name: string; category?: string; keywords?: string; price?: number }) =>
    apiPost({ action: 'aiDescription', token, ...data }),

  generateCaption: (token: string, data: { product_name: string; platform?: string; tone?: string; price?: number }) =>
    apiPost({ action: 'aiCaption', token, ...data }),

  generateHashtags: (token: string, data: { product_name: string; category?: string; platform?: string }) =>
    apiPost({ action: 'aiHashtags', token, ...data }),

  generateTitle: (token: string, data: { product_name: string; category?: string; current_title?: string }) =>
    apiPost({ action: 'aiTitle', token, ...data }),

  generateContentIdeas: (token: string, data: { product_name: string; platform?: string; store_name?: string }) =>
    apiPost({ action: 'aiContentIdeas', token, ...data }),

  generateAutoReply: (token: string, data: { customer_message: string; product_name?: string; store_name?: string }) =>
    apiPost({ action: 'aiAutoReply', token, ...data }),
};

// ─── UPLOAD API ─────────────────────────────────────────────
export const uploadApi = {
  image: async (token: string, file: File): Promise<ApiResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const result = await apiPost({
          action:     'uploadImage',
          token,
          image_data: base64,
          filename:   file.name,
          mime_type:  file.type,
        });
        resolve(result);
      };
      reader.onerror = () => resolve({ success: false, message: 'Gagal membaca file' });
      reader.readAsDataURL(file);
    });
  },
};

// ─── PROFILE API ────────────────────────────────────────────
export const profileApi = {
  update: (token: string, data: { store_name?: string; whatsapp?: string }) =>
    apiPost({ action: 'updateProfile', token, ...data }),

  changePassword: (token: string, data: { current_password: string; new_password: string }) =>
    apiPost({ action: 'changePassword', token, ...data }),
};

// ─── ADMIN API ──────────────────────────────────────────────
export const adminApi = {
  getData: (token: string) =>
    apiFetch({ action: 'adminGetData', token }),

  banUser: (token: string, user_id: string) =>
    apiPost({ action: 'adminBanUser', token, user_id }),

  updateSubscription: (token: string, user_id: string, plan: string) =>
    apiPost({ action: 'adminUpdateSubscription', token, user_id, plan }),
};

// ─── UTILS ──────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style:    'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppUrl(whatsapp: string, message: string): string {
  const clean = whatsapp.replace(/[^0-9]/g, '');
  const num   = clean.startsWith('0') ? '62' + clean.slice(1) : clean;
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

export function buildStoreUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${base}/s/${slug}`;
}
