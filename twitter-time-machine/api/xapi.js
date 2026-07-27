// GET /api/xapi?handle=&from=&to=  — official X API v2 (only if X_BEARER_TOKEN set).
import { cleanHandle } from "../lib/util.js";
import * as xapi from "../lib/xapi.js";
import { applyApiHeaders, getQuery, asInt } from "../lib/http.js";

export default async function handler(req, res) {
  applyApiHeaders(res);
  if (!xapi.isConfigured()) return res.status(501).json({ error: "not_configured", message: "The official X API is not configured on this server. Set X_BEARER_TOKEN to enable it." });
  const q = getQuery(req);
  const handle = cleanHandle(q.handle);
  if (!handle) return res.status(400).json({ error: "invalid_handle", message: "Enter a valid handle." });
  const fromYear = asInt(q.from, undefined);
  const toYear = asInt(q.to, undefined);
  try {
    const data = await xapi.getOfficialTweets(handle, { fromYear, toYear });
    res.status(200).json(data);
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
}
