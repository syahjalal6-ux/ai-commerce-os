import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Sora } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets:  ['latin'],
  variable: '--font-plus-jakarta',
  weight:   ['300', '400', '500', '600', '700', '800'],
  display:  'swap',
});

const sora = Sora({
  subsets:  ['latin'],
  variable: '--font-sora',
  weight:   ['400', '500', '600', '700', '800'],
  display:  'swap',
});

const APP_NAME    = process.env.NEXT_PUBLIC_APP_NAME    || 'AI Commerce OS';
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Platform Toko Online Cerdas untuk UMKM Indonesia';
const APP_URL     = process.env.NEXT_PUBLIC_APP_URL     || 'https://aicommerceos.id';

export const metadata: Metadata = {
  title: {
    default:  `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: 'Buat toko online kamu sendiri dalam 5 menit. Terima pesanan via WhatsApp, kelola produk, dan kembangkan bisnis dengan AI.',
  keywords:    ['toko online', 'jualan online', 'UMKM', 'olshop', 'WhatsApp', 'AI', 'Indonesia'],
  authors:     [{ name: 'AI Commerce OS' }],
  creator:     'AI Commerce OS',
  metadataBase: new URL(APP_URL),
  openGraph: {
    type:        'website',
    locale:      'id_ID',
    url:         APP_URL,
    title:       `${APP_NAME} — ${APP_TAGLINE}`,
    description: 'Buat toko online kamu sendiri dalam 5 menit. Gratis!',
    siteName:    APP_NAME,
  },
  twitter: {
    card:  'summary_large_image',
    title: `${APP_NAME} — ${APP_TAGLINE}`,
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width:              'device-width',
  initialScale:       1,
  maximumScale:       5,
  themeColor:         '#059669',
  colorScheme:        'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${plusJakarta.variable} ${sora.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
