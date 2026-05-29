'use client';

import { useState } from 'react';
import {
  User, Phone, Lock, Save, Loader2,
  Check, AlertCircle, Eye, EyeOff, Crown, LogOut,
} from 'lucide-react';
import { getSession, updateSessionUser, clearSession } from '@/lib/auth';
import { profileApi, authApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router  = useRouter();
  const session = getSession();

  // ── Profile form ──────────────────────────────────────────
  const [storeName, setStoreName] = useState(session?.user.store_name || '');
  const [whatsapp,  setWhatsapp]  = useState(session?.user.whatsapp || '');
  const [savingP,   setSavingP]   = useState(false);

  // ── Password form ─────────────────────────────────────────
  const [currentPw,  setCurrentPw]  = useState('');
  const [newPw,      setNewPw]      = useState('');
  const [confirmPw,  setConfirmPw]  = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [savingPw,   setSavingPw]   = useState(false);

  // ── Toast ─────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function saveProfile() {
    if (!session) return;
    if (!storeName.trim()) { showToast('Nama toko tidak boleh kosong', 'err'); return; }
    setSavingP(true);
    const res = await profileApi.update(session.token, {
      store_name: storeName.trim(),
      whatsapp:   whatsapp.trim(),
    });
    if (res.success) {
      updateSessionUser({ store_name: storeName.trim(), whatsapp: whatsapp.trim() });
      showToast('Profil berhasil diperbarui!');
    } else {
      showToast(res.message || 'Gagal menyimpan', 'err');
    }
    setSavingP(false);
  }

  async function savePassword() {
    if (!session) return;
    if (!currentPw)          { showToast('Password lama wajib diisi', 'err'); return; }
    if (!newPw)              { showToast('Password baru wajib diisi', 'err'); return; }
    if (newPw.length < 6)   { showToast('Password baru minimal 6 karakter', 'err'); return; }
    if (newPw !== confirmPw) { showToast('Konfirmasi password tidak cocok', 'err'); return; }

    setSavingPw(true);
    const res = await profileApi.changePassword(session.token, {
      current_password: currentPw,
      new_password:     newPw,
    });
    if (res.success) {
      showToast('Password berhasil diubah. Silakan login kembali.');
      setTimeout(async () => {
        await authApi.logout(session.token);
        clearSession();
        router.replace('/login');
      }, 2000);
    } else {
      showToast(res.message || 'Gagal mengubah password', 'err');
    }
    setSavingPw(false);
  }

  async function handleLogout() {
    if (!session) return;
    await authApi.logout(session.token);
    clearSession();
    router.replace('/login');
  }

  const plan = session?.user.subscription_plan || 'free';

  return (
    <div className="page-content space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-card-lg text-sm font-semibold animate-slide-up ${
          toast.type === 'ok' ? 'bg-brand-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'ok' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="section-title">Profil & Akun</h1>
        <p className="section-subtitle">Kelola informasi akun dan keamanan</p>
      </div>

      {/* Account overview */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-brand flex items-center justify-center flex-shrink-0">
            <span className="text-white text-2xl font-bold font-display">
              {session?.user.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-slate-900 text-lg truncate">
              {session?.user.store_name}
            </h2>
            <p className="text-slate-500 text-sm truncate">{session?.user.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`badge text-xs ${
                plan === 'pro' || plan === 'admin'
                  ? 'badge-green'
                  : plan === 'banned'
                  ? 'badge-red'
                  : 'badge-gray'
              }`}>
                {plan === 'pro' || plan === 'admin' ? <Crown className="w-2.5 h-2.5" /> : null}
                {plan === 'free' ? 'Akun Gratis' : plan === 'pro' ? 'Pro' : plan === 'admin' ? 'Admin' : 'Banned'}
              </span>
              <span className="text-xs text-slate-400">
                URL: /s/{session?.user.slug}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade banner for free users */}
      {plan === 'free' && (
        <div className="card bg-gradient-to-r from-brand-600 to-brand-800 border-0 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-300" />
                <span className="font-display font-bold">Upgrade ke Pro</span>
              </div>
              <p className="text-brand-200 text-sm">
                Produk unlimited + 6 fitur AI + Analitik lengkap. Hanya Rp 99.000/bulan.
              </p>
            </div>
            <a href="/dashboard/upgrade" className="btn btn-sm bg-white text-brand-700 hover:bg-brand-50 focus:ring-white flex-shrink-0">
              Upgrade
            </a>
          </div>
        </div>
      )}

      {/* Profile info */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" />
          <h2 className="font-display font-semibold text-slate-900">Informasi Toko</h2>
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            type="email"
            value={session?.user.email || ''}
            disabled
            className="input bg-slate-50 text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 mt-1">Email tidak dapat diubah.</p>
        </div>

        <div className="form-group">
          <label className="label">Nama Toko <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="Nama toko kamu"
            className="input"
            maxLength={60}
          />
        </div>

        <div className="form-group">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <label className="label mb-0">Nomor WhatsApp</label>
          </div>
          <input
            type="tel"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
            className="input"
          />
          <p className="text-xs text-slate-400 mt-1">
            Nomor ini digunakan untuk tombol "Pesan via WhatsApp" di toko kamu.
          </p>
        </div>

        <button onClick={saveProfile} disabled={savingP} className="btn-primary btn">
          {savingP
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            : <><Save className="w-4 h-4" /> Simpan Perubahan</>
          }
        </button>
      </div>

      {/* Change password */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-600" />
          <h2 className="font-display font-semibold text-slate-900">Ubah Password</h2>
        </div>

        <div className="form-group">
          <label className="label">Password Lama <span className="text-red-400">*</span></label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              placeholder="Masukkan password saat ini"
              className="input pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="label">Password Baru <span className="text-red-400">*</span></label>
          <input
            type={showPw ? 'text' : 'password'}
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="input"
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label className="label">Konfirmasi Password Baru <span className="text-red-400">*</span></label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Ulangi password baru"
              className={`input pr-10 ${
                confirmPw && confirmPw !== newPw
                  ? 'border-red-300 focus:ring-red-400'
                  : confirmPw && confirmPw === newPw
                  ? 'border-brand-400'
                  : ''
              }`}
              autoComplete="new-password"
            />
            {confirmPw && confirmPw === newPw && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
            )}
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-amber-800 text-xs">
            ⚠️ Mengubah password akan otomatis logout dari semua perangkat.
          </p>
        </div>

        <button onClick={savePassword} disabled={savingPw} className="btn-primary btn">
          {savingPw
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengubah...</>
            : <><Lock className="w-4 h-4" /> Ubah Password</>
          }
        </button>
      </div>

      {/* Danger zone */}
      <div className="card border-red-100">
        <h2 className="font-display font-semibold text-slate-900 mb-4">Zona Bahaya</h2>
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-red-800">Keluar dari akun</p>
            <p className="text-xs text-red-600 mt-0.5">Kamu perlu login ulang setelah keluar.</p>
          </div>
          <button onClick={handleLogout} className="btn-danger btn btn-sm">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
