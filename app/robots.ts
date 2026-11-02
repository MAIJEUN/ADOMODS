import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    // Images on the site load through the proxy, so it stays crawlable
    rules: { userAgent: "*", allow: ["/", "/api/proxy-image"], disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
