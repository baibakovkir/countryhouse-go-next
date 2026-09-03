import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/plots", "/plot", "/expenses", "/timeline", "/login", "/register"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
