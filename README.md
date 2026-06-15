# AEGIS LAB — The Open Encyclopedia of Air-Combat Systems

An interactive, **educational** 3D website explaining how modern air power works:
fighter **generations**, an **aircraft codex** (4th → 6th gen), missile **anatomy**,
a real-physics **intercept simulator**, a **Gaussian-terrain war zone** with radar
coverage and adaptive routing, and a **library of 100 mission scenarios**.

> For learning, not an operational tool. 3D models are **stylised procedural geometry**
> (no Blender/CAD or downloaded models — this environment has no Blender and blocks
> external downloads; a `.glb` loader can be added on a networked host). Specs are from
> public sources and vary by variant; **RCS values are open estimates** and **6th-gen
> figures are projected**. Missions mix **documented operations (HISTORICAL)** with
> **generated training scenarios (SCENARIO)** — clearly labelled.

## Sections

1. **Generations** — what defines 4th / 4.5 / 5th / 6th gen, with capability bars.
2. **The Platform** — a Rafale with projected sensor/weapon hotspots.
3. **The Aircraft Codex** — 16 airframes across four generations. Filter by generation,
   select one for a stylised 3D model (parametric per family: conventional, delta-canard,
   stealth-diamond, tailless wing) plus a full public-spec sheet.
4. **Anatomy of an Interceptor** — explode-able missile with five selectable sections.
5. **Build & Simulate** — configure a weapon, seeker, nav-constant N, range, target
   speed/maneuver, missile G and aspect, then fly a **true Proportional-Navigation**
   intercept with a full HUD and HIT/MISS verdict (`a = N · Vc · λ̇`).
6. **War Zone** — terrain built as a **sum of Gaussian peaks**; each SAM paints a
   **Gaussian threat dome**. A strike route flies HI/DIRECT or hugs the valleys
   (TERRAIN-FOLLOW); **route exposure is a real line integral** of detection probability
   with **terrain line-of-sight masking** — terrain-following typically cuts exposure
   ~60% in mountains, demonstrating how aircraft adapt to geography.
7. **100 Air Missions** — documented operations + generated scenarios; select one to
   load its parameters straight into the simulator.
8. **How the Guidance Thinks** — animated Pro-Nav explainer.

## The maths (real, simplified)

- **Guidance:** true proportional navigation — lateral command ∝ closing velocity ×
  line-of-sight rate, clamped to a G-limit; boost/sustain(ramjet)/coast, quadratic drag,
  gravity, weaving target, sub-stepped integration.
- **Terrain:** `h(x,z) = base + Σ Aᵢ·exp(−((x−xᵢ)²+(z−zᵢ)²)/2σᵢ²)`.
- **Detection:** per-SAM `P = exp(−(d/r)²)` with terrain LOS masking; combined
  `P = 1 − Π(1−Pᵢ)`; **route exposure `= Σ P(x) along the path`**.

## Stack

- **[Three.js](https://threejs.org/)** — all 3D (hero, platform, codex, anatomy,
  simulator, Gaussian terrain), parametric airframe builder, premium lighting
- **[GSAP](https://gsap.com/)** — **ScrollTrigger**, **Flip** (registered), timelines, counters
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scroll

Self-contained: libraries vendored in `/vendor`, all geometry procedural, no external
runtime assets (fonts are the only CDN call, with fallbacks). Offscreen WebGL scenes
pause via IntersectionObserver.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Notes

- **Verified** with headless Chromium at 1440×860 and 390×844: every scene renders,
  the simulator resolves intercepts, terrain-following measurably lowers radar exposure
  (57.7 → 22.3 in testing), missions load into the simulator, and there are **no console
  errors**. Responsive and `prefers-reduced-motion` aware.
- **Roadmap if hosted with network:** drop real `.glb` airframes into a loader, expand
  the historical-mission set with cited sources, and add post-processing bloom.
