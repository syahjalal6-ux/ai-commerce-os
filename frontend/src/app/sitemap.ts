import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aicommerceos.id';

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              APP_URL,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1,
    },
    {
      url:              `${APP_URL}/register`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.8,
    },
    {
      url:              `${APP_URL}/login`,
      lastModified:     new Date(),
      changeFrequency:  'monthly',
      priority:         0.5,
    },
  ];

  // NOTE: For dynamic storefront pages (/s/[slug]),
  // add them here by fetching all public store slugs from your DB.
  // Example:
  // const stores = await fetchAllPublicSlugs();
  // const storePages = stores.map(slug => ({
  //   url: `${APP_URL}/s/${slug}`,
  //   lastModified: new Date(),
  //   changeFrequency: 'daily' as const,
  //   priority: 0.7,
  // }));
  // return [...staticPages, ...storePages];

  return staticPages;
}
