/* =========================================================
   VANTA DYNAMICS — interactions
   GSAP · ScrollTrigger · Three.js · Lenis
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const hasGSAP = typeof gsap !== "undefined";

  if (hasGSAP && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* -----------------------------------------------------
     1. SMOOTH SCROLL (Lenis) + ScrollTrigger sync
  ----------------------------------------------------- */
  let lenis = null;
  function initLenis() {
    if (prefersReduced || typeof Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on("scroll", () => { if (window.ScrollTrigger) ScrollTrigger.update(); });
    if (hasGSAP) {
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* -----------------------------------------------------
     2. THREE.JS HERO — drifting particle field + wire core
  ----------------------------------------------------- */
  function initThree() {
    const canvas = document.getElementById("webgl");
    if (!canvas || typeof THREE === "undefined") {
      if (canvas) canvas.style.background =
        "radial-gradient(60% 80% at 75% 35%, #11161f, #05060a)";
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05060a, 0.045);

    const camera = new THREE.PerspectiveCamera(
      55, window.innerWidth / window.innerHeight, 0.1, 100
    );
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const group = new THREE.Group();
    scene.add(group);

    /* --- Wireframe icosahedron "core" --- */
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x2de2ff, wireframe: true, transparent: true, opacity: 0.32,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(1.5, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc8ff00, wireframe: true, transparent: true, opacity: 0.55,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    group.add(inner);

    /* --- Particle field --- */
    const COUNT = isMobile ? 1400 : 3200;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 6 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x8a90a0, size: 0.035, transparent: true, opacity: 0.9,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(pGeo, pMat);
    scene.add(points);

    /* --- pointer parallax --- */
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener("pointermove", (e) => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* --- hero scroll fade via ScrollTrigger --- */
    let scrollProg = 0;
    if (hasGSAP && window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        onUpdate: (self) => { scrollProg = self.progress; },
      });
    }

    const clock = new THREE.Clock();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      group.rotation.y = t * 0.12 + pointer.x * 0.4;
      group.rotation.x = pointer.y * 0.25;
      inner.rotation.y = -t * 0.3;
      inner.rotation.z = t * 0.15;

      points.rotation.y = t * 0.02;

      // scroll: pull camera in + sink the group
      camera.position.z = 9 - scrollProg * 3;
      group.position.y = -scrollProg * 4;
      group.scale.setScalar(1 - scrollProg * 0.3);

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // pause when tab hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else animate();
    });
  }

  /* -----------------------------------------------------
     3. PRELOADER
  ----------------------------------------------------- */
  function runPreloader(done) {
    const el = document.getElementById("preloader");
    const num = document.getElementById("loaderNum");
    const bar = document.getElementById("loaderBar");
    const status = document.getElementById("loaderStatus");
    if (!el) { done(); return; }

    const steps = ["INITIALISING SYSTEMS", "CALIBRATING SENSORS", "ARMING AUTONOMY", "FLEET ONLINE"];

    if (prefersReduced || !hasGSAP) {
      el.style.display = "none";
      done();
      return;
    }

    const obj = { v: 0 };
    gsap.to(obj, {
      v: 100,
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate() {
        const v = Math.round(obj.v);
        if (num) num.textContent = v;
        if (bar) bar.style.width = v + "%";
        if (status) status.textContent = steps[Math.min(steps.length - 1, Math.floor(v / 25))];
      },
      onComplete() {
        gsap.to(el, {
          yPercent: -100,
          duration: 0.9,
          ease: "expo.inOut",
          onComplete() { el.style.display = "none"; },
        });
        done();
      },
    });
  }

  /* -----------------------------------------------------
     4. HERO INTRO ANIMATION
  ----------------------------------------------------- */
  function animateHero() {
    if (prefersReduced || !hasGSAP) return;
    const words = document.querySelectorAll(".hero__title .word");
    const fades = document.querySelectorAll(".hero [data-fade]");

    const tl = gsap.timeline({ delay: 0.15 });
    tl.from(words, {
      yPercent: 120,
      duration: 1.1,
      ease: "expo.out",
      stagger: 0.08,
    });
    tl.from(fades, {
      y: 24,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.1,
    }, "-=0.7");
  }

  /* -----------------------------------------------------
     5. SCROLL REVEALS
  ----------------------------------------------------- */
  function splitToLines(el) {
    // wrap each word so we can reveal by clipping; keep <em> tags
    const html = el.innerHTML;
    el.innerHTML = "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    // simple word split preserving inline tags via text nodes
    const frag = document.createDocumentFragment();
    tmp.childNodes.forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((w) => {
          if (w.trim() === "") { frag.appendChild(document.createTextNode(w)); return; }
          const s = document.createElement("span");
          s.className = "rw";
          s.style.display = "inline-block";
          s.textContent = w;
          frag.appendChild(s);
        });
      } else {
        node.classList && node.classList.add("rw");
        node.style && (node.style.display = "inline-block");
        frag.appendChild(node);
      }
    });
    el.appendChild(frag);
    return el.querySelectorAll(".rw");
  }

  function initReveals() {
    if (!hasGSAP || !window.ScrollTrigger) return;

    // word-clip reveal for big statements
    document.querySelectorAll(".reveal-text").forEach((el) => {
      if (prefersReduced) return;
      const words = splitToLines(el);
      gsap.from(words, {
        scrollTrigger: { trigger: el, start: "top 82%" },
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.018,
      });
    });

    // generic card reveals
    gsap.utils.toArray("[data-reveal]").forEach((el, i) => {
      gsap.to(el, {
        scrollTrigger: { trigger: el, start: "top 88%" },
        y: 0, opacity: 1, duration: 1, ease: "power3.out",
        delay: (i % 3) * 0.08,
      });
    });

    // systems rows fade-up
    gsap.utils.toArray("[data-system]").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 85%" },
        y: 50, opacity: 0, duration: 1, ease: "power3.out",
      });
    });

    // section heads
    gsap.utils.toArray(".section-head").forEach((el) => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: "top 90%" },
        x: -20, opacity: 0, duration: 0.8, ease: "power2.out",
      });
    });
  }

  /* -----------------------------------------------------
     6. HORIZONTAL CAPABILITIES SCROLL
  ----------------------------------------------------- */
  function initHorizontal() {
    if (isMobile || prefersReduced || !hasGSAP || !window.ScrollTrigger) return;
    const pin = document.getElementById("capsPin");
    const track = document.getElementById("capsTrack");
    if (!pin || !track) return;

    const getScroll = () => track.scrollWidth - pin.clientWidth + 80;

    gsap.to(track, {
      x: () => -getScroll(),
      ease: "none",
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: () => "+=" + getScroll(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  }

  /* -----------------------------------------------------
     7. STAT COUNTERS
  ----------------------------------------------------- */
  function initStats() {
    if (!hasGSAP || !window.ScrollTrigger) return;
    gsap.utils.toArray("[data-stat]").forEach((stat) => {
      const numEl = stat.querySelector(".stat__num");
      const span = numEl.querySelector("span");
      const target = parseInt(numEl.dataset.count, 10);
      const suffix = numEl.dataset.suffix || "";
      const zero = numEl.dataset.zero;

      ScrollTrigger.create({
        trigger: stat,
        start: "top 85%",
        once: true,
        onEnter() {
          if (zero) {
            numEl.innerHTML = `<span>${zero}</span>`;
            return;
          }
          const o = { v: 0 };
          gsap.to(o, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            onUpdate() { span.textContent = Math.round(o.v); },
            onComplete() {
              if (suffix) numEl.innerHTML = `<span>${target}</span><span class="suffix">${suffix}</span>`;
            },
          });
        },
      });
    });
  }

  /* -----------------------------------------------------
     8. MARQUEE
  ----------------------------------------------------- */
  function initMarquee() {
    if (prefersReduced || !hasGSAP) return;
    const track = document.getElementById("marquee");
    if (!track) return;
    gsap.to(track, { xPercent: -50, repeat: -1, duration: 28, ease: "none" });
  }

  /* -----------------------------------------------------
     9. CUSTOM CURSOR + MAGNETIC
  ----------------------------------------------------- */
  function initCursor() {
    if (isMobile || prefersReduced || !hasGSAP) return;
    const ring = document.getElementById("cursor");
    const dot = document.getElementById("cursorDot");
    if (!ring || !dot) return;

    const xR = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
    const yR = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
    const xD = gsap.quickTo(dot, "x", { duration: 0.12, ease: "power3" });
    const yD = gsap.quickTo(dot, "y", { duration: 0.12, ease: "power3" });

    window.addEventListener("pointermove", (e) => {
      xR(e.clientX); yR(e.clientY); xD(e.clientX); yD(e.clientY);
    });

    document.querySelectorAll('[data-cursor="hover"]').forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });

    // magnetic
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        gsap.to(el, { x: mx * 0.3, y: my * 0.4, duration: 0.4, ease: "power3" });
      });
      el.addEventListener("mouseleave", () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* -----------------------------------------------------
     10. NAV + MOBILE MENU
  ----------------------------------------------------- */
  function initNav() {
    const nav = document.getElementById("nav");
    const burger = document.getElementById("navBurger");
    const menu = document.getElementById("mobileMenu");

    if (burger && menu) {
      const toggle = (open) => {
        menu.classList.toggle("open", open);
        nav.classList.toggle("menu-open", open);
        burger.setAttribute("aria-expanded", String(open));
        document.body.style.overflow = open ? "hidden" : "";
        if (lenis) open ? lenis.stop() : lenis.start();
      };
      burger.addEventListener("click", () =>
        toggle(!menu.classList.contains("open"))
      );
      menu.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => toggle(false))
      );
    }

    // scrolled state on mobile
    if (hasGSAP && window.ScrollTrigger) {
      ScrollTrigger.create({
        start: 60,
        onUpdate: (self) =>
          nav.classList.toggle("scrolled", self.scroll() > 60),
      });
    } else {
      window.addEventListener("scroll", () =>
        nav.classList.toggle("scrolled", window.scrollY > 60)
      );
    }

    // anchor smooth scroll via lenis
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#" || id === "#top") return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          if (lenis) lenis.scrollTo(target, { offset: -10 });
          else target.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  /* -----------------------------------------------------
     BOOT
  ----------------------------------------------------- */
  window.addEventListener("DOMContentLoaded", () => {
    initLenis();
    initThree();
    initNav();
    initCursor();
    initMarquee();

    runPreloader(() => {
      animateHero();
      initReveals();
      initHorizontal();
      initStats();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  // refresh layout-dependent triggers once everything (fonts) settles
  window.addEventListener("load", () => {
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 200);
  });
})();
