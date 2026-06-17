# ISOCHRONE — a travel-time atlas

Pick a city and watch the world re-draw itself by **how long it actually takes to get
there** — door to door, by air, rail, road or on foot. Luminous isochrone bands radiate
out from your city over an azimuthal-equidistant projection (the classic isochronic-map
layout), the way Bartholomew drew "Isochronic Distances" in 1914 — but multimodal and
interactive.

## What it does

- **42 departure cities** across every continent (searchable). Selecting one re-centres
  and re-projects the whole globe on that city with an animated transition.
- **Real isochrone contours** (d3-contour) coloured by door-to-door time: ≤45 min → ≤48 h.
- **Toggle the modes** — Air, Rail, Drive, Walk — and watch the reachable world expand or
  collapse (turn off Air and most of the planet becomes unreachable: the point of flight).
- **Hover anywhere** for the estimated time to that exact point, the country, and the
  winning itinerary (e.g. *access → fly LHR→JFK → arrive 25 km drive*).
- A live stat: **share of world cities reachable within 24 h** from your city.

## The model (transparent, researched — see the in-app Methodology)

Every point's time is the **fastest of four modes**:

- **✈ Air** — researched city→airport access time + security/boarding buffer
  (≈2 h international, 1.4 h domestic) + great-circle flight at ~820 km/h effective
  (incl. taxi/climb/descent) + a distance-based connection penalty + the drive from the
  arrival airport to the destination.
- **🚄 Rail** — ~210 km/h inside real high-speed-rail regions (Europe, East Asia),
  ~110 km/h conventional elsewhere. Land routes only.
- **🚗 Drive** — ~85 km/h effective with a 1.25× detour factor. Land routes only.
- **🚶 Walk** — 4.8 km/h. Land routes only.

Ground modes are blocked across open water by a **land mask** (so seas are crossed by air).
Nearest-airport, egress distance and the land mask are precomputed per grid cell, so picking
a city recomputes the whole field in well under a frame.

## Real data

- **504 large international airports** with real coordinates — OurAirports, via the
  `airports` npm dataset.
- **World geometry** (land + country borders) — Natural Earth, via `world-atlas`.
- Airport-access times and HSR-region boxes are researched approximations.

> This is a transparent **model for exploration**, not a routing engine — figures are
> realistic estimates, not bookable itineraries. No live APIs; all data is bundled.

## Run

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(It fetches the bundled JSON in `data/`, so serve over HTTP rather than `file://`.)

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Canvas, control panel, legend, methodology |
| `styles.css` | The dark cartographic design |
| `app.js` | Model, grid precompute, d3-contour bands, azimuthal projection, interactions |
| `data/` | `airports.json` (504 hubs), `land-110m.json`, `countries-110m.json` |
| `vendor/` | d3 (geo + contour), topojson-client |

## Stack

D3 v7 (`geoAzimuthalEquidistant`, `geoContains`, `contours`, `geoPath`) + topojson-client.
No build step; libraries and data vendored locally.

## Notes

Verified with headless Chromium at 1440×860 and 390×844: time-to-interactive ≈250 ms,
sane door-to-door estimates (London→NYC ≈ 11.5 h, →Paris ≈ 2.4 h by rail, →Sydney ≈ 27 h),
city switching, mode toggles, tooltip and methodology all working, no console errors.
