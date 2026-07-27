// Local dev server. Production runs on Vercel as serverless functions (see
// api/ and vercel.json); this Express app mounts the SAME handlers so local
// behavior matches prod with no duplicated logic. Run: `npm start`.

import express from "express";
import compression from "compression";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import config from "./api/config.js";
import archive from "./api/archive.js";
import archiveText from "./api/archive/text.js";
import xapi from "./api/xapi.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.disable("x-powered-by");
app.use(compression());
app.use(morgan("dev"));

app.get("/api/config", (req, res) => config(req, res));
app.get("/api/archive", (req, res) => archive(req, res));
app.get("/api/archive/text", (req, res) => archiveText(req, res));
app.get("/api/xapi", (req, res) => xapi(req, res));

app.use(express.static(join(__dirname, "public"), { extensions: ["html"] }));
app.get("*", (_req, res) => res.sendFile(join(__dirname, "public", "index.html")));

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Local dev on http://localhost:${PORT}  (X API: ${process.env.X_BEARER_TOKEN ? "on" : "off"})`));
}

export default app;
