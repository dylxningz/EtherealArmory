import { portfolioProjects } from "../src/data/portfolioProjects.js";
import { validatePortfolioProjects } from "../src/lib/portfolio.js";

const SITE_URL = "https://www.etherealarmory.com";
const STATIC_PATHS = [
  "",
  "/products",
  "/portfolio",
  "/reviews",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
  "/shipping-policy",
  "/returns-policy",
];

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]);
}

export function portfolioEntriesForProjects(projects) {
  return validatePortfolioProjects(projects).map((project) => ({ loc: `${SITE_URL}/portfolio/${project.slug}` }));
}

async function fetchHandles(type, domain, token, version) {
  const field = type === "products" ? "products" : "collections";
  const query = `query Sitemap($first: Int!, $after: String) { ${field}(first: $first, after: $after) { nodes { handle updatedAt } pageInfo { hasNextPage endCursor } } }`;
  const handles = [];
  let after = null;
  const seenCursors = new Set();

  while (true) {
    const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
      body: JSON.stringify({ query, variables: { first: 250, after } }),
    });
    if (!response.ok) throw new Error(`Shopify sitemap request returned ${response.status}.`);
    const json = await response.json();
    if (json.errors?.length) throw new Error(json.errors[0].message);
    const connection = json.data[field];
    handles.push(...connection.nodes);
    if (!connection.pageInfo.hasNextPage) break;
    const nextCursor = connection.pageInfo.endCursor;
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error(`Shopify sitemap pagination returned an invalid ${field} cursor.`);
    }
    seenCursors.add(nextCursor);
    after = nextCursor;
  }
  return handles;
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).send("Method not allowed");
  }

  const domain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const token = process.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
  const version = process.env.VITE_SHOPIFY_API_VERSION || "2025-10";
  let entries = STATIC_PATHS.map((path) => ({ loc: `${SITE_URL}${path}` }));
  try {
    entries = entries.concat(portfolioEntriesForProjects(portfolioProjects));
  } catch (error) {
    console.error("Portfolio sitemap entries were omitted:", error.message);
  }

  if (domain && token) {
    try {
      const [products, collections] = await Promise.all([
        fetchHandles("products", domain, token, version),
        fetchHandles("collections", domain, token, version),
      ]);
      entries = entries.concat(
        collections.map((item) => ({ loc: `${SITE_URL}/collections/${item.handle}`, lastmod: item.updatedAt })),
        products.map((item) => ({ loc: `${SITE_URL}/products/${item.handle}`, lastmod: item.updatedAt })),
      );
    } catch (error) {
      console.error("Dynamic sitemap fell back to static routes:", error.message);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(({ loc, lastmod }) => `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>`;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return response.status(200).send(xml);
}
