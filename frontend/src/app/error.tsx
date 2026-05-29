'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-slate-500 mb-2">
          Halaman mengalami error tak terduga.
        </p>
        {error.message && (
          <p className="text-xs text-slate-400 bg-slate-100 rounded-xl px-4 py-2 mb-6 font-mono break-all">
            {error.message}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary btn">
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>
          <a href="/dashboard" className="btn-secondary btn">
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
