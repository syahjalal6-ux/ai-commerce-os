import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-8 h-8 text-brand-600" />
        </div>
        <h1 className="font-display text-6xl font-bold text-slate-900 mb-2">404</h1>
        <p className="text-xl font-semibold text-slate-700 mb-2">Halaman tidak ditemukan</p>
        <p className="text-slate-500 mb-8">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/" className="btn-primary btn">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
