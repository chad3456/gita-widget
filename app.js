/* =========================================================
   ISOCHRONE — a travel-time atlas
   D3 (geo + contour) · multimodal door-to-door model
   ========================================================= */
(function () {
  "use strict";

  /* ---------- researched constants (see Methodology) ---------- */
  const CRUISE = 820;      // km/h effective flight speed incl. climb/descent
  const FLIGHT_FIXED = 0.5;// h taxi + takeoff + landing + taxi
  const DRIVE = 85;        // km/h effective road speed
  const DETOUR = 1.25;     // road detour factor over great-circle
  const RAIL_HSR = 210;    // km/h high-speed rail regions
  const RAIL_CONV = 110;   // km/h conventional rail
  const WALK = 4.8;        // km/h
  const GROUND_MAX = 4200; // km — beyond this, only air is considered
  const R = 6371;          // earth km

  // High-speed-rail regions (lat0,lat1,lon0,lon1)
  const HSR = [
    { y0: 36, y1: 60, x0: -10, x1: 30 },   // Europe
    { y0: 22, y1: 46, x0: 100, x1: 146 },  // East Asia (E.China, Korea, Japan)
  ];
  const BANDS = [0.75, 1.5, 3, 6, 12, 24, 48];
  const COLORS = { 0.75: "#fff7d6", 1.5: "#ffd166", 3: "#f4845f", 6: "#e5547c", 12: "#c2399f", 24: "#6d3bd6", 48: "#2f53b3" };
  const BAND_LABEL = { 0.75: "≤ 45 min", 1.5: "≤ 1½ h", 3: "≤ 3 h", 6: "≤ 6 h", 12: "≤ 12 h", 24: "≤ 24 h", 48: "≤ 48 h" };

  /* ---------- origin cities (researched airport-access in minutes) ---------- */
  const CITIES = [
    ["London", "UK", 51.51, -0.13, "LHR", 50], ["Paris", "France", 48.86, 2.35, "CDG", 50],
    ["Amsterdam", "Netherlands", 52.37, 4.90, "AMS", 25], ["Frankfurt", "Germany", 50.11, 8.68, "FRA", 20],
    ["Berlin", "Germany", 52.52, 13.40, "BER", 40], ["Madrid", "Spain", 40.42, -3.70, "MAD", 30],
    ["Barcelona", "Spain", 41.39, 2.17, "BCN", 30], ["Rome", "Italy", 41.90, 12.50, "FCO", 40],
    ["Zurich", "Switzerland", 47.37, 8.54, "ZRH", 20], ["Istanbul", "Türkiye", 41.01, 28.98, "IST", 60],
    ["Moscow", "Russia", 55.76, 37.62, "SVO", 50], ["Dubai", "UAE", 25.20, 55.27, "DXB", 25],
    ["Doha", "Qatar", 25.29, 51.53, "DOH", 25], ["Delhi", "India", 28.61, 77.21, "DEL", 45],
    ["Mumbai", "India", 19.08, 72.88, "BOM", 45], ["Singapore", "Singapore", 1.35, 103.82, "SIN", 25],
    ["Bangkok", "Thailand", 13.76, 100.50, "BKK", 45], ["Hong Kong", "China", 22.32, 114.17, "HKG", 40],
    ["Beijing", "China", 39.90, 116.41, "PEK", 50], ["Shanghai", "China", 31.23, 121.47, "PVG", 60],
    ["Tokyo", "Japan", 35.68, 139.69, "HND", 40], ["Seoul", "South Korea", 37.57, 126.98, "ICN", 60],
    ["Sydney", "Australia", -33.87, 151.21, "SYD", 30], ["Melbourne", "Australia", -37.81, 144.96, "MEL", 30],
    ["Auckland", "New Zealand", -36.85, 174.76, "AKL", 35], ["Johannesburg", "South Africa", -26.20, 28.05, "JNB", 35],
    ["Cairo", "Egypt", 30.04, 31.24, "CAI", 45], ["Nairobi", "Kenya", -1.29, 36.82, "NBO", 40],
    ["Lagos", "Nigeria", 6.52, 3.38, "LOS", 60], ["Addis Ababa", "Ethiopia", 9.03, 38.74, "ADD", 30],
    ["New York", "USA", 40.71, -74.01, "JFK", 60], ["Toronto", "Canada", 43.65, -79.38, "YYZ", 40],
    ["Chicago", "USA", 41.88, -87.63, "ORD", 45], ["Los Angeles", "USA", 34.05, -118.24, "LAX", 40],
    ["San Francisco", "USA", 37.77, -122.42, "SFO", 35], ["Miami", "USA", 25.76, -80.19, "MIA", 30],
    ["Mexico City", "Mexico", 19.43, -99.13, "MEX", 40], ["Bogotá", "Colombia", 4.71, -74.07, "BOG", 40],
    ["Lima", "Peru", -12.05, -77.04, "LIM", 40], ["São Paulo", "Brazil", -23.55, -46.63, "GRU", 50],
    ["Buenos Aires", "Argentina", -34.60, -58.38, "EZE", 50], ["Santiago", "Chile", -33.45, -70.67, "SCL", 35],
  ].map(c => ({ name: c[0], country: c[1], lat: c[2], lon: c[3], iata: c[4], access: c[5] }));

  /* ---------- grid ---------- */
  const STEP = 2.5, LAT0 = 84;
  const NX = Math.round(360 / STEP);                 // 144
  const NY = Math.round((LAT0 * 2) / STEP) + 1;       // 68 → lat 84..-83.5
  const NEG_THRESH = BANDS.map(h => -h).sort((a, b) => a - b);

  /* ---------- state ---------- */
  let AIRPORTS = [], LAND = null, COUNTRIES = [], BORDERS = null;
  let mask = new Uint8Array(NX * NY);
  let cellLon = new Float32Array(NX * NY), cellLat = new Float32Array(NX * NY);
  let destIdx = new Int16Array(NX * NY), egressKm = new Float32Array(NX * NY);
  let values = new Float32Array(NX * NY);
  let bands = [];
  let origin = null, originAp = null;
  const modes = { air: true, rail: true, drive: true, walk: true };
  let showAirports = false, showGrid = true, animating = false;
  const INFRA = window.INFRA || { pipelines: [], cables: [], ports: [] };
  const SITES = INFRA.sites || [];
  const SITE = {}; SITES.forEach(s => SITE[s.key] = s);
  const layers = { pipelines: true, cables: false, ports: true };
  SITES.forEach(s => layers[s.key] = false);
  const PIPE_OIL = "#ff7a45", PIPE_GAS = "#3ad1c0", CABLE = "#7ac8ff", PORT = "#ffd166";
  // panel grouping of every toggleable layer
  const GROUPS = [
    { n: "TRANSPORT & TRADE", k: ["pipelines", "cables", "ports"] },
    { n: "ENERGY", k: ["nuclear", "refinery", "lng", "dam"] },
    { n: "TECH & SCIENCE", k: ["datacenter", "fab", "science", "spaceport"] },
    { n: "DEFENCE & INDUSTRY", k: ["military", "manufacturing"] },
  ];
  const BASEMETA = {
    pipelines: { label: "Pipelines", icon: "🛢", color: PIPE_OIL },
    cables: { label: "Subsea cables", icon: "🛰", color: CABLE },
    ports: { label: "Major ports", icon: "⚓", color: PORT },
  };
  const meta = (k) => BASEMETA[k] || { label: SITE[k].label, icon: SITE[k].icon, color: SITE[k].color };
  let markerHits = [];
  const WCODE = { 0:["☀","Clear"],1:["🌤","Mainly clear"],2:["⛅","Partly cloudy"],3:["☁","Overcast"],
    45:["🌫","Fog"],48:["🌫","Rime fog"],51:["🌦","Drizzle"],53:["🌦","Drizzle"],55:["🌦","Drizzle"],
    56:["🌧","Freezing drizzle"],57:["🌧","Freezing drizzle"],61:["🌧","Rain"],63:["🌧","Rain"],65:["🌧","Heavy rain"],
    66:["🌧","Freezing rain"],67:["🌧","Freezing rain"],71:["🌨","Snow"],73:["🌨","Snow"],75:["❄","Heavy snow"],
    77:["❄","Snow grains"],80:["🌦","Showers"],81:["🌦","Showers"],82:["⛈","Violent showers"],
    85:["🌨","Snow showers"],86:["🌨","Snow showers"],95:["⛈","Thunderstorm"],96:["⛈","Thunderstorm"],99:["⛈","Thunderstorm"] };

  const canvas = document.getElementById("map");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, DPR = 1;
  const projection = d3.geoAzimuthalEquidistant().clipAngle(180 - 1e-3).precision(0.4);
  let path = d3.geoPath(projection, ctx);
  const graticule = d3.geoGraticule10();

  /* ---------- math ---------- */
  const toR = d => d * Math.PI / 180;
  function hav(la1, lo1, la2, lo2) {
    const dLa = toR(la2 - la1), dLo = toR(lo2 - lo1);
    const a = Math.sin(dLa / 2) ** 2 + Math.cos(toR(la1)) * Math.cos(toR(la2)) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function inHSR(la, lo) { return HSR.some(b => la >= b.y0 && la <= b.y1 && lo >= b.x0 && lo <= b.x1); }
  function sameHSR(la1, lo1, la2, lo2) { return HSR.some(b =>
    la1 >= b.y0 && la1 <= b.y1 && lo1 >= b.x0 && lo1 <= b.x1 &&
    la2 >= b.y0 && la2 <= b.y1 && lo2 >= b.x0 && lo2 <= b.x1); }
  function overhead(km) { return km < 2500 ? 0 : km < 6500 ? 1.0 : km < 11000 ? 1.75 : 3.0; }
  function maskAt(lo, la) {
    let gx = Math.round((lo + 180) / STEP); if (gx < 0) gx = 0; if (gx >= NX) gx = NX - 1;
    let gy = Math.round((LAT0 - la) / STEP); if (gy < 0) gy = 0; if (gy >= NY) gy = NY - 1;
    return mask[gy * NX + gx];
  }
  // great-circle interpolation
  function slerpLandOK(la1, lo1, la2, lo2) {
    const φ1 = toR(la1), λ1 = toR(lo1), φ2 = toR(la2), λ2 = toR(lo2);
    const x1 = Math.cos(φ1) * Math.cos(λ1), y1 = Math.cos(φ1) * Math.sin(λ1), z1 = Math.sin(φ1);
    const x2 = Math.cos(φ2) * Math.cos(λ2), y2 = Math.cos(φ2) * Math.sin(λ2), z2 = Math.sin(φ2);
    let dot = x1 * x2 + y1 * y2 + z1 * z2; dot = Math.max(-1, Math.min(1, dot));
    const Ω = Math.acos(dot); if (Ω < 1e-6) return true;
    const n = Math.max(3, Math.min(18, Math.round(Ω * R / 220)));
    for (let i = 1; i < n; i++) {
      const f = i / n, A = Math.sin((1 - f) * Ω) / Math.sin(Ω), B = Math.sin(f * Ω) / Math.sin(Ω);
      const x = A * x1 + B * x2, y = A * y1 + B * y2, z = A * z1 + B * z2;
      const la = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
      const lo = Math.atan2(y, x) * 180 / Math.PI;
      if (!maskAt(lo, la)) return false;
    }
    return true;
  }
  // fast nearest airport via unit-sphere dot product (no trig in the loop)
  function nearestAirport(la, lo) {
    const φ = toR(la), λ = toR(lo), cf = Math.cos(φ);
    const vx = cf * Math.cos(λ), vy = cf * Math.sin(λ), vz = Math.sin(φ);
    let best = -1, bDot = -2;
    for (let i = 0; i < AIRPORTS.length; i++) {
      const a = AIRPORTS[i];
      const d = vx * a.vx + vy * a.vy + vz * a.vz;
      if (d > bDot) { bDot = d; best = i; }
    }
    return best;
  }

  /* ---------- the model ---------- */
  // returns {t, mode, parts} for an arbitrary destination
  function travelTime(la, lo, landKnown) {
    const gc = hav(origin.lat, origin.lon, la, lo);
    let best = Infinity, bm = "", parts = null;
    const onLand = landKnown !== undefined ? landKnown : !!maskAt(lo, la);

    // ground modes (drive / rail / walk) all need a land route
    if ((modes.drive || modes.rail || modes.walk) && gc < GROUND_MAX && onLand && slerpLandOK(origin.lat, origin.lon, la, lo)) {
      const railSpd = modes.rail ? (sameHSR(origin.lat, origin.lon, la, lo) ? RAIL_HSR : RAIL_CONV) : 0;
      const driveSpd = modes.drive ? DRIVE : 0;
      const spd = Math.max(railSpd, driveSpd);
      if (spd > 0) {
        const t = 0.4 + gc * DETOUR / spd;
        if (t < best) { best = t; bm = (spd === railSpd && railSpd > driveSpd) ? "rail" : "drive"; parts = { gc, spd }; }
      }
      if (modes.walk) { const t = gc * 1.15 / WALK; if (t < best) { best = t; bm = "walk"; parts = { gc }; } }
    }

    if (modes.air && originAp) {
      const di = nearestAirport(la, lo); const dest = AIRPORTS[di];
      const fkm = hav(originAp.y, originAp.x, dest.y, dest.x);
      const intl = originAp.c !== dest.c;
      const buffer = intl ? 2.0 : 1.4;
      const fly = FLIGHT_FIXED + fkm / CRUISE + overhead(fkm);
      const egkm = hav(dest.y, dest.x, la, lo);
      const eg = 0.25 + egkm * DETOUR / DRIVE;
      const t = origin.access / 60 + buffer + fly + eg;
      if (t < best) { best = t; bm = "air"; parts = { dest, fkm, egkm, buffer, fly, eg, intl, access: origin.access / 60 }; }
    }
    return { t: best, mode: bm, parts };
  }

  /* ---------- per-cell precompute (origin-independent) ---------- */
  function precompute() {
    // land mask: rasterise the land polygons into an NX×NY grid (one fill, fast)
    const c = document.createElement("canvas"); c.width = NX; c.height = NY;
    const cx = c.getContext("2d"); cx.fillStyle = "#fff";
    const gp = d3.geoPath(d3.geoTransform({
      point(lon, lat) { this.stream.point((lon + 180) / STEP, (LAT0 - lat) / STEP); },
    }), cx);
    cx.beginPath(); gp(LAND); cx.fill();
    const px = cx.getImageData(0, 0, NX, NY).data;
    for (let gy = 0; gy < NY; gy++) {
      for (let gx = 0; gx < NX; gx++) {
        const idx = gy * NX + gx;
        cellLon[idx] = -180 + gx * STEP; cellLat[idx] = LAT0 - gy * STEP;
        mask[idx] = px[idx * 4 + 3] > 40 ? 1 : 0;
      }
    }
    for (let idx = 0; idx < NX * NY; idx++) {
      const di = nearestAirport(cellLat[idx], cellLon[idx]);
      destIdx[idx] = di;
      egressKm[idx] = hav(AIRPORTS[di].y, AIRPORTS[di].x, cellLat[idx], cellLon[idx]);
    }
  }

  /* ---------- compute the time field for current origin/modes ---------- */
  function computeField() {
    const accH = origin.access / 60;
    for (let idx = 0; idx < NX * NY; idx++) {
      const la = cellLat[idx], lo = cellLon[idx];
      const gc = hav(origin.lat, origin.lon, la, lo);
      let best = Infinity;
      if ((modes.drive || modes.rail || modes.walk) && gc < GROUND_MAX && mask[idx] && slerpLandOK(origin.lat, origin.lon, la, lo)) {
        const railSpd = modes.rail ? (sameHSR(origin.lat, origin.lon, la, lo) ? RAIL_HSR : RAIL_CONV) : 0;
        const spd = Math.max(railSpd, modes.drive ? DRIVE : 0);
        if (spd > 0) best = Math.min(best, 0.4 + gc * DETOUR / spd);
        if (modes.walk) best = Math.min(best, gc * 1.15 / WALK);
      }
      if (modes.air && originAp) {
        const dest = AIRPORTS[destIdx[idx]];
        const fkm = hav(originAp.y, originAp.x, dest.y, dest.x);
        const buffer = originAp.c !== dest.c ? 2.0 : 1.4;
        const t = accH + buffer + FLIGHT_FIXED + fkm / CRUISE + overhead(fkm) + 0.25 + egressKm[idx] * DETOUR / DRIVE;
        best = Math.min(best, t);
      }
      values[idx] = best;
    }
    buildBands();
    updateReach();
  }

  function buildBands() {
    const neg = new Float64Array(NX * NY);
    for (let i = 0; i < NX * NY; i++) neg[i] = isFinite(values[i]) ? -values[i] : -1e6;
    const cs = d3.contours().size([NX, NY]).thresholds(NEG_THRESH)(neg);
    bands = cs.map(c => {
      const hours = -c.value;
      const mp = c.coordinates.map(poly => poly.map(ring =>
        ring.map(([gx, gy]) => [-180 + gx * STEP, LAT0 - gy * STEP])));
      return { hours, color: COLORS[hours] || "#2f53b3", mp };
    }).filter(b => b.mp.length).sort((a, b) => b.hours - a.hours); // far → near
  }

  function updateReach() {
    let n = 0, tot = 0;
    CITIES.forEach(c => {
      if (c.name === origin.name) return;
      tot++;
      if (travelTime(c.lat, c.lon, true).t <= 24) n++;
    });
    const el = document.getElementById("reachStat");
    el.innerHTML = `${Math.round(n / tot * 100)}%<small>${n} / ${tot} world cities within 24 h</small>`;
  }

  /* ---------- rendering ---------- */
  function fitProjection() {
    projection.rotate([-origin.lon, -origin.lat]);
    const padL = W > 760 ? 360 : 20;
    projection.fitExtent([[padL, 40], [W - 40, H - 40]], { type: "Sphere" });
  }
  function project(lo, la) { return projection([lo, la]); }

  function render() {
    ctx.save();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#070a12"; ctx.fillRect(0, 0, W, H);

    // globe disk (ocean)
    ctx.beginPath(); path({ type: "Sphere" });
    ctx.fillStyle = "#0a1322"; ctx.fill();
    ctx.save(); ctx.beginPath(); path({ type: "Sphere" }); ctx.clip();

    // graticule
    if (showGrid) {
      ctx.beginPath(); path(graticule);
      ctx.strokeStyle = "rgba(140,160,200,.08)"; ctx.lineWidth = 0.6; ctx.stroke();
    }

    // isochrone bands, clipped to land
    ctx.save();
    ctx.beginPath(); path(LAND); ctx.fillStyle = "#0e1421"; ctx.fill(); // land base
    ctx.beginPath(); path(LAND); ctx.clip();
    ctx.globalAlpha = 0.82;
    for (const b of bands) drawBand(b);
    ctx.globalAlpha = 1;
    ctx.restore();

    // land outline + borders
    ctx.beginPath(); path(LAND); ctx.strokeStyle = "rgba(180,200,240,.22)"; ctx.lineWidth = 0.7; ctx.stroke();
    if (BORDERS) { ctx.beginPath(); path(BORDERS); ctx.strokeStyle = "rgba(140,160,200,.10)"; ctx.lineWidth = 0.5; ctx.stroke(); }

    drawInfra();

    // airports
    if (showAirports) {
      ctx.fillStyle = "rgba(255,255,255,.5)";
      for (const a of AIRPORTS) { const p = project(a.x, a.y); if (!p) continue;
        ctx.beginPath(); ctx.arc(p[0], p[1], 1.1, 0, 7); ctx.fill(); }
    }
    ctx.restore(); // sphere clip

    // origin marker
    const o = project(origin.lon, origin.lat);
    if (o) {
      const g = ctx.createRadialGradient(o[0], o[1], 0, o[0], o[1], 26);
      g.addColorStop(0, "rgba(255,209,102,.55)"); g.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o[0], o[1], 26, 0, 7); ctx.fill();
      ctx.fillStyle = "#fff7d6"; ctx.strokeStyle = "#070a12"; ctx.lineWidth = 1.5;
      star(o[0], o[1], 5, 7, 3.2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawInfra() {
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    // submarine cables
    if (layers.cables) {
      ctx.save(); ctx.setLineDash([2, 5]); ctx.strokeStyle = "rgba(122,200,255,.7)"; ctx.lineWidth = 1.1;
      for (const c of INFRA.cables) { ctx.beginPath(); path({ type: "LineString", coordinates: c.c }); ctx.stroke(); }
      ctx.restore();
    }
    // pipelines (glow underlay + line; dashed if planned)
    if (layers.pipelines) {
      for (const p of INFRA.pipelines) {
        const col = p.t === "oil" ? PIPE_OIL : PIPE_GAS;
        const geom = { type: "LineString", coordinates: p.c };
        ctx.save();
        ctx.globalAlpha = 0.22; ctx.strokeStyle = col; ctx.lineWidth = 4.5;
        ctx.beginPath(); path(geom); ctx.stroke();
        ctx.globalAlpha = 1; ctx.lineWidth = 1.7;
        if (p.s === "planned") ctx.setLineDash([5, 5]);
        ctx.beginPath(); path(geom); ctx.stroke();
        ctx.restore();
      }
    }
    markerHits = [];
    // major ports (diamonds)
    if (layers.ports) {
      for (const pt of INFRA.ports) {
        const q = project(pt.x, pt.y); if (!q) continue;
        drawMarker(q[0], q[1], "diamond", PORT, 2.8);
        markerHits.push({ x: q[0], y: q[1], n: pt.n, c: "Major port" });
      }
    }
    // point site categories — each with a distinct glyph
    for (const s of SITES) {
      if (!layers[s.key]) continue;
      for (const p of s.pts) {
        const q = project(p[1], p[2]); if (!q) continue;
        drawMarker(q[0], q[1], s.shape, s.color, 3.1);
        markerHits.push({ x: q[0], y: q[1], n: p[0], c: s.label });
      }
    }
  }

  function drawMarker(x, y, shape, color, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.lineJoin = "round";
    const dark = "rgba(7,10,18,.85)";
    if (shape === "ring") {
      ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, s * 0.34, 0, 7); ctx.fill();
    } else if (shape === "triangle") {
      tri(0, s, false); ctx.fill(); ctx.lineWidth = .8; ctx.strokeStyle = dark; ctx.stroke();
    } else if (shape === "invtri") {
      tri(0, s, true); ctx.fill(); ctx.lineWidth = .8; ctx.strokeStyle = dark; ctx.stroke();
    } else if (shape === "square") {
      ctx.fillRect(-s, -s, 2 * s, 2 * s); ctx.strokeStyle = dark; ctx.lineWidth = .8; ctx.strokeRect(-s, -s, 2 * s, 2 * s);
    } else if (shape === "rect") {
      ctx.fillRect(-s * 1.3, -s * 0.7, s * 2.6, s * 1.4); ctx.strokeStyle = dark; ctx.lineWidth = .8; ctx.strokeRect(-s * 1.3, -s * 0.7, s * 2.6, s * 1.4);
    } else if (shape === "diamond") {
      ctx.rotate(Math.PI / 4); ctx.fillRect(-s, -s, 2 * s, 2 * s); ctx.strokeStyle = dark; ctx.lineWidth = .8; ctx.strokeRect(-s, -s, 2 * s, 2 * s);
    } else if (shape === "hex") {
      poly(6, s, -Math.PI / 2); ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = .8; ctx.stroke();
    } else if (shape === "plus") {
      const t = s * 0.4; ctx.fillRect(-t, -s, 2 * t, 2 * s); ctx.fillRect(-s, -t, 2 * s, 2 * t);
    } else if (shape === "star") {
      star(0, 0, 5, s * 1.3, s * 0.55); ctx.fill();
    } else if (shape === "gear") {
      poly(8, s, 0); ctx.fill(); ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, 7); ctx.fill();
    } else { ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function tri(cx, r, inv) { const d = inv ? -1 : 1; ctx.beginPath();
    ctx.moveTo(0, -r * d); ctx.lineTo(r * 0.9, r * 0.8 * d); ctx.lineTo(-r * 0.9, r * 0.8 * d); ctx.closePath(); }
  function poly(n, r, rot) { ctx.beginPath();
    for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }

  function drawBand(b) {
    ctx.beginPath();
    for (const poly of b.mp) {
      for (const ring of poly) {
        let started = false;
        for (let k = 0; k < ring.length; k++) {
          const p = project(ring[k][0], ring[k][1]);
          if (!p || !isFinite(p[0])) { started = false; continue; }
          if (!started) { ctx.moveTo(p[0], p[1]); started = true; } else ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
      }
    }
    ctx.fillStyle = b.color; ctx.fill("evenodd");
  }

  function star(cx, cy, spikes, R1, R2) {
    let rot = -Math.PI / 2; const step = Math.PI / spikes; ctx.beginPath();
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * R1, cy + Math.sin(rot) * R1); rot += step;
      ctx.lineTo(cx + Math.cos(rot) * R2, cy + Math.sin(rot) * R2); rot += step;
    }
    ctx.closePath();
  }

  /* ---------- city selection + animation ---------- */
  function setOrigin(city, animate) {
    origin = city;
    originAp = AIRPORTS.find(a => a.i === city.iata) || AIRPORTS[nearestAirport(city.lat, city.lon)];
    document.getElementById("originInfo").innerHTML =
      `<b>${city.name}</b>, ${city.country}<br/>✈ ${originAp.i} · ${city.access} min to airport<br/>${city.lat.toFixed(2)}°, ${city.lon.toFixed(2)}°`;
    fetchWeather(city);
    computeField();
    if (animate) animateTo(); else { fitProjection(); render(); }
  }
  function animateTo() {
    animating = true;
    const r0 = projection.rotate().slice();
    const r1 = [-origin.lon, -origin.lat];
    let dl = r1[0] - r0[0]; while (dl > 180) dl -= 360; while (dl < -180) dl += 360;
    const t0 = performance.now(), dur = 750;
    (function frame(now) {
      const e = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - e, 3);
      projection.rotate([r0[0] + dl * k, r0[1] + (r1[1] - r0[1]) * k]);
      const padL = W > 760 ? 360 : 20;
      projection.fitExtent([[padL, 40], [W - 40, H - 40]], { type: "Sphere" });
      render();
      if (e < 1) requestAnimationFrame(frame); else animating = false;
    })(t0);
  }

  /* ---------- interactions ---------- */
  function fmt(h) {
    if (!isFinite(h)) return "—";
    if (h < 1) return Math.round(h * 60) + " min";
    if (h > 60) return Math.round(h) + " h";
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return mm ? `${hh} h ${mm} m` : `${hh} h`;
  }
  let lastCountry = null;
  function countryAt(lo, la) {
    if (lastCountry && d3.geoContains(lastCountry, [lo, la])) return lastCountry.properties.name;
    for (const f of COUNTRIES) if (d3.geoContains(f, [lo, la])) { lastCountry = f; return f.properties.name; }
    return null;
  }
  const tip = document.getElementById("tip");
  function onMove(e) {
    if (animating || !origin) { tip.hidden = true; return; }
    const mx = e.clientX, my = e.clientY;
    // hovering an infrastructure marker? show its name first
    let near = null, nd = 9;
    for (const h of markerHits) { const d = Math.hypot(h.x - mx, h.y - my); if (d < nd) { nd = d; near = h; } }
    if (near) {
      tip.innerHTML = `<div class="tip__t" style="font-size:18px">${near.n}</div><div class="tip__place">${near.c}</div>`;
      tip.style.left = mx + "px"; tip.style.top = my + "px"; tip.hidden = false; return;
    }
    const inv = projection.invert([mx, my]);
    if (!inv) { tip.hidden = true; return; }
    const back = project(inv[0], inv[1]);
    if (!back || Math.hypot(back[0] - mx, back[1] - my) > 4) { tip.hidden = true; return; }
    const [lo, la] = inv;
    const land = !!maskAt(lo, la);
    const r = travelTime(la, lo, land);
    const place = land ? (countryAt(lo, la) || "Land") : "Open water — crossed by air";
    let brk = "";
    if (!isFinite(r.t)) brk = "<i>unreachable with selected modes</i>";
    else if (r.mode === "air") {
      const p = r.parts;
      brk = `<i>access</i> ${fmt(p.access)} · <i>fly</i> ${originAp.i}→${p.dest.i} ${fmt(p.fly)}<br/><i>arrive</i> ${fmt(p.eg)} drive (${Math.round(p.egkm)} km)`;
    } else if (r.mode === "walk") brk = `🚶 on foot · ${Math.round(r.parts.gc)} km`;
    else brk = `${r.mode === "rail" ? "🚄 rail" : "🚗 drive"} · ${Math.round(r.parts.gc)} km`;
    tip.innerHTML = `<div class="tip__t">${fmt(r.t)}</div><div class="tip__place">${place}</div><div class="tip__break">${brk}</div>`;
    tip.style.left = mx + "px"; tip.style.top = my + "px"; tip.hidden = false;
  }

  function buildLegend() {
    const el = document.getElementById("legendBands");
    el.innerHTML = BANDS.map(h => `<div class="legend__row"><span class="legend__sw" style="background:${COLORS[h]}"></span>${BAND_LABEL[h]}</div>`).join("")
      + `<div class="legend__row"><span class="legend__sw" style="background:#0e1421;border:1px solid rgba(180,200,240,.2)"></span>beyond 48 h</div>`;
    buildLegendInfra();
  }
  function buildLegendInfra() {                 // only show rows for ACTIVE layers
    const el = document.getElementById("legendInfra"); const rows = [];
    const sw = (style) => `<span class="legend__sw" style="${style}"></span>`;
    if (layers.pipelines) {
      rows.push(`${sw(`background:${PIPE_OIL}`)}oil pipeline`);
      rows.push(`${sw(`background:${PIPE_GAS}`)}gas pipeline`);
    }
    if (layers.cables) rows.push(`${sw(`background:repeating-linear-gradient(90deg,${CABLE} 0 3px,transparent 3px 6px)`)}subsea cable`);
    if (layers.ports) rows.push(`${sw(`width:11px;height:11px;transform:rotate(45deg);background:${PORT}`)}major port`);
    for (const s of SITES) if (layers[s.key]) rows.push(`${sw(`background:${s.color}`)}${s.icon} ${s.label}`);
    el.innerHTML = rows.length ? rows.map(r => `<div class="legend__row">${r}</div>`).join("")
      : `<div class="legend__row" style="color:var(--faint)">— toggle a layer —</div>`;
  }
  function buildLayers() {
    const host = document.getElementById("layers");
    host.innerHTML = GROUPS.map(g => `<div class="lgroup"><div class="lgroup__h">${g.n}</div>
      <div class="lgroup__chips">${g.k.map(k => { const m = meta(k);
        return `<button class="lchip ${layers[k] ? "active" : ""}" data-l="${k}">
          <span class="dotc" style="background:${m.color}"></span><i>${m.icon}</i>${m.label}</button>`; }).join("")}</div></div>`).join("");
    host.querySelectorAll(".lchip").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.l; layers[k] = !layers[k]; b.classList.toggle("active", layers[k]);
      buildLegendInfra(); render();
    }));
  }
  function fetchWeather(city) {
    const el = document.getElementById("weather");
    el.className = "weather off"; el.textContent = "◴ fetching weather…";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
    const req = city.name;
    fetch(url).then(r => r.json()).then(d => {
      if (!origin || origin.name !== req) return;
      const c = d.current, w = WCODE[c.weather_code] || ["•", "—"];
      el.className = "weather";
      el.innerHTML = `<span class="weather__ico">${w[0]}</span><div><div class="weather__t">${Math.round(c.temperature_2m)}°C</div>` +
        `<div class="weather__m">${w[1]} · <i>wind</i> ${Math.round(c.wind_speed_10m)} km/h</div></div>`;
    }).catch(() => { if (origin && origin.name === req) { el.className = "weather off"; el.textContent = "☁ live weather unavailable offline"; } });
  }

  function buildCitySearch() {
    const input = document.getElementById("cityInput");
    const results = document.getElementById("cityResults");
    function show(list) {
      results.innerHTML = list.map((c, i) =>
        `<button data-i="${CITIES.indexOf(c)}" class="${i === 0 ? "sel" : ""}">${c.name} <span>${c.country}</span></button>`).join("");
      results.hidden = list.length === 0;
      results.querySelectorAll("button").forEach(b => b.addEventListener("click", () => pick(+b.dataset.i)));
    }
    function pick(i) {
      const c = CITIES[i]; input.value = c.name; results.hidden = true; setOrigin(c, true);
    }
    input.addEventListener("focus", () => show(CITIES.slice(0, 12)));
    input.addEventListener("input", () => {
      const q = input.value.toLowerCase().trim();
      show(CITIES.filter(c => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)).slice(0, 14));
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { const f = results.querySelector("button"); if (f) f.click(); }
      if (e.key === "Escape") results.hidden = true;
    });
    document.addEventListener("click", (e) => { if (!e.target.closest(".ctrl__search")) results.hidden = true; });
  }

  function buildModes() {
    document.querySelectorAll("#modes .mode").forEach(b => b.addEventListener("click", () => {
      const m = b.dataset.m; modes[m] = !modes[m]; b.classList.toggle("active", modes[m]);
      computeField(); render();
    }));
    buildLayers();
    document.getElementById("tgAirports").addEventListener("change", e => { showAirports = e.target.checked; render(); });
    document.getElementById("tgGrid").addEventListener("change", e => { showGrid = e.target.checked; render(); });
    const modal = document.getElementById("methodModal");
    document.getElementById("methodBtn").addEventListener("click", () => modal.hidden = false);
    document.getElementById("methodClose").addEventListener("click", () => modal.hidden = true);
    modal.addEventListener("click", e => { if (e.target === modal) modal.hidden = true; });
  }

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    path = d3.geoPath(projection, ctx);
    if (origin) { fitProjection(); render(); }
  }

  /* ---------- boot ---------- */
  Promise.all([
    fetch("data/land-110m.json").then(r => r.json()),
    fetch("data/countries-110m.json").then(r => r.json()),
    fetch("data/airports.json").then(r => r.json()),
  ]).then(([land, ctry, aps]) => {
    LAND = topojson.feature(land, land.objects.land);
    COUNTRIES = topojson.feature(ctry, ctry.objects.countries).features;
    BORDERS = topojson.mesh(ctry, ctry.objects.countries, (a, b) => a !== b);
    AIRPORTS = aps;
    AIRPORTS.forEach(a => {                 // precompute unit vectors for fast nearest
      const φ = toR(a.y), λ = toR(a.x), cf = Math.cos(φ);
      a.vx = cf * Math.cos(λ); a.vy = cf * Math.sin(λ); a.vz = Math.sin(φ);
    });
    resize();
    precompute();
    buildLegend(); buildCitySearch(); buildModes();
    document.getElementById("cityInput").value = "London";
    setOrigin(CITIES[0], false);
    addEventListener("resize", resize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", () => tip.hidden = true);
    document.getElementById("loader").classList.add("hide");
    // expose for verification
    window.__ISO = { travelTime: (la, lo) => travelTime(la, lo).t, origin: () => origin.name, bands: () => bands.length };
  }).catch(err => {
    document.querySelector(".loader__txt").textContent = "FAILED TO LOAD DATA";
    console.error(err);
  });
})();
