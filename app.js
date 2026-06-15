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
  }

  /* ---------------------------------------------------------
     PAGE — Lenis, reveals, counters, loader, magnetic
  --------------------------------------------------------- */
  function initLenis() {
    if (reduce || typeof Lenis === "undefined") return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
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
    platformScene();
    anatomyScene();
    const sim = simulator();
    guidanceDiagram();
    wireUI(sim);
    initMagnetic();
    requestAnimationFrame(loop);
    boot();
  });
  addEventListener("load", () => { if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 300); });
})();
