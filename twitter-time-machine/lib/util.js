// Shared helpers: Snowflake ID → date, tweet-text extraction, tiny TTL cache.

export const SNOWFLAKE_EPOCH = 1288834974657; // 2010-11-04, Twitter's snowflake epoch

/**
 * Decode a tweet's creation Date from its Snowflake ID.
 * Returns null for pre-snowflake (sequential) IDs (roughly before late 2010)
 * or anything that decodes to an implausible year.
 */
export function tweetDate(id) {
  try {
    const b = BigInt(id);
    if (b < 300000000000n) return null; // pre-snowflake sequential IDs
    const ms = Number(b >> 22n) + SNOWFLAKE_EPOCH;
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    if (y < 2010 || y > new Date().getUTCFullYear() + 1) return null;
    return d;
  } catch {
    return null;
  }
}

/** Extract a tweet's text from an archived snapshot's HTML (best-effort). */
export function extractTweetText(html) {
  if (!html) return null;
  const og =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (og && og[1]) {
    let t = decodeEntities(og[1]).trim().replace(/^["'“]|["'”]$/g, "");
    if (t && t.length > 1) return t;
  }
  const jt =
    html.match(/<p[^>]*class=["'][^"']*js-tweet-text[^"']*["'][^>]*>([\s\S]*?)<\/p>/i) ||
    html.match(/<div[^>]+data-testid=["']tweetText["'][^>]*>([\s\S]*?)<\/div>/i);
  if (jt && jt[1]) {
    const t = decodeEntities(jt[1].replace(/<[^>]+>/g, "")).trim();
    if (t) return t;
  }
  return null;
}

const ENT = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'" };
export function decodeEntities(s) {
  return String(s)
    .replace(/&(amp|lt|gt|quot|#39|apos);/g, (m) => ENT[m])
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

/** Fetch with an abort timeout. Throws on non-OK unless allowNonOk. */
export async function fetchWithTimeout(url, { timeout = 15000, allowNonOk = false, ...opts } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctl.signal });
    if (!allowNonOk && !res.ok) {
      const err = new Error(`Upstream HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res;
  } finally {
    clearTimeout(t);
  }
}

/** Minimal in-memory TTL cache with a bounded size (LRU-ish by insertion). */
export class TTLCache {
  constructor({ ttl = 600000, max = 500 } = {}) {
    this.ttl = ttl;
    this.max = max;
    this.map = new Map();
  }
  get(key) {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.exp) {
      this.map.delete(key);
      return undefined;
    }
    // refresh recency
    this.map.delete(key);
    this.map.set(key, e);
    return e.val;
  }
  set(key, val, ttl = this.ttl) {
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, { val, exp: Date.now() + ttl });
  }
}

/** Normalize a raw handle/URL into a bare handle, or null if invalid. */
export function cleanHandle(raw) {
  if (!raw) return null;
  const h = String(raw)
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/(mobile\.|www\.)?(twitter|x)\.com\//i, "")
    .split(/[/?#]/)[0]
    .trim();
  return /^[A-Za-z0-9_]{1,15}$/.test(h) ? h : null;
}
