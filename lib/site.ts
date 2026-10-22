// Absolute base for canonical URLs, the sitemap and link previews. SITE_URL pins one domain when the
// site is served from several (custom domain, *.vercel.app, the legacy project); otherwise Vercel's
// production domain.
export const siteUrl = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")
).replace(/\/+$/, "")
