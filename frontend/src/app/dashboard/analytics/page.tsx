'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import {
  Eye, Users, MessageCircle, TrendingUp,
  BarChart3, RefreshCw, Crown, Trophy,
} from 'lucide-react';
import { getSession, isPro } from '@/lib/auth';
import { analyticsApi } from '@/lib/api';
import type { Analytics } from '@/lib/api';

const CHART_COLOR  = '#059669';
const ACCENT_COLOR = '#6366f1';
const COLORS = ['#059669', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const session = getSession();
  const pro     = isPro();

  const [data,      setData]    = useState<Analytics | null>(null);
  const [loading,   setLoading] = useState(true);
  const [refreshing,setRefresh] = useState(false);

  useEffect(() => { load(); }, []);

  async function load(refresh = false) {
    if (!session) return;
    if (refresh) setRefresh(true);
    else setLoading(true);

    const res = await analyticsApi.get(session.token);
    if (res.success) setData((res as any).analytics);

    setLoading(false);
    setRefresh(false);
  }

  // Format date for chart
  function fmtDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  const chartData = data?.daily_chart.map(d => ({
    date:     fmtDate(d.date),
    visitor:  d.visitors,
  })) ?? [];

  return (
    <div className="page-content space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Analitik Toko</h1>
          <p className="section-subtitle">Data 30 hari terakhir</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="btn-secondary btn btn-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Pro gate */}
      {!pro && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 text-sm font-semibold">Analitik lengkap tersedia di Pro</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Upgrade untuk lihat data 30 hari, sumber traffic, dan insight mendalam.
            </p>
          </div>
          <button className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400 flex-shrink-0">
            Upgrade
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : !data ? (
        <div className="card text-center py-16">
          <BarChart3 className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500">Belum ada data analitik. Bagikan link toko kamu untuk mulai mendapat pengunjung.</p>
        </div>
      ) : (
        <>
          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Eye}           label="Total Kunjungan" value={data.total_views.toLocaleString('id-ID')}     color="blue" />
            <StatCard icon={Users}         label="Visitor Unik"    value={data.unique_visitors.toLocaleString('id-ID')} color="purple" />
            <StatCard icon={MessageCircle} label="Klik WhatsApp"   value={data.total_wa_clicks.toLocaleString('id-ID')} color="green" />
            <StatCard icon={TrendingUp}    label="Konversi"        value={`${data.conversion_rate}%`}                   color="orange" />
          </div>

          {/* ── VISITOR CHART ── */}
          <div className="card">
            <h2 className="font-display font-semibold text-slate-900 mb-5">Kunjungan Harian (30 hari)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={CHART_COLOR} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.08)', fontSize: 12 }}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  formatter={(v: number) => [v, 'Visitor']}
                />
                <Area type="monotone" dataKey="visitor" stroke={CHART_COLOR} strokeWidth={2} fill="url(#colorVisitor)" dot={false} activeDot={{ r: 4, fill: CHART_COLOR }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── BOTTOM GRID ── */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="card">
              <div className="flex items-center gap-2 mb-5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="font-display font-semibold text-slate-900">Produk Terpopuler</h2>
              </div>
              {data.top_products.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">Belum ada klik produk</p>
              ) : (
                <div className="space-y-3">
                  {data.top_products.map((p, i) => {
                    const max = data.top_products[0].clicks;
                    const pct = max > 0 ? (p.clicks / max) * 100 : 0;
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                            <span className="text-sm text-slate-700 truncate max-w-[180px]">{p.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">{p.clicks}x</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Traffic Sources */}
            <div className="card">
              <h2 className="font-display font-semibold text-slate-900 mb-5">Sumber Traffic</h2>
              {data.referrers.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">Belum ada data traffic</p>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.referrers.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="source"
                      >
                        {data.referrers.slice(0, 6).map((_, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number, name: string) => [v, name]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-0 flex-1">
                    {data.referrers.slice(0, 6).map((r, i) => (
                      <div key={r.source} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-slate-600 truncate flex-1 capitalize">{r.source}</span>
                        <span className="text-xs font-semibold text-slate-400">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversion insight */}
          <div className="card bg-gradient-to-r from-brand-50 to-emerald-50 border-brand-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900 mb-1">Insight Konversi</h3>
                <p className="text-slate-600 text-sm">
                  {data.conversion_rate >= 5
                    ? `Konversi kamu ${data.conversion_rate}% — bagus! ${data.total_wa_clicks} dari ${data.total_views} pengunjung mengklik WhatsApp.`
                    : data.conversion_rate >= 2
                    ? `Konversi ${data.conversion_rate}%. Ada ruang untuk improvement — coba tambahkan foto produk yang lebih menarik.`
                    : `Konversi ${data.conversion_rate}%. Coba tingkatkan dengan menambahkan deskripsi produk yang lebih detail dan foto berkualitas.`
                  }
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const C = { blue: 'bg-blue-50 text-blue-500', purple: 'bg-purple-50 text-purple-500', green: 'bg-emerald-50 text-emerald-500', orange: 'bg-orange-50 text-orange-500' };
  const [bg, ic] = C[color].split(' ');
  return (
    <div className="stat-card">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
        <Icon className={`${ic}`} style={{ width: 18, height: 18 }} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
