'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="page-content flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
          Gagal memuat halaman
        </h2>
        <p className="text-slate-500 text-sm mb-2">
          Terjadi kesalahan saat memuat data. Periksa koneksi internet kamu.
        </p>
        {error.message && (
          <p className="text-xs text-slate-400 bg-slate-100 rounded-xl px-3 py-2 mb-5 font-mono break-all">
            {error.message}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <button onClick={reset} className="btn-primary btn btn-sm">
            <RefreshCw className="w-3.5 h-3.5" />
            Coba Lagi
          </button>
          <a href="/dashboard" className="btn-secondary btn btn-sm">
            <Home className="w-3.5 h-3.5" />
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
