/* =========================================================
   DOSTOEVSKY — immersive experience
   Lenis · GSAP/ScrollTrigger · Three.js
   ========================================================= */
(function () {
  "use strict";

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof gsap !== "undefined";
  const hasFlip = typeof Flip !== "undefined";
  if (hasGSAP && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);
  if (hasGSAP && hasFlip) gsap.registerPlugin(Flip);

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
    { id: "underground", year: "1864", title: "Notes from\nUnderground", line: "The first modern voice of the divided self." },
    { id: "cp", year: "1866", title: "Crime and\nPunishment", line: "A murder, and the slow architecture of conscience." },
    { id: "idiot", year: "1869", title: "The Idiot", line: "A wholly good man loosed upon a corrupt world." },
    { id: "demons", year: "1872", title: "Demons", line: "Ideology as possession; the politics of the abyss." },
    { id: "bk", year: "1880", title: "The Brothers\nKaramazov", line: "Faith, doubt and patricide — his final testament." },
    { id: "gambler", year: "1867", title: "The Gambler", line: "Written against the clock, fevered with chance." },
  ];
  function buildWorks() {
    const grid = document.getElementById("worksGrid");
    if (!grid) return;
    grid.innerHTML = WORKS.map((w) => `
      <article class="work" data-reveal data-book="${w.id}" tabindex="0" role="button" aria-label="Open ${w.title.replace(/\n/g, " ")} walkthrough">
        <span class="work__open">OPEN WALKTHROUGH ↗</span>
        <span class="work__year">${w.year}</span>
        <div>
          <h3 class="work__title">${w.title.replace(/\n/g, "<br/>")}</h3>
          <p class="work__line">${w.line}</p>
        </div>
      </article>`).join("");
    grid.querySelectorAll("[data-book]").forEach((el) => {
      el.addEventListener("click", () => openBook(el.dataset.book));
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(el.dataset.book); } });
    });
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
     QUOTES DECK  (GSAP Flip fan-out)
  --------------------------------------------------------- */
  const QUOTES = [
    { q: "Beauty is mysterious as well as terrible. God and the devil are fighting there, and the battlefield is the heart of man.", c: "THE BROTHERS KARAMAZOV" },
    { q: "Taking a new step, uttering a new word, is what people fear most.", c: "CRIME AND PUNISHMENT" },
    { q: "The darker the night, the brighter the stars; the deeper the grief, the closer is God.", c: "CRIME AND PUNISHMENT" },
    { q: "Man only likes to count his troubles; he does not count his joys.", c: "NOTES FROM UNDERGROUND" },
    { q: "If you want to be respected by others, the great thing is to respect yourself.", c: "THE INSULTED AND HUMILIATED" },
    { q: "Power is given only to those who dare to lower themselves and pick it up.", c: "CRIME AND PUNISHMENT" },
  ];
  function buildQuotes() {
    const deck = document.getElementById("quotesDeck");
    if (!deck) return;
    deck.classList.add("stacked");
    deck.innerHTML = QUOTES.map((x, i) => {
      const r = (i - (QUOTES.length - 1) / 2) * 4;
      return `<figure class="qc" style="--r:${r}deg">
        <span class="qc__mark">“</span>
        <blockquote class="qc__q">${x.q}</blockquote>
        <figcaption class="qc__c">— ${x.c}</figcaption>
      </figure>`;
    }).join("");
  }
  function initQuotesFlip() {
    const deck = document.getElementById("quotesDeck");
    if (!deck) return;
    const cards = deck.querySelectorAll(".qc");
    if (!hasGSAP || !hasFlip || reduce) { deck.classList.remove("stacked"); return; }
    ScrollTrigger.create({
      trigger: "#quotes",
      start: "top 62%",
      once: true,
      onEnter() {
        const state = Flip.getState(cards, { props: "rotate" }); // capture stacked layout + rotation
        deck.classList.remove("stacked");                        // reflow to the spread layout
        Flip.from(state, {
          duration: 1.1, ease: "power3.out", stagger: 0.07, absolute: true,
        });
      },
    });
  }

  /* ---------------------------------------------------------
     VINTAGE SEPIA PLATES (procedural engravings of his life)
  --------------------------------------------------------- */
  const SEPIA = { sky: "#cdb286", paper: "#ddc69a", mid: "#a8814a", dark: "#3a2a16", ink: "#241608" };
  function plateSVG(kind) {
    const open = `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">`;
    const sky = `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SEPIA.sky}"/><stop offset="1" stop-color="${SEPIA.paper}"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#sk)"/>`;
    const L = `stroke="${SEPIA.ink}" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"`;
    let s = "";
    if (kind === "moscow") {
      s = `<rect x="40" y="120" width="320" height="140" fill="${SEPIA.mid}"/>
      <polygon points="120,120 280,120 200,72" fill="${SEPIA.dark}"/>
      <polygon points="120,120 280,120 200,72" ${L}/>
      ${[0,1,2,3,4,5].map(i=>`<rect x="${108+i*32}" y="140" width="14" height="90" fill="${SEPIA.dark}"/>`).join("")}
      <rect x="40" y="120" width="320" height="140" ${L}/>
      <rect x="92" y="130" width="216" height="14" fill="${SEPIA.dark}"/>
      ${[0,1,2,3,4,5,6].map(i=>`<rect x="${52+i*44}" y="232" width="20" height="26" fill="${SEPIA.dark}"/>`).join("")}
      <rect x="0" y="258" width="400" height="42" fill="${SEPIA.dark}"/>`;
    } else if (kind === "scaffold") {
      s = `<rect x="60" y="200" width="280" height="20" fill="${SEPIA.dark}"/>
      <rect x="80" y="120" width="12" height="92" fill="${SEPIA.dark}"/>
      <rect x="308" y="120" width="12" height="92" fill="${SEPIA.dark}"/>
      <rect x="80" y="120" width="240" height="12" fill="${SEPIA.dark}"/>
      ${[0,1,2,3].map(i=>`<g transform="translate(${130+i*40},150)"><circle cx="0" cy="0" r="9" fill="${SEPIA.ink}"/><path d="M0 9 V40 M-9 20 H9 M-7 70 L0 40 L7 70" ${L}/></g>`).join("")}
      <rect x="0" y="220" width="400" height="80" fill="${SEPIA.mid}"/>
      ${[...Array(40)].map(()=>`<circle cx="${Math.random()*400|0}" cy="${Math.random()*300|0}" r="1.5" fill="${SEPIA.paper}" opacity="0.7"/>`).join("")}`;
    } else if (kind === "prison") {
      s = `<rect x="0" y="210" width="400" height="90" fill="${SEPIA.mid}"/>
      ${[...Array(16)].map((_,i)=>`<g transform="translate(${10+i*25},70)"><rect x="0" y="0" width="18" height="150" fill="${i%2?SEPIA.dark:SEPIA.ink}"/><polygon points="0,0 18,0 9,-12" fill="${SEPIA.dark}"/></g>`).join("")}
      <rect x="150" y="120" width="80" height="100" fill="${SEPIA.ink}"/>
      <g transform="translate(190,150)"><circle cx="0" cy="0" r="10" fill="${SEPIA.paper}"/><path d="M0 10 V46 M-10 24 H10 M-8 78 L0 46 L8 78" stroke="${SEPIA.paper}" stroke-width="2" fill="none"/></g>
      ${[...Array(30)].map(()=>`<circle cx="${Math.random()*400|0}" cy="${Math.random()*210|0}" r="1.4" fill="${SEPIA.paper}" opacity="0.6"/>`).join("")}`;
    } else if (kind === "petersburg") {
      s = `<rect x="0" y="40" width="150" height="220" fill="${SEPIA.mid}"/>
      <rect x="250" y="20" width="150" height="240" fill="${SEPIA.dark}"/>
      ${[...Array(5)].map((_,r)=>[...Array(3)].map((_,c)=>`<rect x="${20+c*40}" y="${70+r*38}" width="20" height="26" fill="${SEPIA.dark}"/>`).join("")).join("")}
      ${[...Array(5)].map((_,r)=>[...Array(3)].map((_,c)=>`<rect x="${270+c*40}" y="${50+r*40}" width="20" height="28" fill="${SEPIA.paper}" opacity="0.55"/>`).join("")).join("")}
      <rect x="150" y="180" width="100" height="120" fill="${SEPIA.ink}"/>
      <circle cx="200" cy="60" r="22" fill="${SEPIA.paper}" opacity="0.8"/>
      <rect x="184" y="150" width="6" height="110" fill="${SEPIA.dark}"/><circle cx="187" cy="148" r="7" fill="${SEPIA.dark}"/>
      <rect x="0" y="270" width="400" height="30" fill="${SEPIA.dark}"/>`;
    } else if (kind === "church") {
      const dome = (x,w,h)=>`<ellipse cx="${x}" cy="${h}" rx="${w}" ry="${w*1.15}" fill="${SEPIA.dark}"/>
        <path d="M${x} ${h-w*1.15} v-14" ${L}/><path d="M${x-6} ${h-w*1.15-7} h12" ${L}/>`;
      s = `<rect x="60" y="150" width="280" height="120" fill="${SEPIA.mid}"/>
      <rect x="170" y="90" width="60" height="80" fill="${SEPIA.dark}"/>
      ${dome(200,34,86)}
      <rect x="92" y="170" width="36" height="100" fill="${SEPIA.dark}"/>${dome(110,16,166)}
      <rect x="272" y="170" width="36" height="100" fill="${SEPIA.dark}"/>${dome(290,16,166)}
      ${[0,1,2].map(i=>`<rect x="${120+i*54}" y="200" width="22" height="50" fill="${SEPIA.ink}"/>`).join("")}
      <rect x="0" y="268" width="400" height="32" fill="${SEPIA.dark}"/>`;
    } else { // candle
      s = `<rect width="400" height="300" fill="${SEPIA.ink}"/>
      <rect x="180" y="150" width="40" height="120" fill="${SEPIA.paper}"/>
      <rect x="178" y="146" width="44" height="10" fill="${SEPIA.mid}"/>
      <path d="M200 150 q-16 -28 0 -54 q16 26 0 54Z" fill="${SEPIA.sky}"/>
      <path d="M200 150 q-8 -16 0 -32 q8 16 0 32Z" fill="${SEPIA.paper}"/>
      <circle cx="200" cy="110" r="70" fill="${SEPIA.mid}" opacity="0.18"/>
      <rect x="120" y="60" width="10" height="80" fill="${SEPIA.mid}"/><rect x="103" y="78" width="44" height="9" fill="${SEPIA.mid}"/>`;
    }
    return open + sky + s + `</svg>`;
  }

  /* ---------------------------------------------------------
     3D LIFE TOUR — six rooms of a life
  --------------------------------------------------------- */
  const STATIONS = [
    { year: "1821", place: "MOSCOW · MARIINSKY HOSPITAL", side: "left",  plate: "moscow",
      head: "Born in a wing of a hospital for the poor, among the sick and the destitute.",
      quote: "Man is a mystery. I occupy myself with it, for I wish to be a man." },
    { year: "1849", place: "ST. PETERSBURG · SEMYONOVSKY SQ.", side: "right", plate: "scaffold",
      head: "Condemned for reading forbidden letters, led to the firing posts — reprieved as the rifles rose.",
      quote: "Life is a gift, life is happiness; each minute might have been an eternity." },
    { year: "1850", place: "SIBERIA · OMSK FORTRESS", side: "left", plate: "prison",
      head: "Four years of penal servitude in chains — the years he called the House of the Dead.",
      quote: "I came to feel that a human being can become accustomed to anything." },
    { year: "1866", place: "ST. PETERSBURG · STOLYARNY LANE", side: "right", plate: "petersburg",
      head: "In a cramped garret above the Haymarket he wrote Crime and Punishment, page by page, to pay his debts.",
      quote: "Taking a new step, uttering a new word, is what people fear most." },
    { year: "1878", place: "OPTINA · THE MONASTERY", side: "left", plate: "church",
      head: "Grieving a lost child, he sought the elders — and found Father Zosima for The Brothers Karamazov.",
      quote: "Love all God's creation, the whole of it and every grain of sand." },
    { year: "1881", place: "ST. PETERSBURG · KUZNECHNY LANE", side: "right", plate: "candle",
      head: "He died at fifty-nine; through the winter streets, thousands followed his coffin.",
      quote: "Do not lose heart — the darker the night, the brighter the stars." },
  ];
  function buildStations() {
    const wrap = document.getElementById("lifeStations");
    if (!wrap) return;
    wrap.innerHTML = STATIONS.map((s, i) => `
      <article class="station station--${s.side}" data-st="${i}">
        <div class="station__plate">
          <figure class="plate">
            <div class="plate__img">${plateSVG(s.plate)}</div>
            <figcaption class="plate__cap">${s.place} · ${s.year}</figcaption>
          </figure>
        </div>
        <div class="station__text">
          <div class="station__year">${s.year}</div>
          <div class="station__place">${s.place}</div>
          <p class="station__head">${s.head}</p>
          <p class="station__quote"><b>“</b>${s.quote}<b>”</b></p>
        </div>
      </article>`).join("");
  }

  // -- 3D architecture builder --
  function lifeTour() {
    const canvas = document.getElementById("lifeCanvas");
    if (!canvas || typeof THREE === "undefined") return null;
    const N = STATIONS.length, SPACING = 60;
    const BG = 0x0a0705;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 24, 120);
    const camera = new THREE.PerspectiveCamera(62, canvas.clientWidth / canvas.clientHeight, 0.1, 400);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    resize(); addEventListener("resize", resize);

    scene.add(new THREE.AmbientLight(0x40342a, 0.7));
    const key = new THREE.DirectionalLight(0xffd9a0, 0.8);
    key.position.set(-6, 14, 8); scene.add(key);
    const torch = new THREE.PointLight(0xffb060, 2.6, 70, 2);
    scene.add(torch);

    const box = (w, h, d, color, x, y, z, rx, ry) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
        new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
      m.position.set(x, y, z);
      if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry;
      return m;
    };
    const cyl = (rt, rb, h, color, x, y, z) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 24),
        new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
      m.position.set(x, y, z); return m;
    };
    // ground for the whole corridor
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, N * SPACING + 160),
      new THREE.MeshStandardMaterial({ color: 0x140d09, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(0, -8, -((N - 1) * SPACING) / 2);
    scene.add(ground);

    function chapter(i) {
      const g = new THREE.Group(); g.position.z = -i * SPACING;
      if (i === 0) {                       // Moscow — neoclassical hospital
        g.add(box(46, 22, 6, 0xb8a079, 0, 3, -10));
        for (let c = 0; c < 7; c++) g.add(cyl(1, 1.1, 18, 0xc8b48a, -18 + c * 6, 1, -5));
        g.add(box(50, 4, 8, 0x9c855f, 0, 16, -10));
        const ped = box(26, 10, 5, 0x8a734f, 0, 22, -10); ped.rotation.z = 0; g.add(ped);
      } else if (i === 1) {                // Scaffold
        g.add(box(20, 1.4, 20, 0x5a4632, 0, -6, 0));
        g.add(box(1.4, 16, 1.4, 0x3a2c1e, -8, 1, -6));
        g.add(box(1.4, 16, 1.4, 0x3a2c1e, 8, 1, -6));
        g.add(box(18, 1.4, 1.4, 0x3a2c1e, 0, 9, -6));
        for (let s = 0; s < 5; s++) g.add(box(1.6, 9, 1.6, 0x2c2118, -18 + s * 9, 0.5, 16, 0, 0.2)); // rifles/soldiers
      } else if (i === 2) {                // Siberian palisade
        for (let s = -1; s <= 1; s += 2) {
          for (let z = -8; z <= 18; z += 3.4) g.add(cyl(1.1, 1.1, 17, 0x4a3829, s * 15, 0, z));
        }
        g.add(box(1.2, 14, 1.2, 0x2c2018, -4, 0, -10));
        g.add(box(1.2, 14, 1.2, 0x2c2018, 4, 0, -10));
        g.add(box(10, 1.4, 1.2, 0x2c2018, 0, 7, -10));
      } else if (i === 3) {                // Petersburg tenements (street canyon)
        const winTex = windowTexture();
        const facade = (x) => {
          const m = new THREE.Mesh(new THREE.BoxGeometry(14, 52, 26),
            new THREE.MeshStandardMaterial({ color: 0xb59a52, roughness: 0.9, map: winTex }));
          m.position.set(x, 8, 0); return m;
        };
        g.add(facade(-16)); g.add(facade(16));
        for (let s = 0; s < 6; s++) g.add(box(7 - s, 1.4, 7, 0x3a2c1e, 0, -6.6 + s * 1.4, 14 - s * 2)); // staircase
      } else if (i === 4) {                // Orthodox church
        g.add(box(34, 16, 18, 0xe6dcc6, 0, 0, -8));
        g.add(cyl(5, 5, 22, 0xe6dcc6, 0, 14, -8));
        const onion = (x, r, y) => {
          const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18),
            new THREE.MeshStandardMaterial({ color: 0xc8a24a, roughness: 0.35, metalness: 0.6 }));
          d.scale.y = 1.5; d.position.set(x, y, -8); g.add(d);
          g.add(box(0.5, r * 1.4, 0.5, 0xc8a24a, x, y + r * 1.6, -8));
          g.add(box(r * 0.9, 0.5, 0.5, 0xc8a24a, x, y + r * 1.4, -8));
        };
        onion(0, 5.5, 28);
        onion(-12, 2.6, 12); onion(12, 2.6, 12);
      } else if (i === 5) {                // Death — candle + cross of light
        g.add(cyl(1.6, 1.8, 12, 0xe7dcc0, 0, -2, 0));
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.4, 16),
          new THREE.MeshBasicMaterial({ color: 0xffb24d, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
        fl.position.set(0, 5.4, 0); g.add(fl); g.userData.flame = fl;
        const cl = new THREE.PointLight(0xffb060, 3, 40, 2); cl.position.set(0, 6, 2); g.add(cl);
        g.add(box(1.4, 16, 1.4, 0x2a1d10, 0, 6, -14));
        g.add(box(8, 1.4, 1.4, 0x2a1d10, 0, 10, -14));
      }
      scene.add(g); return g;
    }
    const chapters = []; for (let i = 0; i < N; i++) chapters.push(chapter(i));

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => {
      mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5;
    }, { passive: true });

    const START_Z = 30, END_Z = 30 - (N - 1) * SPACING;
    let prog = 0, cur = 0;
    return {
      setProgress(p) { prog = p; },
      render(t) {
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        const z = START_Z + (END_Z - START_Z) * prog;
        camera.position.set(mouse.x * 6, 2 + mouse.y * -3, z);
        camera.lookAt(mouse.x * 3, 1.5, z - 30);
        torch.position.set(camera.position.x, camera.position.y + 3, camera.position.z + 2);
        const last = chapters[5];
        if (last && last.userData.flame) {
          last.userData.flame.scale.setScalar(0.9 + Math.random() * 0.18);
        }
        renderer.render(scene, camera);
      },
    };
  }
  // small canvas texture: warm windows on a facade
  function windowTexture() {
    const c = document.createElement("canvas"); c.width = 128; c.height = 256;
    const x = c.getContext("2d");
    x.fillStyle = "#b59a52"; x.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 9; r++) for (let col = 0; col < 3; col++) {
      x.fillStyle = Math.random() > 0.55 ? "#ffd98a" : "#2a2012";
      x.fillRect(20 + col * 36, 16 + r * 26, 18, 16);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 1);
    return tex;
  }

  function initLifeTour(tour) {
    if (!tour || !hasGSAP || !ScrollTrigger) return;
    const stations = gsap.utils.toArray(".station");
    gsap.set(stations, { opacity: 0 });
    if (stations[0]) gsap.set(stations[0], { opacity: 1 });
    const N = stations.length;
    let active = 0;
    const fill = document.getElementById("lifeProgress");
    const hint = document.getElementById("lifeHint");

    if (reduce) {
      // static fallback: stack stations vertically, show all, no pin
      gsap.set(stations, { opacity: 1, position: "relative" });
      tour.setProgress(0);
      return;
    }

    ScrollTrigger.create({
      trigger: "#lifetour",
      start: "top top",
      end: () => "+=" + N * Math.max(innerHeight, 640),
      pin: "#lifePin",
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate(self) {
        tour.setProgress(self.progress);
        if (fill) fill.style.width = (self.progress * 100).toFixed(1) + "%";
        if (hint) hint.style.opacity = self.progress > 0.04 ? "0" : "0.8";
        const idx = Math.min(N - 1, Math.round(self.progress * (N - 1)));
        if (idx !== active) {
          gsap.to(stations[active], { opacity: 0, y: -24, duration: 0.45, ease: "power2.in" });
          active = idx;
          gsap.fromTo(stations[active], { opacity: 0, y: 28 },
            { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
        }
      },
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
      initQuotesFlip();
      initLifeTour(lifeTourScene);
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

  /* ---------------------------------------------------------
     QUOTE ARCHIVE — searchable concordance of his works
     Source-checked against public quote repositories + texts;
     commonly mis-attributed lines deliberately excluded.
  --------------------------------------------------------- */
  const ARCHIVE = [
    // --- Crime and Punishment (1866) ---
    { q: "Pain and suffering are always inevitable for a large intelligence and a deep heart. The really great men must, I think, have great sadness on earth.", w: "Crime and Punishment", y: "1866", who: "Raskolnikov" },
    { q: "Taking a new step, uttering a new word, is what people fear most.", w: "Crime and Punishment", y: "1866", who: "Raskolnikov" },
    { q: "Power is given only to him who dares to stoop and take it… one must have the courage to dare.", w: "Crime and Punishment", y: "1866", who: "Raskolnikov" },
    { q: "I did not bow down to you, I bowed down to all the suffering of humanity.", w: "Crime and Punishment", y: "1866", who: "Raskolnikov to Sonia" },
    { q: "I murdered myself, not her. I crushed myself once for all, forever.", w: "Crime and Punishment", y: "1866", who: "Raskolnikov" },
    { q: "To go wrong in one's own way is better than to go right in someone else's.", w: "Crime and Punishment", y: "1866", who: "Razumikhin" },
    { q: "It takes something more than intelligence to act intelligently.", w: "Crime and Punishment", y: "1866", who: "Razumikhin" },
    { q: "Man grows used to everything, the scoundrel!", w: "Crime and Punishment", y: "1866", who: "Raskolnikov" },
    { q: "What do you think, would not one tiny crime be wiped out by thousands of good deeds?", w: "Crime and Punishment", y: "1866", who: "a student, overheard" },

    // --- Notes from Underground (1864) ---
    { q: "I am a sick man… I am a spiteful man. I am an unattractive man.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "I say let the world go to hell, but I should always have my tea.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "Twice two makes four is an excellent thing, but twice two makes five is sometimes a very charming little thing too.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "To be too conscious is an illness — a real, thorough-going illness.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "Man is sometimes extraordinarily, passionately, in love with suffering.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "The best definition of man is: a being that goes on two legs and is ungrateful.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },
    { q: "What man wants is simply independent choice, whatever that independence may cost and wherever it may lead.", w: "Notes from Underground", y: "1864", who: "The Underground Man" },

    // --- The Idiot (1869) ---
    { q: "Beauty will save the world.", w: "The Idiot", y: "1869", who: "attributed to Prince Myshkin" },
    { q: "It is better to be unhappy and know the worst, than to be happy in a fool's paradise.", w: "The Idiot", y: "1869" },
    { q: "The soul is healed by being with children.", w: "The Idiot", y: "1869", who: "Prince Myshkin" },
    { q: "Compassion was the chief law of human existence.", w: "The Idiot", y: "1869", who: "Prince Myshkin" },
    { q: "There is no happiness in comfort; happiness is bought with suffering.", w: "The Idiot", y: "1869", who: "Ippolit" },
    { q: "To love is to suffer and there can be no love otherwise.", w: "The Idiot", y: "1869" },

    // --- The Brothers Karamazov (1880) ---
    { q: "The awful thing is that beauty is mysterious as well as terrible. God and the devil are fighting there, and the battlefield is the heart of man.", w: "The Brothers Karamazov", y: "1880", who: "Dmitri" },
    { q: "Above all, don't lie to yourself. The man who lies to himself and listens to his own lie comes to a point where he cannot distinguish the truth within him, or around him.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },
    { q: "What is hell? I maintain that it is the suffering of being no longer able to love.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },
    { q: "Love all God's creation, the whole of it and every grain of sand. Love every leaf, every ray of God's light.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },
    { q: "Every one of us is responsible to all men for all and everything, not merely through the general sinfulness of creation, but each one personally for all mankind.", w: "The Brothers Karamazov", y: "1880", who: "Zosima / Markel" },
    { q: "Active love is a harsh and fearful thing compared with love in dreams.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },
    { q: "The mystery of human existence lies not in just staying alive, but in finding something to live for.", w: "The Brothers Karamazov", y: "1880" },
    { q: "Man, do not pride yourself on superiority to the animals; they are without sin, and you, with your greatness, defile the earth.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },
    { q: "It is not miracles that bring a realist to faith. The genuine realist, if he is an unbeliever, will always find strength to disbelieve in the miraculous.", w: "The Brothers Karamazov", y: "1880", who: "on Alyosha" },
    { q: "Sarcasm is the last refuge of modest and chaste-souled people when the privacy of their soul is coarsely and intrusively invaded.", w: "The Brothers Karamazov", y: "1880" },
    { q: "If everyone is responsible, then so am I — and we shall water the earth with our tears.", w: "The Brothers Karamazov", y: "1880", who: "after Zosima" },
    { q: "Much on earth is hidden from us, but to make up for that we have been given a precious mystic sense of our living bond with the other world.", w: "The Brothers Karamazov", y: "1880", who: "Zosima" },

    // --- Demons / The Possessed (1872) ---
    { q: "To make the truth more plausible, it's absolutely necessary to mix a bit of falsehood with it.", w: "Demons", y: "1872" },
    { q: "It seems as though the second half of a man's life is made up of nothing but the habits he has accumulated during the first half.", w: "Demons", y: "1872", who: "Stepan Verkhovensky" },
    { q: "God is necessary, and so must exist… but I know that He doesn't and can't.", w: "Demons", y: "1872", who: "Kirillov" },
    { q: "Fear of an enemy destroys spite against him.", w: "Demons", y: "1872" },

    // --- The Gambler (1867) ---
    { q: "All it would take is to stand firm just once, and I can change my whole destiny in a single hour.", w: "The Gambler", y: "1867", who: "Alexei Ivanovich" },
    { q: "People really do like seeing their best friends humiliated; a large part of friendship is based on humiliation.", w: "The Gambler", y: "1867" },

    // --- White Nights (1848) ---
    { q: "My God, a whole moment of bliss! Is that too little for the whole of a man's life?", w: "White Nights", y: "1848", who: "The Dreamer" },
    { q: "I am a dreamer. I know so little of real life that I just can't help re-living such moments as these in my dreams.", w: "White Nights", y: "1848", who: "The Dreamer" },
    { q: "May your sky be clear, may your sweet smile be bright and happy — be blessed for the moment of bliss you gave to another lonely, grateful heart.", w: "White Nights", y: "1848", who: "The Dreamer" },

    // --- The House of the Dead (1862) ---
    { q: "Man is a creature that can get used to anything, and I think that is the best definition of him.", w: "The House of the Dead", y: "1862" },
    { q: "Tyranny is a habit; it has its own organic life and develops finally into a disease.", w: "The House of the Dead", y: "1862" },
    { q: "Without some goal and some effort to reach it, no man can live.", w: "The House of the Dead", y: "1862" },
    { q: "Life without hope is no life at all.", w: "The House of the Dead", y: "1862" },

    // --- The Insulted and Humiliated (1861) ---
    { q: "If you want to be respected by others, the great thing is to respect yourself.", w: "The Insulted and Humiliated", y: "1861" },

    // --- Letters ---
    { q: "Man is a mystery. It must be solved, and if you spend your whole life solving it, do not say you have wasted time. I occupy myself with this mystery, because I want to be a man.", w: "Letter to his brother", y: "1839", who: "Letter" },
    { q: "Life is a gift, life is happiness, every minute might have been an eternity of happiness.", w: "Letter after his reprieve", y: "1849", who: "Letter to Mikhail" },
  ];
  const ARCHIVE_WORKS = ["All", "Crime and Punishment", "The Brothers Karamazov", "Notes from Underground", "The Idiot", "Demons", "The Gambler", "White Nights", "The House of the Dead", "Letters"];
  function initArchive() {
    const grid = document.getElementById("qGrid");
    if (!grid) return;
    const input = document.getElementById("qSearch");
    const clear = document.getElementById("qClear");
    const count = document.getElementById("qCount");
    const empty = document.getElementById("qEmpty");
    const filtersEl = document.getElementById("qFilters");
    const toast = document.getElementById("toast");
    const isLetter = (w) => w.startsWith("Letter");
    filtersEl.innerHTML = ARCHIVE_WORKS.map((w, i) =>
      `<button data-w="${w}"${i === 0 ? ' class="active"' : ""}>${w === "All" ? "ALL" : w}</button>`).join("");

    let filter = "All", query = "";
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    function hi(text, q) {
      if (!q) return text;
      try { return text.replace(new RegExp("(" + esc(q) + ")", "ig"), "<mark>$1</mark>"); } catch (e) { return text; }
    }
    function matchWork(d) {
      if (filter === "All") return true;
      if (filter === "Letters") return isLetter(d.w);
      return d.w === filter;
    }
    function render() {
      const q = query.trim().toLowerCase();
      const items = ARCHIVE.filter((d) => matchWork(d) &&
        (!q || d.q.toLowerCase().includes(q) || d.w.toLowerCase().includes(q) || (d.who || "").toLowerCase().includes(q)));
      grid.innerHTML = items.map((d) => `
        <button class="qcard" data-q="${d.q.replace(/"/g, "&quot;")}" data-w="${d.w}">
          <p class="qcard__q">“${hi(d.q, query.trim())}”</p>
          <div class="qcard__meta"><span class="qcard__work">${d.w}</span><span class="qcard__year">${d.y}</span></div>
          ${d.who ? `<div class="qcard__who">— ${d.who}</div>` : ""}
          <div class="qcard__copy">CLICK TO COPY ⧉</div>
        </button>`).join("");
      count.textContent = `${items.length} of ${ARCHIVE.length} quotations` + (filter !== "All" ? ` · ${filter}` : "") + (q ? ` · “${query.trim()}”` : "");
      empty.hidden = items.length > 0;
      grid.querySelectorAll(".qcard").forEach((b) => b.addEventListener("click", () => {
        const text = `“${b.dataset.q}” — Dostoevsky, ${b.dataset.w}`;
        const done = () => { toast.textContent = "Copied to clipboard"; toast.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove("show"), 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
        else done();
      }));
    }
    filtersEl.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.w; filtersEl.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); render();
    }));
    let deb;
    input.addEventListener("input", () => { query = input.value; clearTimeout(deb); deb = setTimeout(render, 90); });
    clear.addEventListener("click", () => { input.value = ""; query = ""; input.focus(); render(); });
    render();
  }

  /* ---------------------------------------------------------
     BOOK WALKTHROUGHS — synopsis, philosophy, cast, graph, quotes
     (content cross-checked against public references for accuracy)
  --------------------------------------------------------- */
  function illusSVG(key) {
    const G = '#c8a24a', R = '#b3160f', C = '#ece4d2';
    const s = `stroke="${G}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
    if (key === "underground") return `<svg viewBox="0 0 200 200">
      <path d="M40 180 V70 a60 60 0 0 1 120 0 V180" ${s}/>
      <path d="M64 180 V86 a36 36 0 0 1 72 0 V180" ${s} opacity=".6"/>
      <path d="M88 180 V104 a12 12 0 0 1 24 0 V180" ${s} opacity=".4"/>
      <path d="M30 180 H170" ${s}/><circle cx="100" cy="150" r="3" fill="${R}"/></svg>`;
    if (key === "axe") return `<svg viewBox="0 0 200 200">
      <path d="M70 168 L120 60" ${s}/>
      <path d="M112 44 q40 6 44 44 q-34 -6 -56 14 q-2 -38 12 -58z" ${s} fill="rgba(200,162,74,.08)"/>
      <circle cx="60" cy="150" r="5" fill="${R}"/><circle cx="74" cy="158" r="3" fill="${R}" opacity=".6"/></svg>`;
    if (key === "idiot") return `<svg viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="52" ${s}/>
      <circle cx="100" cy="100" r="68" ${s} opacity=".4" stroke-dasharray="3 7"/>
      <path d="M100 30 V170 M30 100 H170" ${s} opacity=".5"/>
      <circle cx="100" cy="100" r="10" fill="${R}"/></svg>`;
    if (key === "demons") {
      let b = ""; for (let i = 0; i < 9; i++) { const x = 40 + (i * 37 % 130), y = 40 + (i * 53 % 120); b += `<path d="M${x} ${y} q8 -8 16 0 q8 -8 16 0" ${s} opacity="${0.4 + (i % 3) * 0.2}"/>`; }
      return `<svg viewBox="0 0 200 200">${b}<circle cx="100" cy="120" r="4" fill="${R}"/></svg>`;
    }
    if (key === "cross") return `<svg viewBox="0 0 200 200">
      <g ${s}><path d="M100 28 V176"/><path d="M70 60 H130"/><path d="M58 92 H142"/><path d="M78 140 L122 116"/></g>
      <circle cx="100" cy="92" r="58" ${s} opacity=".25" stroke-dasharray="2 8"/>
      <circle cx="100" cy="92" r="6" fill="${R}"/></svg>`;
    // roulette
    let spokes = ""; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; spokes += `<line x1="100" y1="100" x2="${100 + Math.cos(a) * 60}" y2="${100 + Math.sin(a) * 60}" ${s} opacity=".5"/><circle cx="${100 + Math.cos(a) * 52}" cy="${100 + Math.sin(a) * 52}" r="4" fill="${i % 2 ? R : G}"/>`; }
    return `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="64" ${s}/><circle cx="100" cy="100" r="40" ${s} opacity=".6"/>${spokes}<circle cx="100" cy="100" r="6" fill="${C}"/></svg>`;
  }

  const BOOKS = {
    underground: { ru: "ЗАПИСКИ ИЗ ПОДПОЛЬЯ", title: "Notes from\nUnderground", year: "1864", archive: "Notes from Underground", illus: "underground",
      tag: "“I am a sick man… I am a spiteful man.”",
      walk: [
        "Part One is the monologue of a nameless retired civil servant — the Underground Man — writing from a squalid room in St. Petersburg. Spiteful, brilliant and self-lacerating, he tears into the 'rational egoism' of his age: the faith that, shown their true interests, people will act reasonably.",
        "He insists instead that a human being will choose suffering, caprice, even self-destruction, simply to prove he is free and not a 'piano-key' played by the laws of nature. Reason is only one faculty; the will is the whole man.",
        "Part Two, 'Apropos of the Wet Snow', puts the theory in flesh: a humiliating dinner with old schoolfellows, and his cruel-then-tender-then-cruel treatment of the young prostitute Liza, whose offered love he cannot bear to accept.",
      ],
      phil: [
        { h: "Against the Crystal Palace", p: "A direct satire of utopian rationalism: even in a perfectly rational society, man would smash it just to assert that he is free." },
        { h: "Twice two makes five", p: "Freedom matters more than arithmetic. 'Two times two is four' is the death of will; man craves the right to want the irrational." },
        { h: "Consciousness as illness", p: "To be hyper-aware is to be paralysed — able only to brood, never to act. Spite becomes the proof that one is still alive." },
        { h: "The cruelty of ideals", p: "Liza shows that an abstract love of humanity collapses the moment a real, vulnerable person asks to be loved." },
      ],
      cast: [
        { name: "The Underground Man", role: "Narrator", desc: "A nameless, bitter ex-official; brilliant, paralysed and at war with himself." },
        { name: "Liza", role: "A young prostitute", desc: "Answers his contempt with genuine feeling; his inability to accept it is his deepest defeat." },
        { name: "Zverkov", role: "Officer", desc: "A vain former schoolmate whose farewell dinner the narrator gate-crashes and ruins." },
        { name: "Simonov", role: "Old schoolfellow", desc: "A reluctant acquaintance the narrator clings to and borrows money from." },
        { name: "Apollon", role: "His servant", desc: "A silent, contemptuous presence with whom he wages domestic war." },
      ],
      rel: [[0, 1, "tenderness he destroys"], [0, 2, "envy & humiliation"], [0, 3, "borrowed money"], [0, 4, "domestic warfare"]] },

    cp: { ru: "ПРЕСТУПЛЕНИЕ И НАКАЗАНИЕ", title: "Crime and\nPunishment", year: "1866", archive: "Crime and Punishment", illus: "axe",
      tag: "Conscience is the slowest, surest punishment.",
      walk: [
        "Rodion Raskolnikov, a destitute ex-student in St. Petersburg, murders a rapacious pawnbroker — and, unplanned, her gentle sister Lizaveta — to test a theory: that 'extraordinary' men may step over moral law for a higher purpose.",
        "The crime brings him no freedom, only fever, isolation and dread. The magistrate Porfiry Petrovich circles him not with evidence but with psychology, while Sonya — forced into prostitution to feed her family — becomes the one soul he can confess to.",
        "His sister Dunya is pursued by the scoundrel Luzhin and the depraved, lucid Svidrigailov. In the end it is not logic but Sonya's faith and love that draw Raskolnikov toward confession and the long road of expiation in Siberia.",
      ],
      phil: [
        { h: "The extraordinary-man theory", p: "Raskolnikov's article: a Napoleon may shed blood for history's sake. The novel dismantles the idea from the inside." },
        { h: "Conscience over law", p: "The real punishment is not the sentence but the self; guilt works on him long before the police do." },
        { h: "Redemption through suffering", p: "Salvation comes not by reason but by humbling oneself, confessing, and accepting suffering alongside Sonya." },
        { h: "The double", p: "Svidrigailov is Raskolnikov's dark mirror — the same will to power, followed all the way to despair and suicide." },
      ],
      cast: [
        { name: "Raskolnikov", role: "Ex-student", desc: "Proud, impoverished, intellectual; murders to prove a theory and is destroyed by it." },
        { name: "Sonya", role: "His redeemer", desc: "Driven to prostitution by poverty yet luminous with faith; hears his confession and follows him to Siberia." },
        { name: "Porfiry", role: "Magistrate", desc: "The investigator who plays a patient psychological game, certain of Raskolnikov's guilt." },
        { name: "Dunya", role: "His sister", desc: "Strong and principled; courted by Luzhin and menaced by Svidrigailov." },
        { name: "Razumikhin", role: "His friend", desc: "Warm, loyal and energetic; cares for Rodion and loves Dunya." },
        { name: "Svidrigailov", role: "His dark double", desc: "A sensualist haunted by his crimes — the theory's nihilistic endpoint." },
        { name: "Marmeladov", role: "Sonya's father", desc: "A ruined drunkard whose self-pity opens the novel's world of the poor." },
      ],
      rel: [[0, 1, "confession & love"], [0, 2, "cat & mouse"], [0, 3, "brother & sister"], [4, 3, "love"], [3, 5, "pursued by"], [1, 6, "daughter & father"], [0, 5, "dark mirror"], [0, 4, "friendship"]] },

    idiot: { ru: "ИДИОТ", title: "The Idiot", year: "1869", archive: "The Idiot", illus: "idiot",
      tag: "“Beauty will save the world.”",
      walk: [
        "Prince Lev Myshkin, an epileptic of childlike honesty, returns to Russia after years in a Swiss sanatorium. His radical innocence — Dostoevsky's attempt at a 'positively beautiful man' — both disarms and destabilises a society built on money, vanity and cruelty.",
        "He is caught between two women: the proud, 'fallen' Nastasya Filippovna, whom he loves out of compassion, and the bright Aglaya, who loves him. The merchant Rogozhin loves Nastasya with a violent, possessive passion.",
        "Goodness in a corrupt world cannot save it; it is consumed by it. The novel ends in catastrophe — Rogozhin murders Nastasya, and Myshkin's mind collapses back into 'idiocy'.",
      ],
      phil: [
        { h: "Beauty will save the world", p: "Myshkin embodies the question: can compassion and beauty redeem a fallen world? The novel answers with anguish, not comfort." },
        { h: "The Christlike man", p: "A flawed Christ figure — pure, truthful, socially 'an idiot' — destroyed by the very world he might heal." },
        { h: "Compassion vs. passion", p: "Myshkin's pity for Nastasya collides with Rogozhin's devouring love and Aglaya's wounded pride." },
        { h: "Holbein's Dead Christ", p: "A painting of Christ's corpse, so brutally human it 'could make a man lose his faith', haunts the novel's argument about belief." },
      ],
      cast: [
        { name: "Prince Myshkin", role: "The 'idiot'", desc: "Epileptic, guileless, compassionate; a 'positively beautiful' soul among predators." },
        { name: "Nastasya F.", role: "The wronged beauty", desc: "Proud and self-destructive, branded a 'fallen woman'; the object of pity and passion." },
        { name: "Rogozhin", role: "Merchant's heir", desc: "Loves Nastasya with a dark, jealous violence that ends in murder." },
        { name: "Aglaya", role: "General's daughter", desc: "Spirited and proud; loves Myshkin but cannot share him with his pity." },
        { name: "Ganya", role: "Ambitious clerk", desc: "Torn between money and dignity in the scramble around Nastasya." },
        { name: "Lebedyev", role: "A schemer", desc: "A buffoonish, scripture-quoting opportunist orbiting the drama." },
      ],
      rel: [[0, 1, "compassion"], [0, 3, "love"], [2, 1, "fatal passion"], [0, 2, "brothers & rivals"], [4, 1, "courted for money"], [3, 1, "rivals"]] },

    demons: { ru: "БЕСЫ", title: "Demons", year: "1872", archive: "Demons", illus: "demons",
      tag: "Ideas, untethered from God, possess men like demons.",
      walk: [
        "In a provincial town a cell of would-be revolutionaries gathers around two men: the magnetic, morally hollow aristocrat Nikolai Stavrogin, and the cynical agitator Pyotr Verkhovensky, who dreams of destruction as the road to power.",
        "To bind the group in blood, Pyotr engineers the murder of Shatov — a former radical who has turned to Russian faith — and frames it as the suicide of Kirillov, an engineer obsessed with becoming 'man-god' by killing himself to prove his absolute freedom.",
        "Modelled partly on a real political murder, the novel is Dostoevsky's prophecy of nihilism and ideological terror: ideas, cut loose from God and conscience, enter men like the demons of its Gospel epigraph and drive them — and their society — to ruin.",
      ],
      phil: [
        { h: "Nihilism as possession", p: "The epigraph — the Gadarene swine — frames radical ideas as demons that enter and destroy their hosts and the body politic." },
        { h: "If there is no God…", p: "Kirillov's logic: without God, man must become god, and prove it by willing his own death. Freedom curdles into self-annihilation." },
        { h: "Shigalyovism", p: "A chilling parody of utopian politics: 'unlimited freedom' arriving, in practice, as unlimited despotism." },
        { h: "The hollow centre", p: "Stavrogin can inspire faith, atheism, love and murder in others while believing nothing himself — charisma without a soul." },
      ],
      cast: [
        { name: "Stavrogin", role: "The hollow idol", desc: "Beautiful, brilliant, morally empty; everyone projects their faith or nihilism onto him." },
        { name: "Pyotr V.", role: "The agitator", desc: "A ruthless, manipulative revolutionary who orchestrates the conspiracy and the murder." },
        { name: "Stepan V.", role: "The old liberal", desc: "Pyotr's father; a vain 1840s idealist whose ideas seeded his son's nihilism." },
        { name: "Shatov", role: "The convert", desc: "A former radical turned to Russian Orthodoxy and 'the people'; murdered by the cell." },
        { name: "Kirillov", role: "The engineer", desc: "Obsessed with suicide as the ultimate act of free will and man-godhood." },
        { name: "Varvara P.", role: "Stavrogin's mother", desc: "Imperious patroness of Stepan and the social pivot of the town." },
      ],
      rel: [[1, 0, "wants as figurehead"], [1, 3, "murders"], [1, 4, "exploits suicide of"], [1, 2, "son & father"], [2, 5, "patron & dependent"], [0, 5, "mother & son"], [3, 4, "old companions"]] },

    bk: { ru: "БРАТЬЯ КАРАМАЗОВЫ", title: "The Brothers\nKaramazov", year: "1880", archive: "The Brothers Karamazov", illus: "cross",
      tag: "Faith, doubt, and a father's murder.",
      walk: [
        "The dissolute landowner Fyodor Pavlovich Karamazov and his sons embody warring parts of the Russian soul: sensual Dmitri, the atheist intellectual Ivan, the gentle novice Alyosha, and the resentful illegitimate servant Smerdyakov.",
        "Father and eldest son clash over money and over Grushenka, while Dmitri's fiancée Katerina becomes entangled with Ivan. When Fyodor is murdered, Dmitri is accused — but it is Smerdyakov who killed him, acting on Ivan's idea that 'if there is no God, everything is permitted'.",
        "Around the crime Dostoevsky builds his deepest argument about God, freedom and suffering — Ivan's 'Rebellion' and 'The Grand Inquisitor', answered by the elder Zosima's gospel of active love and universal responsibility.",
      ],
      phil: [
        { h: "The Grand Inquisitor", p: "Ivan's poem: a returning Christ is arrested by the Church, which has 'corrected' his gift of freedom because men prefer miracle, mystery and authority — bread over liberty." },
        { h: "If there is no God…", p: "Ivan's idea that without immortality 'everything is permitted' becomes the loaded gun that Smerdyakov fires." },
        { h: "The suffering of children", p: "Ivan 'returns his ticket': no future harmony can justify the torture of a single innocent child — the hardest objection to faith in the book." },
        { h: "Active love", p: "Zosima's answer: not abstract ideals but concrete, humbling love, and the conviction that each is 'responsible to all, for all'." },
      ],
      cast: [
        { name: "Fyodor Pavlovich", role: "The father", desc: "A buffoonish, lecherous landowner whose murder drives the plot." },
        { name: "Dmitri (Mitya)", role: "Eldest son", desc: "Passionate, impulsive, generous; rivals his father for Grushenka and is wrongly convicted." },
        { name: "Ivan", role: "Middle son", desc: "Brilliant atheist; his ideas inspire the murder and then torment his conscience." },
        { name: "Alyosha", role: "Youngest son", desc: "A novice monk and the novel's heart; disciple of the elder Zosima." },
        { name: "Smerdyakov", role: "Illegitimate son / servant", desc: "Resentful and cunning; the actual murderer, who internalises Ivan's logic." },
        { name: "Grushenka", role: "The contested woman", desc: "Loved by both Fyodor and Dmitri; proud, wounded, finally redemptive." },
        { name: "Katerina", role: "Dmitri's fiancée", desc: "Noble and self-dramatising; bound to Dmitri yet drawn to Ivan." },
        { name: "Zosima", role: "The elder", desc: "A dying monk whose teaching of active love answers Ivan's rebellion." },
      ],
      rel: [[0, 1, "father & rival"], [0, 4, "father & murderer"], [1, 5, "love"], [0, 5, "rivalry over"], [1, 6, "engaged"], [2, 6, "drawn together"], [2, 4, "idea & instrument"], [3, 7, "disciple & elder"], [2, 3, "doubt & faith"]] },

    gambler: { ru: "ИГРОК", title: "The Gambler", year: "1867", archive: "The Gambler", illus: "roulette",
      tag: "Addiction as a substitute for love and will.",
      walk: [
        "Dictated in a frantic 26 days to pay off Dostoevsky's own gambling debts, the novella follows Alexei Ivanovich, a tutor in the household of a ruined Russian General abroad, consumed by two passions: roulette and the General's haughty stepdaughter, Polina.",
        "The family awaits the death of a rich grandmother — 'la Baboulinka' — only for her to arrive in person and gamble the inheritance away at the tables before their eyes, while Mademoiselle Blanche and the Frenchman des Grieux circle the General's money.",
        "Alexei wins a fortune and loses Polina, and himself, to the spin of the wheel — a precise, autobiographical study of addiction as a substitute for love, will and meaning.",
      ],
      phil: [
        { h: "Chance as a god", p: "The wheel offers the illusion of sudden destiny — a way to seize fate 'in a single hour' without patience or virtue." },
        { h: "Addiction & will", p: "A clinical self-portrait: the gambler knows the odds are against him and plays anyway, mistaking compulsion for freedom." },
        { h: "Love and humiliation", p: "Alexei's love for Polina is bound up with submission and humiliation — the same surrender the tables demand." },
        { h: "The Russian abroad", p: "A satirical x-ray of Russians, French and Germans in the spa towns: money, manners and national character on display." },
      ],
      cast: [
        { name: "Alexei", role: "Tutor / narrator", desc: "Proud and obsessive; in love first with Polina, then with the wheel." },
        { name: "Polina", role: "The General's stepdaughter", desc: "Proud and enigmatic; Alexei's love and his torment." },
        { name: "The General", role: "His employer", desc: "A vain, ruined man waiting on an inheritance and infatuated with Blanche." },
        { name: "Grandmother", role: "The rich aunt ('Babulinka')", desc: "Arrives alive and gambles the awaited fortune away at roulette." },
        { name: "Mlle Blanche", role: "Adventuress", desc: "A Frenchwoman pursuing the General's expected money." },
        { name: "Mr. Astley", role: "English friend", desc: "A steady, decent Englishman who quietly loves Polina." },
      ],
      rel: [[0, 1, "love & torment"], [0, 5, "friendship"], [2, 4, "infatuation"], [2, 3, "awaited inheritance"], [1, 5, "quiet devotion"], [0, 2, "tutor & employer"]] },
  };

  function buildGraph(host, cast, rel) {
    const NS = "http://www.w3.org/2000/svg";
    const W = 600, H = 460, cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.36;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const pos = cast.map((_, i) => {
      const a = -Math.PI / 2 + (i / cast.length) * Math.PI * 2;
      return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
    });
    const edges = [];
    rel.forEach(([a, b, label]) => {
      if (!pos[a] || !pos[b]) return;
      const line = document.createElementNS(NS, "line");
      line.setAttribute("x1", pos[a].x); line.setAttribute("y1", pos[a].y);
      line.setAttribute("x2", pos[b].x); line.setAttribute("y2", pos[b].y);
      line.setAttribute("class", "edge"); svg.appendChild(line);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", (pos[a].x + pos[b].x) / 2); t.setAttribute("y", (pos[a].y + pos[b].y) / 2 - 4);
      t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "elabel"); t.textContent = label;
      svg.appendChild(t);
      edges.push({ a, b, line, t });
    });
    const nodes = cast.map((c, i) => {
      const g = document.createElementNS(NS, "g"); g.setAttribute("class", "bm-node");
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", pos[i].x); circle.setAttribute("cy", pos[i].y); circle.setAttribute("r", 9);
      const label = document.createElementNS(NS, "text");
      const outward = pos[i].y < cy ? -16 : 22;
      label.setAttribute("x", pos[i].x); label.setAttribute("y", pos[i].y + outward);
      label.textContent = c.name;
      g.appendChild(circle); g.appendChild(label); svg.appendChild(g);
      const hot = () => {
        nodes.forEach((n, k) => n.classList.toggle("dim", k !== i));
        edges.forEach((e) => {
          const on = e.a === i || e.b === i;
          e.line.classList.toggle("hot", on); e.t.classList.toggle("hot", on);
          if (on) { nodes[e.a].classList.remove("dim"); nodes[e.b].classList.remove("dim"); }
        });
        g.classList.add("hot");
      };
      const cool = () => {
        nodes.forEach((n) => n.classList.remove("dim", "hot"));
        edges.forEach((e) => { e.line.classList.remove("hot"); e.t.classList.remove("hot"); });
      };
      g.addEventListener("mouseenter", hot);
      g.addEventListener("mouseleave", cool);
      g.addEventListener("click", hot);
      return g;
    });
    host.innerHTML = "";
    host.appendChild(svg);
    const hint = document.createElement("div");
    hint.className = "bm-graph__hint"; hint.textContent = "HOVER A NAME TO TRACE THEIR BONDS";
    host.appendChild(hint);
  }

  function openBook(id) {
    const b = BOOKS[id]; if (!b) return;
    const modal = document.getElementById("bookModal");
    const body = document.getElementById("bookBody");
    const quotes = ARCHIVE.filter((q) => q.w === b.archive).slice(0, 8);
    body.innerHTML = `
      <div class="bm-hero">
        <div class="bm-hero__text">
          <div class="bm-ru">${b.ru}</div>
          <h2 class="bm-title">${b.title.replace(/\n/g, "<br/>")}</h2>
          <div class="bm-year">FYODOR DOSTOEVSKY · ${b.year}</div>
          <p class="bm-tag">${b.tag}</p>
        </div>
        <div class="bm-illus">${illusSVG(b.illus)}</div>
      </div>
      <div class="bm-sec bm-walk"><div class="bm-sec__h">THE WALKTHROUGH</div>${b.walk.map((p) => `<p>${p}</p>`).join("")}</div>
      <div class="bm-sec"><div class="bm-sec__h">THE PHILOSOPHY</div>
        <div class="bm-phil">${b.phil.map((x) => `<div><h4>${x.h}</h4><p>${x.p}</p></div>`).join("")}</div></div>
      <div class="bm-sec"><div class="bm-sec__h">THE CAST</div>
        <div class="bm-cast">${b.cast.map((c) => `<div class="bm-char"><b>${c.name}</b><span>${c.role}</span><p>${c.desc}</p></div>`).join("")}</div></div>
      <div class="bm-sec"><div class="bm-sec__h">INTERACTIONS &amp; BONDS</div>
        <div class="bm-graph" id="bmGraph"></div></div>
      <div class="bm-sec"><div class="bm-sec__h">POPULAR QUOTES</div>
        <div class="bm-quotes">${quotes.map((q) => `<div><blockquote>“${q.q}”</blockquote><cite>${q.who ? q.who + " · " : ""}${b.title.replace(/\n/g, " ")}</cite></div>`).join("")}</div></div>`;
    buildGraph(document.getElementById("bmGraph"), b.cast, b.rel);
    modal.scrollTop = 0;
    modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function closeBook() {
    const modal = document.getElementById("bookModal");
    modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lenis) lenis.start();
  }
  function initBooks() {
    const back = document.getElementById("bookBack");
    if (back) back.addEventListener("click", closeBook);
    addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("bookModal").classList.contains("open")) closeBook();
    });
  }

  /* ---------------------------------------------------------
     DOSTOEVSKY'S SLAMBOOK (Y2K)  — bio is real; a couple of
     answers are knowing anachronistic gags (marked with 🎧)
  --------------------------------------------------------- */
  const SLAM_FIELDS = [
    { q: "Full name", a: "Fyodor Mikhailovich Dostoevsky" },
    { q: "Goes by", a: "Fedya ♡", heart: true },
    { q: "B-day", a: "Nov 11, 1821 ⭐ (Scorpio, obviously)" },
    { q: "Hometown", a: "Moscow — born in a hospital for the poor" },
    { q: "Skool", a: "Military Engineering Institute, St. Petersburg" },
    { q: "Worst subject", a: "Maths & drafting. Became an engineer. Quit. Sorry dad." },
    { q: "BFF 4 lyfe", a: "my big brother Mikhail" },
    { q: "Crush", a: "Anna G. — took my dictation in 26 days, then married me ♡♡", heart: true },
    { q: "Fav author", a: "Pushkin 4ever · \"we all crawled out of Gogol's Overcoat\"" },
    { q: "Fav book", a: "the Gospels (smuggled it through Siberia)" },
    { q: "Hobbies", a: "roulette 🎰 (do NOT lend me money), night walks" },
    { q: "Biggest fear", a: "the firing squad (ask me about 1849…) + my fits" },
    { q: "Dream job", a: "NOVELIST. obviously." },
    { q: "Fav band", a: "anything in a minor key 🎧 (ok fine — Linkin Park gets the Underground)" },
    { q: "Life motto", a: "\"Above all, don't lie to yourself.\"" },
    { q: "Most likely to", a: "write 800 pages about ONE murder" },
    { q: "Hottest take", a: "twice two makes FIVE is sometimes a very charming thing" },
    { q: "Catchphrase", a: "beauty will save the world (the rest of u… doomed)" },
  ];
  const SLAM_DOODLES = [
    { svg: "♡", x: "4%", y: "8%", s: 38, c: "#ff3db4" },
    { svg: "✟", x: "92%", y: "12%", s: 30, c: "#5a1e9e" },
    { svg: "★", x: "88%", y: "70%", s: 34, c: "#ffd54a" },
    { svg: "☠", x: "7%", y: "74%", s: 32, c: "#241046" },
    { svg: "ПОДПОЛЬЕ 4EVER", x: "50%", y: "4%", s: 16, c: "#d6006e", text: true },
    { svg: "✦", x: "20%", y: "44%", s: 22, c: "#00d0ff" },
  ];
  const SLAM_SIGNERS = ["Rodya wuz here ♡", "Alyosha ✟", "Sonya ☆", "Mitya 🎲", "Ivan (skeptical)", "the Underground Man — anon.", "Prince M. :)", "Grushenka 💋", "Razumikhin!!", "Smerdyakov 👀"];

  // curated REAL Y Combinator companies, labelled by Fyodor
  const YC = [
    { n: "Airbnb", w: "rent a stranger's home", l: "Strangers sleeping in strangers' beds — the whole earth is now The House of the Dead, but with five-star reviews." },
    { n: "Stripe", w: "payments API", l: "They have made it frictionless to move money. Raskolnikov could simply have charged a subscription." },
    { n: "Dropbox", w: "file storage", l: "A place to keep what you cannot bear to lose — and will lose anyway." },
    { n: "Coinbase", w: "crypto exchange", l: "A casino dressed as a cathedral. The Gambler would mortgage his soul by Tuesday." },
    { n: "DoorDash", w: "food delivery", l: "A man too proud to leave his room, fed by a man too poor to refuse. I already wrote this novel." },
    { n: "Reddit", w: "forums", l: "Ten thousand Underground Men in one cellar, voting on their own humiliation." },
    { n: "Twitch", w: "live streaming", l: "The crowd watches one man play and feels it has lived. Vanity, vanity." },
    { n: "Instacart", w: "grocery delivery", l: "Penance, delivered in thirty minutes or less." },
    { n: "Cruise", w: "self-driving cars", l: "A carriage that drives itself — at last, no coachman to flog in my dreams." },
    { n: "GitLab", w: "code collaboration", l: "A confession booth for code: every sin logged, and every sin revertible. If only souls had branches." },
    { n: "Gusto", w: "payroll", l: "They tend the clerk's small wages. Akaky Akakievich would have wept with gratitude." },
    { n: "Brex", w: "corporate cards", l: "Credit without conscience — my favourite kind of credit." },
    { n: "Zapier", w: "app automation", l: "It connects all things to all things. I connected guilt to punishment and needed no integration." },
    { n: "Docker", w: "containers", l: "Each process sealed in its own container, isolated, reproducible — the modern soul, shipped." },
    { n: "Heroku", w: "cloud platform", l: "It deploys your dreams to the cloud, where they belong: aloft, and unreachable." },
    { n: "Scribd", w: "subscription library", l: "A library you rent but never finish — like a Petersburg winter." },
    { n: "Disqus", w: "comment system", l: "The comments beneath the article: the truest Notes from Underground yet written." },
    { n: "Mixpanel", w: "product analytics", l: "They measure every twitch of the will. Free will — quantified, charted, and sold." },
    { n: "Segment", w: "customer data", l: "They gather the self into data and ship it elsewhere. The double, monetised." },
    { n: "Flexport", w: "freight logistics", l: "Cargo across the whole earth — and somewhere in a container, my manuscripts, lost in transit." },
    { n: "Faire", w: "wholesale marketplace", l: "Beauty for the small shops, sold by the pallet. Beauty will save the world — bulk orders only." },
    { n: "Razorpay", w: "payments (India)", l: "Another gate for money to pass through. The old moneylender, reincarnated as an API." },
    { n: "Ginkgo Bioworks", w: "synthetic biology", l: "They program the living cell as I programmed the soul — and with markedly fewer scruples." },
    { n: "Checkr", w: "background checks", l: "They would never have cleared Raskolnikov for hire. Wise, wise." },
    { n: "Rappi", w: "delivery (LatAm)", l: "Everything delivered, nothing earned — and still the heart is restless." },
    { n: "Weebly", w: "website builder", l: "Now anyone may build a website. Not everyone should. This, too, is pride." },
  ];

  function initSlambook() {
    const fields = document.getElementById("slamFields");
    if (!fields) return;
    fields.innerHTML = SLAM_FIELDS.map((f) =>
      `<div class="field"><b>${f.q}</b><span class="${f.heart ? "heart" : ""}">${f.a}</span></div>`).join("");
    const dood = document.getElementById("slamDoodles");
    dood.innerHTML = SLAM_DOODLES.map((d) =>
      `<span class="slam__doodle" style="left:${d.x};top:${d.y};font-size:${d.s}px;color:${d.c};${d.text ? "font-family:'Permanent Marker',cursive;white-space:nowrap;transform:translateX(-50%) rotate(-4deg);" : ""}">${d.svg}</span>`).join("");
    const signBtn = document.getElementById("slamSign");
    const signers = document.getElementById("slamSigners");
    let i = 0;
    if (signBtn) signBtn.addEventListener("click", () => {
      const s = document.createElement("span");
      s.textContent = " " + SLAM_SIGNERS[i % SLAM_SIGNERS.length] + "  ";
      s.style.cssText = "display:inline-block;transform:rotate(" + ((Math.random() * 10 - 5).toFixed(1)) + "deg);";
      signers.appendChild(s); i++;
    });
    // YC flip cards
    const grid = document.getElementById("ycGrid");
    grid.innerHTML = YC.map((c, k) => `
      <button class="ycc" data-k="${k}" aria-label="${c.n} — tap for verdict">
        <div class="ycc__in">
          <div class="ycc__face ycc__front"><i>YC</i><b>${c.n}</b><span>${c.w}</span><em>tap →</em></div>
          <div class="ycc__face ycc__back"><p>"${c.l}"</p><small>— Fedya</small></div>
        </div>
      </button>`).join("");
    grid.querySelectorAll(".ycc").forEach((b) => b.addEventListener("click", () => b.classList.toggle("flip")));
  }

  let lifeTourScene = null;
  addEventListener("DOMContentLoaded", () => {
    initLenis();
    initCursor();
    drawPrisoners();
    buildWorks();
    initBooks();
    initSlambook();
    buildQuotes();
    buildStations();
    initArchive();

    const s1 = candleScene(document.getElementById("webgl"));
    const s2 = emberScene(document.getElementById("webgl2"));
    lifeTourScene = lifeTour();
    if (s1) scenes.push(s1);
    if (s2) scenes.push(s2);
    if (lifeTourScene) scenes.push(lifeTourScene);
    requestAnimationFrame(loop);

    boot();
  });

  addEventListener("load", () => {
    if (ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 250);
  });
})();
