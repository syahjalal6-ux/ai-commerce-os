'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isLoggedIn } from '@/lib/auth';
import {
  ShoppingBag, Zap, BarChart3, MessageCircle, Star,
  ArrowRight, CheckCircle2, Sparkles, Globe, Shield,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (isLoggedIn()) router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-lg">AI Commerce OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn text-sm hidden sm:flex">Masuk</Link>
            <Link href="/register" className="btn-primary btn text-sm">
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-100 rounded-full opacity-50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-200 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Platform #1 untuk UMKM & Seller Indonesia
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 text-balance">
            Buat Toko Online Kamu
            <br />
            <span className="text-brand-600">dalam 5 Menit.</span>
            <br />
            Terima Pesanan via WhatsApp.
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform toko online lengkap dengan AI assistant, analitik, dan integrasi WhatsApp.
            Cocok untuk TikTok seller, Shopee seller, dropshipper, dan UMKM Indonesia.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="btn-primary btn btn-lg w-full sm:w-auto">
              Buat Toko Gratis Sekarang
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary btn btn-lg w-full sm:w-auto">
              Sudah punya akun? Masuk
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            ✅ Gratis untuk 5 produk &nbsp;·&nbsp; ✅ Tanpa kartu kredit &nbsp;·&nbsp; ✅ Setup 5 menit
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Semua yang kamu butuhkan untuk jualan online
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Dari toko online sampai AI content creator — semuanya ada di sini.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card-hover group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.bg}`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-display font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI FEATURES ── */}
      <section className="py-20 bg-gradient-to-br from-brand-900 to-brand-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600 opacity-20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-full text-sm font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Fitur AI (Plan Pro)
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              AI Assistant yang paham pasar Indonesia
            </h2>
            <p className="text-brand-200 text-lg max-w-2xl mx-auto">
              Generate konten, deskripsi, caption, dan strategi penjualan dengan satu klik.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {AI_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 bg-white/10 rounded-xl px-4 py-3 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4 text-brand-300 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Harga yang fair untuk semua seller
            </h2>
            <p className="text-slate-500 text-lg">Mulai gratis, upgrade kalau sudah siap.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="card">
              <div className="badge-gray badge mb-4">Free</div>
              <div className="text-4xl font-display font-bold text-slate-900 mb-1">Rp 0</div>
              <p className="text-slate-500 text-sm mb-6">Selamanya gratis</p>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-secondary btn w-full justify-center">
                Daftar Gratis
              </Link>
            </div>

            <div className="card border-2 border-brand-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge-green badge px-3 py-1 text-xs shadow-sm">⭐ Paling Populer</span>
              </div>
              <div className="badge-green badge mb-4">Pro</div>
              <div className="text-4xl font-display font-bold text-slate-900 mb-1">
                Rp 99rb
                <span className="text-base font-normal text-slate-500">/bln</span>
              </div>
              <p className="text-slate-500 text-sm mb-6">Semua yang kamu butuhkan</p>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-primary btn w-full justify-center">
                Coba Pro 7 Hari Gratis
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Siap mulai berjualan? 🚀
          </h2>
          <p className="text-slate-500 text-lg mb-8">
            Bergabung dengan ribuan seller Indonesia yang sudah pakai AI Commerce OS.
          </p>
          <Link href="/register" className="btn-primary btn btn-lg">
            Buat Toko Sekarang — Gratis!
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">AI Commerce OS</span>
          </div>
          <p className="text-xs">© 2024 AI Commerce OS Indonesia. Dibuat dengan ❤️ untuk UMKM Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: Globe,
    title: 'Toko Online Sendiri',
    desc:  'Setiap seller dapat URL toko unik. Pelanggan bisa browsing produk tanpa marketplace.',
    bg:    'bg-blue-50',  color: 'text-blue-500',
  },
  {
    icon: MessageCircle,
    title: 'Order via WhatsApp',
    desc:  'Tombol "Pesan via WhatsApp" langsung membuka chat dengan pesan produk yang sudah terisi.',
    bg:    'bg-green-50', color: 'text-green-500',
  },
  {
    icon: Sparkles,
    title: 'AI Content Generator',
    desc:  'Generate deskripsi produk, caption TikTok, hashtag viral, dan ide konten dengan AI.',
    bg:    'bg-purple-50', color: 'text-purple-500',
  },
  {
    icon: BarChart3,
    title: 'Analitik Lengkap',
    desc:  'Pantau visitor, produk terlaris, klik WhatsApp, dan konversi toko kamu real-time.',
    bg:    'bg-orange-50', color: 'text-orange-500',
  },
  {
    icon: Zap,
    title: 'Setup 5 Menit',
    desc:  'Daftar, tambah produk, share link toko. Langsung bisa jualan tanpa ribet.',
    bg:    'bg-yellow-50', color: 'text-yellow-500',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    desc:  'Data tersimpan di Google Sheets milik kamu sendiri. Privasi terjamin penuh.',
    bg:    'bg-red-50',   color: 'text-red-500',
  },
];

const AI_FEATURES = [
  'AI Deskripsi Produk',
  'AI Caption TikTok & Instagram',
  'AI Hashtag Viral',
  'AI Judul Produk Optimizer',
  'AI Ide Konten Video',
  'AI Auto Reply Customer',
];

const FREE_FEATURES = [
  'URL toko online sendiri',
  'Maksimal 5 produk',
  'Tombol pesan via WhatsApp',
  'Statistik dasar',
  'Kustomisasi tema warna',
];

const PRO_FEATURES = [
  'Semua fitur Free',
  'Produk unlimited',
  'Semua 6 fitur AI',
  'Analitik lengkap 30 hari',
  'Upload gambar ke Google Drive',
  'Prioritas support',
];
