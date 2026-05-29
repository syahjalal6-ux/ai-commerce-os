'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag, LayoutDashboard, Package, BarChart3,
  Sparkles, Store, LogOut, Menu, X, Crown, Copy,
  ExternalLink, ChevronRight, User, QrCode,
} from 'lucide-react';
import { getSession, clearSession, isPro } from '@/lib/auth';
import { authApi, buildStoreUrl } from '@/lib/api';
import type { Session } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/products',   icon: Package,         label: 'Produk' },
  { href: '/dashboard/analytics',  icon: BarChart3,       label: 'Analitik' },
  { href: '/dashboard/ai-tools',   icon: Sparkles,        label: 'AI Tools' },
  { href: '/dashboard/store',      icon: Store,           label: 'Pengaturan Toko' },
  { href: '/dashboard/profile',    icon: User,            label: 'Profil & Akun' },
  { href: '/dashboard/qrcode',     icon: QrCode,          label: 'QR Code Toko' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [session,   setSession_]   = useState<Session | null>(null);
  const [sidebarOpen, setSidebar]  = useState(false);
  const [copied,    setCopied]     = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace('/login'); return; }
    setSession_(s);
  }, [router]);

  async function handleLogout() {
    const s = getSession();
    if (s) await authApi.logout(s.token);
    clearSession();
    router.replace('/login');
  }

  function copyStoreUrl() {
    if (!session) return;
    const url = buildStoreUrl(session.user.slug);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat...</p>
        </div>
      </div>
    );
  }

  const pro = isPro();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* ── SIDEBAR (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-brand rounded-xl flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm leading-none">AI Commerce OS</div>
              <div className="text-slate-500 text-xs mt-0.5">Indonesia</div>
            </div>
          </div>
        </div>

        {/* Store info */}
        <div className="px-4 py-4 border-b border-slate-700/50">
          <div className="bg-slate-800/60 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs">Toko kamu</span>
              {pro
                ? <span className="badge-green badge text-xs"><Crown className="w-2.5 h-2.5" /> Pro</span>
                : <span className="badge-gray badge text-xs">Free</span>
              }
            </div>
            <p className="text-white text-sm font-semibold truncate">{session.user.store_name}</p>
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={copyStoreUrl}
                className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-slate-700/60 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white text-xs transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Tersalin!' : 'Salin URL'}
              </button>
              <a
                href={`/s/${session.user.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-slate-700/60 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade banner */}
        {!pro && (
          <div className="px-3 pb-3">
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white text-xs font-semibold">Upgrade ke Pro</span>
              </div>
              <p className="text-brand-200 text-xs mb-2">Dapatkan AI tools, produk unlimited & analitik lengkap.</p>
              <button className="w-full py-1.5 bg-white text-brand-700 text-xs font-semibold rounded-lg hover:bg-brand-50 transition-colors">
                Upgrade Rp 99rb/bln
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-4 border-t border-slate-700/50 pt-3">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-slate-300 text-xs font-semibold">
                {session.user.email[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{session.user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="sidebar-link w-full">
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebar(false)} />
          <aside className="relative flex flex-col w-72 bg-[#0f172a] h-full">
            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-white text-sm">AI Commerce OS</span>
              </div>
              <button onClick={() => setSidebar(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active ? 'sidebar-link-active' : 'sidebar-link'}
                    onClick={() => setSidebar(false)}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="px-3 pb-4 border-t border-slate-700/50 pt-3">
              <button onClick={handleLogout} className="sidebar-link w-full">
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebar(true)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-brand rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-sm">AI Commerce OS</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
