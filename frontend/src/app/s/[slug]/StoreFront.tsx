'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Store, Search, X, ShoppingBag, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { analyticsApi, buildWhatsAppUrl, formatRupiah } from '@/lib/api';
import { getVisitorId } from '@/lib/auth';
import type { Store as StoreType, Product } from '@/lib/api';

export default function StoreFront({
  initialStore, initialProducts, slug,
}: {
  initialStore:    StoreType;
  initialProducts: Product[];
  slug:            string;
}) {
  const [store]    = useState<StoreType>(initialStore);
  const [products] = useState<Product[]>(initialProducts);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('Semua');
  const [selected, setSelected] = useState<Product | null>(null);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [shared,   setShared]   = useState(false);

  // Track visit once on mount
  useEffect(() => {
    const vid = getVisitorId();
    const ref = document.referrer
      ? new URL(document.referrer).hostname
      : 'direct';

    analyticsApi.track({
      slug,
      visitor_id: vid,
      referrer:   ref,
    });
  }, [slug]);

  // Track product click
  function trackProductClick(productName: string) {
    const vid = getVisitorId();
    analyticsApi.track({ slug, visitor_id: vid, clicked_product: productName });
  }

  // Track WA click
  function trackWAClick(productName: string) {
    const vid = getVisitorId();
    analyticsApi.track({ slug, visitor_id: vid, whatsapp_click: true, clicked_product: productName });
  }

  function openProduct(p: Product) {
    trackProductClick(p.product_name);
    setSelected(p);
    setImgIdx(0);
    document.body.style.overflow = 'hidden';
  }

  function closeProduct() {
    setSelected(null);
    document.body.style.overflow = '';
  }

  function orderViaWhatsApp(p: Product) {
    const msg = `Halo ${store.store_name}! 👋\n\nSaya ingin memesan:\n\n🛍️ *${p.product_name}*\n💰 Harga: ${formatRupiah(p.price)}\n\nMohon informasi ketersediaan dan cara pemesanannya ya. Terima kasih!`;
    trackWAClick(p.product_name);
    window.open(buildWhatsAppUrl(store.whatsapp || '', msg), '_blank');
  }

  function shareStore() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: store.store_name, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const filtered = products.filter(p => {
    const matchSearch   = p.product_name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'Semua' || p.category === category;
    return matchSearch && matchCategory && p.is_active;
  });

  const tc = store.theme_color || '#059669';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER / BANNER ── */}
      <div className="relative" style={{ background: tc }}>
        {store.banner_url ? (
          <img
            src={store.banner_url}
            alt="Banner"
            className="w-full h-40 sm:h-56 object-cover"
          />
        ) : (
          <div className="h-36 sm:h-48 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${tc} 0%, ${tc}cc 100%)` }}
          >
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)`, backgroundSize: '20px 20px' }}
            />
          </div>
        )}

        {/* Share button */}
        <button
          onClick={shareStore}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
        {shared && (
          <div className="absolute top-14 right-3 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg">
            Link tersalin!
          </div>
        )}

        {/* Logo + Name */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-0 flex items-end gap-3">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-[3px] border-white shadow-card-md overflow-hidden bg-white flex items-center justify-center translate-y-1/2">
            {store.logo_url ? (
              <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-8 h-8" style={{ color: tc }} />
            )}
          </div>
        </div>
      </div>

      {/* ── STORE INFO ── */}
      <div className="bg-white border-b border-slate-100 px-4 pt-12 pb-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-xl font-bold text-slate-900">{store.store_name}</h1>
          {store.store_description && (
            <p className="text-slate-500 text-sm mt-1 leading-relaxed">{store.store_description}</p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            {filtered.length} produk tersedia
          </p>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-3xl mx-auto px-4 py-5">
        {/* Search + Filter */}
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk..."
              className="input pl-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={category === cat ? { background: tc } : {}}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Products */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">
              {search ? `Tidak ada produk "${search}"` : 'Belum ada produk'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map(p => (
              <button
                key={p.product_id}
                onClick={() => openProduct(p)}
                className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-md transition-shadow text-left"
              >
                <div className="relative h-36 sm:h-44 overflow-hidden bg-slate-100">
                  {p.image_urls[0] ? (
                    <img
                      src={p.image_urls[0]}
                      alt={p.product_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-slate-300" />
                    </div>
                  )}
                  {p.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold bg-slate-800/80 px-2 py-1 rounded-full">Habis</span>
                    </div>
                  )}
                  {p.image_urls.length > 1 && (
                    <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
                      1/{p.image_urls.length}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{p.product_name}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: tc }}>{formatRupiah(p.price)}</p>
                  {p.stock > 0 && p.stock <= 10 && (
                    <p className="text-xs text-orange-500 mt-0.5">Sisa {p.stock}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer className="text-center py-8 mt-4">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ShoppingBag className="w-3 h-3" />
          Dibuat dengan AI Commerce OS
        </a>
      </footer>

      {/* ── PRODUCT DETAIL MODAL ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeProduct}
        >
          <div
            className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Image Gallery */}
            <div className="relative">
              <div className="h-64 sm:h-72 bg-slate-100 overflow-hidden">
                {selected.image_urls.length > 0 ? (
                  <img
                    src={selected.image_urls[imgIdx]}
                    alt={selected.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-slate-200" />
                  </div>
                )}
              </div>

              {/* Close */}
              <button
                onClick={closeProduct}
                className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-card hover:bg-slate-50"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>

              {/* Image nav */}
              {selected.image_urls.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx(i => (i - 1 + selected.image_urls.length) % selected.image_urls.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-card"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>
                  <button
                    onClick={() => setImgIdx(i => (i + 1) % selected.image_urls.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-card"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selected.image_urls.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className="w-1.5 h-1.5 rounded-full transition-all"
                        style={{ background: i === imgIdx ? tc : 'rgba(255,255,255,0.6)' }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">{selected.product_name}</h2>
                {selected.category && (
                  <span className="badge-gray badge text-xs flex-shrink-0">{selected.category}</span>
                )}
              </div>

              <p className="text-2xl font-bold mb-1" style={{ color: tc }}>{formatRupiah(selected.price)}</p>

              <p className={`text-xs font-semibold mb-3 ${selected.stock === 0 ? 'text-red-500' : selected.stock <= 10 ? 'text-orange-500' : 'text-emerald-500'}`}>
                {selected.stock === 0 ? '❌ Stok habis' : selected.stock <= 10 ? `⚠️ Sisa ${selected.stock} lagi` : `✅ Stok tersedia`}
              </p>

              {selected.description && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-1">Deskripsi</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{selected.description}</p>
                </div>
              )}
            </div>

            {/* Order Button */}
            <div className="px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => orderViaWhatsApp(selected)}
                disabled={selected.stock === 0}
                className="btn-wa btn w-full justify-center text-base py-3.5 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageCircle className="w-5 h-5" />
                {selected.stock === 0 ? 'Stok Habis' : 'Pesan via WhatsApp'}
              </button>
              <p className="text-center text-xs text-slate-400 mt-2">
                Chat langsung dengan penjual untuk konfirmasi pesanan
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
