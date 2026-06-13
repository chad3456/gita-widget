/* =========================================================
   PHANTOM — spherical WebGL gallery
   Three.js (sphere of cards) · custom Lenis-style drag easing
   · Lenis-smoothed wheel · GSAP project transition
   ========================================================= */
(function () {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const TAU = Math.PI * 2;

  /* ---------- project data ---------- */
  const PROJECTS = [
    { brand: "NETFLIX",        title: "Stranger Things Walking Tour", cat: "EXPERIENCE",    tags: ["3D", "EVENT"],          year: "2025", c: ["#7a0d0d", "#e23b2e"], big: "STRANGER\nTHINGS" },
    { brand: "NBCUNIVERSAL",   title: "Bridget Jones OOH",            cat: "COMMUNICATION", tags: ["OOH", "CAMPAIGN"],      year: "2025", c: ["#3a1410", "#b6502f"], big: "" },
    { brand: "FINANCIAL TIMES",title: "AI Compass",                   cat: "EXPERIENCE",    tags: ["WEBSITE", "CONTENT"],   year: "2024", c: ["#1a1a1a", "#f0a23b"], big: "AI°\nCOMPASS" },
    { brand: "GOOGLE",         title: "Pixel for Travel",             cat: "COMMUNICATION", tags: ["ILLUSTRATION","CAMPAIGN"], year: "2025", c: ["#dfe6ef", "#9fb4cc"], big: "", dark: true },
    { brand: "GOOGLE MAPS",    title: "Petra — The Rose-Red City",    cat: "EXPERIENCE",    tags: ["WEBSITE", "AR"],        year: "2025", c: ["#6e1f1a", "#c8584a"], big: "PETRA" },
    { brand: "GOOGLE",         title: "Visitor Experience Guide",     cat: "EXPERIENCE",    tags: ["PHYSICAL", "EVENT"],    year: "2024", c: ["#3b6ea5", "#8fc1e3"], big: "" },
    { brand: "FREE SPIRITS",   title: "Casamigos Global Travel",      cat: "EXPERIENCE",    tags: ["3D", "MOTION"],         year: "2026", c: ["#2b2b30", "#9aa0aa"], big: "" },
    { brand: "DIAGEO",         title: "Don Julio World Class",        cat: "COMMUNICATION", tags: ["ILLUSTRATION", "3D"],   year: "2025", c: ["#5a2a0b", "#e08a2c"], big: "" },
    { brand: "DIAGEO",         title: "Johnnie Walker Festive",       cat: "COMMUNICATION", tags: ["AI", "EVENT"],          year: "2025", c: ["#0a1c3a", "#2f6bb0"], big: "" },
    { brand: "SONY MUSIC",     title: "Judas Priest: Forge",          cat: "EXPERIENCE",    tags: ["WEBSITE"],              year: "2025", c: ["#5b0c0c", "#d23030"], big: "JUDAS\nPRIEST" },
    { brand: "GOOGLE",         title: "Data & AI Trends 2024",        cat: "EXPERIENCE",    tags: ["WEBSITE", "TOOL"],      year: "2024", c: ["#0f3b2e", "#3fae84"], big: "" },
    { brand: "GOOGLE CLOUD",   title: "BigQuery",                     cat: "EXPERIENCE",    tags: ["TOOL", "CAMPAIGN"],     year: "2024", c: ["#2a1750", "#7c52d6"], big: "" },
    { brand: "SPOTIFY",        title: "Wrapped Live",                 cat: "COMMUNICATION", tags: ["MOTION", "3D"],         year: "2025", c: ["#0b3d1f", "#1ed760"], big: "WRAPPED" },
    { brand: "NIKE",           title: "Air Max Pulse",                cat: "EXPERIENCE",    tags: ["3D", "WEBSITE"],        year: "2024", c: ["#1a1a1a", "#c6ff2e"], big: "AIR\nMAX" },
    { brand: "ADOBE",          title: "Firefly Showcase",             cat: "COMMUNICATION", tags: ["AI", "CONTENT"],        year: "2025", c: ["#4a0d3a", "#e0479e"], big: "" },
    { brand: "META",           title: "Quest Worlds",                 cat: "EXPERIENCE",    tags: ["AR", "3D"],             year: "2025", c: ["#06303a", "#1fb6c9"], big: "" },
  ];

  /* ---------- sphere layout ---------- */
  const R = 12;
  const COLS = 14;                 // columns around the equator (seamless wrap)
  const ROWS = 5;                  // latitude bands
  const LON_STEP = TAU / COLS;
  const LAT_STEP = 0.5;
  const PITCH_LIMIT = LAT_STEP * (ROWS - 1) / 2 + 0.15;
  const TEX_W = 480, TEX_H = 560;
  const PLANE_W = R * LON_STEP * 0.92;
  const PLANE_H = PLANE_W * (TEX_H / TEX_W);

  /* ---------- three basics ---------- */
  const canvas = document.getElementById("gl");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, R, R + 16);

  const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 0);

  const group = new THREE.Group();
  scene.add(group);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const texCache = new Map();

  /* ---------- card texture (canvas) ---------- */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function makeTexture(p, idx) {
    if (texCache.has(idx)) return texCache.get(idx);
    const cv = document.createElement("canvas");
    cv.width = TEX_W; cv.height = TEX_H;
    const ctx = cv.getContext("2d");

    // ----- image block -----
    const bx = 0, by = 92, bw = TEX_W, bh = 360;
    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, p.c[0]);
    g.addColorStop(1, p.c[1]);
    ctx.save();
    roundRect(ctx, bx, by, bw, bh, 16);
    ctx.clip();
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);
    // soft radial sheen
    const rg = ctx.createRadialGradient(bw * 0.7, by + bh * 0.35, 20, bw * 0.7, by + bh * 0.35, bw * 0.8);
    rg.addColorStop(0, "rgba(255,255,255,0.22)");
    rg.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(bx, by, bw, bh);
    // big label inside the block
    if (p.big) {
      ctx.fillStyle = p.dark ? "rgba(20,20,25,0.92)" : "rgba(255,255,255,0.95)";
      ctx.font = "800 62px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      p.big.split("\n").forEach((line, i) => ctx.fillText(line, 30, by + 34 + i * 60));
    }
    ctx.restore();

    // ----- top labels -----
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    ctx.font = "700 17px 'Space Mono', ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(p.brand, 2, 70);
    ctx.textAlign = "right";
    ctx.font = "400 15px 'Space Mono', ui-monospace, monospace";
    wrapRight(ctx, p.title.toUpperCase(), TEX_W - 2, 56, 220, 18);

    // ----- bottom row: category + tag chips + year -----
    const baseY = by + bh + 34;
    ctx.textAlign = "left";
    ctx.fillStyle = "#cfcfcf";
    ctx.font = "400 14px 'Space Mono', ui-monospace, monospace";
    ctx.fillText(p.cat, 2, baseY + 14);
    // chips
    let cx = 2;
    const chipsY = baseY + 30;
    ctx.font = "400 13px 'Space Mono', ui-monospace, monospace";
    p.tags.forEach((tg) => {
      const tw = ctx.measureText(tg).width + 20;
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      roundRect(ctx, cx, chipsY, tw, 26, 13);
      ctx.stroke();
      ctx.fillStyle = "#e8e8e8";
      ctx.fillText(tg, cx + 10, chipsY + 18);
      cx += tw + 8;
    });
    // year (right)
    ctx.textAlign = "right";
    ctx.fillStyle = "#9a9a9a";
    ctx.font = "400 14px 'Space Mono', ui-monospace, monospace";
    ctx.fillText(p.year, TEX_W - 2, baseY + 14);

    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = maxAniso;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    texCache.set(idx, tex);
    return tex;
  }

  function wrapRight(ctx, text, x, y, maxW, lh) {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    words.forEach((w) => {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; }
      else line = t;
    });
    if (line) lines.push(line);
    const start = y - (lines.length - 1) * lh;
    lines.forEach((l, i) => ctx.fillText(l, x, start + i * lh));
  }

  /* ---------- build the sphere ---------- */
  const cards = [];
  const geo = new THREE.PlaneGeometry(PLANE_W, PLANE_H);
  let n = 0;
  for (let r = 0; r < ROWS; r++) {
    const lat = (r - (ROWS - 1) / 2) * LAT_STEP;
    for (let c = 0; c < COLS; c++) {
      const lon = c * LON_STEP + (r % 2) * LON_STEP * 0.5; // brick offset per row
      const p = PROJECTS[n % PROJECTS.length];
      const tex = makeTexture(p, n % PROJECTS.length);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
      mat.depthWrite = false;

      const pivot = new THREE.Object3D();
      pivot.rotation.order = "YXZ";
      pivot.rotation.y = lon;
      pivot.rotation.x = lat;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0, -R);          // sits in front of the camera (-Z), faces origin
      mesh.userData = { project: p, lon, lat, mat };
      pivot.add(mesh);
      group.add(pivot);
      cards.push(mesh);
      n++;
    }
  }

  /* ---------- cursor-reactive particle shader ---------- */
  // smoothed pointer in normalised device coords (-1..1), shared by particles + hover
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => {
    mouse.tx = (e.clientX / innerWidth) * 2 - 1;
    mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  }, { passive: true });

  const particles = (function () {
    const COUNT = isTouch ? 1200 : 2600;
    const pos = new Float32Array(COUNT * 3);
    const scale = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // distribute in a shell around the camera, mostly in front of the cards
      const rr = 3 + Math.random() * (R + 3);
      const th = Math.random() * TAU;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3]     = rr * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = rr * Math.cos(ph);
      scale[i] = 0.6 + Math.random() * 2.4;
      phase[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uMouseVel: { value: 0 },
        uPixelRatio: { value: Math.min(devicePixelRatio, 2) },
        uColor: { value: new THREE.Color(0xbfe0ff) },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uMouseVel;
        uniform float uPixelRatio;
        attribute float aScale;
        attribute float aPhase;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          // organic drift
          float t = uTime * 0.18 + aPhase * 6.2831853;
          p.x += sin(t) * 0.45;
          p.y += cos(t * 0.9) * 0.45;
          p.z += sin(t * 0.7) * 0.45;
          // cursor swirl around the view axis (stronger when the cursor moves)
          float ang = uMouse.x * (0.35 + uMouseVel * 2.5);
          float ca = cos(ang), sa = sin(ang);
          p.xy = mat2(ca, -sa, sa, ca) * p.xy;
          // cursor push — particles lean toward the pointer with a soft falloff
          float fall = 1.0 / (1.0 + length(p.xy) * 0.07);
          p.x += uMouse.x * 3.2 * fall;
          p.y += uMouse.y * 3.2 * fall;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aScale * uPixelRatio * (90.0 / max(0.1, -mv.z));
          vAlpha = clamp(1.0 - (-mv.z) / 26.0, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uMouseVel;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.0, d) * vAlpha * (0.35 + uMouseVel * 1.2);
          gl_FragColor = vec4(uColor, a);
        }
      `,
    });

    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    const layer = new THREE.Group();      // own parallax layer
    layer.add(pts);
    scene.add(layer);

    return {
      update(time, vel) {
        mat.uniforms.uTime.value = time;
        mat.uniforms.uMouse.value.set(mouse.x, mouse.y);
        mat.uniforms.uMouseVel.value = vel;
        // parallax: counter-rotate a little against the gallery + lean with cursor
        layer.rotation.y = group.rotation.y * 0.12 - mouse.x * 0.15;
        layer.rotation.x = group.rotation.x * 0.12 - mouse.y * 0.15;
      },
    };
  })();

  /* ---------- control state (Lenis-style easing) ---------- */
  const rot = { x: 0, y: 0 };          // applied to the group every frame
  const target = { x: 0, y: 0 };       // where we are easing toward
  const vel = { x: 0, y: 0 };          // release inertia
  let dragging = false, moved = false, animating = false, isOpen = false;
  let last = { x: 0, y: 0 }, downPt = { x: 0, y: 0 };
  let introTween = null;
  const stopIntro = () => { if (introTween) { introTween.kill(); introTween = null; } };
  const DRAG_SENS = 0.0042;
  const EASE = 0.085;                  // exponential smoothing — the Lenis "feel"
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- pointer drag ---------- */
  canvas.addEventListener("pointerdown", (e) => {
    if (isOpen) return;
    stopIntro();
    dragging = true; moved = false;
    last.x = e.clientX; last.y = e.clientY;
    downPt.x = e.clientX; downPt.y = e.clientY;
    vel.x = vel.y = 0;
    canvas.classList.add("grabbing");
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      last.x = e.clientX; last.y = e.clientY;
      target.y += dx * DRAG_SENS;
      target.x -= dy * DRAG_SENS;
      vel.y = dx * DRAG_SENS;
      vel.x = -dy * DRAG_SENS;
      if (Math.abs(e.clientX - downPt.x) + Math.abs(e.clientY - downPt.y) > 6) moved = true;
    } else if (!isOpen) {
      hover(e);
    }
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    canvas.classList.remove("grabbing");
    // treat a clean tap as a click
    if (!moved) clickAt(e);
  }
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", () => (dragging = false));

  /* ---------- raycaster hover / click ---------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;

  function pick(e) {
    ndc.x = (e.clientX / innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / innerHeight) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cards, false);
    return hits.length ? hits[0].object : null;
  }
  function hover(e) {
    const hit = pick(e);
    if (hit === hovered) return;
    if (hovered) gsap.to(hovered.scale, { x: 1, y: 1, duration: 0.4, ease: "power3.out" });
    hovered = hit;
    if (hovered) {
      gsap.to(hovered.scale, { x: 1.06, y: 1.06, duration: 0.4, ease: "power3.out" });
      canvas.classList.add("pointing");
    } else {
      canvas.classList.remove("pointing");
    }
  }
  function clickAt(e) {
    const hit = pick(e);
    if (hit) openProject(hit);
  }

  /* ---------- wheel via Lenis (desktop) ---------- */
  let lenis = null, lastScroll = 0;
  if (!isTouch && typeof Lenis !== "undefined" && !reduce) {
    const spacer = document.createElement("div");
    spacer.style.cssText = "position:absolute;top:0;left:0;width:1px;height:400vh;pointer-events:none;opacity:0;z-index:-1;";
    document.body.appendChild(spacer);
    try {
      lenis = new Lenis({ infinite: true, lerp: 0.08, wheelMultiplier: 0.9 });
      lenis.on("scroll", ({ scroll }) => {
        if (isOpen || animating) { lastScroll = scroll; return; }
        if (Math.abs(scroll - lastScroll) > 0.5) stopIntro();
        target.y += (scroll - lastScroll) * 0.0012;
        lastScroll = scroll;
      });
    } catch (err) { lenis = null; }
  }
  // fallback / touch wheel
  canvas.addEventListener("wheel", (e) => {
    if (lenis || isOpen || animating) return;
    e.preventDefault();
    stopIntro();
    target.y += e.deltaX * 0.0016;
    target.x -= e.deltaY * 0.0016;
  }, { passive: false });

  /* ---------- project open / close (GSAP) ---------- */
  const detail = document.getElementById("detail");
  let openMesh = null;
  function openProject(mesh) {
    if (isOpen) return;
    isOpen = true; animating = true; openMesh = mesh;
    if (lenis) lenis.stop();                 // release the wheel so the page can scroll
    detail.scrollTop = 0;
    document.getElementById("hint").style.opacity = "0";
    if (hovered) { gsap.to(hovered.scale, { x: 1, y: 1, duration: 0.3 }); hovered = null; }
    canvas.classList.remove("pointing");

    const { project: p, lon, lat } = mesh.userData;
    // populate the detail template
    detail.querySelector("#detailBrand").textContent = p.brand;
    detail.querySelector("#detailTitle").textContent = p.title;
    detail.querySelector("#detailClient").textContent = p.brand;
    detail.querySelector("#detailYear").textContent = p.year;
    detail.querySelector("#detailTags").textContent = [p.cat, ...p.tags].join(" · ");
    detail.querySelector("#detailHero").style.background =
      `linear-gradient(135deg, ${p.c[0]}, ${p.c[1]})`;
    const next = PROJECTS[(PROJECTS.indexOf(p) + 1) % PROJECTS.length];
    detail.querySelector("#detailNext").textContent = next.title;

    // centre the clicked card (shortest path on the infinite axis)
    const baseY = -lon;
    const k = Math.round((rot.y - baseY) / TAU);
    const ty = baseY + k * TAU;

    const tl = gsap.timeline({
      onComplete() {
        detail.classList.add("open");
        detail.setAttribute("aria-hidden", "false");
      },
    });
    tl.to(rot, { y: ty, x: -lat, duration: 0.8, ease: "power3.inOut" }, 0)
      .to(camera.position, { z: -(R - 4.2), duration: 1.0, ease: "power3.inOut" }, 0)
      .to(mesh.scale, { x: 1.25, y: 1.25, duration: 1.0, ease: "power3.inOut" }, 0)
      .to(camera, { fov: 52, duration: 1.0, ease: "power3.inOut",
        onUpdate: () => camera.updateProjectionMatrix() }, 0);
  }

  function closeProject() {
    if (!isOpen) return;
    detail.classList.remove("open");
    detail.setAttribute("aria-hidden", "true");
    const mesh = openMesh;
    const tl = gsap.timeline({
      onComplete() {
        animating = false; isOpen = false; openMesh = null;
        target.y = rot.y; target.x = clamp(rot.x, -PITCH_LIMIT, PITCH_LIMIT);
        vel.x = vel.y = 0;
        if (lenis) { lenis.start(); lastScroll = lenis.scroll || 0; }
      },
    });
    tl.to(camera.position, { z: 0, duration: 0.9, ease: "power3.inOut" }, 0)
      .to(camera, { fov: 70, duration: 0.9, ease: "power3.inOut",
        onUpdate: () => camera.updateProjectionMatrix() }, 0);
    if (mesh) tl.to(mesh.scale, { x: 1, y: 1, duration: 0.9, ease: "power3.inOut" }, 0);
  }

  document.getElementById("detailBack").addEventListener("click", closeProject);
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeProject(); });

  /* ---------- render loop ---------- */
  let prevMouseX = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    if (lenis) lenis.raf(t);

    // smooth the pointer (the particle field's "feel")
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;
    const mvel = Math.min(0.5, Math.abs(mouse.x - prevMouseX) * 6);
    prevMouseX = mouse.x;
    particles.update(t * 0.001, mvel);

    if (!animating) {
      if (!dragging) {
        target.y += vel.y; target.x += vel.x;
        vel.y *= 0.94; vel.x *= 0.94;
        if (Math.abs(vel.y) < 1e-5) vel.y = 0;
        if (Math.abs(vel.x) < 1e-5) vel.x = 0;
      }
      target.x = clamp(target.x, -PITCH_LIMIT, PITCH_LIMIT);
      rot.y += (target.y - rot.y) * EASE;
      rot.x += (target.x - rot.x) * EASE;
    }
    group.rotation.y = rot.y;
    group.rotation.x = rot.x;
    renderer.render(scene, camera);
  }

  /* ---------- intro ---------- */
  function intro() {
    if (reduce) {
      cards.forEach((m) => (m.material.opacity = 1));
      return;
    }
    cards.forEach((m) => { m.material.opacity = 0; m.scale.set(0.6, 0.6, 0.6); });
    gsap.to(cards.map((m) => m.material), {
      opacity: 1, duration: 1.0, ease: "power2.out", stagger: { each: 0.012, from: "random" },
    });
    gsap.to(cards.map((m) => m.scale), {
      x: 1, y: 1, z: 1, duration: 1.1, ease: "power3.out", stagger: { each: 0.012, from: "random" },
    });
    // a gentle initial drift that the user can override at any time
    introTween = gsap.to(target, { y: 0.6, duration: 6, ease: "power1.out" });
  }

  /* ---------- resize ---------- */
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  /* ---------- clocks + sound toggle ---------- */
  function tickClocks() {
    const fmt = (tz) => new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date());
    const offset = (tz) => {
      const s = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
        .formatToParts(new Date()).find((x) => x.type === "timeZoneName");
      return s ? s.value.replace("GMT", "GMT") : "";
    };
    const lon = document.getElementById("clockLon");
    const akl = document.getElementById("clockAkl");
    if (lon) lon.textContent = `${fmt("Europe/London")} ${offset("Europe/London")}`;
    if (akl) akl.textContent = `${fmt("Pacific/Auckland")} ${offset("Pacific/Auckland")}`;
  }
  tickClocks();
  setInterval(tickClocks, 1000 * 20);

  const soundBtn = document.getElementById("soundBtn");
  let soundOn = false;
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    document.getElementById("soundState").textContent = soundOn ? "[ON]" : "[OFF]";
  });

  // magnetic buttons (subtle)
  if (!isTouch) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const b = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (b.left + b.width / 2)) * 0.25,
          y: (e.clientY - (b.top + b.height / 2)) * 0.35, duration: 0.4, ease: "power3" });
      });
      el.addEventListener("mouseleave", () =>
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
    });
  }

  /* ---------- loader → boot ---------- */
  function boot() {
    const bar = document.getElementById("loaderBar");
    const pct = document.getElementById("loaderPct");
    const loader = document.getElementById("loader");
    const o = { v: 0 };
    gsap.to(o, {
      v: 100, duration: 0.8, ease: "power1.inOut",
      onUpdate() { const v = Math.round(o.v); bar.style.width = v + "%"; pct.textContent = v; },
      onComplete() {
        gsap.to(loader, { opacity: 0, duration: 0.5, onComplete() { loader.style.display = "none"; } });
        intro();
      },
    });
  }

  requestAnimationFrame(frame);
  boot();
})();
