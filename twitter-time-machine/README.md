# Tweet Time Machine

A small, production-ready web app to **browse any Twitter/X account's tweets across any era** — including old tweets from 2012 and earlier.

It's a Node/Express server that serves a single-page frontend and proxies two data sources:

| Source | Cost | Coverage | Notes |
| --- | --- | --- | --- |
| **Internet Archive** (default) | Free, no key | Real archived captures back to 2006 | Incomplete — only what was archived. Each tweet's exact date is decoded from its Snowflake ID. |
| **Official X API v2** (optional) | Paid tiers | Complete where your token's tier allows | Enable by setting `X_BEARER_TOKEN`. Full history to 2012 needs an elevated (Academic/Pro/Enterprise) tier; Basic/Free falls back to recent tweets. |

It runs on **Vercel** as serverless functions (`api/*`) plus a static frontend (`public/`). Doing the fetching server-side is what makes it "production": the browser never sees API tokens, cross-origin calls happen server-side, and responses are edge-cached.

## Why not a pure static app / "every tweet"?

Since 2023 there is **no free, public API** that returns an account's complete history, and a static browser page can't call `api.twitter.com` (CORS) or hold a secret token. The Internet Archive is the honest free route to old tweets; the official API (server-side, paid) is the route to completeness. This app supports both.

## Deploy to Vercel

**Dashboard (easiest):** Vercel → **Add New → Project** → import this repo → set **Root Directory** to `twitter-time-machine` → Deploy. No build command needed (`vercel.json` handles routing).

**CLI:**

```bash
npm i -g vercel
cd twitter-time-machine
vercel            # preview deploy
vercel --prod     # production
```

To enable the **Official X API** source, add an environment variable in the
Vercel project (Settings → Environment Variables), then redeploy:

```
X_BEARER_TOKEN = <your X API v2 bearer token>
```

`api/config` reports whether it's set, and the frontend enables/disables the
source toggle accordingly.

### How it maps onto Vercel

- `api/config.js`, `api/archive.js`, `api/archive/text.js`, `api/xapi.js` →
  serverless functions at `/api/*` (each `export default`s a `(req, res)` handler).
- `public/` → static frontend, with an SPA-style rewrite in `vercel.json`.
- Security headers (CSP, nosniff, referrer-policy) are set in `vercel.json`.
- Caching is via `Cache-Control` (edge `s-maxage`); the in-memory TTL cache in
  `lib/` is a best-effort bonus on warm instances.

## Run locally

`server.js` is a thin Express dev server that mounts the **same** `api/*`
handlers, so local behavior matches Vercel with no duplicated logic:

```bash
cd twitter-time-machine
npm install
npm start                       # http://localhost:3000
X_BEARER_TOKEN=xxxx npm start   # with the official API enabled
```

(Or use `vercel dev` if you have the Vercel CLI — it runs the functions directly.)

## Test

```bash
npm test        # unit tests: snowflake decoding, handle parsing, text extraction
```

## API

| Endpoint | Description |
| --- | --- |
| `GET /api/config` | Which sources are available (`archive` always, `xapi` if a token is set). |
| `GET /api/archive?handle=&from=&to=` | Archived tweets from the Internet Archive, deduped and date-decoded. |
| `GET /api/archive/text?handle=&id=&capTs=` | Extract one archived tweet's text (server-side, cached). |
| `GET /api/xapi?handle=&from=&to=` | Official X API results (503/501 if no token). |

Responses are cached in memory (1h for archive listings, 24h for tweet text) and `/api` is rate-limited to 60 req/min per IP.

## How dates work

Twitter IDs after late 2010 are **Snowflake** IDs that embed the creation timestamp:
`date = ((id >> 22) + 1288834974657)`. That gives each archived tweet its true post date — independent of when the Internet Archive captured it — so the per-year histogram and era filters are accurate.

## Project layout

```
api/config.js        GET /api/config      (serverless fn)
api/archive.js       GET /api/archive     (serverless fn)
api/archive/text.js  GET /api/archive/text (serverless fn)
api/xapi.js          GET /api/xapi        (serverless fn)
lib/util.js          Snowflake decode, text extraction, TTL cache, handle parsing
lib/archive.js       Internet Archive (CDX) client
lib/xapi.js          Official X API v2 client
lib/http.js          Framework-agnostic req/res helpers
public/              Frontend SPA (index.html, app.js, styles.css)
server.js            Local dev server (mounts the same api/ handlers)
test/                Unit tests (node:test)
vercel.json · .env.example
```

## Limitations (read before expecting magic)

- Internet Archive coverage is **partial** — popular accounts return a lot, obscure ones little or nothing. This is a property of what was archived, not a bug.
- The official API's completeness is bounded by your **access tier**; the app tells you when it had to fall back to recent-only.
- Neither source can resurrect tweets that were deleted *and* never archived.
