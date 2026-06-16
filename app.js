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

  let lifeTourScene = null;
  addEventListener("DOMContentLoaded", () => {
    initLenis();
    initCursor();
    drawPrisoners();
    buildWorks();
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
