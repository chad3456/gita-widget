# Tweet Time Machine

A small, production-ready web app to **browse any Twitter/X account's tweets across any era** — including old tweets from 2012 and earlier.

It's a Node/Express server that serves a single-page frontend and proxies two data sources:

| Source | Cost | Coverage | Notes |
| --- | --- | --- | --- |
| **Internet Archive** (default) | Free, no key | Real archived captures back to 2006 | Incomplete — only what was archived. Each tweet's exact date is decoded from its Snowflake ID. |
| **Official X API v2** (optional) | Paid tiers | Complete where your token's tier allows | Enable by setting `X_BEARER_TOKEN`. Full history to 2012 needs an elevated (Academic/Pro/Enterprise) tier; Basic/Free falls back to recent tweets. |

Running it as a server (rather than a static page) is what makes it "production": the browser never sees API tokens, cross-origin calls happen server-side, and responses are cached and rate-limited.

## Why not a pure static app / "every tweet"?

Since 2023 there is **no free, public API** that returns an account's complete history, and a static browser page can't call `api.twitter.com` (CORS) or hold a secret token. The Internet Archive is the honest free route to old tweets; the official API (server-side, paid) is the route to completeness. This app supports both.

## Run locally

```bash
cd twitter-time-machine
npm install
npm start
# open http://localhost:3000
```

Optionally enable the official X API:

```bash
cp .env.example .env
# put your bearer token in .env, then:
X_BEARER_TOKEN=xxxx npm start
```

## Test

```bash
npm test        # unit tests: snowflake decoding, handle parsing, text extraction
```

## Deploy

Any Node host works. Included configs:

- **Render** — New → Blueprint → pick this repo (`render.yaml` builds from this folder). Set `X_BEARER_TOKEN` in the dashboard to enable the official API.
- **Docker** — `docker build -t ttm . && docker run -p 3000:3000 -e X_BEARER_TOKEN=… ttm`
- **Railway / Fly / Heroku-likes** — `Procfile` (`web: node server.js`); set `X_BEARER_TOKEN` as a secret.

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
server.js          Express app: routes, security, caching, rate limiting
lib/util.js        Snowflake decode, text extraction, TTL cache, handle parsing
lib/archive.js     Internet Archive (CDX) client
lib/xapi.js        Official X API v2 client
public/            Frontend SPA (index.html, app.js, styles.css)
test/              Unit tests (node:test)
Dockerfile · render.yaml · Procfile · .env.example
```

## Limitations (read before expecting magic)

- Internet Archive coverage is **partial** — popular accounts return a lot, obscure ones little or nothing. This is a property of what was archived, not a bug.
- The official API's completeness is bounded by your **access tier**; the app tells you when it had to fall back to recent-only.
- Neither source can resurrect tweets that were deleted *and* never archived.
