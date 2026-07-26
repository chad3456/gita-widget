// Official X (Twitter) API v2 data source. Server-side only — the bearer token
// never reaches the browser, and calling from the server avoids CORS.
//
// Coverage depends on the token's access tier:
//   - Full-archive search (/2/tweets/search/all) → any date incl. 2012, but
//     requires an elevated tier (Academic / Pro / Enterprise). Basic/Free 403s.
//   - User timeline (/2/users/:id/tweets) → up to the most recent ~3,200 tweets.
// We try full-archive when a date range is given, and fall back to timeline.

import { fetchWithTimeout, TTLCache } from "./util.js";

const BASE = "https://api.twitter.com/2";
const userCache = new TTLCache({ ttl: 6 * 60 * 60 * 1000, max: 500 });

function authHeaders() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    const e = new Error("xapi_not_configured");
    e.code = "not_configured";
    throw e;
  }
  return { Authorization: `Bearer ${token}`, "User-Agent": "tweet-time-machine/1.0" };
}

export function isConfigured() {
  return Boolean(process.env.X_BEARER_TOKEN);
}

async function apiGet(path, params) {
  const url = BASE + path + (params ? "?" + new URLSearchParams(params) : "");
  const res = await fetchWithTimeout(url, { headers: authHeaders(), timeout: 15000, allowNonOk: true });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(body?.title || body?.detail || `X API HTTP ${res.status}`);
    e.status = res.status;
    e.code = res.status === 403 ? "tier" : res.status === 429 ? "rate" : "api";
    e.detail = body;
    throw e;
  }
  return body;
}

async function getUser(handle) {
  const key = `user:${handle.toLowerCase()}`;
  const hit = userCache.get(key);
  if (hit) return hit;
  const body = await apiGet(`/users/by/username/${encodeURIComponent(handle)}`, {
    "user.fields": "profile_image_url,name,created_at,public_metrics",
  });
  if (!body.data) {
    const e = new Error("user_not_found");
    e.code = "not_found";
    throw e;
  }
  userCache.set(key, body.data);
  return body.data;
}

function normalize(tweets = [], user) {
  return tweets.map((t) => ({
    id: t.id,
    iso: t.created_at || null,
    year: t.created_at ? new Date(t.created_at).getUTCFullYear() : null,
    text: t.text || "",
    metrics: t.public_metrics || null,
    live: `https://twitter.com/${user.username}/status/${t.id}`,
  }));
}

/**
 * Full-archive search (any era). Requires elevated access; throws {code:'tier'}
 * on 403 so the caller can explain and fall back.
 */
async function fullArchive(user, { fromYear, toYear, maxPages = 5 }) {
  const params = {
    query: `from:${user.username} -is:retweet`,
    max_results: "100",
    "tweet.fields": "created_at,public_metrics",
  };
  if (fromYear) params.start_time = `${fromYear}-01-01T00:00:00Z`;
  if (toYear && toYear < 3000) params.end_time = `${Math.min(toYear, new Date().getUTCFullYear())}-12-31T23:59:59Z`;

  const out = [];
  let next;
  for (let i = 0; i < maxPages; i++) {
    const body = await apiGet("/tweets/search/all", next ? { ...params, next_token: next } : params);
    out.push(...normalize(body.data || [], user));
    next = body.meta?.next_token;
    if (!next) break;
  }
  return out;
}

/** Recent user timeline (most recent ~3,200). Works on Basic tier. */
async function timeline(user, { maxPages = 5 }) {
  const params = { max_results: "100", "tweet.fields": "created_at,public_metrics", exclude: "retweets,replies" };
  const out = [];
  let next;
  for (let i = 0; i < maxPages; i++) {
    const body = await apiGet(`/users/${user.id}/tweets`, next ? { ...params, pagination_token: next } : params);
    out.push(...normalize(body.data || [], user));
    next = body.meta?.next_token;
    if (!next) break;
  }
  return out;
}

export async function getOfficialTweets(handle, { fromYear, toYear, maxPages = 5 } = {}) {
  const user = await getUser(handle);
  let tweets;
  let mode = "search_all";
  try {
    tweets = await fullArchive(user, { fromYear, toYear, maxPages });
  } catch (e) {
    if (e.code === "tier") {
      // fall back to timeline, then filter by year client-need
      mode = "timeline";
      tweets = await timeline(user, { maxPages });
      if (fromYear || toYear) {
        tweets = tweets.filter((t) => t.year && t.year >= (fromYear || 0) && t.year <= (toYear || 3000));
      }
    } else {
      throw e;
    }
  }
  tweets.sort((a, b) => (b.iso || "").localeCompare(a.iso || ""));
  return {
    handle: user.username,
    source: "xapi",
    mode, // 'search_all' (full history) or 'timeline' (recent only, tier-limited)
    user: {
      name: user.name,
      username: user.username,
      avatar: user.profile_image_url,
      created_at: user.created_at,
      metrics: user.public_metrics || null,
    },
    count: tweets.length,
    tweets,
  };
}
