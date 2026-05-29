'use client';

import { useState } from 'react';
import {
  Sparkles, FileText, Instagram, Hash, Type,
  Lightbulb, MessageCircle, Copy, Check, Crown,
  Loader2, ChevronDown, ChevronUp, Zap,
} from 'lucide-react';
import { getSession, isPro } from '@/lib/auth';
import { aiApi } from '@/lib/api';

type Tool =
  | 'description' | 'caption' | 'hashtags'
  | 'title' | 'content-ideas' | 'auto-reply';

interface ToolDef {
  id:    Tool;
  icon:  React.ElementType;
  label: string;
  desc:  string;
  color: string;
  bg:    string;
}

const TOOLS: ToolDef[] = [
  { id: 'description',  icon: FileText,       label: 'Deskripsi Produk',  desc: 'Generate deskripsi produk yang menarik & SEO-friendly',      color: 'text-blue-500',   bg: 'bg-blue-50' },
  { id: 'caption',      icon: Instagram,      label: 'Caption TikTok/IG', desc: 'Buat caption viral untuk TikTok dan Instagram',              color: 'text-pink-500',   bg: 'bg-pink-50' },
  { id: 'hashtags',     icon: Hash,           label: 'Hashtag Generator', desc: 'Generate 30 hashtag viral untuk pasar Indonesia',             color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'title',        icon: Type,           label: 'Judul Produk',      desc: 'Optimasi judul produk untuk Shopee, Tokopedia & TikTok Shop', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'content-ideas',icon: Lightbulb,      label: 'Ide Konten',        desc: 'Dapatkan 10 ide konten video kreatif untuk produk kamu',      color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'auto-reply',   icon: MessageCircle,  label: 'Auto Reply',        desc: 'Generate balasan customer yang ramah dan persuasif',          color: 'text-green-500',  bg: 'bg-green-50' },
];

const PLATFORMS  = ['TikTok', 'Instagram', 'Instagram Reels', 'Shopee', 'Tokopedia', 'WhatsApp Status'];
const CATEGORIES = ['Fashion', 'Makanan & Minuman', 'Kecantikan', 'Elektronik', 'Rumah Tangga', 'Lainnya'];

export default function AIToolsPage() {
  const session  = getSession();
  const pro      = isPro();

  const [activeTool, setActiveTool] = useState<Tool>('description');
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState('');
  const [copied,     setCopied]     = useState(false);

  // Form state per tool
  const [productName,   setProductName]   = useState('');
  const [price,         setPrice]         = useState('');
  const [category,      setCategory]      = useState('');
  const [keywords,      setKeywords]      = useState('');
  const [platform,      setPlatform]      = useState('TikTok');
  const [tone,          setTone]          = useState('casual dan engaging');
  const [currentTitle,  setCurrentTitle]  = useState('');
  const [customerMsg,   setCustomerMsg]   = useState('');
  const [storeName,     setStoreName]     = useState(session?.user.store_name || '');

  function copyResult() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generate() {
    if (!session) return;
    if (!productName.trim() && activeTool !== 'auto-reply') {
      alert('Masukkan nama produk terlebih dahulu');
      return;
    }
    if (activeTool === 'auto-reply' && !customerMsg.trim()) {
      alert('Masukkan pesan customer terlebih dahulu');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      let res: Record<string, unknown> = {};

      switch (activeTool) {
        case 'description':
          res = await aiApi.generateDescription(session.token, {
            product_name: productName, category, keywords, price: Number(price) || undefined,
          });
          setResult((res.description as string) || '');
          break;

        case 'caption':
          res = await aiApi.generateCaption(session.token, {
            product_name: productName, platform, tone, price: Number(price) || undefined,
          });
          setResult((res.caption as string) || '');
          break;

        case 'hashtags':
          res = await aiApi.generateHashtags(session.token, {
            product_name: productName, category, platform,
          });
          setResult((res.hashtags as string) || '');
          break;

        case 'title':
          res = await aiApi.generateTitle(session.token, {
            product_name: productName, category, current_title: currentTitle,
          });
          setResult((res.titles as string) || '');
          break;

        case 'content-ideas':
          res = await aiApi.generateContentIdeas(session.token, {
            product_name: productName, platform, store_name: storeName,
          });
          setResult((res.ideas as string) || '');
          break;

        case 'auto-reply':
          res = await aiApi.generateAutoReply(session.token, {
            customer_message: customerMsg,
            product_name:     productName,
            store_name:       storeName,
          });
          setResult((res.replies as string) || '');
          break;
      }

      if (!res.success) {
        setResult(`❌ ${(res.message as string) || 'Gagal generate konten.'}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const tool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div className="page-content space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">AI Tools</h1>
        <p className="section-subtitle">Generate konten otomatis untuk produk dan toko kamu</p>
      </div>

      {/* Pro gate */}
      {!pro && (
        <div className="card bg-gradient-to-br from-brand-900 to-brand-800 border-0 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg mb-1">Fitur AI butuh Plan Pro</h3>
              <p className="text-brand-200 text-sm mb-3">
                Upgrade ke Pro untuk menggunakan semua 6 fitur AI. Generate deskripsi, caption viral,
                hashtag, dan strategi konten dengan satu klik.
              </p>
              <button className="btn btn-sm bg-white text-brand-700 hover:bg-brand-50 focus:ring-white">
                <Zap className="w-3.5 h-3.5" />
                Upgrade Sekarang — Rp 99rb/bln
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── TOOL SELECTOR ── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pilih Tool</p>
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setResult(''); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150 ${
                activeTool === t.id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-white border border-slate-100 hover:border-brand-200 hover:shadow-card text-slate-700'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                activeTool === t.id ? 'bg-white/20' : t.bg
              }`}>
                <t.icon className={`w-4 h-4 ${activeTool === t.id ? 'text-white' : t.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-none mb-1 ${activeTool === t.id ? 'text-white' : 'text-slate-800'}`}>{t.label}</p>
                <p className={`text-xs line-clamp-1 ${activeTool === t.id ? 'text-white/70' : 'text-slate-400'}`}>{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── INPUT + OUTPUT ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tool header */}
          <div className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.bg}`}>
              <tool.icon className={`w-5 h-5 ${tool.color}`} />
            </div>
            <div>
              <h2 className="font-display font-semibold text-slate-900">{tool.label}</h2>
              <p className="text-slate-500 text-xs">{tool.desc}</p>
            </div>
          </div>

          {/* Input form */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-800 text-sm">Input</h3>

            {/* Product name — shown for all except auto-reply as optional */}
            {activeTool !== 'auto-reply' && (
              <div className="form-group">
                <label className="label">
                  Nama Produk <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="Contoh: Gamis Wanita Terbaru"
                  className="input"
                />
              </div>
            )}

            {/* Tool-specific fields */}
            {activeTool === 'description' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Harga (opsional)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="input" />
                  </div>
                  <div className="form-group">
                    <label className="label">Kategori</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                      <option value="">Pilih kategori</option>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Kata Kunci Tambahan</label>
                  <input type="text" value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="premium, original, bestseller..." className="input" />
                </div>
              </>
            )}

            {activeTool === 'caption' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Platform</label>
                    <select value={platform} onChange={e => setPlatform(e.target.value)} className="input">
                      {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Harga (opsional)</label>
                    <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Tone</label>
                  <input type="text" value={tone} onChange={e => setTone(e.target.value)} placeholder="casual, formal, lucu, dll" className="input" />
                </div>
              </>
            )}

            {activeTool === 'hashtags' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                    <option value="">Semua</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className="input">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            )}

            {activeTool === 'title' && (
              <>
                <div className="form-group">
                  <label className="label">Judul Saat Ini (opsional)</label>
                  <input type="text" value={currentTitle} onChange={e => setCurrentTitle(e.target.value)} placeholder="Masukkan judul yang ingin dioptimasi" className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input">
                    <option value="">Pilih kategori</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            {activeTool === 'content-ideas' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Platform</label>
                  <select value={platform} onChange={e => setPlatform(e.target.value)} className="input">
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Nama Toko</label>
                  <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Nama toko kamu" className="input" />
                </div>
              </div>
            )}

            {activeTool === 'auto-reply' && (
              <>
                <div className="form-group">
                  <label className="label">Pesan Customer <span className="text-red-400">*</span></label>
                  <textarea
                    value={customerMsg}
                    onChange={e => setCustomerMsg(e.target.value)}
                    placeholder="Contoh: Kak berapa harga gamis yang warna pink?"
                    className="input min-h-[80px] resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Produk (opsional)</label>
                    <input type="text" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Nama produk" className="input" />
                  </div>
                  <div className="form-group">
                    <label className="label">Nama Toko</label>
                    <input type="text" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Nama toko" className="input" />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={generate}
              disabled={loading || !pro}
              className="btn-primary btn w-full justify-center"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI sedang generate...</>
              ) : !pro ? (
                <><Crown className="w-4 h-4" /> Butuh Upgrade Pro</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate dengan AI</>
              )}
            </button>
          </div>

          {/* Output */}
          {result && (
            <div className="card space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  Hasil AI
                </h3>
                <button
                  onClick={copyResult}
                  className="btn-secondary btn btn-sm"
                >
                  {copied ? <><Check className="w-3.5 h-3.5" /> Tersalin!</> : <><Copy className="w-3.5 h-3.5" /> Salin</>}
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto scrollbar-hide">
                {result}
              </div>
              <p className="text-xs text-slate-400">
                💡 Hasil AI bisa diedit sesuai kebutuhan. Klik "Salin" untuk menyalin ke clipboard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
