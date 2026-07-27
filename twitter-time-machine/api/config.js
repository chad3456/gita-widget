// GET /api/config — which data sources this deployment offers.
import * as xapi from "../lib/xapi.js";
import { applyApiHeaders } from "../lib/http.js";

export default function handler(req, res) {
  applyApiHeaders(res);
  res.status(200).json({ sources: { archive: true, xapi: xapi.isConfigured() } });
}
