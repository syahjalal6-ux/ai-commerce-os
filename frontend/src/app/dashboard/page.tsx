'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package, BarChart3, MessageCircle, ExternalLink, Copy,
  ArrowRight, TrendingUp, Eye, ShoppingBag, Crown,
  Sparkles, Plus, Zap,
} from 'lucide-react';
import { getSession, isPro } from '@/lib/auth';
import { productsApi, analyticsApi, buildStoreUrl, formatRupiah } from '@/lib/api';
import type { Product, Analytics } from '@/lib/api';

export default function DashboardPage() {
  const session  = getSession();
  const pro      = isPro();

  const [products,  setProducts]  = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [copied,    setCopied]    = useState(false);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      productsApi.getAll(session.token),
      analyticsApi.get(session.token),
    ]).then(([pRes, aRes]) => {
      if (pRes.success)  setProducts((pRes as any).products  || []);
      if (aRes.success)  setAnalytics((aRes as any).analytics || null);
    }).finally(() => setLoading(false));
  }, []);

  function copyUrl() {
    if (!session) return;
    navigator.clipboard.writeText(buildStoreUrl(session.user.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const storeUrl = session ? buildStoreUrl(session.user.slug) : '';

  return (
    <div className="page-content space-y-6 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="section-title text-2xl">
            Halo, {session?.user.store_name} 👋
          </h1>
          <p className="section-subtitle mt-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/products" className="btn-primary btn btn-sm self-start sm:self-auto">
          <Plus className="w-3.5 h-3.5" />
          Tambah Produk
        </Link>
      </div>

      {/* ── STORE URL CARD ── */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-brand-200 text-xs font-medium mb-1">Link Toko Kamu</p>
            <p className="font-mono text-sm font-semibold truncate">{storeUrl}</p>
            <p className="text-brand-200 text-xs mt-2">Bagikan link ini ke pelanggan untuk mulai terima pesanan.</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={copyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
            <a
              href={`/s/${session?.user.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Lihat
            </a>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Produk"
          value={loading ? '...' : String(products.length)}
          sub={!pro ? `${products.length}/5 (Free)` : 'Unlimited (Pro)'}
          color="blue"
        />
        <StatCard
          icon={Eye}
          label="Visitor (30 hari)"
          value={loading ? '...' : String(analytics?.total_views ?? 0)}
          sub={`${analytics?.unique_visitors ?? 0} unik`}
          color="purple"
        />
        <StatCard
          icon={MessageCircle}
          label="WA Clicks"
          value={loading ? '...' : String(analytics?.total_wa_clicks ?? 0)}
          sub="Total klik order"
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Konversi"
          value={loading ? '...' : `${analytics?.conversion_rate ?? 0}%`}
          sub="Click-to-WA rate"
          color="orange"
        />
      </div>

      {/* ── QUICK ACTIONS + PRODUCTS ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Products List */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-slate-900">Produk Terbaru</h2>
            <Link href="/dashboard/products" className="text-brand-600 text-sm font-medium hover:underline flex items-center gap-1">
              Lihat semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">Belum ada produk. Tambah sekarang!</p>
              <Link href="/dashboard/products" className="btn-primary btn btn-sm">
                <Plus className="w-3.5 h-3.5" />
                Tambah Produk Pertama
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {products.slice(0, 5).map(p => (
                <div key={p.product_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    {p.image_urls[0] ? (
                      <img src={p.image_urls[0]} alt={p.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-slate-500">{formatRupiah(p.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`badge text-xs ${p.stock > 0 ? 'badge-green' : 'badge-red'}`}>
                      Stok {p.stock}
                    </span>
                    <span className={`badge text-xs ${p.is_active ? 'badge-blue' : 'badge-gray'}`}>
                      {p.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!pro && products.length >= 5 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <Crown className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-xs font-semibold">Batas produk tercapai</p>
                <p className="text-amber-600 text-xs mt-0.5">Upgrade ke Pro untuk tambah produk unlimited.</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-display font-semibold text-slate-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${a.bg}`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Top Products */}
          {analytics && analytics.top_products.length > 0 && (
            <div className="card">
              <h2 className="font-display font-semibold text-slate-900 mb-4">Produk Terpopuler</h2>
              <div className="space-y-2">
                {analytics.top_products.slice(0, 3).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700 flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.clicks}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── AI PROMO (free users) ── */}
      {!pro && (
        <div className="card border-2 border-dashed border-brand-200 bg-gradient-card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-slate-900">Coba Fitur AI</h3>
                <span className="badge-green badge">Pro</span>
              </div>
              <p className="text-slate-500 text-sm mb-3">
                Generate deskripsi produk, caption TikTok viral, hashtag, dan ide konten otomatis dengan AI.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/ai-tools" className="btn-primary btn btn-sm">
                  <Zap className="w-3.5 h-3.5" />
                  Coba AI Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-500' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500' },
    green:  { bg: 'bg-emerald-50',icon: 'text-emerald-500' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-500' },
  };
  const c = colors[color];

  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}>
        <Icon className={`w-4.5 h-4.5 ${c.icon}`} style={{ width: 18, height: 18 }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

const QUICK_ACTIONS = [
  { href: '/dashboard/products',  icon: Plus,       label: 'Tambah Produk', sub: 'Upload produk baru',        bg: 'bg-blue-50',   color: 'text-blue-500' },
  { href: '/dashboard/analytics', icon: BarChart3,  label: 'Lihat Analitik', sub: 'Statistik toko',           bg: 'bg-purple-50', color: 'text-purple-500' },
  { href: '/dashboard/ai-tools',  icon: Sparkles,   label: 'AI Tools',      sub: 'Generate konten',           bg: 'bg-emerald-50',color: 'text-emerald-500' },
  { href: '/dashboard/store',     icon: ShoppingBag,label: 'Edit Toko',     sub: 'Kustomisasi tampilan',      bg: 'bg-orange-50', color: 'text-orange-500' },
];
