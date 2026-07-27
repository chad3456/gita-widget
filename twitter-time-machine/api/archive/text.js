// GET /api/archive/text?handle=&id=&capTs=  — extract one archived tweet's text.
import { cleanHandle } from "../../lib/util.js";
import { getArchivedText } from "../../lib/archive.js";
import { applyApiHeaders, getQuery } from "../../lib/http.js";

export default async function handler(req, res) {
  applyApiHeaders(res);
  const q = getQuery(req);
  const handle = cleanHandle(q.handle);
  const id = String(q.id || "");
  const capTs = String(q.capTs || "");
  if (!handle || !/^\d+$/.test(id) || !/^\d{14}$/.test(capTs)) return res.status(400).json({ error: "bad_request" });
  try {
    const text = await getArchivedText(id, capTs, handle);
    res.status(200).json({ id, text });
  } catch {
    res.status(200).json({ id, text: null });
  }
}
