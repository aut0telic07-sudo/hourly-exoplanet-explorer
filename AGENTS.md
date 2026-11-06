# AGENTS.md — Exoplanet Education & Observatory Platform

## Project Mission
Transform this repository into the **premier interactive educational environment for exoplanet science and astronomical data**:
- Intuitive for beginners and students while rich enough for space enthusiasts and researchers.
- Explains **how we detect and characterize exoplanets** (Transit Photometry, Radial Velocity / Doppler Spectroscopy, Direct Imaging & Coronagraphy, Gravitational Microlensing, Astrometry, Transit Timing Variations, and JWST Transmission/Emission Spectroscopy) with interactive physics simulations.
- Showcases the **full diversity of exoplanetary systems** across all 6,451+ confirmed worlds in the NASA Exoplanet Archive—not just habitable-zone worlds, but also **extreme systems** (Ultra-Hot Jupiters with iron rain, tidally disrupted egg-shaped worlds, magma-ocean Lava Super-Earths, ultra-low-density "Super-Puffs", evaporating comet-like planets, Pulsar planets, circumbinary "Tatooine" worlds, and extreme-eccentricity flash-heated worlds).

## Video-Game Usability & Diegetic Sci-Fi UX Standard (Mandatory for All Agents)
All agents must design and build with **video-game usability and tactile feel**—taking inspiration from the *Mass Effect* Galaxy Map, *Elite Dangerous* / *Starfield* System Scanners, *No Man's Sky* Discovery Codex, *Outer Wilds* Ship Log, and *Universe Sandbox*:
1. **Zero "Wall-of-Text" Rule — Scanner HUD & Codex Cards**:
   - Never present dry academic paragraphs or raw unformatted tables.
   - Present planet data like a **Sci-Fi Ship Scanner / Game Codex**: visual stat bars, color-coded **Environmental Hazard Badges** (`MOLTEN IRON RAIN`, `TIDALLY LOCKED`, `SUPERSONIC ROCK WINDS`, `PULSAR RADIATION`, `HABITABLE ZONE`), instant **Scale Silhouettes** (Earth / Jupiter comparison rings right next to the planet), and punchy 1–2 sentence "Scanner Briefings" with progressive-disclosure tabs for deeper astrophysics.
2. **Toy-Like Direct Manipulation (60fps "Play With the Physics")**:
   - Every scientific concept must feel like an interactive sandbox toy. Sliders, toggles, and canvas elements must respond at 60fps with immediate visual feedback.
   - Include **One-Click Preset Cartridges** on every simulation (e.g., `[Load KELT-9b Inferno]`, `[Load TRAPPIST-1e]`, `[Load HD 80606b Comet Orbit]`) so users don't have to guess parameter values to see dramatic effects.
3. **Guided "Expedition Missions" & Discovery Log**:
   - Include an interactive **Expedition / Mission Selector** (guided 3–5 stop tours with a progress tracker, e.g., *"Expedition 1: Worlds of Fire & Iron Rain"*, *"Expedition 2: How We Spot Invisible Worlds"*, *"Expedition 3: Cosmic Giants & Super-Puffs"*, *"Expedition 4: The Search for Earth 2.0"*).
4. **Game-Like Navigation, Persistent Target Context & Hotkeys**:
   - Maintain a persistent **Active Target HUD** across all tabs so selecting a planet in the Extreme Codex, Population Scatter Plot, or 3D Cockpit keeps it locked in as the active target everywhere (`window.warpToPlanet(pl_name)`).
   - Support crisp keyboard shortcuts (`1`–`6` to switch deck stations, `Space` to pause/resume orbital simulation, `R` for random warp jump, `/` for quick target search, `Esc` to dismiss modals) alongside effortless mouse/touch controls.

## Architecture & Build Pipeline (Critical Rule)
1. **Source vs. Compiled Entrypoint**:
   - `template.html` is the **authoritative source HTML file**.
   - `index.html` is a **generated 5.5 MB bundle** produced by injecting `data/exoplanets.json` and `assets/` base64 art into `template.html` at the `/*__INLINE_JSON_PLACEHOLDER__*/ null` marker.
   - **Never edit `index.html` directly without updating `template.html`.**
   - After modifying `template.html` or any JS/data files, always run:
     ```bash
     node build_bundle.mjs
     ```
     to regenerate `index.html`, `data/exoplanets_bundle.js`, and `data/concept_art_bundle.js`.
2. **Modular JavaScript for Multi-Agent Collaboration**:
   - To avoid file collisions when multiple specialized subagents work in parallel, place new domain modules in dedicated `.js` files (e.g., `app_detection_lab.js`, `app_extreme_worlds.js`, `app_education_charts.js`, `app_guided_tours.js`) and reference them via `<script src="...">` tags in `template.html`.
   - `app_spaceship.js` contains the 3D cockpit starfield & galaxy navigation engine (`window.SpaceshipRoam`).

## Dataset Schema (`data/exoplanets.json` / `window.EXOPLANET_ATLAS_DATA`)
Loaded globally into `ATLAS` (`window.EXOPLANET_ATLAS_DATA || window.EXOPLANET_ATLAS_FALLBACK`):
- `summary`: `{ total_confirmed_planets, total_host_stars, multi_planet_systems, habitable_candidates, catalog_sample_size }`
- `discovery_methods`: Array of `{ discoverymethod, cnt }`
- `discovery_years`: Array of `{ disc_year, cnt }`
- `top_facilities`: Array of `{ disc_facility, cnt }`
- `planets`: Array of 6,451+ confirmed exoplanet objects with fields:
  - `pl_name` (string): Planet name (e.g., `"TRAPPIST-1 e"`, `"55 Cnc e"`, `"KELT-9 b"`, `"WASP-76 b"`, `"PSR B1257+12 b"`)
  - `hostname` (string): Host star name
  - `sy_snum` (number): Number of stars in the system (1 = single, 2 = binary, 3+ = multi-star)
  - `sy_pnum` (number): Number of confirmed planets in the system
  - `discoverymethod` (string): `"Transit"`, `"Radial Velocity"`, `"Microlensing"`, `"Imaging"`, `"Transit Timing Variations"`, `"Pulsar Timing"`, `"Astrometry"`, etc.
  - `disc_year` (number): Year of discovery
  - `disc_facility` (string): Observatory / mission (e.g., `"Kepler"`, `"Transiting Exoplanet Survey Satellite (TESS)"`, `"La Silla Observatory"`, `"James Webb Space Telescope (JWST)"`)
  - `pl_orbper` (number | null): Orbital period in Earth days
  - `pl_orbsmax` (number): Semi-major axis in AU
  - `pl_rade` (number): Planet radius in Earth radii ($R_\oplus$)
  - `pl_bmasse` (number): Planet mass in Earth masses ($M_\oplus$)
  - `pl_eqt` (number): Equilibrium temperature in Kelvin (K)
  - `pl_orbeccen` (number): Orbital eccentricity ($0 \le e < 1$)
  - `st_spectype` (string): Host star spectral classification (O, B, A, F, G, K, M, Pulsar, White Dwarf)
  - `st_teff` (number): Stellar effective temperature (K)
  - `st_rad` (number): Stellar radius in Solar radii ($R_\odot$)
  - `st_mass` (number): Stellar mass in Solar masses ($M_\odot$)
  - `sy_dist` (number): Distance from Earth in parsecs ($\text{ly} = \text{pc} \times 3.26156$)
  - `ra`, `dec` (number): Right Ascension and Declination in degrees
  - `hz_in_au`, `hz_out_au` (number): Conservative habitable zone inner/outer boundaries in AU
  - `hz_status` (string): `"Conservative HZ"`, `"Optimistic HZ"`, `"Temperate Zone"`, `"Inner Warm/Scorched"`, `"Outer Cryo Zone"`
  - `esi` (number): Earth Similarity Index ($0.000$ to $1.000$)
  - `planet_class` (string): `"Lava World"`, `"Sub-Earth / Mercurian"`, `"Terrestrial World"`, `"Super-Earth"`, `"Hycean / Sub-Neptune"`, `"Mini-Neptune"`, `"Ice Giant / Neptunian"`, `"Hot Jupiter"`, `"Gas Giant / Jovian"`
