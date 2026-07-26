// Tweet Time Machine — production server.
// Serves the SPA and proxies two data sources: the Internet Archive (free) and,
// when X_BEARER_TOKEN is set, the official X API v2.

import express from "express";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { cleanHandle } from "./lib/util.js";
import { getArchivedTweets, getArchivedText } from "./lib/archive.js";
import * as xapi from "./lib/xapi.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "https:", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["https://web.archive.org", "https://twitter.com", "https://platform.twitter.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use("/api", apiLimiter);

const asInt = (v, d) => (Number.isFinite(+v) ? +v : d);

// ---- config: tells the frontend which sources are available ----
app.get("/api/config", (_req, res) => {
  res.json({ sources: { archive: true, xapi: xapi.isConfigured() } });
});

// ---- Internet Archive: list archived tweets ----
app.get("/api/archive", async (req, res) => {
  const handle = cleanHandle(req.query.handle);
  if (!handle) return res.status(400).json({ error: "invalid_handle", message: "Enter a valid handle (letters, numbers, underscore)." });
  const fromYear = asInt(req.query.from, 2006);
  const toYear = asInt(req.query.to, 3000);
  try {
    const data = await getArchivedTweets(handle, { fromYear, toYear });
    res.json(data);
  } catch (e) {
    if (e.message === "archive_unreachable") {
      return res.status(502).json({ error: "archive_unreachable", message: "Couldn't reach the Internet Archive. It may be rate-limiting or temporarily down — try again shortly.", detail: e.cause });
    }
    console.error("archive error:", e);
    res.status(500).json({ error: "server_error", message: "Something went wrong fetching archived tweets." });
  }
});

// ---- Internet Archive: extract one tweet's text ----
app.get("/api/archive/text", async (req, res) => {
  const handle = cleanHandle(req.query.handle);
  const id = String(req.query.id || "");
  const capTs = String(req.query.capTs || "");
  if (!handle || !/^\d+$/.test(id) || !/^\d{14}$/.test(capTs)) return res.status(400).json({ error: "bad_request" });
  try {
    const text = await getArchivedText(id, capTs, handle);
    res.json({ id, text });
  } catch {
    res.json({ id, text: null });
  }
});

// ---- Official X API ----
app.get("/api/xapi", async (req, res) => {
  if (!xapi.isConfigured()) return res.status(501).json({ error: "not_configured", message: "The official X API is not configured on this server. Set X_BEARER_TOKEN to enable it." });
  const handle = cleanHandle(req.query.handle);
  if (!handle) return res.status(400).json({ error: "invalid_handle", message: "Enter a valid handle." });
  const fromYear = asInt(req.query.from, undefined);
  const toYear = asInt(req.query.to, undefined);
  try {
    const data = await xapi.getOfficialTweets(handle, { fromYear, toYear });
    res.json(data);
  } catch (e) {
    const map = {
      not_found: [404, "That account doesn't exist on X (or was suspended)."],
      tier: [403, "This X API token's access tier can't do what was requested."],
      rate: [429, "X API rate limit hit — wait a minute and try again."],
      not_configured: [501, "The official X API is not configured on this server."],
    };
    const [status, message] = map[e.code] || [502, e.message || "X API request failed."];
    if (status >= 500) console.error("xapi error:", e);
    res.status(status).json({ error: e.code || "api_error", message });
  }
});

// ---- static SPA ----
app.use(express.static(join(__dirname, "public"), { maxAge: "1h", extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile(join(__dirname, "public", "index.html")));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Tweet Time Machine on http://localhost:${PORT}  (X API: ${xapi.isConfigured() ? "on" : "off"})`));
}

export default app;
