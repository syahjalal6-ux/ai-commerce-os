'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Share2, Copy, Check, QrCode } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { buildStoreUrl } from '@/lib/api';

export default function QRCodePage() {
  const session  = getSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied,  setCopied]  = useState(false);
  const [loaded,  setLoaded]  = useState(false);

  const storeUrl  = buildStoreUrl(session?.user.slug || '');
  const storeName = session?.user.store_name || 'Toko Kamu';

  useEffect(() => {
    generateQR();
  }, [storeUrl]);

  async function generateQR() {
    try {
      // Dynamic import to avoid SSR issues
      const QRCode = (await import('qrcode')).default;
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, storeUrl, {
        width:  280,
        margin: 2,
        color:  { dark: '#065f46', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setLoaded(true);
    } catch (err) {
      console.error('QR generation failed:', err);
    }
  }

  function downloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a larger canvas with branding
    const out = document.createElement('canvas');
    out.width  = 400;
    out.height = 480;
    const ctx  = out.getContext('2d')!;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, 400, 480, 20);
    ctx.fill();

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, 400, 80);
    grad.addColorStop(0, '#059669');
    grad.addColorStop(1, '#065f46');
    ctx.fillStyle = grad;
    ctx.roundRect(0, 0, 400, 80, [20, 20, 0, 0]);
    ctx.fill();

    // Store name in header
    ctx.fillStyle = '#ffffff';
    ctx.font      = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(storeName, 200, 35);
    ctx.font      = '13px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Scan untuk lihat toko', 200, 58);

    // QR code centered
    ctx.drawImage(canvas, 60, 95, 280, 280);

    // URL at bottom
    ctx.fillStyle = '#64748b';
    ctx.font      = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(storeUrl, 200, 420);

    // Branding
    ctx.fillStyle = '#94a3b8';
    ctx.font      = '10px system-ui, sans-serif';
    ctx.fillText('AI Commerce OS Indonesia', 200, 460);

    const link      = document.createElement('a');
    link.download   = `qr-${session?.user.slug || 'toko'}.png`;
    link.href       = out.toDataURL('image/png', 1.0);
    link.click();
  }

  function copyUrl() {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareUrl() {
    if (navigator.share) {
      navigator.share({ title: storeName, url: storeUrl });
    } else {
      copyUrl();
    }
  }

  return (
    <div className="page-content animate-fade-in">
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="section-title">QR Code Toko</h1>
          <p className="section-subtitle">Bagikan QR code ini agar pelanggan mudah menemukan toko kamu</p>
        </div>

        {/* QR Card */}
        <div className="card text-center">
          <div className="inline-flex flex-col items-center gap-4">
            {/* QR frame */}
            <div className="relative p-4 bg-white rounded-2xl border-2 border-brand-100 shadow-card-md">
              <canvas
                ref={canvasRef}
                className={`rounded-xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {!loaded && (
                <div className="absolute inset-4 flex items-center justify-center bg-slate-50 rounded-xl">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {/* Corner decorations */}
              {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
                <div key={i} className={`absolute ${pos} w-5 h-5 border-brand-500 ${
                  i < 2 ? 'border-t-2' : 'border-b-2'
                } ${i % 2 === 0 ? 'border-l-2' : 'border-r-2'} rounded-sm`} />
              ))}
            </div>

            <div>
              <p className="font-display font-bold text-slate-900 text-lg">{storeName}</p>
              <p className="text-slate-400 text-xs mt-1 font-mono break-all">{storeUrl}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <button
              onClick={downloadQR}
              disabled={!loaded}
              className="btn-primary btn btn-sm flex-col gap-1 py-3 h-auto"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs">Download</span>
            </button>
            <button onClick={copyUrl} className="btn-secondary btn btn-sm flex-col gap-1 py-3 h-auto">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs">{copied ? 'Tersalin!' : 'Salin URL'}</span>
            </button>
            <button onClick={shareUrl} className="btn-wa btn btn-sm flex-col gap-1 py-3 h-auto">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Bagikan</span>
            </button>
          </div>
        </div>

        {/* Usage tips */}
        <div className="card bg-brand-50 border-brand-100">
          <h3 className="font-semibold text-brand-900 text-sm mb-3">💡 Tips Penggunaan QR Code</h3>
          <ul className="space-y-2 text-sm text-brand-700">
            {[
              'Print dan tempel di depan toko fisik atau stand bazaar',
              'Bagikan di WhatsApp Story dan Instagram untuk promosi',
              'Tambahkan ke kartu nama digital atau brosur',
              'Tempel di packaging produk untuk re-order mudah',
              'Share ke grup WhatsApp komunitas pembeli',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-500 font-bold flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
