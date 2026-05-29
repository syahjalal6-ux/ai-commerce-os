'use client';

import { useState } from 'react';
import {
  Crown, Check, Zap, Package, BarChart3,
  Sparkles, MessageCircle, ArrowRight, Shield,
} from 'lucide-react';
import { getSession } from '@/lib/auth';

const PRO_FEATURES = [
  { icon: Package,    text: 'Produk & gambar unlimited' },
  { icon: Sparkles,   text: 'AI Deskripsi Produk otomatis' },
  { icon: Sparkles,   text: 'AI Caption TikTok & Instagram' },
  { icon: Sparkles,   text: 'AI Hashtag Generator (30 hashtag)' },
  { icon: Sparkles,   text: 'AI Judul Produk Optimizer' },
  { icon: Sparkles,   text: 'AI Ide Konten Video (10 ide)' },
  { icon: Sparkles,   text: 'AI Auto Reply Customer' },
  { icon: BarChart3,  text: 'Analitik lengkap 30 hari' },
  { icon: Shield,     text: 'Prioritas customer support' },
];

const FAQS = [
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Pembayaran melalui transfer bank atau e-wallet (GoPay, OVO, Dana). Konfirmasi otomatis setelah pembayaran.',
  },
  {
    q: 'Apakah ada garansi uang kembali?',
    a: 'Ya! Jika dalam 7 hari kamu tidak puas, kami kembalikan pembayaran penuh tanpa pertanyaan.',
  },
  {
    q: 'Berapa lama masa aktif?',
    a: 'Plan Pro aktif selama 30 hari sejak tanggal pembayaran. Bisa diperpanjang kapan saja.',
  },
  {
    q: 'Data toko saya aman kalau tidak bayar?',
    a: 'Aman! Toko dan produk kamu tetap ada, hanya fitur Pro yang tidak bisa digunakan. Tidak ada yang dihapus.',
  },
];

export default function UpgradePage() {
  const session = getSession();
  const isPro   = session?.user.subscription_plan === 'pro';
  const [faq,   setFaq] = useState<number | null>(null);

  if (isPro) {
    return (
      <div className="page-content animate-fade-in">
        <div className="card text-center py-16 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
            Kamu sudah Pro! 🎉
          </h1>
          <p className="text-slate-500 mb-6">
            Nikmati semua fitur Pro tanpa batas. Terima kasih sudah upgrade!
          </p>
          <a href="/dashboard" className="btn-primary btn mx-auto">
            Kembali ke Dashboard
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
          <Crown className="w-3.5 h-3.5" />
          Upgrade ke Pro
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">
          Jual lebih banyak dengan AI
        </h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Dapatkan semua tools yang kamu butuhkan untuk scale bisnis online di Indonesia.
        </p>
      </div>

      {/* Pricing Card */}
      <div className="max-w-sm mx-auto">
        <div className="card border-2 border-brand-500 relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="badge-green badge px-4 py-1.5 text-xs shadow-sm font-semibold">
              ⭐ Paling Populer
            </span>
          </div>

          <div className="text-center mb-6 pt-2">
            <div className="badge-green badge mx-auto mb-3">Pro Plan</div>
            <div className="font-display text-5xl font-extrabold text-slate-900">
              99rb
            </div>
            <div className="text-slate-500 text-sm mt-1">per bulan · bisa batalkan kapan saja</div>
          </div>

          <ul className="space-y-3 mb-6">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Check className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                {f.text}
              </li>
            ))}
          </ul>

          {/* CTA - Payment preparation */}
          <div className="space-y-3">
            <button
              onClick={() => {
                // TODO: Integrate Midtrans or Xendit
                // See README for payment integration guide
                alert('Fitur pembayaran segera hadir! Sementara hubungi admin via WhatsApp untuk upgrade manual.');
              }}
              className="btn-primary btn w-full justify-center text-base py-3.5 rounded-2xl"
            >
              <Zap className="w-5 h-5" />
              Upgrade Sekarang
            </button>
            <button
              onClick={() => {
                const msg = `Halo Admin AI Commerce OS!\n\nSaya ingin upgrade ke Plan Pro.\n\nEmail: ${session?.user.email}\nToko: ${session?.user.store_name}\n\nMohon informasi cara pembayarannya. Terima kasih!`;
                window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(msg)}`, '_blank');
              }}
              className="btn-wa btn w-full justify-center"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-900">Perbandingan Fitur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-1/2">Fitur</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Free</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-brand-600 uppercase tracking-wide">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {COMPARISON.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 text-slate-700">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    {row.free === true  ? <Check className="w-4 h-4 text-brand-500 mx-auto" /> :
                     row.free === false ? <span className="text-slate-300 text-lg">—</span> :
                     <span className="text-xs text-slate-500">{row.free}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.pro === true   ? <Check className="w-4 h-4 text-brand-500 mx-auto" /> :
                     row.pro === false  ? <span className="text-slate-300 text-lg">—</span> :
                     <span className="text-xs font-semibold text-brand-600">{row.pro}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <div className="card space-y-3">
        <h2 className="font-display font-semibold text-slate-900 mb-2">FAQ</h2>
        {FAQS.map((item, i) => (
          <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
            <button
              onClick={() => setFaq(faq === i ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-800">{item.q}</span>
              <span className="text-slate-400 text-lg ml-4 flex-shrink-0">
                {faq === i ? '−' : '+'}
              </span>
            </button>
            {faq === i && (
              <div className="px-4 pb-3 text-sm text-slate-500 animate-fade-in border-t border-slate-100 pt-3">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const COMPARISON: { feature: string; free: boolean | string; pro: boolean | string }[] = [
  { feature: 'URL toko sendiri',         free: true,       pro: true },
  { feature: 'Jumlah produk',            free: 'Maks 5',   pro: 'Unlimited' },
  { feature: 'Gambar per produk',        free: 'Maks 5',   pro: 'Maks 20' },
  { feature: 'Tombol WA order',          free: true,       pro: true },
  { feature: 'Kustomisasi tema & logo',  free: true,       pro: true },
  { feature: 'Upload gambar ke Drive',   free: true,       pro: true },
  { feature: 'Analitik dasar',           free: true,       pro: true },
  { feature: 'Analitik 30 hari',         free: false,      pro: true },
  { feature: 'Traffic sources',          free: false,      pro: true },
  { feature: 'AI Deskripsi Produk',      free: false,      pro: true },
  { feature: 'AI Caption TikTok/IG',     free: false,      pro: true },
  { feature: 'AI Hashtag Generator',     free: false,      pro: true },
  { feature: 'AI Judul Optimizer',       free: false,      pro: true },
  { feature: 'AI Ide Konten',            free: false,      pro: true },
  { feature: 'AI Auto Reply',            free: false,      pro: true },
  { feature: 'Prioritas support',        free: false,      pro: true },
];
