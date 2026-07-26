// Internet Archive (Wayback / CDX) data source — free, key-less, real historical
// tweet captures. Server-side so we avoid browser CORS and can cache.

import { fetchWithTimeout, tweetDate, extractTweetText, TTLCache } from "./util.js";

const CDX = "https://web.archive.org/cdx/search/cdx";
const cache = new TTLCache({ ttl: 60 * 60 * 1000, max: 300 }); // 1h
const textCache = new TTLCache({ ttl: 24 * 60 * 60 * 1000, max: 2000 }); // 24h

const PATTERNS = (handle) => [
  `twitter.com/${handle}/status/`,
  `x.com/${handle}/status/`,
  `mobile.twitter.com/${handle}/status/`,
];

async function cdxQuery(pattern, limit) {
  const url =
    CDX +
    "?" +
    new URLSearchParams({
      url: pattern,
      matchType: "prefix",
      collapse: "urlkey",
      fl: "timestamp,original,statuscode",
      output: "json",
      limit: String(limit),
      filter: "statuscode:200",
    });
  const res = await fetchWithTimeout(url, { timeout: 20000 });
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length < 2) return [];
  return rows.slice(1); // drop header row
}

/**
 * Return archived tweets for a handle within [fromYear, toYear].
 * { handle, count, scanned, truncated, tweets: [{id, iso, year, capTs, wayback, live}] }
 */
export async function getArchivedTweets(handle, { fromYear = 2006, toYear = 3000, limit = 4000 } = {}) {
  const key = `arch:${handle}:${limit}`;
  let merged = cache.get(key);

  if (!merged) {
    const settled = await Promise.allSettled(PATTERNS(handle).map((p) => cdxQuery(p, limit)));
    const ok = settled.filter((s) => s.status === "fulfilled");
    if (!ok.length) {
      const reason = settled[0]?.reason;
      const err = new Error("archive_unreachable");
      err.cause = reason?.message || "fetch failed";
      throw err;
    }
    const seen = new Map();
    for (const s of ok) {
      for (const [ts, original] of s.value) {
        const m = String(original).match(/status(?:es)?\/(\d+)/);
        if (!m) continue;
        const id = m[1];
        const prev = seen.get(id);
        if (!prev || ts < prev.capTs) seen.set(id, { id, capTs: ts, original });
      }
    }
    merged = [...seen.values()];
    cache.set(key, merged);
  }

  const scanned = merged.length;
  const tweets = merged
    .map((it) => {
      const d = tweetDate(it.id);
      const year = d ? d.getUTCFullYear() : +it.capTs.slice(0, 4);
      return {
        id: it.id,
        iso: d ? d.toISOString() : null,
        year,
        capTs: it.capTs,
        wayback: `https://web.archive.org/web/${it.capTs}/${it.original}`,
        live: `https://twitter.com/${handle}/status/${it.id}`,
      };
    })
    .filter((t) => t.year >= fromYear && t.year <= toYear)
    .sort((a, b) => (b.iso || "").localeCompare(a.iso || "") || b.id.localeCompare(a.id));

  return { handle, source: "archive", count: tweets.length, scanned, truncated: scanned >= limit, tweets };
}

/** Fetch and extract the text of a single archived tweet (cached). */
export async function getArchivedText(id, capTs, handle) {
  const key = `txt:${id}`;
  const hit = textCache.get(key);
  if (hit !== undefined) return hit;

  const original = `http://twitter.com/${handle}/status/${id}`;
  const snap = `https://web.archive.org/web/${capTs}id_/${original}`;
  let text = null;
  try {
    const res = await fetchWithTimeout(snap, { timeout: 15000, allowNonOk: true });
    const html = await res.text();
    text = extractTweetText(html);
  } catch {
    text = null;
  }
  textCache.set(key, text);
  return text;
}
