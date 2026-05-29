'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/lib/api';
import { setSession, isLoggedIn } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    store_name: '',
    email:      '',
    whatsapp:   '',
    password:   '',
    confirm:    '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showPw,  setShowPw]  = useState(false);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/dashboard');
  }, [router]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  function validate() {
    if (!form.store_name.trim()) return 'Nama toko wajib diisi';
    if (form.store_name.trim().length < 3) return 'Nama toko minimal 3 karakter';
    if (!form.email) return 'Email wajib diisi';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Format email tidak valid';
    if (!form.password) return 'Password wajib diisi';
    if (form.password.length < 6) return 'Password minimal 6 karakter';
    if (form.password !== form.confirm) return 'Password tidak cocok';
    return '';
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validErr = validate();
    if (validErr) { setError(validErr); return; }

    setLoading(true);
    setError('');

    try {
      const res = await authApi.register({
        store_name: form.store_name.trim(),
        email:      form.email.trim().toLowerCase(),
        whatsapp:   form.whatsapp.trim(),
        password:   form.password,
      });

      if (!res.success) {
        setError(res.message || 'Pendaftaran gagal');
        return;
      }

      setSession({ token: res.token as string, user: res.user as any });
      router.replace('/dashboard');
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 6 ? 1
    : form.password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-emerald-50 flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-card-md">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 text-xl">AI Commerce OS</span>
          </Link>
          <p className="text-slate-500 text-sm mt-2">Buat toko online kamu sekarang — gratis!</p>
        </div>

        <div className="card shadow-card-lg">
          <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Daftar Akun Baru</h1>
          <p className="text-slate-500 text-sm mb-6">Selesai dalam 1 menit. Tidak perlu kartu kredit.</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="form-group">
              <label className="label">
                Nama Toko <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="store_name"
                value={form.store_name}
                onChange={onChange}
                placeholder="Contoh: Toko Cantik Jaya"
                className="input"
                autoComplete="organization"
                maxLength={60}
                required
              />
              {form.store_name && (
                <p className="text-xs text-slate-400 mt-1">
                  URL toko: <span className="text-brand-600 font-medium">
                    /s/{form.store_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}
                  </span>
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="label">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={onChange}
                placeholder="email@contoh.com"
                className="input"
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">
                Nomor WhatsApp
                <span className="text-slate-400 font-normal"> (untuk terima order)</span>
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={onChange}
                placeholder="08xxxxxxxxxx atau +628xxxxxxxxxx"
                className="input"
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label className="label">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  placeholder="Minimal 6 karakter"
                  className="input pr-11"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.password && (
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      pwStrength >= i
                        ? i === 1 ? 'bg-red-400'
                        : i === 2 ? 'bg-yellow-400'
                        : 'bg-brand-500'
                        : 'bg-slate-200'
                    }`} />
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="label">
                Konfirmasi Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  placeholder="Ulangi password"
                  className={`input pr-10 ${
                    form.confirm && form.confirm !== form.password
                      ? 'border-red-300 focus:ring-red-400'
                      : form.confirm && form.confirm === form.password
                      ? 'border-brand-400 focus:ring-brand-400'
                      : ''
                  }`}
                  autoComplete="new-password"
                  required
                />
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn w-full justify-center mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat Toko...
                </>
              ) : 'Buat Toko Gratis Sekarang 🚀'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            Dengan mendaftar, kamu menyetujui{' '}
            <span className="text-brand-600 cursor-pointer hover:underline">Syarat & Ketentuan</span> kami.
          </p>

          <p className="text-center text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
