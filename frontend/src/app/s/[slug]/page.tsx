import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import StoreFront from './StoreFront';
import { serverGetPublicStore } from '@/lib/server-api';

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const data = await serverGetPublicStore(params.slug);
  if (!data.success) return { title: 'Toko tidak ditemukan' };

  const store = data.store as Record<string, string>;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';

  return {
    title:       `${store.store_name} | AI Commerce OS`,
    description: store.store_description || `Belanja produk pilihan dari ${store.store_name}. Pesan langsung via WhatsApp!`,
    metadataBase: APP_URL ? new URL(APP_URL) : undefined,
    openGraph: {
      title:       store.store_name,
      description: store.store_description || `Toko online ${store.store_name}`,
      images:      store.banner_url ? [store.banner_url] : store.logo_url ? [store.logo_url] : [],
      type:        'website',
      locale:      'id_ID',
    },
    twitter: {
      card:        'summary_large_image',
      title:       store.store_name,
      description: store.store_description || `Toko online ${store.store_name}`,
    },
  };
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const data = await serverGetPublicStore(params.slug);
  if (!data.success) notFound();

  return (
    <StoreFront
      initialStore={data.store as any}
      initialProducts={(data.products as any[]) || []}
      slug={params.slug}
    />
  );
}
