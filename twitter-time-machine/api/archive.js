// GET /api/archive?handle=&from=&to=  — archived tweets from the Internet Archive.
import { cleanHandle } from "../lib/util.js";
import { getArchivedTweets } from "../lib/archive.js";
import { applyApiHeaders, getQuery, asInt } from "../lib/http.js";

export default async function handler(req, res) {
  applyApiHeaders(res);
  const q = getQuery(req);
  const handle = cleanHandle(q.handle);
  if (!handle) return res.status(400).json({ error: "invalid_handle", message: "Enter a valid handle (letters, numbers, underscore)." });
  const fromYear = asInt(q.from, 2006);
  const toYear = asInt(q.to, 3000);
  try {
    const data = await getArchivedTweets(handle, { fromYear, toYear });
    res.status(200).json(data);
  } catch (e) {
    if (e.message === "archive_unreachable") {
      return res.status(502).json({ error: "archive_unreachable", message: "Couldn't reach the Internet Archive. It may be rate-limiting or temporarily down — try again shortly.", detail: e.cause });
    }
    console.error("archive error:", e);
    res.status(500).json({ error: "server_error", message: "Something went wrong fetching archived tweets." });
  }
}
