import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://smartclaw.xyz";

const staticPages = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/premium", priority: "0.9", changefreq: "daily" },
    { loc: "/docs", priority: "0.8", changefreq: "weekly" },
    { loc: "/fxmint", priority: "0.7", changefreq: "daily" },
];

const discoveryFiles = [
    { loc: "/SKILL.md", priority: "0.8", changefreq: "weekly" },
    { loc: "/llms.txt", priority: "0.6", changefreq: "weekly" },
    { loc: "/agents.json", priority: "0.6", changefreq: "weekly" },
    { loc: "/.well-known/ai-plugin.json", priority: "0.5", changefreq: "monthly" },
    { loc: "/feed.xml", priority: "0.5", changefreq: "daily" },
    { loc: "/api/openapi", priority: "0.7", changefreq: "weekly" },
];

export async function GET() {
    const now = new Date().toISOString().split("T")[0];

    const urls = [...staticPages, ...discoveryFiles]
        .map(
            (page) => `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
        )
        .join("\n");

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
        },
    });
}
