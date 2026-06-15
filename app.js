/* =========================================================
   AEGIS LAB — air-defence missile systems, visualised
   Three.js · GSAP (ScrollTrigger, Flip) · Lenis
   Educational. Models are stylised; numbers are illustrative.
   ========================================================= */
(function () {
  "use strict";
  const T = window.THREE;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && window.Flip) gsap.registerPlugin(Flip);

  const RS = 0.02;                 // metres -> scene units (positions only)
  const MACH = 340;                // m/s
  const G = 9.80665;
  let lenisRef = null;             // shared smooth-scroll handle
  let simCtl = null;               // simulator scenario controller (set by wireUI)
  function goTo(sel) { const el = document.querySelector(sel); if (!el) return; if (lenisRef) lenisRef.scrollTo(el, { offset: -10 }); else el.scrollIntoView({ behavior: "smooth" }); }

  /* ---------------------------------------------------------
     SCENE REGISTRY — render only what's on screen
  --------------------------------------------------------- */
  const registry = [];
  function register(canvas, obj) {
    const entry = { obj, active: true };
    registry.push(entry);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (e) => { entry.active = e[0].isIntersecting; },
        { rootMargin: "120px" }
      );
      io.observe(canvas);
    }
    return obj;
  }
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    for (const e of registry) if (e.active && e.obj.render) e.obj.render(dt, now);
  }

  function makeRenderer(canvas) {
    const r = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    return r;
  }
  function fit(renderer, camera, canvas) {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  /* ---------------------------------------------------------
     MATERIALS
  --------------------------------------------------------- */
  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.6, metalness: o.m ?? 0.3, ...o });
  const PALETTE = {
    body: 0x8a97a8, dark: 0x3a4453, canopy: 0x16242f, accent: 0x33e1d6,
    missile: 0xcfd6df, missileDark: 0x6b7686, warm: 0xffb24d, red: 0xff5a52,
  };

  /* ---------------------------------------------------------
     MODEL BUILDERS  (everything faces +X = forward)
  --------------------------------------------------------- */
  function cyl(rt, rb, len, m, segs = 20) {
    const g = new T.Mesh(new T.CylinderGeometry(rt, rb, len, segs), m);
    g.rotation.z = -Math.PI / 2;           // lie along +X
    return g;
  }
  function buildRafale(scale = 1) {
    const g = new T.Group();
    const skin = mat(PALETTE.body, { r: 0.5, m: 0.4 });
    const dark = mat(PALETTE.dark, { r: 0.6 });
    // fuselage
    const fus = cyl(0.9, 1.1, 12, skin, 24); fus.position.x = 0; g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(0.9, 4, 24), skin);
    nose.rotation.z = -Math.PI / 2; nose.position.x = 8; g.add(nose);
    const tailcone = new T.Mesh(new T.ConeGeometry(1.1, 3, 24), dark);
    tailcone.rotation.z = Math.PI / 2; tailcone.position.x = -7.5; g.add(tailcone);
    // canopy
    const canopy = new T.Mesh(new T.SphereGeometry(0.95, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(PALETTE.canopy, { r: 0.15, m: 0.6 }));
    canopy.scale.set(3.4, 1, 1.1); canopy.position.set(3.6, 0.7, 0); g.add(canopy);
    // delta wings
    const wingShape = new T.Shape();
    wingShape.moveTo(2.5, 0); wingShape.lineTo(-4.5, 0); wingShape.lineTo(-4.5, 8.5); wingShape.lineTo(2.5, 1.4); wingShape.closeTo?.();
    const wingGeo = new T.ExtrudeGeometry(wingShape, { depth: 0.25, bevelEnabled: false });
    const mkWing = (side) => {
      const w = new T.Mesh(wingGeo, skin);
      w.rotation.x = -Math.PI / 2; w.position.set(-1, -0.2, side * 0.9);
      w.scale.z = side; return w;
    };
    g.add(mkWing(1)); g.add(mkWing(-1));
    // canards
    const canardGeo = new T.BoxGeometry(2.2, 0.12, 2.6);
    [1, -1].forEach((s) => {
      const c = new T.Mesh(canardGeo, dark);
      c.position.set(4.4, 0.2, s * 2.0); c.rotation.y = s * 0.5; g.add(c);
    });
    // vertical tail
    const tailShape = new T.Shape();
    tailShape.moveTo(0, 0); tailShape.lineTo(-3.4, 0); tailShape.lineTo(-3.4, 3.4); tailShape.lineTo(-0.5, 0.3);
    const tail = new T.Mesh(new T.ExtrudeGeometry(tailShape, { depth: 0.16, bevelEnabled: false }), skin);
    tail.position.set(-5, 0.4, -0.08); g.add(tail);
    // intakes + nozzles
    [1, -1].forEach((s) => {
      const intake = new T.Mesh(new T.BoxGeometry(3, 1.2, 1.1), dark);
      intake.position.set(2.5, -0.3, s * 1.2); g.add(intake);
      const noz = new T.Mesh(new T.CylinderGeometry(0.5, 0.6, 1, 16), mat(0x222a33, { m: 0.7, r: 0.4 }));
      noz.rotation.z = Math.PI / 2; noz.position.set(-8.6, -0.1, s * 0.5); g.add(noz);
    });
    g.scale.setScalar(scale);
    return g;
  }

  // missile with named sections (for anatomy explode/highlight)
  function buildMissile(scale = 1) {
    const g = new T.Group();
    const parts = {};
    const skin = mat(PALETTE.missile, { r: 0.45, m: 0.5 });
    const dk = mat(PALETTE.missileDark, { r: 0.5, m: 0.5 });
    // seeker (nose)
    const seeker = new T.Group();
    const dome = new T.Mesh(new T.SphereGeometry(0.5, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(0x223544, { r: 0.1, m: 0.7 }));
    dome.rotation.z = -Math.PI / 2; dome.position.x = 4.4; seeker.add(dome);
    const seekBody = cyl(0.5, 0.5, 1.2, skin); seekBody.position.x = 3.6; seeker.add(seekBody);
    parts.seeker = seeker;
    // guidance
    const guidance = new T.Group();
    const gd = cyl(0.5, 0.5, 1.4, dk); gd.position.x = 2.2; guidance.add(gd);
    parts.guidance = guidance;
    // warhead
    const warhead = new T.Group();
    const wh = cyl(0.5, 0.5, 1.6, mat(PALETTE.warm, { r: 0.5, m: 0.3 })); wh.position.x = 0.6; warhead.add(wh);
    parts.warhead = warhead;
    // propulsion
    const propulsion = new T.Group();
    const motor = cyl(0.5, 0.5, 3.2, skin); motor.position.x = -1.8; propulsion.add(motor);
    const nozzle = new T.Mesh(new T.CylinderGeometry(0.28, 0.42, 0.7, 16), mat(0x1a2129, { m: 0.7 }));
    nozzle.rotation.z = Math.PI / 2; nozzle.position.x = -3.7; propulsion.add(nozzle);
    parts.propulsion = propulsion;
    // fins (control + wings)
    const fins = new T.Group();
    const finGeo = new T.BoxGeometry(1.1, 0.06, 0.9);
    const wingGeo = new T.BoxGeometry(0.9, 0.06, 0.7);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const f = new T.Mesh(finGeo, dk);
      f.position.set(-3, Math.cos(a) * 0.7, Math.sin(a) * 0.7); f.rotation.x = a; fins.add(f);
      const w = new T.Mesh(wingGeo, dk);
      w.position.set(0.4, Math.cos(a) * 0.7, Math.sin(a) * 0.7); w.rotation.x = a; fins.add(w);
    }
    parts.fins = fins;

    Object.values(parts).forEach((p) => { p.userData.home = 0; g.add(p); });
    // store explode offsets (along -X spread order: seeker..fins)
    parts.seeker.userData.ex = 5; parts.guidance.userData.ex = 2.4;
    parts.warhead.userData.ex = 0; parts.propulsion.userData.ex = -3.2; parts.fins.userData.ex = -6.5;
    g.scale.setScalar(scale);
    g.userData.parts = parts;
    return g;
  }

  function buildJet(color, scale = 1) {           // generic target jet (faces +X)
    const g = new T.Group();
    const skin = mat(color, { r: 0.5, m: 0.3 });
    const fus = cyl(0.6, 0.7, 7, skin, 16); g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(0.6, 2.4, 16), skin);
    nose.rotation.z = -Math.PI / 2; nose.position.x = 4.7; g.add(nose);
    const wing = new T.Mesh(new T.BoxGeometry(2.4, 0.12, 9), skin); wing.position.x = -0.4; g.add(wing);
    const tail = new T.Mesh(new T.BoxGeometry(1.4, 0.12, 4), skin); tail.position.x = -3.6; g.add(tail);
    const fin = new T.Mesh(new T.BoxGeometry(1.4, 1.8, 0.12), skin); fin.position.set(-3.6, 0.9, 0); g.add(fin);
    g.scale.setScalar(scale);
    return g;
  }

  function orient(obj, vHat) {                    // point +X along velocity
    obj.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), vHat);
  }

  /* ---------------------------------------------------------
     SKY / ENVIRONMENT helper
  --------------------------------------------------------- */
  function addSky(scene, top, bottom) {
    scene.background = new T.Color(bottom);
    scene.add(new T.HemisphereLight(top, 0x0a0f16, 0.9));
    const sun = new T.DirectionalLight(0xffffff, 1.0); sun.position.set(40, 60, 20); scene.add(sun);
    const fill = new T.DirectionalLight(PALETTE.accent, 0.25); fill.position.set(-30, 10, -20); scene.add(fill);
  }
  function cloudField(scene, n, spread, yBase) {
    const geo = new T.SphereGeometry(1, 8, 6);
    const m = new T.MeshStandardMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.06, roughness: 1 });
    const mesh = new T.InstancedMesh(geo, m, n);
    const d = new T.Object3D();
    for (let i = 0; i < n; i++) {
      d.position.set((Math.random() - 0.5) * spread, yBase + (Math.random() - 0.5) * spread * 0.3, (Math.random() - 0.5) * spread);
      const s = 14 + Math.random() * 40; d.scale.set(s, s * 0.5, s);
      d.updateMatrix(); mesh.setMatrixAt(i, d.matrix);
    }
    scene.add(mesh); return mesh;
  }

  /* ---------------------------------------------------------
     HERO — Rafale flying
  --------------------------------------------------------- */
  function heroScene() {
    const canvas = document.getElementById("heroGL");
    if (!canvas || !T) return;
    const scene = new T.Scene(); scene.fog = new T.FogExp2(0x070b12, 0.0038);
    addSky(scene, 0x1a3a5a, 0x070b12);
    const camera = new T.PerspectiveCamera(45, 1, 0.1, 2000);
    const renderer = makeRenderer(canvas);
    const jet = buildRafale(1.1); scene.add(jet);
    // a couple of MICA missiles under wings
    [1, -1].forEach((s) => {
      const m = buildMissile(0.5); m.position.set(-1, -1.2, s * 5.6); scene.add(m);
      m.userData.host = s;
    });
    cloudField(scene, 40, 600, -30);
    const fitAll = () => fit(renderer, camera, canvas);
    fitAll(); addEventListener("resize", fitAll);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });
    let t = 0;
    return register(canvas, { render(dt) {
      t += dt;
      mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
      jet.position.set(2 + Math.sin(t * 0.4) * 1.5, -1 + Math.sin(t * 0.7) * 1.2, 0);
      jet.rotation.z = Math.sin(t * 0.5) * 0.12;
      jet.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.15;
      jet.rotation.x = 0.06 + mouse.y * 0.2;
      scene.children.forEach(() => {});
      camera.position.set(26 + mouse.x * 8, 6 + mouse.y * -6, 30);
      camera.lookAt(0, -1, 0);
      renderer.render(scene, camera);
    } });
  }

  /* ---------------------------------------------------------
     PLATFORM — Rafale with projected hotspots
  --------------------------------------------------------- */
  const HOTSPOTS = [
    { id: "RBE2-AA AESA RADAR", at: [8, 0, 0], desc: "The active electronically-scanned array in the nose detects and tracks targets, then hands the missile its initial track before launch." },
    { id: "MICA INTERCEPTOR", at: [-1, -1.4, 5.6], desc: "An interceptor on the wing station. IR or radar-guided, it is cued by the jet's sensors and released into the engagement." },
    { id: "CANARD FOREPLANE", at: [4.4, 0.2, 2.0], desc: "Movable foreplanes give the delta-canard layout its agility — vital for pointing the nose and the seeker quickly." },
    { id: "SPECTRA / EW SUITE", at: [-5, 0.6, 0], desc: "The electronic-warfare suite detects threats and jams hostile seekers — the defensive half of the air-combat equation." },
  ];
  function platformScene() {
    const canvas = document.getElementById("platformGL");
    const layer = document.getElementById("hotspots");
    const readout = document.getElementById("platformReadout");
    if (!canvas || !T) return;
    const scene = new T.Scene(); scene.fog = new T.FogExp2(0x070b12, 0.006);
    addSky(scene, 0x21456a, 0x0a1018);
    const camera = new T.PerspectiveCamera(42, 1, 0.1, 1000);
    const renderer = makeRenderer(canvas);
    const jet = buildRafale(1.0); scene.add(jet);
    [1, -1].forEach((s) => { const m = buildMissile(0.5); m.position.set(-1, -1.2, s * 5.6); scene.add(m); });
    const fitAll = () => fit(renderer, camera, canvas); fitAll(); addEventListener("resize", fitAll);

    // DOM hotspots
    const els = HOTSPOTS.map((h, i) => {
      const d = document.createElement("button");
      d.className = "hot"; d.innerHTML = "<span></span>";
      d.setAttribute("aria-label", h.id);
      d.addEventListener("mouseenter", () => activate(i));
      d.addEventListener("click", () => activate(i));
      layer.appendChild(d); return d;
    });
    let activeI = 0;
    function activate(i) {
      activeI = i; els.forEach((e, k) => e.classList.toggle("active", k === i));
      readout.querySelector("h3").textContent = HOTSPOTS[i].id;
      readout.querySelector("p").textContent = HOTSPOTS[i].desc;
    }
    const v = new T.Vector3();
    let t = 0;
    return register(canvas, { render(dt) {
      t += dt;
      jet.rotation.y = -0.6 + Math.sin(t * 0.18) * 0.5;
      jet.rotation.z = Math.sin(t * 0.3) * 0.04;
      camera.position.set(20, 8, 24); camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      // project hotspots
      const rect = canvas.getBoundingClientRect();
      HOTSPOTS.forEach((h, i) => {
        v.set(h.at[0], h.at[1], h.at[2]).applyMatrix4(jet.matrixWorld).project(camera);
        const x = (v.x * 0.5 + 0.5) * rect.width, y = (-v.y * 0.5 + 0.5) * rect.height;
        const el = els[i];
        el.style.left = x + "px"; el.style.top = y + "px";
        el.style.display = v.z < 1 ? "block" : "none";
      });
    } });
  }

  /* ---------------------------------------------------------
     ANATOMY — missile parts, explode + highlight
  --------------------------------------------------------- */
  const PARTS_INFO = [
    { key: "seeker", name: "Seeker", color: 0x33e1d6, idx: "01", desc: "The eye. An infrared or active-radar head that locks the target and measures the line of sight to it." },
    { key: "guidance", name: "Guidance & Control", color: 0x6fb1ff, idx: "02", desc: "The brain. It runs the navigation law, deciding how hard to turn, and drives the fin actuators." },
    { key: "warhead", name: "Warhead & Fuze", color: 0xffb24d, idx: "03", desc: "The effect. A proximity fuze detonates a fragmentation warhead at the optimum miss distance." },
    { key: "propulsion", name: "Rocket Motor", color: 0xcfd6df, idx: "04", desc: "The legs. A solid (or ramjet) motor boosts the missile to several times the speed of sound." },
    { key: "fins", name: "Control Fins", color: 0x9aa6b6, idx: "05", desc: "The hands. Tail fins and wings translate guidance commands into lateral acceleration." },
  ];
  function anatomyScene() {
    const canvas = document.getElementById("anatomyGL");
    const list = document.getElementById("partsList");
    const btn = document.getElementById("explodeBtn");
    if (!canvas || !T) return;
    const scene = new T.Scene();
    addSky(scene, 0x21456a, 0x0a1018);
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 200); camera.position.set(0, 3, 20);
    const renderer = makeRenderer(canvas);
    const missile = buildMissile(1.3); scene.add(missile);
    const parts = missile.userData.parts;
    const fitAll = () => fit(renderer, camera, canvas); fitAll(); addEventListener("resize", fitAll);

    // build list
    list.innerHTML = PARTS_INFO.map((p) => `
      <li data-key="${p.key}">
        <div class="parts__head">
          <span class="parts__dot" style="background:#${p.color.toString(16).padStart(6,"0")}"></span>
          <span class="parts__name">${p.name}</span>
          <span class="parts__idx">${p.idx}</span>
        </div>
        <p class="parts__desc">${p.desc}</p>
      </li>`).join("");
    const items = [...list.querySelectorAll("li")];
    let exploded = false, activeKey = null;
    function highlight(key) {
      activeKey = key;
      items.forEach((li) => li.classList.toggle("active", li.dataset.key === key));
      PARTS_INFO.forEach((p) => {
        const grp = parts[p.key];
        grp.traverse((o) => {
          if (o.isMesh) {
            o.material.emissive = new T.Color(key && p.key === key ? p.color : 0x000000);
            o.material.emissiveIntensity = key && p.key === key ? 0.5 : 0;
            o.material.opacity = !key || p.key === key ? 1 : 0.25;
            o.material.transparent = !(!key || p.key === key);
          }
        });
      });
    }
    items.forEach((li) => li.addEventListener("mouseenter", () => highlight(li.dataset.key)));
    items.forEach((li) => li.addEventListener("click", () => highlight(li.dataset.key)));
    function setExplode(on) {
      exploded = on; btn.textContent = on ? "◂ COLLAPSE" : "EXPLODE ▸";
      PARTS_INFO.forEach((p) => {
        const grp = parts[p.key];
        const x = on ? grp.userData.ex : 0;
        if (hasGSAP && !reduce) gsap.to(grp.position, { x, duration: 0.9, ease: "power3.inOut" });
        else grp.position.x = x;
      });
    }
    btn.addEventListener("click", () => setExplode(!exploded));
    let t = 0;
    return register(canvas, { render(dt) {
      t += dt;
      missile.rotation.y = t * 0.3;
      missile.position.y = Math.sin(t) * 0.3;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    } });
  }

  /* ---------------------------------------------------------
     SIMULATOR — Pro-Nav intercept (the centrepiece)
  --------------------------------------------------------- */
  const WEAPONS = [
    { name: "MICA-IR", seeker: "ir", boostA: 380, boostT: 2.6, sustainA: 0, sustainT: 0, vmax: 1020, dragK: 1.6e-4, desc: "Short/medium-range. Imaging-infrared seeker, fire-and-forget, superb agility up close." },
    { name: "MICA-EM", seeker: "radar", boostA: 380, boostT: 2.6, sustainA: 0, sustainT: 0, vmax: 1050, dragK: 1.5e-4, desc: "Same airframe, active-radar seeker — all-weather and immune to IR decoys." },
    { name: "METEOR", seeker: "radar", boostA: 300, boostT: 2.2, sustainA: 120, sustainT: 9, vmax: 1400, dragK: 1.1e-4, desc: "Ramjet sustainer keeps thrust for many seconds — a huge no-escape zone at long range." },
  ];
  const ASPECTS = ["HEAD-ON", "CROSSING", "TAIL-CHASE"];

  function simulator() {
    const canvas = document.getElementById("simGL");
    if (!canvas || !T) return;
    const scene = new T.Scene(); scene.fog = new T.FogExp2(0x070b12, 0.0016);
    addSky(scene, 0x1d3e60, 0x070b12);
    const camera = new T.PerspectiveCamera(50, 1, 0.1, 5000);
    const renderer = makeRenderer(canvas);

    // ground grid + horizon
    const grid = new T.GridHelper(4000, 80, 0x1c8c87, 0x12303a);
    grid.position.y = -40; scene.add(grid);
    cloudField(scene, 60, 2600, 120);

    const rafale = buildRafale(1.4); scene.add(rafale);
    const missile = buildMissile(1.6); scene.add(missile); missile.visible = false;
    const target = buildJet(PALETTE.red, 1.5); scene.add(target);

    // exhaust plume
    const plume = new T.Mesh(new T.ConeGeometry(0.6, 4, 12),
      new T.MeshBasicMaterial({ color: PALETTE.warm, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    plume.rotation.z = Math.PI / 2; missile.add(plume); plume.position.x = -5.5; plume.visible = false;

    // trajectory lines
    function trail(color) {
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.BufferAttribute(new Float32Array(4000 * 3), 3));
      geo.setDrawRange(0, 0);
      const line = new T.Line(geo, new T.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
      line.frustumCulled = false; scene.add(line); return line;
    }
    const mTrail = trail(PALETTE.accent), tTrail = trail(PALETTE.red);
    let mPts = 0, tPts = 0;
    function pushTrail(line, count, vec) {
      const arr = line.geometry.attributes.position.array;
      const i = count * 3;
      if (i + 2 < arr.length) {
        arr[i] = vec.x * RS; arr[i + 1] = vec.y * RS; arr[i + 2] = vec.z * RS;
        line.geometry.setDrawRange(0, count + 1);
        line.geometry.attributes.position.needsUpdate = true;
        return count + 1;
      }
      return count;
    }

    const fitAll = () => fit(renderer, camera, canvas); fitAll(); addEventListener("resize", fitAll);

    // ---- config (driven by UI) ----
    const cfg = { weapon: 0, seeker: "ir", N: 4, rangeKm: 12, tMach: 0.9, tG: 5, mG: 40, aspect: 0 };

    // ---- simulation state ----
    const S = {
      phase: "STANDBY", t: 0, minRange: Infinity, result: "",
      mPos: new T.Vector3(), mVel: new T.Vector3(),
      tPos: new T.Vector3(), tVel: new T.Vector3(),
      aCmd: 0, los: 0, vc: 0, weave: 0,
    };
    let running = false;

    function reset() {
      running = false; S.phase = "STANDBY"; S.t = 0; S.minRange = Infinity; S.result = "";
      S.aCmd = 0; S.los = 0; S.vc = 0; S.weave = 0;
      mPts = 0; tPts = 0; mTrail.geometry.setDrawRange(0, 0); tTrail.geometry.setDrawRange(0, 0);
      missile.visible = false; plume.visible = false;
      // launcher at origin moving +X at ~M0.9
      rafale.position.set(0, 0, 0);
      const launchSpeed = 0.9 * MACH;
      S.mPos.set(0, 0, 0); S.mVel.set(launchSpeed, 0, 0);
      // target placed downrange per aspect
      const R = cfg.rangeKm * 1000;
      const tSpd = cfg.tMach * MACH;
      if (cfg.aspect === 0) {            // HEAD-ON
        S.tPos.set(R, 0, 0); S.tVel.set(-tSpd, 0, 0);
      } else if (cfg.aspect === 1) {     // CROSSING
        S.tPos.set(R * 0.8, 0, -R * 0.4); S.tVel.set(0, 0, tSpd);
      } else {                            // TAIL-CHASE
        S.tPos.set(R, 0, 0); S.tVel.set(tSpd, 0, 0);
      }
      orient(missile, S.mVel.clone().normalize());
      orient(target, S.tVel.clone().normalize());
      hud.result.className = "hud__result"; hud.result.textContent = "";
      hud.phase.textContent = "STANDBY";
      updateHUD(R, 0, 0, 0, S.tVel.length());
    }

    function launch() {
      if (S.phase !== "STANDBY" && S.phase !== "HIT" && S.phase !== "MISS") return;
      reset(); running = true; S.phase = "BOOST"; missile.visible = true; plume.visible = true;
      hud.reticle.style.opacity = "1";
    }

    const W = () => WEAPONS[cfg.weapon];

    function step(dt) {
      const w = W();
      S.t += dt;
      // ----- target motion (weave) -----
      const tg = cfg.tG * G;
      if (tg > 0.1) {
        S.weave += dt;
        const tvHat = S.tVel.clone().normalize();
        // lateral dir = perpendicular in horizontal plane
        const lat = new T.Vector3(0, 1, 0).cross(tvHat).normalize();
        const a = lat.multiplyScalar(Math.sin(S.weave * 0.8) * tg);
        S.tVel.addScaledVector(a, dt);
      }
      S.tPos.addScaledVector(S.tVel, dt);
      orient(target, S.tVel.clone().normalize());

      // ----- missile guidance (Proportional Navigation) -----
      const R = S.tPos.clone().sub(S.mPos);          // LOS vector
      const range = R.length();
      const Vr = S.tVel.clone().sub(S.mVel);          // relative velocity
      const rHat = R.clone().normalize();
      S.vc = -Vr.dot(rHat);                           // closing velocity (+ = closing)
      const omega = R.clone().cross(Vr).divideScalar(Math.max(1, R.dot(R))); // LOS rate vector
      S.los = omega.length();
      // commanded lateral accel (perpendicular to LOS)
      let aCmd = omega.clone().cross(rHat).multiplyScalar(cfg.N * Math.max(0, S.vc));
      // clamp to structural limit
      const maxA = cfg.mG * G;
      if (aCmd.length() > maxA) aCmd.setLength(maxA);
      S.aCmd = aCmd.length();

      // ----- thrust along velocity -----
      const vHat = S.mVel.clone().normalize();
      let thrust = 0;
      if (S.t <= w.boostT) thrust = w.boostA;
      else if (S.t <= w.boostT + w.sustainT) thrust = w.sustainA;
      // drag (opposes velocity, ~v^2)
      const speed = S.mVel.length();
      const drag = -w.dragK * speed * speed;
      // integrate missile velocity
      S.mVel.addScaledVector(vHat, (thrust + drag) * dt);
      S.mVel.addScaledVector(aCmd, dt);                 // steering
      S.mVel.y -= G * dt * 0.4;                          // a little gravity droop
      // cap top speed
      if (S.mVel.length() > w.vmax) S.mVel.setLength(w.vmax);
      S.mPos.addScaledVector(S.mVel, dt);
      orient(missile, S.mVel.clone().normalize());

      // ----- phase + outcome -----
      if (S.t > w.boostT && S.phase === "BOOST") { S.phase = w.sustainT > 0 && S.t <= w.boostT + w.sustainT ? "SUSTAIN" : "COAST"; plume.visible = false; }
      if (S.phase === "SUSTAIN" && S.t > w.boostT + w.sustainT) S.phase = "COAST";
      if (range < 1500 && (S.phase === "COAST" || S.phase === "SUSTAIN" || S.phase === "BOOST")) S.phase = "TERMINAL";
      S.minRange = Math.min(S.minRange, range);

      if (range < 22) { end("HIT"); return; }
      if (S.vc < 0 && S.minRange < range - 5 && S.t > 0.5) {  // passed the target (opening)
        end(S.minRange < 35 ? "HIT" : "MISS"); return;
      }
      if (S.mVel.length() < 180 || S.t > 60) { end("MISS"); return; }
    }

    function end(result) {
      running = false; S.result = result; S.phase = result;
      hud.result.textContent = result === "HIT" ? "INTERCEPT" : "MISS · " + Math.round(S.minRange) + " m";
      hud.result.className = "hud__result " + (result === "HIT" ? "hit" : "miss");
      hud.phase.textContent = result;
      hud.reticle.style.opacity = "0";
      if (result === "HIT") burst(S.tPos.clone());
    }

    // detonation flash
    let flash = null, flashT = 0;
    function burst(pos) {
      if (!flash) {
        flash = new T.Mesh(new T.SphereGeometry(1, 16, 12),
          new T.MeshBasicMaterial({ color: 0xffd27a, transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
        scene.add(flash);
      }
      flash.position.copy(pos.clone().multiplyScalar(RS)); flash.visible = true; flashT = 0;
    }

    // ---- HUD elements ----
    const hud = {
      range: document.getElementById("hRange"), phase: document.getElementById("hPhase"),
      vc: document.getElementById("hVc"), mm: document.getElementById("hMmach"),
      tm: document.getElementById("hTmach"), g: document.getElementById("hG"),
      los: document.getElementById("hLos"), time: document.getElementById("hTime"),
      result: document.getElementById("hResult"), reticle: document.getElementById("hReticle"),
    };
    function updateHUD(range, vc, mspeed, aCmd, tspeed) {
      hud.range.textContent = (range / 1000).toFixed(1) + " km";
      hud.vc.textContent = Math.round(vc) + " m/s";
      hud.mm.textContent = "M " + (mspeed / MACH).toFixed(2);
      hud.tm.textContent = "M " + (tspeed / MACH).toFixed(2);
      hud.g.textContent = (aCmd / G).toFixed(0) + " G";
      hud.los.textContent = (S.los * 180 / Math.PI).toFixed(2) + "°/s";
      hud.time.textContent = S.t.toFixed(1) + " s";
      hud.phase.textContent = S.phase;
    }

    // ---- camera ----
    let camMode = "chase";
    const camPos = new T.Vector3(60, 30, 80), camAim = new T.Vector3();
    function updateCamera(dt) {
      const mp = S.mPos.clone().multiplyScalar(RS);
      const tp = S.tPos.clone().multiplyScalar(RS);
      const mid = mp.clone().add(tp).multiplyScalar(0.5);
      let want = new T.Vector3(), aim = new T.Vector3();
      if (!missile.visible) {                 // standby: frame the jet + downrange
        want.set(-40, 18, 70); aim.copy(tp.clone().multiplyScalar(0.3));
      } else if (camMode === "chase") {
        const vHat = S.mVel.clone().normalize();
        want.copy(mp).addScaledVector(vHat, -28).add(new T.Vector3(0, 9, 0));
        aim.copy(mp).addScaledVector(vHat, 30);
      } else if (camMode === "orbit") {
        const a = performance.now() * 0.0002;
        const d = mp.distanceTo(tp) * 0.7 + 60;
        want.set(mid.x + Math.cos(a) * d, mid.y + d * 0.5, mid.z + Math.sin(a) * d);
        aim.copy(mid);
      } else {                                // top
        want.set(mid.x, mid.y + mp.distanceTo(tp) * 0.9 + 80, mid.z + 1);
        aim.copy(mid);
      }
      const k = 1 - Math.pow(0.001, dt);
      camPos.lerp(want, k); camAim.lerp(aim, k);
      camera.position.copy(camPos); camera.lookAt(camAim);
    }

    const v = new T.Vector3();
    reset();
    return register(canvas, {
      cfg, reset, launch,
      setRunning(r) { if (S.phase === "HIT" || S.phase === "MISS") return; running = r; },
      setCam(m) { camMode = m; },
      render(dt) {
        if (running && S.phase !== "STANDBY") {
          // sub-step for stability at high speed
          const steps = 3; const sdt = dt / steps;
          for (let i = 0; i < steps && running; i++) step(sdt);
        }
        // place meshes
        missile.position.copy(S.mPos.clone().multiplyScalar(RS));
        target.position.copy(S.tPos.clone().multiplyScalar(RS));
        if (running) { mPts = pushTrail(mTrail, mPts, S.mPos); tPts = pushTrail(tTrail, tPts, S.tPos); }
        plume.scale.set(0.8 + Math.random() * 0.5, 1, 0.8 + Math.random() * 0.5);
        if (flash && flash.visible) {
          flashT += dt; const s = 1 + flashT * 120; flash.scale.setScalar(s);
          flash.material.opacity = Math.max(0, 1 - flashT * 1.6);
          if (flashT > 0.7) flash.visible = false;
        }
        updateCamera(dt);
        // HUD numbers
        const range = S.tPos.distanceTo(S.mPos);
        if (S.phase !== "STANDBY") updateHUD(range, S.vc, S.mVel.length(), S.aCmd, S.tVel.length());
        // reticle projection
        if (missile.visible && S.phase !== "HIT" && S.phase !== "MISS") {
          v.copy(target.position).project(camera);
          const rect = canvas.getBoundingClientRect();
          hud.reticle.style.left = (v.x * 0.5 + 0.5) * rect.width + "px";
          hud.reticle.style.top = (-v.y * 0.5 + 0.5) * rect.height + "px";
          hud.reticle.style.opacity = v.z < 1 ? "1" : "0";
        }
        renderer.render(scene, camera);
      },
    });
  }

  /* ---------------------------------------------------------
     GUIDANCE DIAGRAM — 2D top-down (canvas 2D)
  --------------------------------------------------------- */
  function guidanceDiagram() {
    const canvas = document.getElementById("diagramGL");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function size() { const r = canvas.getBoundingClientRect(); canvas.width = r.width * 2; canvas.height = r.height * 2; ctx.setTransform(2, 0, 0, 2, 0, 0); return r; }
    let rect = size(); addEventListener("resize", () => rect = size());
    let t = 0;
    return register(canvas, { render(dt) {
      t += dt; if (t > 6) t = 0;
      const W = rect.width, H = rect.height;
      ctx.clearRect(0, 0, W, H);
      const p = t / 6;
      // target: left->right across top third
      const tgt = { x: W * (0.15 + p * 0.7), y: H * 0.25 };
      // missile: bottom-left -> intercept point (collision triangle)
      const intercept = { x: W * 0.85, y: H * 0.25 };
      const start = { x: W * 0.12, y: H * 0.9 };
      const msl = { x: start.x + (intercept.x - start.x) * p, y: start.y + (intercept.y - start.y) * p };
      // trails
      const trail = (a, b, c) => { ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); };
      trail({ x: W * 0.15, y: H * 0.25 }, tgt, "rgba(255,90,82,.5)");
      trail(start, msl, "rgba(51,225,214,.5)");
      // LOS lines (stay parallel = collision course)
      ctx.setLineDash([4, 5]); ctx.strokeStyle = "rgba(255,181,71,.55)"; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const f = (i / 4) * p;
        const mp = { x: start.x + (intercept.x - start.x) * f, y: start.y + (intercept.y - start.y) * f };
        const tp = { x: W * (0.15 + f * 0.7), y: H * 0.25 };
        ctx.beginPath(); ctx.moveTo(mp.x, mp.y); ctx.lineTo(tp.x, tp.y); ctx.stroke();
      }
      ctx.setLineDash([]);
      // markers
      const dot = (pt, c, r) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, 7); ctx.fill(); };
      dot(tgt, "#ff5a52", 6); dot(msl, "#33e1d6", 5);
      ctx.fillStyle = "#7d8ca3"; ctx.font = "11px 'JetBrains Mono',monospace";
      ctx.fillText("TARGET", tgt.x - 18, tgt.y - 12);
      ctx.fillText("MISSILE", msl.x - 20, msl.y + 20);
    } });
  }

  /* ---------------------------------------------------------
     UI WIRING
  --------------------------------------------------------- */
  function wireUI(sim) {
    if (!sim) return;
    const cfg = sim.cfg;
    const $ = (id) => document.getElementById(id);
    // weapon segment
    const wSeg = $("weaponSeg"), wDesc = $("weaponDesc"), seekSeg = $("seekerSeg");
    function setWeapon(i) {
      cfg.weapon = i;
      [...wSeg.children].forEach((b, k) => b.classList.toggle("active", k === i));
      wDesc.textContent = WEAPONS[i].desc;
      // seeker follows preset but stays user-editable
      setSeeker(WEAPONS[i].seeker);
      sim.reset();
    }
    function setSeeker(s) {
      cfg.seeker = s;
      [...seekSeg.children].forEach((b) => b.classList.toggle("active", b.dataset.s === s));
    }
    [...wSeg.children].forEach((b) => b.addEventListener("click", () => setWeapon(+b.dataset.w)));
    [...seekSeg.children].forEach((b) => b.addEventListener("click", () => setSeeker(b.dataset.s)));

    // sliders
    const bind = (rid, vid, fn) => {
      const r = $(rid), o = $(vid);
      const upd = () => { o.textContent = fn(+r.value); };
      r.addEventListener("input", () => { upd(); applySliders(); if (!isRunning()) sim.reset(); });
      upd();
    };
    function applySliders() {
      cfg.N = +$("rN").value; cfg.rangeKm = +$("rRange").value; cfg.tMach = +$("rTspd").value;
      cfg.tG = +$("rTg").value; cfg.mG = +$("rMg").value; cfg.aspect = +$("rAspect").value;
    }
    let _running = false;
    const isRunning = () => _running;
    bind("rN", "vN", (v) => v.toFixed(1));
    bind("rRange", "vRange", (v) => v + " km");
    bind("rTspd", "vTspd", (v) => "M " + v.toFixed(2));
    bind("rTg", "vTg", (v) => v + " G");
    bind("rMg", "vMg", (v) => v + " G");
    bind("rAspect", "vAspect", (v) => ASPECTS[v]);
    applySliders();

    // actions
    $("launchBtn").addEventListener("click", () => { applySliders(); _running = true; sim.launch(); });
    $("pauseBtn").addEventListener("click", () => { _running = !_running; sim.setRunning(_running); $("pauseBtn").innerHTML = _running ? "❚❚ PAUSE" : "▶ RESUME"; });
    $("resetBtn").addEventListener("click", () => { _running = false; $("pauseBtn").innerHTML = "❚❚ PAUSE"; sim.reset(); });
    const camSeg = $("camSeg");
    [...camSeg.children].forEach((b) => b.addEventListener("click", () => {
      [...camSeg.children].forEach((x) => x.classList.toggle("active", x === b));
      sim.setCam(b.dataset.cam);
    }));
    setWeapon(0);

    // expose scenario loading for the missions library
    simCtl = {
      load(s) {
        setWeapon(s.weapon ?? 0);
        const set = (id, val) => { const r = $(id); r.value = val; r.dispatchEvent(new Event("input")); };
        if (s.range != null) set("rRange", s.range);
        if (s.tspd != null) set("rTspd", s.tspd);
        if (s.tg != null) set("rTg", s.tg);
        if (s.mg != null) set("rMg", s.mg);
        if (s.aspect != null) set("rAspect", s.aspect);
        if (s.N != null) set("rN", s.N);
        applySliders(); _running = false; sim.reset();
      },
    };
  }

  /* ---------------------------------------------------------
     GENERATIONS
  --------------------------------------------------------- */
  const GENS = [
    { id: "4", name: "4th Generation", era: "1970s – 1990s", color: "g-4",
      blurb: "Agile, relaxed-stability dogfighters with pulse-Doppler radar and beyond-visual-range missiles. The jet is a superb platform — but the pilot still fuses the picture by hand.",
      traits: ["Relaxed stability + fly-by-wire", "Pulse-Doppler look-down/shoot-down radar", "Semi-active radar BVR missiles", "Little to no signature shaping"],
      ex: "F-16 · F-15 · Su-27 · MiG-29",
      bars: { Stealth: 12, Sensors: 45, Networking: 25, Supercruise: 10 } },
    { id: "4.5", name: "4.5 Generation", era: "1990s – 2010s", color: "g-45",
      blurb: "AESA radar, helmet sights, active-radar missiles and a glass cockpit. Modest signature reduction. The aircraft starts fusing sensors for the pilot rather than the other way round.",
      traits: ["AESA radar + sensor fusion", "Active-radar fire-and-forget missiles (Meteor, AMRAAM)", "Helmet-mounted cueing", "Reduced — not stealth — signature"],
      ex: "Rafale · Typhoon · Gripen E · Super Hornet · Su-35",
      bars: { Stealth: 35, Sensors: 75, Networking: 60, Supercruise: 45 } },
    { id: "5", name: "5th Generation", era: "2005 – present", color: "g-5",
      blurb: "All-aspect stealth, internal weapons, and a fused sensor picture shared across the formation. The cockpit shows answers, not raw data. First-look, first-shot, first-kill.",
      traits: ["All-aspect low observability", "Internal weapons carriage", "Full sensor fusion + datalink", "Supercruise (F-22) and EO/DAS spherical awareness"],
      ex: "F-22 · F-35 · Su-57 · J-20",
      bars: { Stealth: 92, Sensors: 92, Networking: 88, Supercruise: 70 } },
    { id: "6", name: "6th Generation", era: "≈2030s (in development)", color: "g-6",
      blurb: "Optionally-crewed penetrating platforms teamed with autonomous collaborative aircraft (loyal wingmen), adaptive-cycle engines and AI decision support. Programmes — figures are projected.",
      traits: ["Manned-unmanned teaming (CCAs / loyal wingmen)", "Adaptive-cycle propulsion", "Broadband signature management", "AI-assisted decision support & directed energy"],
      ex: "NGAD · GCAP / Tempest · FCAS",
      bars: { Stealth: 98, Sensors: 98, Networking: 99, Supercruise: 85 } },
  ];
  function initGenerations() {
    const tabs = document.getElementById("gensTabs");
    const panel = document.getElementById("gensPanel");
    const bar = document.getElementById("gensBar");
    if (!tabs) return;
    tabs.innerHTML = GENS.map((g, i) => `<button data-i="${i}"${i === 0 ? ' class="active"' : ""}>${g.name}</button>`).join("");
    function show(i) {
      const g = GENS[i];
      [...tabs.children].forEach((b, k) => b.classList.toggle("active", k === i));
      panel.innerHTML = `<div class="era">${g.era}</div><h3>${g.name}</h3><p>${g.blurb}</p>
        <ul>${g.traits.map((t) => `<li>${t}</li>`).join("")}</ul>
        <div class="ex">EXEMPLARS · ${g.ex}</div>`;
      bar.innerHTML = Object.entries(g.bars).map(([k, v]) =>
        `<div class="gbar"><span><i>${k}</i><i>${v}</i></span><div class="gbar__track"><div class="gbar__fill" data-v="${v}"></div></div></div>`).join("");
      requestAnimationFrame(() => bar.querySelectorAll(".gbar__fill").forEach((f) => f.style.width = f.dataset.v + "%"));
    }
    [...tabs.children].forEach((b) => b.addEventListener("click", () => show(+b.dataset.i)));
    show(0);
  }

  /* ---------------------------------------------------------
     AIRCRAFT CODEX — data + parametric models
  --------------------------------------------------------- */
  const AIRCRAFT = [
    { id: "f16", name: "F-16C Fighting Falcon", gen: "4", origin: "USA", year: "1978", role: "Lightweight multirole",
      cfg: { family: "conv", len: 15, span: 10, color: 0x8a97a8, eng: 1, tail: "single", canard: false, hstab: true },
      specs: { Length: "15.06 m", Wingspan: "9.96 m", "Max speed": "Mach 2.0", "Combat radius": "~550 km", Ceiling: "15,240 m", Engine: "1 × F110 (~129 kN)", "RCS (est.)": "~1.2 m²", Radar: "APG-83 AESA (V)", Armament: "AIM-120, AIM-9, JDAM", Crew: "1" },
      blurb: "The benchmark 4th-gen lightweight fighter — relaxed stability, bubble canopy, and unmatched production scale across the world." },
    { id: "f15", name: "F-15C Eagle", gen: "4", origin: "USA", year: "1976", role: "Air superiority",
      cfg: { family: "conv", len: 19.4, span: 13, color: 0x9aa6b6, eng: 2, tail: "twin", canard: false, hstab: true },
      specs: { Length: "19.43 m", Wingspan: "13.05 m", "Max speed": "Mach 2.5", "Combat radius": "~1,060 km", Ceiling: "20,000 m", Engine: "2 × F100 (~105 kN ea.)", "RCS (est.)": "large (~10 m²)", Radar: "APG-63/70", Armament: "AIM-120, AIM-7, AIM-9", Crew: "1" },
      blurb: "Undefeated in air-to-air combat for decades — a big-wing, twin-engine interceptor built around the radar and the missile." },
    { id: "su27", name: "Su-27 Flanker", gen: "4", origin: "USSR", year: "1985", role: "Air superiority",
      cfg: { family: "conv", len: 21.9, span: 14.7, color: 0x808d9c, eng: 2, tail: "twin", canard: false, hstab: true },
      specs: { Length: "21.9 m", Wingspan: "14.7 m", "Max speed": "Mach 2.35", "Combat radius": "~1,340 km", Ceiling: "18,500 m", Engine: "2 × AL-31F (122 kN ea.)", "RCS (est.)": "large (~12 m²)", Radar: "N001 Myech", Armament: "R-27, R-73", Crew: "1" },
      blurb: "A long-range Soviet answer to the Eagle, famous for its blended lifting-body fuselage and the cobra manoeuvre." },
    { id: "mig29", name: "MiG-29 Fulcrum", gen: "4", origin: "USSR", year: "1983", role: "Frontline fighter",
      cfg: { family: "conv", len: 17.3, span: 11.4, color: 0x7e8a99, eng: 2, tail: "twin", canard: false, hstab: true },
      specs: { Length: "17.32 m", Wingspan: "11.36 m", "Max speed": "Mach 2.25", "Combat radius": "~700 km", Ceiling: "18,000 m", Engine: "2 × RD-33 (81 kN ea.)", "RCS (est.)": "~5 m²", Radar: "N019", Armament: "R-27, R-73", Crew: "1" },
      blurb: "Highly agile point-defence fighter; its helmet-cued R-73 stunned Western analysts in the 1990s." },

    { id: "rafale", name: "Dassault Rafale", gen: "4.5", origin: "France", year: "2001", role: "Omnirole",
      cfg: { family: "delta", len: 15.3, span: 10.8, color: 0x6c7a8a, eng: 2, tail: "single", canard: true, hstab: false },
      specs: { Length: "15.27 m", Wingspan: "10.80 m", "Max speed": "Mach 1.8", "Combat radius": "~1,000 km", Ceiling: "15,235 m", Engine: "2 × M88 (75 kN ea.)", "RCS (est.)": "reduced (~1 m²)", Radar: "RBE2-AA AESA", Armament: "Meteor, MICA, SCALP", Crew: "1–2" },
      blurb: "A delta-canard 'omnirole' fighter — air defence, strike, recce and nuclear strike from one airframe, with the SPECTRA EW suite." },
    { id: "typhoon", name: "Eurofighter Typhoon", gen: "4.5", origin: "Europe", year: "2003", role: "Air dominance",
      cfg: { family: "delta", len: 16, span: 11, color: 0x76838f, eng: 2, tail: "single", canard: true, hstab: false },
      specs: { Length: "15.96 m", Wingspan: "10.95 m", "Max speed": "Mach 2.0", "Combat radius": "~1,390 km", Ceiling: "19,800 m", Engine: "2 × EJ200 (90 kN ea.)", "RCS (est.)": "reduced (~1 m²)", Radar: "Captor-E AESA", Armament: "Meteor, ASRAAM, AMRAAM", Crew: "1–2" },
      blurb: "An unstable close-coupled delta-canard optimised for high-energy BVR combat and supersonic agility." },
    { id: "gripen", name: "Saab JAS 39 Gripen E", gen: "4.5", origin: "Sweden", year: "2017", role: "Multirole",
      cfg: { family: "delta", len: 15.2, span: 8.6, color: 0x83909d, eng: 1, tail: "single", canard: true, hstab: false },
      specs: { Length: "15.2 m", Wingspan: "8.6 m", "Max speed": "Mach 2.0", "Combat radius": "~1,500 km", Ceiling: "16,000 m", Engine: "1 × F414 (98 kN)", "RCS (est.)": "low", Radar: "Raven ES-05 AESA", Armament: "Meteor, IRIS-T", Crew: "1" },
      blurb: "Designed for dispersed road-base operations, rapid turnaround and a software-defined, network-centric cockpit." },
    { id: "shornet", name: "F/A-18E Super Hornet", gen: "4.5", origin: "USA", year: "1999", role: "Carrier multirole",
      cfg: { family: "conv", len: 18.3, span: 13.6, color: 0x8893a1, eng: 2, tail: "vtwin-cant", canard: false, hstab: true },
      specs: { Length: "18.31 m", Wingspan: "13.62 m", "Max speed": "Mach 1.6", "Combat radius": "~720 km", Ceiling: "15,000 m", Engine: "2 × F414 (98 kN ea.)", "RCS (est.)": "reduced", Radar: "APG-79 AESA", Armament: "AIM-120, AIM-9X", Crew: "1–2" },
      blurb: "The US Navy's carrier workhorse — canted tails, leading-edge extensions and a growler EW variant." },
    { id: "su35", name: "Su-35S Flanker-E", gen: "4.5", origin: "Russia", year: "2014", role: "Air superiority",
      cfg: { family: "conv", len: 21.9, span: 15.3, color: 0x77838f, eng: 2, tail: "twin", canard: false, hstab: true },
      specs: { Length: "21.9 m", Wingspan: "15.3 m", "Max speed": "Mach 2.25", "Combat radius": "~1,600 km", Ceiling: "18,000 m", Engine: "2 × AL-41F1S (142 kN, TVC)", "RCS (est.)": "~1–3 m²", Radar: "Irbis-E PESA", Armament: "R-77, R-74, R-37M", Crew: "1" },
      blurb: "A thrust-vectoring super-Flanker with huge fuel, long-range missiles and extreme post-stall agility." },
    { id: "f15ex", name: "F-15EX Eagle II", gen: "4.5", origin: "USA", year: "2021", role: "Multirole / missile truck",
      cfg: { family: "conv", len: 19.4, span: 13, color: 0x9aa6b6, eng: 2, tail: "twin", canard: false, hstab: true },
      specs: { Length: "19.43 m", Wingspan: "13.05 m", "Max speed": "Mach 2.5", "Combat radius": "~1,500 km", Ceiling: "18,000 m", Engine: "2 × F110 (129 kN ea.)", "RCS (est.)": "large", Radar: "APG-82 AESA", Armament: "Up to 12 AAMs", Crew: "1–2" },
      blurb: "A new-build digital Eagle carrying an enormous weapons load — the standoff 'missile truck' beside stealth fighters." },

    { id: "f22", name: "F-22 Raptor", gen: "5", origin: "USA", year: "2005", role: "Air dominance (stealth)",
      cfg: { family: "stealth", len: 18.9, span: 13.6, color: 0x59636f, eng: 2, tail: "vtwin-cant", canard: false, hstab: true },
      specs: { Length: "18.92 m", Wingspan: "13.56 m", "Max speed": "Mach 2.25", Supercruise: "Mach 1.8", "Combat radius": "~850 km", Engine: "2 × F119 (156 kN, TVC)", "RCS (est.)": "~0.0001 m² (marble)", Radar: "APG-77 AESA", Armament: "AIM-120, AIM-9 (internal)", Crew: "1" },
      blurb: "The first 5th-gen fighter: all-aspect stealth, supercruise and thrust-vectoring — designed to win before it is seen." },
    { id: "f35", name: "F-35A Lightning II", gen: "5", origin: "USA", year: "2015", role: "Multirole (stealth)",
      cfg: { family: "stealth", len: 15.7, span: 10.7, color: 0x5e6873, eng: 1, tail: "vtwin-cant", canard: false, hstab: true },
      specs: { Length: "15.7 m", Wingspan: "10.7 m", "Max speed": "Mach 1.6", "Combat radius": "~1,135 km", Ceiling: "15,000 m", Engine: "1 × F135 (191 kN)", "RCS (est.)": "~0.005 m²", Radar: "APG-81 AESA + EOTS/DAS", Armament: "AIM-120, internal bombs", Crew: "1" },
      blurb: "A networked sensor node as much as a fighter — its fused EO-DAS spherical picture and datalink define the modern force." },
    { id: "su57", name: "Su-57 Felon", gen: "5", origin: "Russia", year: "2020", role: "Stealth multirole",
      cfg: { family: "stealth", len: 20.1, span: 14.1, color: 0x5b656f, eng: 2, tail: "vtwin-cant", canard: false, hstab: true },
      specs: { Length: "20.1 m", Wingspan: "14.1 m", "Max speed": "Mach 2.0", "Combat radius": "~1,500 km", Ceiling: "20,000 m", Engine: "2 × AL-41F1 / izd.30", "RCS (est.)": "~0.1–0.5 m²", Radar: "N036 Byelka AESA", Armament: "R-77M, R-74, internal", Crew: "1" },
      blurb: "Russia's first stealth fighter — extreme agility with LEVCONs, distributed apertures and supersonic internal carriage." },
    { id: "j20", name: "Chengdu J-20", gen: "5", origin: "China", year: "2017", role: "Stealth air superiority",
      cfg: { family: "delta", len: 20.4, span: 13.5, color: 0x565f6a, eng: 2, tail: "vtwin-cant", canard: true, hstab: false },
      specs: { Length: "20.4 m", Wingspan: "13.5 m", "Max speed": "Mach 2.0", "Combat radius": "~1,100 km", Ceiling: "20,000 m", Engine: "2 × WS-10C / WS-15", "RCS (est.)": "low (frontal)", Radar: "Type 1475 AESA", Armament: "PL-15, PL-10 (internal)", Crew: "1" },
      blurb: "A long-range stealth interceptor with a canard-delta layout and large internal bays — built for the Pacific's distances." },

    { id: "ngad", name: "NGAD (F-47 programme)", gen: "6", origin: "USA", year: "≈2030s", role: "Penetrating counter-air",
      cfg: { family: "wing", len: 21, span: 16, color: 0x4a525c, eng: 2, tail: "none", canard: false, hstab: false },
      specs: { Status: "In development", Configuration: "Tailless penetrating platform", Teaming: "Collaborative Combat Aircraft (CCA)", Propulsion: "Adaptive-cycle (NGAP)", Signature: "Broadband VLO (projected)", Sensors: "Multi-spectral fusion", Crew: "1 / optionally uncrewed" },
      blurb: "A family-of-systems: a crewed penetrating aircraft directing autonomous loyal wingmen deep into contested airspace. Figures projected." },
    { id: "gcap", name: "GCAP / Tempest", gen: "6", origin: "UK · Italy · Japan", year: "≈2035", role: "Stealth air dominance",
      cfg: { family: "wing", len: 20, span: 15, color: 0x4d555f, eng: 2, tail: "none", canard: false, hstab: false },
      specs: { Status: "In development", Configuration: "Large tailless delta", Teaming: "Uncrewed adjuncts", Propulsion: "Next-gen adaptive", Signature: "VLO (projected)", Sensors: "AI-assisted fusion, RF sensing", Crew: "1 / optional" },
      blurb: "A trilateral 6th-gen programme merging the UK's Tempest and Japan's F-X — a large-range, deep-magazine air-dominance jet. Projected." },
  ];

  function buildAircraft(spec) {
    const c = spec.cfg, g = new T.Group();
    const L = c.len, span = c.span;
    const skin = mat(c.color, { r: 0.45, m: 0.5 });
    const dark = mat(0x2a323d, { r: 0.6, m: 0.4 });
    const glass = mat(0x1a2a36, { r: 0.1, m: 0.8 });
    const nozzle = mat(0x161c24, { r: 0.4, m: 0.7 });
    const half = L * 0.5;
    // fuselage
    const fus = cyl(L * 0.058, L * 0.07, L * 0.8, skin, 22); g.add(fus);
    const nose = new T.Mesh(new T.ConeGeometry(L * 0.058, L * 0.24, 20), skin);
    nose.rotation.z = -Math.PI / 2; nose.position.x = half * 0.8 + L * 0.04; g.add(nose);
    const canopy = new T.Mesh(new T.SphereGeometry(L * 0.055, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2), glass);
    canopy.scale.set(3.2, 1, 1.05); canopy.position.set(L * 0.2, L * 0.05, 0); g.add(canopy);

    function pair(pts, opt) {
      const sh = new T.Shape(); sh.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
      const geo = new T.ExtrudeGeometry(sh, { depth: opt.th || L * 0.012, bevelEnabled: false });
      [1, -1].forEach((s) => {
        const m = new T.Mesh(geo, opt.m || skin);
        m.rotation.x = -Math.PI / 2; m.scale.z = s;
        m.position.set(opt.x || 0, opt.y || 0, 0); g.add(m);
      });
    }
    // main wing per family
    let wing;
    if (c.family === "delta") wing = [[L * 0.16, 0], [-L * 0.30, 0], [-L * 0.30, span * 0.48], [L * 0.08, span * 0.12]];
    else if (c.family === "stealth") wing = [[L * 0.14, 0], [-L * 0.26, 0], [-L * 0.30, span * 0.46], [L * 0.02, span * 0.16]];
    else if (c.family === "wing") wing = [[L * 0.34, 0], [-L * 0.34, 0], [-L * 0.28, span * 0.5], [L * 0.04, span * 0.34], [L * 0.36, span * 0.05]];
    else wing = [[L * 0.06, 0], [-L * 0.16, 0], [-L * 0.30, span * 0.4], [-L * 0.12, span * 0.44], [0, span * 0.1]];
    pair(wing, { x: -L * 0.02, y: -L * 0.02 });

    // canards
    if (c.canard) pair([[L * 0.06, 0], [-L * 0.08, 0], [-L * 0.10, span * 0.17], [L * 0.04, span * 0.05]], { x: L * 0.27, y: 0.02 });
    // horizontal stabilators
    if (c.hstab) pair([[L * 0.04, 0], [-L * 0.12, 0], [-L * 0.18, span * 0.2], [-L * 0.04, span * 0.22]], { x: -L * 0.3, y: 0, m: dark });

    // vertical tails
    function fin(z, cant) {
      const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(-L * 0.16, 0); sh.lineTo(-L * 0.15, L * 0.17); sh.lineTo(-L * 0.02, L * 0.03);
      const geo = new T.ExtrudeGeometry(sh, { depth: L * 0.01, bevelEnabled: false });
      const m = new T.Mesh(geo, skin);
      m.position.set(-L * 0.26, L * 0.02, z);
      if (cant) m.rotation.x = cant; g.add(m);
    }
    if (c.tail === "single") fin(0, 0);
    else if (c.tail === "twin") { fin(span * 0.1, 0); fin(-span * 0.1, 0); }
    else if (c.tail === "vtwin-cant") { fin(span * 0.09, -0.45); fin(-span * 0.09, 0.45); }

    // engines / nozzles
    const en = c.eng || 1;
    for (let i = 0; i < en; i++) {
      const z = en === 2 ? (i ? L * 0.05 : -L * 0.05) : 0;
      const nz = new T.Mesh(new T.CylinderGeometry(L * 0.04, L * 0.05, L * 0.08, 16), nozzle);
      nz.rotation.z = Math.PI / 2; nz.position.set(-half * 0.78, -L * 0.01, z); g.add(nz);
    }
    return g;
  }

  function aircraftDB() {
    const canvas = document.getElementById("dbGL");
    if (!canvas || !T) return;
    const scene = new T.Scene(); scene.fog = new T.FogExp2(0x070b12, 0.01);
    addSky(scene, 0x244a70, 0x0a1320);
    const rim = new T.DirectionalLight(0x6fb1ff, 0.5); rim.position.set(-8, 4, -10); scene.add(rim);
    const camera = new T.PerspectiveCamera(40, 1, 0.1, 400); camera.position.set(0, 6, 34);
    const renderer = makeRenderer(canvas);
    // soft floor
    const floor = new T.Mesh(new T.CircleGeometry(40, 48), new T.MeshStandardMaterial({ color: 0x0a1018, roughness: 1, transparent: true, opacity: 0.7 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -6; scene.add(floor);
    scene.add(new T.GridHelper(80, 40, 0x16343f, 0x0e2129));
    scene.children[scene.children.length - 1].position.y = -5.98;

    const fitAll = () => fit(renderer, camera, canvas); fitAll(); addEventListener("resize", fitAll);
    let model = null;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

    function setAircraft(spec) {
      if (model) { scene.remove(model); model.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } }); }
      model = buildAircraft(spec);
      const s = 20 / spec.cfg.len;             // normalise visual size
      model.scale.setScalar(s); scene.add(model);
    }
    let t = 0;
    const r = register(canvas, {
      setAircraft,
      render(dt) {
        t += dt;
        mouse.x += (mouse.tx - mouse.x) * 0.04; mouse.y += (mouse.ty - mouse.y) * 0.04;
        if (model) { model.rotation.y = t * 0.35 + mouse.x * 0.8; model.rotation.z = Math.sin(t * 0.5) * 0.05; model.position.y = Math.sin(t) * 0.4; }
        camera.position.set(mouse.x * 6, 6 + mouse.y * -5, 34); camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      },
    });
    return r;
  }

  function initAircraftDB(db) {
    if (!db) return;
    const filters = document.getElementById("dbFilters");
    const list = document.getElementById("dbList");
    const spec = document.getElementById("dbSpec");
    const badge = document.getElementById("dbBadge");
    const nameEl = document.getElementById("dbName");
    const gens = ["ALL", "4", "4.5", "5", "6"];
    filters.innerHTML = gens.map((g, i) => `<button data-g="${g}"${i === 0 ? ' class="active"' : ""}>${g === "ALL" ? "ALL" : "GEN " + g}</button>`).join("");
    function gClass(g) { return g === "4" ? "g-4" : g === "4.5" ? "g-45" : g === "5" ? "g-5" : "g-6"; }
    let filter = "ALL", activeId = null;
    function renderList() {
      const items = AIRCRAFT.filter((a) => filter === "ALL" || a.gen === filter);
      list.innerHTML = items.map((a) => `<button class="dbcard${a.id === activeId ? " active" : ""}" data-id="${a.id}">
        <b>${a.name}</b><span>${a.origin} · ${a.year}</span><span class="g ${gClass(a.gen)}">GEN ${a.gen}</span></button>`).join("");
      list.querySelectorAll(".dbcard").forEach((b) => b.addEventListener("click", () => select(b.dataset.id)));
    }
    function select(id) {
      const a = AIRCRAFT.find((x) => x.id === id); if (!a) return;
      activeId = id;
      list.querySelectorAll(".dbcard").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
      db.setAircraft(a);
      badge.textContent = "GEN " + a.gen; badge.className = "db__badge"; nameEl.textContent = a.name;
      spec.innerHTML = `<h4>${a.name}</h4><div class="role">${a.role} · ${a.origin}</div>` +
        Object.entries(a.specs).map(([k, v]) => `<div class="specrow"><span>${k}</span><b>${v}</b></div>`).join("") +
        `<p class="blurb">${a.blurb}</p><p class="est">RCS figures are open-source estimates and vary by aspect &amp; variant. 6th-gen data is projected.</p>`;
    }
    filters.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.g; filters.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); renderList();
    }));
    renderList(); select("rafale");
  }

  /* ---------------------------------------------------------
     WAR ZONE — Gaussian terrain, radar domes, adaptive route
  --------------------------------------------------------- */
  const THEATRES = [
    { name: "MOUNTAIN", base: 6, sea: -999,
      desc: "Sharp ridgelines give superb terrain masking — fly the valleys and the radars never see you.",
      peaks: [[-110, 40, 60, 34], [-30, -70, 78, 28], [50, 20, 66, 30], [120, -40, 54, 36], [10, 95, 58, 26], [-150, -20, 50, 40]],
      sams: [[-60, -10, 80], [40, -30, 85], [120, 30, 75]] },
    { name: "DESERT", base: 3, sea: -999,
      desc: "Open, flat terrain — almost no masking. Exposure stays high whatever altitude you pick.",
      peaks: [[-80, 30, 16, 80], [30, -40, 14, 90], [110, 40, 18, 70]],
      sams: [[-90, 0, 95], [-10, 40, 90], [70, -30, 95], [140, 20, 85]] },
    { name: "COASTAL", base: -8, sea: 0,
      desc: "Sea to the west, rising land to the east — threats cluster on the coastline you must cross.",
      peaks: [[60, 20, 52, 34], [120, -30, 46, 38], [150, 60, 40, 30]],
      sams: [[20, -10, 90], [70, 40, 85], [130, 0, 80]] },
  ];
  function terrainH(x, z, th) {
    let h = th.base;
    if (th.name === "COASTAL") h = -8 + (x + 160) / 320 * 34;   // ramp west→east
    for (const p of th.peaks) {
      const dx = x - p[0], dz = z - p[1];
      h += p[2] * Math.exp(-(dx * dx + dz * dz) / (2 * p[3] * p[3]));
    }
    return Math.max(h, th.sea > -900 ? th.sea : h);
  }

  function warZone() {
    const canvas = document.getElementById("wzGL");
    if (!canvas || !T) return;
    const scene = new T.Scene(); scene.fog = new T.FogExp2(0x070b12, 0.0022);
    addSky(scene, 0x223b58, 0x0a1018);
    const sun = new T.DirectionalLight(0xffe9c8, 1.1); sun.position.set(-80, 120, 60); scene.add(sun);
    const camera = new T.PerspectiveCamera(48, 1, 0.1, 1600); camera.position.set(0, 200, 300);
    const renderer = makeRenderer(canvas);
    const fitAll = () => fit(renderer, camera, canvas); fitAll(); addEventListener("resize", fitAll);

    const SIZE = 360, SEG = 110;
    const geo = new T.PlaneGeometry(SIZE, SIZE, SEG, SEG); geo.rotateX(-Math.PI / 2);
    const colors = new Float32Array((SEG + 1) * (SEG + 1) * 3);
    geo.setAttribute("color", new T.BufferAttribute(colors, 3));
    const terrain = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: true }));
    scene.add(terrain);
    const water = new T.Mesh(new T.PlaneGeometry(SIZE, SIZE), new T.MeshStandardMaterial({ color: 0x0c2230, roughness: 0.3, metalness: 0.4, transparent: true, opacity: 0.85 }));
    water.rotation.x = -Math.PI / 2; water.position.y = 0.2; water.visible = false; scene.add(water);

    function colFor(h) {
      if (h <= 0.3) return [0.05, 0.13, 0.18];
      if (h < 14) return [0.16, 0.28, 0.16];
      if (h < 38) return [0.34, 0.28, 0.16];
      if (h < 60) return [0.4, 0.4, 0.42];
      return [0.85, 0.88, 0.92];
    }
    const samGroup = new T.Group(); scene.add(samGroup);
    const routeLine = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ vertexColors: true, linewidth: 2 }));
    routeLine.frustumCulled = false; scene.add(routeLine);
    const jet = buildAircraft(AIRCRAFT.find((a) => a.id === "f35")); jet.scale.setScalar(0.9); scene.add(jet);

    let TH = THEATRES[0], profile = "hi", routePts = [], jetT = 0, metrics = {};

    function detect(x, z, alt) {
      let none = 1;
      for (const s of TH.sams) {
        const dx = x - s[0], dz = z - s[1], d = Math.hypot(dx, dz);
        if (d > s[2] * 1.5) continue;
        let p = Math.exp(-(d * d) / (s[2] * s[2]));                 // gaussian footprint
        // terrain masking: sample line of sight site->aircraft
        const siteTop = terrainH(s[0], s[1], TH) + 8;
        let masked = false;
        for (let f = 0.15; f < 0.95; f += 0.12) {
          const sx = s[0] + dx * f, sz = s[1] + dz * f;
          const sight = siteTop + (alt - siteTop) * f;
          if (terrainH(sx, sz, TH) > sight + 2) { masked = true; break; }
        }
        if (masked) p *= 0.12;
        none *= (1 - Math.min(1, p));
      }
      return 1 - none;
    }

    function buildRoute() {
      routePts = [];
      const N = 70; let exp = 0, peak = 0, altSum = 0;
      let prevZ = 0;
      for (let i = 0; i <= N; i++) {
        const f = i / N, x = -160 + f * 320;
        let z = 0, alt;
        if (profile === "hi") { z = 0; alt = 95; }
        else {
          // search z that minimises detection (valley + threat avoidance), smoothed
          let best = 1e9, bestZ = prevZ;
          for (let zz = -70; zz <= 70; zz += 10) {
            const a = terrainH(x, zz, TH) + 10;
            const pen = detect(x, zz, a) + Math.abs(zz - prevZ) * 0.002;
            if (pen < best) { best = pen; bestZ = zz; }
          }
          z = prevZ + (bestZ - prevZ) * 0.5; prevZ = z;
          alt = terrainH(x, z, TH) + 10;
        }
        const p = detect(x, z, alt);
        exp += p; peak = Math.max(peak, p); altSum += alt;
        routePts.push({ x, y: alt, z, p });
      }
      metrics = { exp: exp, peak: peak, alt: altSum / (N + 1), sam: TH.sams.length };
      // line geometry + colours
      const pos = new Float32Array(routePts.length * 3), col = new Float32Array(routePts.length * 3);
      routePts.forEach((pt, i) => {
        pos[i * 3] = pt.x; pos[i * 3 + 1] = pt.y; pos[i * 3 + 2] = pt.z;
        const c = pt.p < 0.25 ? [0.2, 0.88, 0.84] : pt.p < 0.6 ? [1, 0.71, 0.28] : [1, 0.35, 0.32];
        col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2];
      });
      routeLine.geometry.dispose();
      const rg = new T.BufferGeometry();
      rg.setAttribute("position", new T.BufferAttribute(pos, 3));
      rg.setAttribute("color", new T.BufferAttribute(col, 3));
      routeLine.geometry = rg;
      return metrics;
    }

    function rebuildTerrain() {
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i);
        const h = terrainH(x, z, TH); pos.setY(i, h);
        const c = colFor(h); colors[i * 3] = c[0]; colors[i * 3 + 1] = c[1]; colors[i * 3 + 2] = c[2];
      }
      pos.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals();
      water.visible = TH.sea > -900;
      // SAM domes
      samGroup.clear();
      TH.sams.forEach((s) => {
        const dome = new T.Mesh(new T.SphereGeometry(s[2], 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new T.MeshBasicMaterial({ color: 0xff5a52, transparent: true, opacity: 0.08, depthWrite: false }));
        dome.position.set(s[0], terrainH(s[0], s[1], TH), s[1]); samGroup.add(dome);
        const ring = new T.Mesh(new T.RingGeometry(s[2] * 0.96, s[2], 48),
          new T.MeshBasicMaterial({ color: 0xff5a52, transparent: true, opacity: 0.35, side: T.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(s[0], terrainH(s[0], s[1], TH) + 0.5, s[1]); samGroup.add(ring);
        const post = new T.Mesh(new T.ConeGeometry(3, 10, 8), new T.MeshStandardMaterial({ color: 0xff5a52 }));
        post.position.set(s[0], terrainH(s[0], s[1], TH) + 5, s[1]); samGroup.add(post);
      });
    }

    function refresh() { rebuildTerrain(); return buildRoute(); }

    let camA = 0;
    const r = register(canvas, {
      setTheatre(i) { TH = THEATRES[i]; return refresh(); },
      setProfile(p) { profile = p; return buildRoute(); },
      getMetrics() { return metrics; },
      render(dt) {
        camA += dt * 0.05;
        const rad = 250;
        camera.position.set(Math.sin(camA) * rad, 165, Math.cos(camA) * rad);
        camera.lookAt(0, 18, 0);
        // fly jet along route
        if (routePts.length) {
          jetT += dt * 0.06; if (jetT > 1) jetT = 0;
          const idx = jetT * (routePts.length - 1), i0 = Math.floor(idx), i1 = Math.min(routePts.length - 1, i0 + 1), fr = idx - i0;
          const a = routePts[i0], b = routePts[i1];
          jet.position.set(a.x + (b.x - a.x) * fr, a.y + (b.y - a.y) * fr + 3, a.z + (b.z - a.z) * fr);
          const dir = new T.Vector3(b.x - a.x, b.y - a.y, b.z - a.z).normalize();
          if (dir.lengthSq() > 0) orient(jet, dir);
        }
        renderer.render(scene, camera);
      },
    });
    refresh();
    return r;
  }

  function initWarZone(wz) {
    if (!wz) return;
    const desc = document.getElementById("wzDesc");
    const fmt = (m) => {
      document.getElementById("wzExp").textContent = (m.exp).toFixed(1);
      document.getElementById("wzPk").textContent = Math.round(m.peak * 100) + "%";
      document.getElementById("wzAlt").textContent = Math.round(m.alt * 30) + " m";
      document.getElementById("wzSam").textContent = m.sam;
    };
    const tSeg = document.getElementById("wzTheatre"), pSeg = document.getElementById("wzProfile");
    [...tSeg.children].forEach((b) => b.addEventListener("click", () => {
      [...tSeg.children].forEach((x) => x.classList.toggle("active", x === b));
      desc.textContent = THEATRES[+b.dataset.t].desc;
      fmt(wz.setTheatre(+b.dataset.t));
    }));
    [...pSeg.children].forEach((b) => b.addEventListener("click", () => {
      [...pSeg.children].forEach((x) => x.classList.toggle("active", x === b));
      fmt(wz.setProfile(b.dataset.p));
    }));
    desc.textContent = THEATRES[0].desc;
    fmt(wz.getMetrics());
  }

  /* ---------------------------------------------------------
     MISSIONS — curated history + generated scenarios (100)
  --------------------------------------------------------- */
  const HIST = [
    { year: "1967", name: "Operation Focus", theatre: "Sinai / Egypt", ac: "Mirage III, Mystère", desc: "Israel's pre-emptive strike destroyed the Egyptian air force on the ground in hours.", scen: { weapon: 0, aspect: 2, range: 8, tspd: 0.7, tg: 2 } },
    { year: "1981", name: "Operation Opera", theatre: "Osirak, Iraq", ac: "F-16A, F-15A", desc: "Eight F-16s, escorted by F-15s, destroyed the Osirak reactor in a low-level strike.", scen: { weapon: 0, aspect: 0, range: 10, tspd: 0.8, tg: 3 } },
    { year: "1982", name: "Mole Cricket 19", theatre: "Bekaa Valley", ac: "F-15, F-16, E-2C", desc: "A landmark SEAD operation: Syrian SAM batteries and ~80 aircraft destroyed for minimal loss.", scen: { weapon: 1, aspect: 1, range: 14, tspd: 0.9, tg: 5 } },
    { year: "1982", name: "Operation Black Buck", theatre: "Falklands", ac: "Avro Vulcan", desc: "Ultra-long-range RAF bombing raids supported by a huge tanker chain.", scen: { weapon: 2, aspect: 2, range: 22, tspd: 0.6, tg: 1 } },
    { year: "1986", name: "El Dorado Canyon", theatre: "Libya", ac: "F-111F, A-6E", desc: "US night precision strikes flown around denied airspace from the UK.", scen: { weapon: 0, aspect: 0, range: 12, tspd: 0.8, tg: 3 } },
    { year: "1991", name: "Desert Storm — Night One", theatre: "Iraq", ac: "F-117, F-15E, F/A-18", desc: "Stealth and precision opened the air campaign against integrated air defences.", scen: { weapon: 1, aspect: 0, range: 16, tspd: 0.9, tg: 4 } },
    { year: "1991", name: "Eagle Sweep", theatre: "Iraq", ac: "F-15C", desc: "USAF F-15s scored the majority of coalition air-to-air kills of the war.", scen: { weapon: 1, aspect: 0, range: 18, tspd: 1.0, tg: 6 } },
    { year: "1995", name: "Deliberate Force", theatre: "Bosnia", ac: "F-16, F/A-18, Mirage 2000", desc: "NATO precision air campaign that helped end the Bosnian War.", scen: { weapon: 0, aspect: 1, range: 12, tspd: 0.85, tg: 4 } },
    { year: "1999", name: "Allied Force", theatre: "Yugoslavia", ac: "F-15, F-16, F-117", desc: "78-day NATO air campaign; notable for the loss of an F-117 to an SA-3.", scen: { weapon: 1, aspect: 1, range: 15, tspd: 0.9, tg: 5 } },
    { year: "2001", name: "Enduring Freedom", theatre: "Afghanistan", ac: "F-14, F/A-18, B-52", desc: "Carrier and bomber power projected over a landlocked theatre with persistent ISR.", scen: { weapon: 2, aspect: 2, range: 20, tspd: 0.7, tg: 2 } },
    { year: "2003", name: "Iraqi Freedom", theatre: "Iraq", ac: "F-15E, F/A-18, Tornado", desc: "'Shock and awe' — massed precision strikes against command and air-defence nodes.", scen: { weapon: 1, aspect: 0, range: 16, tspd: 0.9, tg: 4 } },
    { year: "2011", name: "Harmattan / Odyssey Dawn", theatre: "Libya", ac: "Rafale, Mirage 2000, Typhoon", desc: "Rafales flew the opening strikes enforcing the no-fly zone over Libya.", scen: { weapon: 0, aspect: 1, range: 13, tspd: 0.85, tg: 5 } },
    { year: "2015", name: "Inherent Resolve", theatre: "Syria / Iraq", ac: "F-22, F-15E, Rafale", desc: "The F-22's combat debut, escorting and coordinating strikes against ISIS.", scen: { weapon: 1, aspect: 0, range: 17, tspd: 0.9, tg: 4 } },
    { year: "2018", name: "Operation Hamilton", theatre: "Syria", ac: "Rafale, Tornado, B-1B", desc: "Coordinated stand-off cruise-missile strikes on chemical-weapons sites.", scen: { weapon: 2, aspect: 2, range: 24, tspd: 0.7, tg: 2 } },
    { year: "2019", name: "Balakot Strike", theatre: "South Asia", ac: "Mirage 2000, Su-30MKI", desc: "Cross-border precision strike followed by a dramatic next-day air engagement.", scen: { weapon: 0, aspect: 0, range: 14, tspd: 0.95, tg: 6 } },
    { year: "1973", name: "Operation Nickel Grass", theatre: "Yom Kippur War", ac: "F-4 Phantom, A-4", desc: "Intense air combat against a dense, modern Soviet-supplied SAM network.", scen: { weapon: 0, aspect: 1, range: 11, tspd: 0.85, tg: 5 } },
    { year: "1988", name: "Bekaa II Patrols", theatre: "Lebanon", ac: "F-15, F-16", desc: "Sustained combat air patrols against contested airspace.", scen: { weapon: 1, aspect: 0, range: 16, tspd: 0.9, tg: 5 } },
    { year: "2020", name: "Spring Shield", theatre: "Idlib, Syria", ac: "F-16, UCAV", desc: "Manned-unmanned strikes against armour and air defences.", scen: { weapon: 0, aspect: 1, range: 12, tspd: 0.8, tg: 4 } },
  ];
  const SCEN_AC = ["Rafale", "F-35A", "F-22", "Typhoon", "Su-57", "F-16C", "Gripen E", "F-15EX", "J-20", "Su-35"];
  const SCEN_OBJ = ["DCA Sweep", "OCA Strike", "SEAD Push", "Maritime Strike", "Escort", "CAP Station", "Deep Interdiction", "QRA Intercept", "Fighter Sweep", "Strike Egress"];
  const SCEN_TH = ["Mountain Corridor", "Desert Box", "Coastal Approach", "Polar Front", "Littoral Gap", "Highland Pass"];
  function buildMissions() {
    const all = HIST.map((h) => ({ ...h, kind: "H" }));
    let seed = 7;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    let n = all.length;
    while (all.length < 100) {
      const ac = SCEN_AC[Math.floor(rnd() * SCEN_AC.length)];
      const obj = SCEN_OBJ[Math.floor(rnd() * SCEN_OBJ.length)];
      const th = SCEN_TH[Math.floor(rnd() * SCEN_TH.length)];
      const weapon = Math.floor(rnd() * 3), aspect = Math.floor(rnd() * 3);
      const range = 6 + Math.floor(rnd() * 19), tspd = +(0.6 + rnd() * 0.9).toFixed(2), tg = Math.floor(rnd() * 9);
      all.push({ year: "SIM", name: `${obj} ${String(++n).padStart(3, "0")}`, theatre: th, ac,
        desc: `Training scenario — ${ac} flying a ${obj.toLowerCase()} against a Mach ${tspd}, ${tg}-G target.`,
        kind: "S", scen: { weapon, aspect, range, tspd, tg } });
    }
    return all;
  }
  function initMissions() {
    const grid = document.getElementById("missionsGrid");
    const filters = document.getElementById("msFilters");
    const moreBtn = document.getElementById("msMore");
    if (!grid) return;
    const all = buildMissions();
    const fmtAspect = ["HEAD-ON", "CROSSING", "TAIL-CHASE"];
    const wname = ["MICA-IR", "MICA-EM", "METEOR"];
    filters.innerHTML = ["ALL", "HISTORICAL", "SCENARIO"].map((f, i) => `<button data-f="${f}"${i === 0 ? ' class="active"' : ""}>${f}</button>`).join("");
    let filter = "ALL", shown = 0;
    function list() { return all.filter((m) => filter === "ALL" || (filter === "HISTORICAL" ? m.kind === "H" : m.kind === "S")); }
    function card(m) {
      return `<button class="mcard" data-y="${m.year}">
        <div class="mcard__top"><span class="mcard__year">${m.year}</span>
          <span class="mcard__tag ${m.kind === "H" ? "tag-h" : "tag-s"}">${m.kind === "H" ? "HISTORICAL" : "SCENARIO"}</span></div>
        <div class="mcard__name">${m.name}</div>
        <div class="mcard__meta">${m.theatre} · ${m.ac}</div>
        <div class="mcard__desc">${m.desc}</div>
        <div class="mcard__load">▶ ${wname[m.scen.weapon]} · ${fmtAspect[m.scen.aspect]} · ${m.scen.range}km — LOAD ↗</div></button>`;
    }
    function render(reset) {
      const items = list();
      if (reset) { shown = 0; grid.innerHTML = ""; }
      const next = items.slice(shown, shown + 24);
      grid.insertAdjacentHTML("beforeend", next.map(card).join(""));
      shown += next.length;
      moreBtn.style.display = shown >= items.length ? "none" : "inline-flex";
      // bind newly added
      grid.querySelectorAll(".mcard:not([data-bound])").forEach((b, k) => {
        b.setAttribute("data-bound", "1");
      });
      bind(items);
    }
    function bind(items) {
      grid.querySelectorAll(".mcard").forEach((b, i) => {
        b.onclick = () => {
          const m = items[i]; if (!m || !simCtl) return;
          simCtl.load(m.scen); goTo("#sim");
        };
      });
    }
    filters.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.f; filters.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      render(true);
    }));
    moreBtn.addEventListener("click", () => render(false));
    render(true);
  }

  /* ---------------------------------------------------------
     PAGE — Lenis, reveals, counters, loader, magnetic
  --------------------------------------------------------- */
  function initLenis() {
    if (reduce || typeof Lenis === "undefined") return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenisRef = lenis;
    lenis.on("scroll", () => window.ScrollTrigger && ScrollTrigger.update());
    gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const id = a.getAttribute("href"); if (id.length < 2) return;
      const el = document.querySelector(id); if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -10 }); }
    }));
  }
  function initReveals() {
    if (!hasGSAP || !window.ScrollTrigger) return;
    gsap.utils.toArray(".reveal").forEach((el) =>
      gsap.from(el, { scrollTrigger: { trigger: el, start: "top 86%" }, y: 40, opacity: 0, duration: 1, ease: "power3.out" }));
    gsap.utils.toArray(".sec-head").forEach((el) =>
      gsap.from(el, { scrollTrigger: { trigger: el, start: "top 90%" }, x: -16, opacity: 0, duration: 0.8, ease: "power2.out" }));
    // counters
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter() {
        const o = { v: 0 }; gsap.to(o, { v: target, duration: 1.4, ease: "power2.out", onUpdate() { el.textContent = Math.round(o.v); } });
      } });
    });
    // hero intro
    gsap.from(".hero__title", { y: 30, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.2 });
    gsap.from([".kicker", ".hero__sub", ".hero__cta", ".hero__stats"], { y: 20, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, delay: 0.4 });
  }
  function initMagnetic() {
    if (isTouch || !hasGSAP) return;
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => { const b = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (b.left + b.width / 2)) * 0.25, y: (e.clientY - (b.top + b.height / 2)) * 0.4, duration: 0.4, ease: "power3" }); });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
    });
  }
  function boot() {
    const bar = document.getElementById("loaderBar"), st = document.getElementById("loaderStatus"), loader = document.getElementById("loader");
    const steps = ["CALIBRATING SENSORS", "ARMING SYSTEMS", "UPLINK ESTABLISHED", "READY"];
    const start = () => { initReveals(); if (window.ScrollTrigger) ScrollTrigger.refresh(); };
    if (reduce || !hasGSAP) { if (loader) loader.style.display = "none"; start(); return; }
    const o = { v: 0 };
    gsap.to(o, { v: 100, duration: 1.5, ease: "power1.inOut",
      onUpdate() { const v = Math.round(o.v); bar.style.width = v + "%"; st.textContent = steps[Math.min(3, Math.floor(v / 25))]; },
      onComplete() { gsap.to(loader, { opacity: 0, duration: 0.6, onComplete() { loader.style.display = "none"; } }); start(); } });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  addEventListener("DOMContentLoaded", () => {
    if (!T) { document.getElementById("loader").style.display = "none"; return; }
    initLenis();
    heroScene();
    initGenerations();
    platformScene();
    const db = aircraftDB();
    initAircraftDB(db);
    anatomyScene();
    const sim = simulator();
    guidanceDiagram();
    wireUI(sim);
    const wz = warZone();
    initWarZone(wz);
    initMissions();
    initMagnetic();
    requestAnimationFrame(loop);
    boot();
  });
  addEventListener("load", () => { if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 300); });
})();
