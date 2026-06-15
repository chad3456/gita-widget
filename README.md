# AEGIS LAB — Air-Defence Missile Systems, Visualised

An interactive, **educational** 3D website that explains how an air-to-air
missile interception works — the parts of the missile, the platform that
carries it, the guidance law that flies it, and a **real physics intercept
simulation** you can configure and launch.

> For learning, not an operational tool. The 3D models are stylised and all
> figures are illustrative — the value is the *concepts and the physics*.

## What you can do

1. **The Platform** — explore a Dassault Rafale (delta-canard multirole fighter)
   with live hotspots over the radar, interceptor, canard and EW suite.
2. **Anatomy of an Interceptor** — an explode-able 3D missile; hover/click the
   five sections (seeker, guidance, warhead, rocket motor, control fins).
3. **Build & Simulate** — the centrepiece. Pick a weapon (MICA-IR, MICA-EM,
   METEOR), choose the seeker, then dial in nav constant **N**, target range,
   target speed, target maneuver, missile max-G and engagement aspect — and
   **launch**. Watch the missile fly a true **Proportional Navigation**
   intercept with a full HUD (range, closing velocity, Mach, lateral G, LOS
   rate, time) and a HIT / MISS verdict with miss-distance.
4. **How the Guidance Thinks** — an animated explainer of `a = N · Vc · λ̇`.

### The physics (real, simplified)

The missile uses **true Proportional Navigation**: it commands lateral
acceleration proportional to the closing velocity times the line-of-sight
rotation rate, `a = N · Vc · λ̇`, clamped to a structural G-limit. Boost /
sustain (ramjet for METEOR) / coast phases, quadratic drag, gravity droop and a
weaving target are all integrated each frame (sub-stepped for stability). Null
the LOS rate and you're on a collision course — exactly how real interceptors fly.

## Stack

- **[Three.js](https://threejs.org/)** — Rafale, missile, target and the
  simulation viewport (chase / orbit / top cameras), all built from primitives
- **[GSAP](https://gsap.com/)** — **ScrollTrigger** (reveals, counters), **Flip**
  registered for layout transitions, timelines (hero, anatomy explode), magnetics
- **[Lenis](https://lenis.darkroom.engineering/)** — smooth scrolling
- **Canvas 2D** — the proportional-navigation diagram

Self-contained: libraries vendored in `/vendor`, all geometry procedural, no
external runtime assets (fonts are the only CDN call, with fallbacks). Offscreen
WebGL scenes pause via IntersectionObserver to stay light.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Sections, controls, HUD |
| `styles.css` | HUD / panel aesthetic, responsive |
| `app.js` | Model builders, four 3D scenes, the Pro-Nav simulator, UI wiring |
| `vendor/` | three, gsap, ScrollTrigger, Flip, lenis |

## Notes

- **Verified** end-to-end with headless Chromium at 1440×860 and 390×844:
  every scene renders, the simulator completes intercepts (HIT/MISS), all three
  camera modes and weapon/aspect presets work, and there are **no console errors**.
- Responsive (panel stacks under the viewport on small screens) and
  `prefers-reduced-motion` aware.
