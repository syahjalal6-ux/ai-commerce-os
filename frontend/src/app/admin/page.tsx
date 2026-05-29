'use client';

import { useState, useEffect } from 'react';
import {
  Users, ShoppingBag, BarChart3, Crown, Ban,
  Search, RefreshCw, Shield, Check, AlertCircle,
  ExternalLink, Loader2,
} from 'lucide-react';
import { getSession, isAdmin } from '@/lib/auth';
import { adminApi, formatRupiah } from '@/lib/api';
import { useRouter } from 'next/navigation';

const PLANS = ['free', 'pro', 'admin', 'banned'] as const;
type Plan = (typeof PLANS)[number];

interface AdminUser {
  user_id:           string;
  email:             string;
  whatsapp:          string;
  store_name:        string;
  subscription_plan: Plan;
  created_at:        string;
  role:              string;
}

export default function AdminPage() {
  const router  = useRouter();
  const session = getSession();

  const [stats,   setStats]   = useState<Record<string, number>>({});
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<Plan | 'all'>('all');
  const [toast,   setToast]   = useState<{ msg: string; type: 'ok'|'err' } | null>(null);
  const [acting,  setActing]  = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) { router.replace('/dashboard'); return; }
    load();
  }, []);

  async function load() {
    if (!session) return;
    setLoading(true);
    const res = await adminApi.getData(session.token);
    if (res.success) {
      setStats((res as any).stats || {});
      setUsers((res as any).users || []);
    }
    setLoading(false);
  }

  function showToast(msg: string, type: 'ok'|'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function changePlan(userId: string, plan: Plan) {
    if (!session) return;
    setActing(userId);
    const res = await adminApi.updateSubscription(session.token, userId, plan);
    if (res.success) {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, subscription_plan: plan } : u));
      showToast(`Plan berhasil diubah ke ${plan}`);
    } else {
      showToast(res.message || 'Gagal mengubah plan', 'err');
    }
    setActing(null);
  }

  async function banUser(userId: string) {
    if (!confirm('Ban user ini?')) return;
    if (!session) return;
    setActing(userId);
    const res = await adminApi.banUser(session.token, userId);
    if (res.success) {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, subscription_plan: 'banned' } : u));
      showToast('User di-ban');
    } else {
      showToast(res.message || 'Gagal ban user', 'err');
    }
    setActing(null);
  }

  const filtered = users.filter(u => {
    const matchSearch = u.email.includes(search) || u.store_name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.subscription_plan === filter;
    return matchSearch && matchFilter;
  });

  const planBadge = (plan: Plan) => {
    const m = { free: 'badge-gray', pro: 'badge-green', admin: 'badge-blue', banned: 'badge-red' };
    return m[plan] || 'badge-gray';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-card-lg text-sm font-semibold animate-slide-up ${
          toast.type === 'ok' ? 'bg-brand-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Topbar */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-display font-bold text-sm">Admin Panel</span>
          <span className="badge-green badge text-xs">AI Commerce OS</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <a href="/dashboard" className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" /> Dashboard
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { icon: Users,     label: 'Total Users',    value: stats.total_users    ?? 0, color: 'text-blue-500',   bg: 'bg-blue-50' },
            { icon: ShoppingBag,label:'Free',           value: stats.total_free     ?? 0, color: 'text-slate-500',  bg: 'bg-slate-100' },
            { icon: Crown,     label: 'Pro',            value: stats.total_pro      ?? 0, color: 'text-yellow-500', bg: 'bg-yellow-50' },
            { icon: BarChart3, label: 'Total Produk',   value: stats.total_products ?? 0, color: 'text-purple-500', bg: 'bg-purple-50' },
            { icon: BarChart3, label: 'Total Visits',   value: stats.total_visits   ?? 0, color: 'text-green-500',  bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${s.bg}`}>
                <s.icon className={`${s.color}`} style={{ width: 16, height: 16 }} />
              </div>
              <div className="text-xl font-display font-bold text-slate-900">{s.value.toLocaleString('id-ID')}</div>
              <div className="text-xs text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Users Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="font-display font-semibold text-slate-900 flex-1">Manajemen User</h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari email atau toko..."
                  className="input pl-9 text-xs py-2"
                />
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value as Plan | 'all')}
                className="input text-xs py-2 w-auto"
              >
                <option value="all">Semua Plan</option>
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Bergabung</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(u => (
                    <tr key={u.user_id} className={`hover:bg-slate-50 transition-colors ${u.subscription_plan === 'banned' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{u.email[0].toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate text-xs">{u.store_name}</p>
                            <p className="text-slate-400 text-xs truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs hidden sm:table-cell">{u.whatsapp || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${planBadge(u.subscription_plan)}`}>
                          {u.subscription_plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <select
                            value={u.subscription_plan}
                            onChange={e => changePlan(u.user_id, e.target.value as Plan)}
                            disabled={acting === u.user_id}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          {acting === u.user_id && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />}
                          <a
                            href={`/s/${u.store_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            target="_blank"
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Tidak ada user ditemukan
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
