/* =========================================================
   DOSTOEVSKY — immersive experience
   Lenis · GSAP/ScrollTrigger · Three.js
   ========================================================= */
(function () {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  /* ---------------------------------------------------------
     SMOOTH SCROLL
  --------------------------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (reduce || typeof Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.5 });
    lenis.on("scroll", () => ScrollTrigger.update());
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------------------------------------------------
     THREE.JS — hero candle (light in the dark)
  --------------------------------------------------------- */
  function candleScene(canvas) {
    if (!canvas || typeof THREE === "undefined") return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.4, 7);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize();

    const grp = new THREE.Group();
    scene.add(grp);

    // candle body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.52, 3.0, 40),
      new THREE.MeshStandardMaterial({ color: 0xe7dcc0, roughness: 0.85, metalness: 0.0 })
    );
    body.position.y = -1.4;
    grp.add(body);
    // melted top
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.46, 0.18, 40),
      new THREE.MeshStandardMaterial({ color: 0xd9cba8, roughness: 0.9 })
    );
    top.position.y = 0.18; grp.add(top);

    // flame (additive)
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffb24d, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.62, 20), flameMat);
    flame.position.y = 0.62; grp.add(flame);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff7a1f, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false });
    const glow = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.5, 20), glowMat);
    glow.position.y = 0.7; grp.add(glow);

    // lights
    const warm = new THREE.PointLight(0xffa64d, 2.4, 14, 2);
    warm.position.set(0, 0.7, 0.6); scene.add(warm);
    scene.add(new THREE.AmbientLight(0x3a1410, 0.6));
    const rim = new THREE.DirectionalLight(0xb3160f, 0.5);
    rim.position.set(-3, 2, 2); scene.add(rim);

    // embers
    const N = 220;
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = Math.random() * 4 + 0.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      seed[i] = Math.random();
    }
    const eg = new THREE.BufferGeometry();
    eg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const embers = new THREE.Points(eg, new THREE.PointsMaterial({
      color: 0xffa24a, size: 0.055, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(embers);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => {
      mouse.tx = (e.clientX / innerWidth - 0.5);
      mouse.ty = (e.clientY / innerHeight - 0.5);
    }, { passive: true });
    addEventListener("resize", resize);

    let flick = 0;
    return {
      render(t) {
        flick += 0.1;
        const f = 0.85 + Math.sin(flick * 2.1) * 0.08 + Math.sin(flick * 5.7) * 0.05 + Math.random() * 0.04;
        warm.intensity = 1.8 + f * 1.2;
        flame.scale.set(0.9 + Math.random() * 0.12, f + 0.25, 0.9 + Math.random() * 0.12);
        flame.position.x = Math.sin(flick * 3) * 0.012;
        glow.scale.setScalar(0.9 + f * 0.2);
        glow.material.opacity = 0.2 + f * 0.12;
        const p = eg.attributes.position.array;
        for (let i = 0; i < N; i++) {
          p[i * 3 + 1] += 0.006 + seed[i] * 0.01;
          p[i * 3] += Math.sin(t * 0.001 + seed[i] * 9) * 0.0016;
          if (p[i * 3 + 1] > 4.8) { p[i * 3 + 1] = 0.6; }
        }
        eg.attributes.position.needsUpdate = true;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        grp.rotation.y = mouse.x * 0.5;
        grp.rotation.x = mouse.y * 0.2;
        camera.position.x = mouse.x * 0.8;
        camera.lookAt(0, 0.2, 0);
        renderer.render(scene, camera);
      },
    };
  }

  /* ---------------------------------------------------------
     THREE.JS — outro embers (souls rising)
  --------------------------------------------------------- */
  function emberScene(canvas) {
    if (!canvas || typeof THREE === "undefined") return null;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener("resize", resize);

    const N = 600;
    const pos = new Float32Array(N * 3), spd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
      spd[i] = 0.004 + Math.random() * 0.014;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xc8742a, size: 0.05, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    scene.add(pts);

    return {
      render(t) {
        const p = g.attributes.position.array;
        for (let i = 0; i < N; i++) {
          p[i * 3 + 1] += spd[i];
          p[i * 3] += Math.sin(t * 0.0004 + i) * 0.002;
          if (p[i * 3 + 1] > 9) p[i * 3 + 1] = -9;
        }
        g.attributes.position.needsUpdate = true;
        pts.rotation.y = t * 0.00004;
        renderer.render(scene, camera);
      },
    };
  }

  /* ---------------------------------------------------------
     CURSOR + BLIPPING WORDS
  --------------------------------------------------------- */
  const WORDS = [
    "SUFFERING", "REDEMPTION", "FAITH", "DOUBT", "GUILT", "FREEDOM", "SOUL",
    "UNDERGROUND", "CONSCIENCE", "GOD", "CRIME", "PUNISHMENT", "BEAUTY", "LOVE",
    "DESPAIR", "MADNESS", "GRACE", "SIN", "PRIDE", "MERCY", "ABYSS", "CONFESSION",
    "СТРАДАНИЕ", "ВЕРА", "СВОБОДА", "ДУША",
  ];
  function initCursor() {
    if (isTouch || reduce || !hasGSAP) return;
    const cur = document.getElementById("cursor");
    const blips = document.getElementById("blips");
    const xT = gsap.quickTo(cur, "x", { duration: 0.25, ease: "power3" });
    const yT = gsap.quickTo(cur, "y", { duration: 0.25, ease: "power3" });
    let lastBlip = 0, lx = 0, ly = 0, wi = 0;
    addEventListener("pointermove", (e) => {
      xT(e.clientX); yT(e.clientY);
      const now = performance.now();
      const moved = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (now - lastBlip > 110 && moved > 26) {
        lastBlip = now; lx = e.clientX; ly = e.clientY;
        const b = document.createElement("span");
        b.className = "blip";
        b.textContent = WORDS[wi++ % WORDS.length];
        b.style.left = e.clientX + "px";
        b.style.top = e.clientY + "px";
        blips.appendChild(b);
        gsap.fromTo(b,
          { opacity: 0.9, scale: 0.7, y: 0 },
          { opacity: 0, scale: 1, y: -60, duration: 1.3, ease: "power2.out",
            onComplete: () => b.remove() });
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     PROCEDURAL ENGRAVING — chained prisoners (House of the Dead)
  --------------------------------------------------------- */
  function drawPrisoners() {
    const svg = document.getElementById("prisoners");
    if (!svg) return;
    const W = 760, H = 600, n = 7;
    let s = `<rect width="${W}" height="${H}" fill="#2a140e"/>`;
    // chain line
    s += `<path d="M40 ${H * 0.62} H ${W - 40}" stroke="#0c0a09" stroke-width="3" stroke-dasharray="2 7" opacity="0.8"/>`;
    const stroke = `stroke="#0c0a09" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((W - 140) / (n - 1));
      const lean = (Math.random() - 0.5) * 10;
      const yh = H * 0.30 + Math.random() * 16;     // head y
      const yf = H * 0.86;                           // feet
      const wob = (Math.random() - 0.5) * 6;
      s += `<g transform="translate(${x},0) rotate(${lean} 0 ${H * 0.6})" opacity="0.95">`;
      // head (bowed)
      s += `<circle cx="${wob}" cy="${yh}" r="22" ${stroke}/>`;
      // hood/hair hatch
      s += `<path d="M${wob - 22} ${yh - 4} q22 -34 44 0" ${stroke}/>`;
      // bowed back + torso
      s += `<path d="M${wob} ${yh + 22} q-26 30 -18 70 q6 34 4 78" ${stroke}/>`;
      s += `<path d="M${wob} ${yh + 22} q26 28 20 70 q-4 34 -2 78" ${stroke}/>`;
      // arms toward chain
      s += `<path d="M${wob - 12} ${yh + 60} q-26 14 -34 ${H * 0.62 - (yh + 60)}" ${stroke}/>`;
      s += `<path d="M${wob + 12} ${yh + 60} q26 14 34 ${H * 0.62 - (yh + 60)}" ${stroke}/>`;
      // legs
      s += `<path d="M${wob - 14} ${yh + 178} l-6 ${yf - (yh + 178)}" ${stroke}/>`;
      s += `<path d="M${wob + 14} ${yh + 178} l6 ${yf - (yh + 178)}" ${stroke}/>`;
      // feet
      s += `<path d="M${wob - 20} ${yf} h22 M${wob + 8} ${yf} h22" ${stroke}/>`;
      // coat hatching
      for (let k = 0; k < 4; k++) {
        const hy = yh + 50 + k * 30;
        s += `<path d="M${wob - 16} ${hy} q16 8 32 0" ${stroke} opacity="0.6"/>`;
      }
      s += `</g>`;
    }
    svg.innerHTML = s;
  }

  /* ---------------------------------------------------------
     BOOK FLIP
  --------------------------------------------------------- */
  const FACES = [
    { cover: true, title: "THE COLLECTED\nDOSTOEVSKY", sub: "NINE DESCENTS INTO THE SOUL" },
    { book: "NOTES FROM UNDERGROUND · 1864", quote: "I am a sick man… I am a spiteful man. I am an unattractive man." },
    { book: "CRIME AND PUNISHMENT · 1866", quote: "To go wrong in one's own way is better than to go right in someone else's." },
    { book: "THE IDIOT · 1869", quote: "Beauty will save the world." },
    { book: "DEMONS · 1872", quote: "Nothing is easier than to denounce the evildoer; nothing harder than to understand him." },
    { book: "A WRITER'S DIARY · 1877", quote: "The greatest happiness is to know the source of unhappiness." },
    { book: "THE BROTHERS KARAMAZOV · 1880", quote: "What is hell? The suffering of being no longer able to love." },
    { book: "THE BROTHERS KARAMAZOV · 1880", quote: "Above all, do not lie to yourself, for you cease to distinguish the truth." },
    { book: "THE BROTHERS KARAMAZOV · 1880", quote: "Love all God's creation, every grain of sand. Love the animals, love the plants." },
    { book: "LETTER TO HIS BROTHER · 1838", quote: "Man is a mystery. I occupy myself with it, for I wish to be a man." },
    { end: true, quote: "To love is to suffer, and there can be no love otherwise." },
    { end: true, quote: "" },
  ];
  function faceHTML(f, idx) {
    if (f.cover) {
      return `<div class="page page--cover">
        <span class="page__sub">${f.sub}</span>
        <h3 class="page__title">${f.title.replace(/\n/g, "<br/>")}</h3>
        <span class="page__orn">✦</span></div>`;
    }
    if (f.end) {
      return f.quote
        ? `<div class="page page--cover"><span class="page__orn">☦</span>
           <p class="page__quote">${f.quote}</p>
           <span class="page__sub">1821 — 1881</span></div>`
        : `<div class="page page--cover"><span class="page__orn">✦</span></div>`;
    }
    return `<div class="page">
      <span class="page__book">${f.book}</span>
      <span class="page__orn">❧</span>
      <p class="page__quote">${f.quote}</p>
      <span class="page__num">${idx}</span></div>`;
  }
  function buildBook() {
    const stage = document.getElementById("bookStage");
    if (!stage) return [];
    const leaves = [];
    const L = Math.ceil(FACES.length / 2);
    for (let i = 0; i < L; i++) {
      const leaf = document.createElement("div");
      leaf.className = "leaf";
      leaf.style.zIndex = String(L - i);
      const front = document.createElement("div");
      front.className = "leaf__face leaf__front";
      front.innerHTML = faceHTML(FACES[i * 2], i * 2);
      const back = document.createElement("div");
      back.className = "leaf__face leaf__back";
      back.innerHTML = faceHTML(FACES[i * 2 + 1] || { end: true, quote: "" }, i * 2 + 1);
      leaf.appendChild(front); leaf.appendChild(back);
      stage.appendChild(leaf);
      leaves.push(leaf);
    }
    return leaves;
  }
  function initBook() {
    const leaves = buildBook();
    if (!leaves.length || !hasGSAP || reduce) {
      // static fallback: fan the first spread open
      if (leaves[0]) gsap.set(leaves[0], { rotateY: -160 });
      return;
    }
    const L = leaves.length;
    const setZ = (leaf, i) => {
      const r = gsap.getProperty(leaf, "rotateY");
      leaf.style.zIndex = String(r <= -90 ? 200 + i : 100 - i);
    };
    leaves.forEach((lf, i) => setZ(lf, i));

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#book",
        start: "top top",
        end: () => "+=" + (L * Math.max(innerHeight * 0.85, 520)),
        pin: "#bookPin",
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    leaves.forEach((lf, i) => {
      tl.to(lf, {
        rotateY: -180, ease: "power1.inOut", duration: 1,
        onUpdate: () => setZ(lf, i),
      }, i);
    });
    // fade the hint out as the first page turns
    gsap.to("#bookHint", {
      scrollTrigger: { trigger: "#book", start: "top top", end: "+=300", scrub: true },
      opacity: 0,
    });
  }

  /* ---------------------------------------------------------
     WORKS GALLERY
  --------------------------------------------------------- */
  const WORKS = [
    { year: "1864", title: "Notes from\nUnderground", line: "The first modern voice of the divided self." },
    { year: "1866", title: "Crime and\nPunishment", line: "A murder, and the slow architecture of conscience." },
    { year: "1869", title: "The Idiot", line: "A wholly good man loosed upon a corrupt world." },
    { year: "1872", title: "Demons", line: "Ideology as possession; the politics of the abyss." },
    { year: "1880", title: "The Brothers\nKaramazov", line: "Faith, doubt and patricide — his final testament." },
    { year: "1867", title: "The Gambler", line: "Written against the clock, fevered with chance." },
  ];
  function buildWorks() {
    const grid = document.getElementById("worksGrid");
    if (!grid) return;
    grid.innerHTML = WORKS.map((w) => `
      <article class="work" data-reveal>
        <span class="work__year">${w.year}</span>
        <div>
          <h3 class="work__title">${w.title.replace(/\n/g, "<br/>")}</h3>
          <p class="work__line">${w.line}</p>
        </div>
      </article>`).join("");
  }

  /* ---------------------------------------------------------
     REVEALS
  --------------------------------------------------------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w" style="display:inline-block">${w}</span>`).join(" ");
    return el.querySelectorAll(".w");
  }
  function initReveals() {
    if (!hasGSAP || !ScrollTrigger) return;

    document.querySelectorAll(".reveal").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 84%" },
        y: 46, opacity: 0, duration: 1, ease: "power3.out",
      });
    });

    document.querySelectorAll(".reveal-words, .statement__text").forEach((el) => {
      if (el.querySelector(".w") || el.querySelector("em")) {
        // statement has <em>; just fade it
        gsap.from(el, { scrollTrigger: { trigger: el, start: "top 82%" }, y: 40, opacity: 0, duration: 1, ease: "power3.out" });
        return;
      }
      const words = splitWords(el);
      gsap.from(words, {
        scrollTrigger: { trigger: el, start: "top 80%" },
        y: 28, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.04,
      });
    });

    // works cards
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      onEnter: (els) => gsap.from(els, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.1, overwrite: true }),
    });

    // newspaper redaction bars
    gsap.set(".redact", { transformOrigin: "left center", scaleX: 0 });
    document.querySelectorAll(".redact").forEach((r) => {
      gsap.to(r, {
        scrollTrigger: { trigger: r, start: "top 90%" },
        scaleX: 1, duration: 0.7, ease: "power2.inOut",
      });
    });

    // hero title rise
    gsap.from(".hero__title .ht-line span", {
      yPercent: 120, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.1,
    });
    gsap.from([".hero__eyebrow", ".hero__sub", ".hero__corners .corner", ".hero__scroll"], {
      opacity: 0, y: 18, duration: 1, ease: "power3.out", stagger: 0.08, delay: 0.5,
    });

    // candle parallax up on scroll past hero
    gsap.to("#webgl", {
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true },
      yPercent: -18, opacity: 0.2,
    });

    // creed book parallax
    gsap.to(".creed__book", {
      scrollTrigger: { trigger: ".creed", start: "top bottom", end: "bottom top", scrub: true },
      yPercent: -14, rotateZ: -3,
    });
  }

  /* ---------------------------------------------------------
     RAIL PROGRESS
  --------------------------------------------------------- */
  function initRail() {
    const fill = document.getElementById("railFill");
    if (!fill || !ScrollTrigger) return;
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: (self) => { fill.style.width = (self.progress * 100).toFixed(2) + "%"; },
    });
  }

  /* ---------------------------------------------------------
     RENDER LOOP (three scenes)
  --------------------------------------------------------- */
  const scenes = [];
  function loop(t) {
    requestAnimationFrame(loop);
    for (const s of scenes) s && s.render(t);
  }

  /* ---------------------------------------------------------
     LOADER → BOOT
  --------------------------------------------------------- */
  function boot() {
    const bar = document.getElementById("loaderBar");
    const pct = document.getElementById("loaderPct");
    const loader = document.getElementById("loader");
    const start = () => {
      initReveals();
      initBook();
      initRail();
      if (ScrollTrigger) ScrollTrigger.refresh();
    };
    if (reduce || !hasGSAP) {
      if (loader) loader.style.display = "none";
      start();
      return;
    }
    const o = { v: 0 };
    gsap.to(o, {
      v: 100, duration: 1.4, ease: "power1.inOut",
      onUpdate() { const v = Math.round(o.v); bar.style.width = v + "%"; pct.textContent = v; },
      onComplete() {
        gsap.to(loader, { opacity: 0, duration: 0.7, ease: "power2.inOut",
          onComplete() { loader.style.display = "none"; } });
        start();
      },
    });
  }

  /* ---------------------------------------------------------
     INIT
  --------------------------------------------------------- */
  addEventListener("DOMContentLoaded", () => {
    initLenis();
    initCursor();
    drawPrisoners();
    buildWorks();

    const s1 = candleScene(document.getElementById("webgl"));
    const s2 = emberScene(document.getElementById("webgl2"));
    if (s1) scenes.push(s1);
    if (s2) scenes.push(s2);
    requestAnimationFrame(loop);

    boot();
  });

  addEventListener("load", () => {
    if (ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 250);
  });
})();
