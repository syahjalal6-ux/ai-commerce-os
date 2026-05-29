'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Package, X, Loader2,
  ImagePlus, Crown, AlertCircle, Check, Eye, EyeOff,
} from 'lucide-react';
import { getSession, isPro } from '@/lib/auth';
import { productsApi, uploadApi, formatRupiah } from '@/lib/api';
import type { Product } from '@/lib/api';

const CATEGORIES = [
  'Fashion', 'Makanan & Minuman', 'Kecantikan & Perawatan',
  'Elektronik', 'Rumah Tangga', 'Kesehatan', 'Hobi & Olahraga',
  'Buku & Alat Tulis', 'Otomotif', 'Pertanian', 'Lainnya',
];

const EMPTY_FORM = {
  product_name: '', price: '', description: '',
  stock: '', category: 'Lainnya', image_urls: [] as string[], is_active: true,
};

export default function ProductsPage() {
  const session = getSession();
  const pro     = isPro();

  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState<'add' | 'edit' | null>(null);
  const [editing,   setEditing]   = useState<Product | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [toast,     setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    if (!session) return;
    setLoading(true);
    const res = await productsApi.getAll(session.token);
    if (res.success) setProducts((res as any).products || []);
    setLoading(false);
  }

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal('add');
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      product_name: p.product_name,
      price:        String(p.price),
      description:  p.description,
      stock:        String(p.stock),
      category:     p.category,
      image_urls:   [...p.image_urls],
      is_active:    p.is_active,
    });
    setModal('edit');
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !session) return;

    const maxImgs = pro ? 20 : 5;
    if (form.image_urls.length + files.length > maxImgs) {
      showToast(`Maksimal ${maxImgs} gambar per produk`, 'err');
      return;
    }

    // Validate file sizes (max 5MB each)
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        showToast(`${f.name} terlalu besar. Maks 5MB per gambar.`, 'err');
        return;
      }
    }

    setUploading(true);
    const urls: string[] = [];

    for (const file of files) {
      const res = await uploadApi.image(session.token, file);
      if (res.success) {
        urls.push((res as any).image_url);
      } else {
        showToast(`Gagal upload ${file.name}: ${res.message}`, 'err');
      }
    }

    if (urls.length > 0) {
      setForm(prev => ({ ...prev, image_urls: [...prev.image_urls, ...urls] }));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removeImage(idx: number) {
    setForm(prev => ({ ...prev, image_urls: prev.image_urls.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    if (!session) return;
    if (!form.product_name.trim()) { showToast('Nama produk wajib diisi', 'err'); return; }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      showToast('Harga tidak valid', 'err'); return;
    }

    setSaving(true);
    try {
      let res;
      if (modal === 'add') {
        res = await productsApi.create(session.token, {
          product_name: form.product_name.trim(),
          price:        Number(form.price),
          description:  form.description.trim(),
          stock:        Number(form.stock) || 0,
          category:     form.category,
          image_urls:   form.image_urls,
          is_active:    form.is_active,
        });
      } else {
        res = await productsApi.update(session.token, {
          product_id:   editing!.product_id,
          product_name: form.product_name.trim(),
          price:        Number(form.price),
          description:  form.description.trim(),
          stock:        Number(form.stock) || 0,
          category:     form.category,
          image_urls:   form.image_urls,
          is_active:    form.is_active,
        });
      }

      if (!res.success) { showToast(res.message || 'Gagal menyimpan', 'err'); return; }

      showToast(modal === 'add' ? 'Produk berhasil ditambahkan!' : 'Produk berhasil diperbarui!');
      setModal(null);
      loadProducts();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(productId: string, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    if (!session) return;
    setDeleting(productId);
    const res = await productsApi.delete(session.token, productId);
    if (res.success) {
      showToast('Produk dihapus');
      setProducts(prev => prev.filter(p => p.product_id !== productId));
    } else {
      showToast(res.message || 'Gagal menghapus', 'err');
    }
    setDeleting(null);
  }

  async function toggleActive(p: Product) {
    if (!session) return;
    const res = await productsApi.update(session.token, {
      product_id: p.product_id, is_active: !p.is_active,
    });
    if (res.success) {
      setProducts(prev => prev.map(x => x.product_id === p.product_id ? { ...x, is_active: !x.is_active } : x));
    }
  }

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
          <h1 className="section-title">Kelola Produk</h1>
          <p className="section-subtitle">
            {pro ? `${products.length} produk` : `${products.length}/5 produk (Free)`}
          </p>
        </div>
        <button
          onClick={openAdd}
          disabled={!pro && products.length >= 5}
          className="btn-primary btn btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Produk
        </button>
      </div>

      {/* Free plan limit warning */}
      {!pro && products.length >= 5 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-amber-800 text-sm font-semibold">Batas produk gratis tercapai</p>
            <p className="text-amber-600 text-xs mt-0.5">Upgrade ke Pro untuk produk unlimited.</p>
          </div>
          <button className="btn btn-sm bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400">
            Upgrade Pro
          </button>
        </div>
      )}

      {/* Products Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <Package className="w-14 h-14 text-slate-200 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-slate-600 mb-2">Belum ada produk</h3>
          <p className="text-slate-400 text-sm mb-6">Tambahkan produk pertama kamu untuk mulai berjualan.</p>
          <button onClick={openAdd} className="btn-primary btn mx-auto">
            <Plus className="w-4 h-4" />
            Tambah Produk Pertama
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.product_id} className={`card flex flex-col gap-3 ${!p.is_active ? 'opacity-60' : ''}`}>
              {/* Image */}
              <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100">
                {p.image_urls[0] ? (
                  <img src={p.image_urls[0]} alt={p.product_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    <Package className="w-8 h-8 text-slate-300" />
                    <span className="text-xs text-slate-400">Tanpa gambar</span>
                  </div>
                )}
                {p.image_urls.length > 1 && (
                  <span className="absolute bottom-2 right-2 badge-gray badge text-xs">
                    +{p.image_urls.length - 1} foto
                  </span>
                )}
                {!p.is_active && (
                  <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                    <span className="badge-gray badge text-xs">Nonaktif</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{p.product_name}</h3>
                  <span className="badge-gray badge text-xs flex-shrink-0">{p.category}</span>
                </div>
                <p className="text-brand-600 font-bold text-base mt-1">{formatRupiah(p.price)}</p>
                <p className="text-slate-400 text-xs mt-0.5">Stok: {p.stock}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => toggleActive(p)}
                  className={`btn btn-sm flex-1 ${p.is_active ? 'btn-secondary' : 'btn-primary'}`}
                >
                  {p.is_active ? <><EyeOff className="w-3 h-3" /> Nonaktifkan</> : <><Eye className="w-3 h-3" /> Aktifkan</>}
                </button>
                <button onClick={() => openEdit(p)} className="btn-secondary btn btn-sm px-2.5">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(p.product_id, p.product_name)}
                  disabled={deleting === p.product_id}
                  className="btn-danger btn btn-sm px-2.5"
                >
                  {deleting === p.product_id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full sm:max-w-xl bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-display font-semibold text-slate-900">
                {modal === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* Product Name */}
              <div className="form-group">
                <label className="label">Nama Produk <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="Masukkan nama produk"
                  className="input"
                  maxLength={100}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Harga (Rp) <span className="text-red-400">*</span></label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0"
                    className="input"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Stok</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                    placeholder="0"
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Kategori</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Deskripsi Produk</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Deskripsikan produk kamu..."
                  className="input min-h-[100px] resize-none"
                  rows={4}
                />
              </div>

              {/* Images */}
              <div className="form-group">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">
                    Foto Produk
                    <span className="text-slate-400 font-normal text-xs ml-1">
                      ({form.image_urls.length}/{pro ? 20 : 5})
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {form.image_urls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-5 h-5 text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 badge-green badge text-xs">Utama</span>
                      )}
                    </div>
                  ))}

                  {form.image_urls.length < (pro ? 20 : 5) && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-brand-400 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-brand-500 transition-colors bg-slate-50"
                    >
                      {uploading
                        ? <Loader2 className="w-5 h-5 animate-spin" />
                        : <><ImagePlus className="w-5 h-5" /><span className="text-xs">Upload</span></>
                      }
                    </button>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  Format: JPG, PNG, WebP. Maks 5MB per gambar.
                  {!pro && ' Maks 5 gambar (Free).'}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-700">Status Produk</p>
                  <p className="text-xs text-slate-400">Produk aktif akan tampil di toko</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-brand-500' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setModal(null)} className="btn-secondary btn flex-1 justify-center">
                Batal
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary btn flex-1 justify-center">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : 'Simpan Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
