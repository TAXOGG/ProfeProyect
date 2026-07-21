import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/solicitar-acceso", "/login"],
      disallow: ["/dashboard", "/secciones", "/auth"],
    },
    sitemap: "https://arcecr.com/sitemap.xml",
  };
}
