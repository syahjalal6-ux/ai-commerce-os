'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Store, Palette, ImagePlus, Save, ExternalLink,
  Loader2, Check, AlertCircle, Copy, QrCode,
} from 'lucide-react';
import { getSession } from '@/lib/auth';
import { storeApi, uploadApi, buildStoreUrl } from '@/lib/api';
import type { Store as StoreType } from '@/lib/api';

const THEMES = [
  { label: 'Hijau (Default)', value: '#059669' },
  { label: 'Biru',            value: '#2563EB' },
  { label: 'Merah',           value: '#DC2626' },
  { label: 'Ungu',            value: '#7C3AED' },
  { label: 'Orange',          value: '#EA580C' },
  { label: 'Pink',            value: '#DB2777' },
  { label: 'Teal',            value: '#0891B2' },
  { label: 'Abu-abu',         value: '#475569' },
];

export default function StoreSettingsPage() {
  const session = getSession();

  const [store,     setStore]     = useState<StoreType | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [uploadingLogo,  setUploadingLogo]  = useState(false);
  const [uploadingBanner,setUploadingBanner]= useState(false);

  // Form state
  const [themeColor,   setThemeColor]   = useState('#059669');
  const [description,  setDescription]  = useState('');
  const [logoUrl,      setLogoUrl]      = useState('');
  const [bannerUrl,    setBannerUrl]    = useState('');

  const logoRef   = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadStore(); }, []);

  async function loadStore() {
    if (!session) return;
    setLoading(true);
    const res = await storeApi.get(session.token);
    if (res.success) {
      const s = (res as any).store as StoreType;
      setStore(s);
      setThemeColor(s.theme_color || '#059669');
      setDescription(s.store_description || '');
      setLogoUrl(s.logo_url || '');
      setBannerUrl(s.banner_url || '');
    }
    setLoading(false);
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    const res = await storeApi.update(session.token, {
      theme_color:       themeColor,
      store_description: description,
      logo_url:          logoUrl,
      banner_url:        bannerUrl,
    });
    if (res.success) showToast('Pengaturan toko berhasil disimpan!');
    else showToast(res.message || 'Gagal menyimpan', 'err');
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Logo maks 2MB', 'err'); return; }
    setUploadingLogo(true);
    const res = await uploadApi.image(session.token, file);
    if (res.success) setLogoUrl((res as any).image_url);
    else showToast('Gagal upload logo', 'err');
    setUploadingLogo(false);
    if (logoRef.current) logoRef.current.value = '';
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Banner maks 5MB', 'err'); return; }
    setUploadingBanner(true);
    const res = await uploadApi.image(session.token, file);
    if (res.success) setBannerUrl((res as any).image_url);
    else showToast('Gagal upload banner', 'err');
    setUploadingBanner(false);
    if (bannerRef.current) bannerRef.current.value = '';
  }

  function copyUrl() {
    if (!session) return;
    navigator.clipboard.writeText(buildStoreUrl(session.user.slug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="page-content space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    );
  }

  const storeUrl  = buildStoreUrl(session?.user.slug || '');
  const previewBg = themeColor;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Pengaturan Toko</h1>
          <p className="section-subtitle">Kustomisasi tampilan toko online kamu</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/s/${session?.user.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn btn-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Preview
          </a>
          <button onClick={handleSave} disabled={saving} className="btn-primary btn btn-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── FORM ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Store URL */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Store className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold text-slate-900">URL Toko</h2>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <span className="font-mono text-sm text-slate-700 flex-1 truncate">{storeUrl}</span>
              <button onClick={copyUrl} className="btn-secondary btn btn-sm flex-shrink-0">
                {copied ? <><Check className="w-3 h-3" /> OK</> : <><Copy className="w-3 h-3" /> Salin</>}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              URL toko tidak bisa diubah setelah dibuat.
            </p>
          </div>

          {/* Description */}
          <div className="card">
            <h2 className="font-display font-semibold text-slate-900 mb-4">Deskripsi Toko</h2>
            <div className="form-group">
              <label className="label">Deskripsi singkat tentang toko kamu</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Contoh: Toko fashion wanita terpercaya. Kualitas premium, harga bersahabat. Fast respon & pengiriman cepat!"
                className="input resize-none"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{description.length}/300</p>
            </div>
          </div>

          {/* Theme Color */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold text-slate-900">Warna Tema</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {THEMES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setThemeColor(t.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    themeColor === t.value
                      ? 'border-slate-900 shadow-md'
                      : 'border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full shadow-inner" style={{ background: t.value }} />
                  <span className="text-xs text-slate-600 leading-tight text-center">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 form-group">
              <label className="label">Atau masukkan hex color custom</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <input
                  type="text"
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value)}
                  placeholder="#059669"
                  className="input flex-1"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold text-slate-900">Logo Toko</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-8 h-8 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <button
                  onClick={() => logoRef.current?.click()}
                  disabled={uploadingLogo}
                  className="btn-secondary btn btn-sm mb-2"
                >
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                  {uploadingLogo ? 'Mengupload...' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button onClick={() => setLogoUrl('')} className="block text-xs text-red-500 hover:underline">
                    Hapus logo
                  </button>
                )}
                <p className="text-xs text-slate-400 mt-1">PNG/JPG, maks 2MB. Kotak atau bulat terbaik.</p>
              </div>
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>

          {/* Banner */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <ImagePlus className="w-4 h-4 text-brand-600" />
              <h2 className="font-display font-semibold text-slate-900">Banner Toko</h2>
            </div>
            {bannerUrl ? (
              <div className="relative rounded-xl overflow-hidden mb-3 h-28">
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                <button
                  onClick={() => setBannerUrl('')}
                  className="absolute top-2 right-2 btn-danger btn btn-sm px-2"
                >
                  Hapus
                </button>
              </div>
            ) : (
              <div
                onClick={() => bannerRef.current?.click()}
                className="h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors mb-3"
              >
                {uploadingBanner
                  ? <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  : <><ImagePlus className="w-6 h-6 text-slate-300" /><span className="text-xs text-slate-400">Klik untuk upload banner</span></>
                }
              </div>
            )}
            <button
              onClick={() => bannerRef.current?.click()}
              disabled={uploadingBanner}
              className="btn-secondary btn btn-sm"
            >
              {uploadingBanner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
              {bannerUrl ? 'Ganti Banner' : 'Upload Banner'}
            </button>
            <p className="text-xs text-slate-400 mt-2">Rasio 3:1 terbaik (contoh: 1200×400px). Maks 5MB.</p>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview Toko</p>

            {/* Phone mockup */}
            <div className="relative mx-auto max-w-xs">
              <div className="border-[8px] border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                {/* Phone screen */}
                <div className="bg-white">
                  {/* Banner */}
                  <div className="h-24 relative" style={{ background: previewBg }}>
                    {bannerUrl ? (
                      <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full opacity-20"
                        style={{ background: `repeating-linear-gradient(45deg, rgba(255,255,255,.1), rgba(255,255,255,.1) 10px, transparent 10px, transparent 20px)` }}
                      />
                    )}
                    {/* Logo */}
                    <div className="absolute -bottom-6 left-4">
                      <div className="w-14 h-14 rounded-2xl border-3 border-white shadow-card-md overflow-hidden bg-white flex items-center justify-center" style={{ border: '3px solid white' }}>
                        {logoUrl
                          ? <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                          : <Store className="w-6 h-6" style={{ color: previewBg }} />
                        }
                      </div>
                    </div>
                  </div>

                  {/* Store info */}
                  <div className="px-4 pt-9 pb-4">
                    <h3 className="font-display font-bold text-slate-900 text-sm">{session?.user.store_name}</h3>
                    {description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
                    )}
                    {/* Fake product grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-xl overflow-hidden bg-slate-100">
                          <div className="h-16 bg-slate-200" />
                          <div className="p-2">
                            <div className="h-2.5 bg-slate-300 rounded w-3/4 mb-1" />
                            <div className="h-2.5 rounded w-1/2" style={{ background: previewBg, opacity: 0.6 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Tampilan aktual mungkin sedikit berbeda
            </p>
          </div>
        </div>
      </div>

      {/* Save button (mobile) */}
      <div className="lg:hidden sticky bottom-4">
        <button onClick={handleSave} disabled={saving} className="btn-primary btn w-full justify-center shadow-card-lg">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
        </button>
      </div>
    </div>
  );
}
