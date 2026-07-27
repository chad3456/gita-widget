// Helpers shared by the serverless functions (Vercel) and the local dev server.
// Vercel and Express both populate req.query and support res.status().json();
// these keep the handlers framework-agnostic.

export function applyApiHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Cache at the edge: fine for a public read API; tune as needed.
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=600");
}

export function getQuery(req) {
  if (req.query) return req.query;
  try {
    const u = new URL(req.url, "http://localhost");
    const q = {};
    u.searchParams.forEach((v, k) => (q[k] = v));
    return q;
  } catch {
    return {};
  }
}

export const asInt = (v, d) => (Number.isFinite(+v) && v !== "" && v != null ? +v : d);
