// ============================================================================
// CSV "ASTRONAV-PRIME" — EXPANDED 3D GALACTIC UNIVERSE & BRIDGE ENGINE v3.0
// - Organic 3D Spiral-Arm & Multi-Sector Galaxy (Zero CCD Grid Clumping!)
// - Seamless Macro-to-Micro 3D Space: Fly between 4,847 Star Systems AND fly
//   directly inside multi-planet 3D orbital architectures!
// - 3D Volumetric Nebulae, Dynamic 3D Space-Dust Motion Particles & Sector Gates
// - Non-Inverted Controls + Click-to-Fly + Click-to-Glide Bridge Stations
// ============================================================================

window.SpaceshipRoam = (function() {
  let roamMode = 'flight';     // Default to 'flight' or 'bridge' seamlessly
  let flightCamView = 'chase'; // 'chase' (3D Starship Exterior) | 'cockpit' (1st-Person HUD)
  let keys = {};
  let isDragging = false;
  let dragMoved = false;
  let lastMx = 0, lastMy = 0;

  // Bridge First-Person Camera (Non-inverted: pitch > 0 looks UP, yaw > 0 turns RIGHT)
  const bridgeCam = {
    x: 0, y: 44, z: -55,
    yaw: 0, pitch: 0.02,
    targetX: null, targetZ: null, targetYaw: null
  };

  const STATIONS = [
    { id: 'helm',  name: 'FORWARD HELM & FLIGHT DECK',       x: 0,    z: 145,  color: '#00f0ff', action: 'LAUNCH INTO 3D SPACE FLIGHT', desc: 'Panoramic Observation Window & Flight Controls' },
    { id: 'holo',  name: 'CENTRAL 3D HOLO-ROTUNDA',          x: 0,    z: 15,   color: '#00ff9d', action: 'SCAN NEW DEEP-SPACE WORLD',   desc: 'Volumetric Orbital System Projector' },
    { id: 'xeno',  name: 'PORT XENOBIOLOGY & BIO-LAB',       x: -135, z: 25,   color: '#a855f7', action: 'ANALYZE BIOSIGNATURES',       desc: 'Biostasis Containment & DNA Helix Scanner' },
    { id: 'probe', name: 'STARBOARD TACTICAL PROBE BAY',     x: 135,  z: 25,   color: '#ffb703', action: 'DEPLOY ORBITAL RECON PROBE',  desc: 'Long-Range Telemetry & Surface Probes' },
    { id: 'warp',  name: 'AFT QUANTUM ANTIMATTER WARP CORE', x: 0,    z: -145, color: '#ff2a6d', action: 'ENGAGE QUANTUM HYPER-JUMP',   desc: 'Magnetic Constriction Antimatter Reactor' }
  ];

  // 5 Vast 3D Galactic Sectors (Spanning a 3,600 x 1,200 x 3,600 Parsec 3D Navigable Volume)
  const GALACTIC_SECTORS = [
    { id: 'sol',         name: 'SECTOR 01 // SOL LOCAL BUBBLE',       x: 0,     y: 0,    z: 0,     color: '#00f0ff', desc: 'Solar Neighborhood & Nearest Habitable Red Dwarfs' },
    { id: 'orion',       name: 'SECTOR 02 // ORION-CYGNUS SPIRAL ARM', x: 420,   y: 35,   z: 520,   color: '#00ff9d', desc: 'Main Spiral Arm Corridor & Multi-Planet Resonant Chains' },
    { id: 'perseus',     name: 'SECTOR 03 // PERSEUS OUTER FRONTIER', x: -680,  y: -55,  z: 640,   color: '#38bdf8', desc: 'Outer Spiral Frontier, Ice Giants & Ringed Jovians' },
    { id: 'sagittarius', name: 'SECTOR 04 // SAGITTARIUS CORE NEBULA', x: 580,   y: 75,   z: -620,  color: '#ffb703', desc: 'Luminous Core Star Clouds, Lava Worlds & Binary Suns' },
    { id: 'halo',        name: 'SECTOR 05 // GALACTIC HALO RIM',      x: -640,  y: 160,  z: -680,  color: '#a855f7', desc: 'High-Inclination Halo Systems, Pulsars & Ancient Worlds' }
  ];

  let nearestStation = null;
  let bannerMsg = '3D GALACTIC NAVIGATOR READY — CLICK ANY STAR OR PLANET TO FLY THERE, OR USE WASD / ARROWS / NAV PAD';
  let bannerTimer = 260;

  // 6-DOF Spaceship Flight State
  const shipFlight = {
    x: 0, y: 8, z: -48,
    vx: 0, vy: 0, vz: 0,
    yaw: 0, pitch: -0.05, bank: 0,
    speed: 0,
    warpLevel: 2,
    autopilot: false,
    targetSys: null,
    stopDistance: 14
  };

  // 3D Volumetric Space Dust & Nebula Clouds for true sense of 3D motion
  const spaceDust3D = [];
  const volumetricNebulae = [
    { x: 320,  y: 60,  z: 480,  r: 340, col: 'rgba(0, 240, 255, 0.09)' },
    { x: -520, y: -40, z: 540,  r: 380, col: 'rgba(168, 85, 247, 0.09)' },
    { x: 490,  y: 90,  z: -510, r: 360, col: 'rgba(255, 183, 3, 0.08)' },
    { x: -480, y: 120, z: -560, r: 400, col: 'rgba(244, 63, 94, 0.08)' },
    { x: 0,    y: -30, z: 180,  r: 260, col: 'rgba(0, 255, 157, 0.07)' }
  ];

  const padHold = { fwd: false, back: false, left: false, right: false, turnL: false, turnR: false, up: false, down: false };

  let starSystems3D = [];
  let visibleScreenStars = [];
  let visibleScreenPlanets = [];
  let stationScreenBoxes = [];

  function hash32(str) {
    let h = 2166136261 >>> 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededRng(seed) {
    let s = seed >>> 0;
    return function() {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // De-grids telescope pencil beams (Kepler/K2/OGLE CCD tiles) into a true, organic,
  // 360-degree 3D Spiral Galaxy while preserving local neighborhood star geometry!
  function build3DStarCatalog(allPlanets) {
    const map = new Map();
    for (let i = 0; i < allPlanets.length; i++) {
      const p = allPlanets[i];
      if (!p.hostname) continue;
      let sys = map.get(p.hostname);
      if (!sys) {
        const seed = hash32(p.hostname);
        const rng  = seededRng(seed);
        const rawDist = Number(p.sy_dist) || (40 + rng() * 600);
        const isPencilBeam = /^(Kepler|KOI|K2|OGLE|MOA|COROT|SWEEPS)/i.test(p.hostname);

        let x, y, z;
        if (!isPencilBeam && rawDist <= 120) {
          // True Local Bubble 3D Astrometric Coordinates (expanded scale so systems have breathing room)
          const raRad  = ((Number(p.ra) || rng() * 360) * Math.PI) / 180;
          const decRad = ((Number(p.dec) || (rng() * 160 - 80)) * Math.PI) / 180;
          // Spread 1..120 pc smoothly across 18..280 units from SOL
          const rScaled = 18 + Math.pow(rawDist, 0.82) * 5.2 + (rng() - 0.5) * 14;
          x = rScaled * Math.cos(decRad) * Math.cos(raRad);
          y = rScaled * Math.sin(decRad) * 0.65;
          z = rScaled * Math.cos(decRad) * Math.sin(raRad);
        } else {
          // Distribute across 4 Logarithmic 3D Galactic Spiral Arms + Vertical Galactic Disk Thickness
          // Eliminates the flat 21-tile Kepler CCD grid completely!
          const armIndex = seed % 4;
          const armProgress = 0.12 + Math.pow(rng(), 0.72) * 0.88; // 0.12 .. 1.0 out along spiral arm
          const radialDist = 160 + armProgress * 1180;             // up to 1,340 units radius
          const spiralWind = armProgress * 2.85;                   // spiral curvature angle
          const baseAngle  = (armIndex * Math.PI * 0.5) + spiralWind;

          // Natural organic scatter across the spiral arm width and galactic plane thickness
          const angleScatter = (rng() + rng() - 1.0) * 0.58;
          const theta = baseAngle + angleScatter;
          const radiusJitter = (rng() - 0.5) * 140;
          const finalR = radialDist + radiusJitter;

          // Vertical disk height (thicker in halo/core, thinner in arms)
          const diskHeight = (rng() + rng() + rng() - 1.5) * (95 + armProgress * 165);

          x = Math.cos(theta) * finalR;
          z = Math.sin(theta) * finalR;
          y = diskHeight;
        }

        sys = {
          hostname: p.hostname,
          x: x,
          y: y,
          z: z,
          realDistPc: rawDist,
          teff: Number(p.st_teff) || 5200,
          spectype: p.st_spectype || 'G2V',
          st_rad: Number(p.st_rad) || 0.9,
          planets: []
        };
        map.set(p.hostname, sys);
      }
      sys.planets.push(p);
    }

    // Sort planets inside each system by semi-major axis
    for (const sys of map.values()) {
      sys.planets.sort((a, b) => (Number(a.pl_orbsmax) || 0) - (Number(b.pl_orbsmax) || 0));
    }
    starSystems3D = Array.from(map.values());

    // Initialize 3D ambient space-dust particles around the ship
    spaceDust3D.length = 0;
    const dRng = seededRng(109283);
    for (let i = 0; i < 140; i++) {
      spaceDust3D.push({
        ox: (dRng() - 0.5) * 160,
        oy: (dRng() - 0.5) * 160,
        oz: (dRng() - 0.5) * 160,
        col: i % 3 === 0 ? '#00f0ff' : (i % 3 === 1 ? '#00ff9d' : '#ffffff')
      });
    }
  }

  // Non-Inverted 3D Perspective Projection:
  // +X = Right, +Y = Up, +Z = Forward when yaw=0, pitch=0
  function project3D(wx, wy, wz, cam, w, h, fov) {
    const dx = wx - cam.x;
    const dy = wy - cam.y;
    const dz = wz - cam.z;

    const cosY = Math.cos(cam.yaw), sinY = Math.sin(cam.yaw);
    const rx  =  dx * cosY - dz * sinY;
    const rz1 =  dx * sinY + dz * cosY;

    const cosP = Math.cos(cam.pitch), sinP = Math.sin(cam.pitch);
    const ry =  dy * cosP - rz1 * sinP;
    const rz =  dy * sinP + rz1 * cosP;

    if (rz <= 1.2) return null;
    const scale = fov / rz;
    return {
      sx: w * 0.5 + rx * scale,
      sy: h * 0.5 - ry * scale,
      rz: rz,
      scale: scale
    };
  }

  function draw3DPolygon(ctx, pts3D, cam, w, h, fov, fillStyle, strokeStyle, lineWidth) {
    const proj = [];
    for (let i = 0; i < pts3D.length; i++) {
      const p = project3D(pts3D[i][0], pts3D[i][1], pts3D[i][2], cam, w, h, fov);
      if (!p) return false;
      proj.push(p);
    }
    ctx.beginPath();
    ctx.moveTo(proj[0].sx, proj[0].sy);
    for (let i = 1; i < proj.length; i++) {
      ctx.lineTo(proj[i].sx, proj[i].sy);
    }
    ctx.closePath();
    if (fillStyle) { ctx.fillStyle = fillStyle; ctx.fill(); }
    if (strokeStyle) { ctx.strokeStyle = strokeStyle; ctx.lineWidth = lineWidth || 1.2; ctx.stroke(); }
    return true;
  }

  function initControls(canvas) {
    window.addEventListener('keydown', e => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target || {}).tagName)) return;
      keys[e.code] = true;
      if (window.currentMainTab === 'spaceship') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (e.code === 'KeyF') triggerActiveStationOrAutopilot();
        if (e.code === 'Digit1') setWarpLevel(1);
        if (e.code === 'Digit2') setWarpLevel(2);
        if (e.code === 'Digit3') setWarpLevel(3);
        if (e.code === 'Digit4') setWarpLevel(4);
      }
    });
    window.addEventListener('keyup', e => { keys[e.code] = false; });

    canvas.addEventListener('mousedown', e => {
      isDragging = true;
      dragMoved = false;
      lastMx = e.clientX;
      lastMy = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    canvas.addEventListener('click', e => {
      if (dragMoved) return;
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);

      if (roamMode === 'bridge') {
        for (const box of stationScreenBoxes) {
          if (Math.hypot(mx - box.sx, my - box.sy) < box.r) {
            teleportToStation(box.id);
            return;
          }
        }
      } else {
        // 1. Check if user clicked an individual orbiting 3D planet first!
        for (let i = 0; i < visibleScreenPlanets.length; i++) {
          const vp = visibleScreenPlanets[i];
          if (Math.hypot(mx - vp.sx, my - vp.sy) < Math.max(16, vp.pr + 10)) {
            if (window.warpToPlanet) window.warpToPlanet(vp.planet.pl_name);
            showShipBanner(`SENSOR LOCK ACQUIRED: ${vp.planet.pl_name.toUpperCase()} (${vp.planet.planet_class} | ${vp.planet.hz_status})`);
            return;
          }
        }
        // 2. Otherwise check if user clicked any star system in 3D space to fly there!
        let bestStar = null;
        let bestDist = 28;
        for (let i = 0; i < visibleScreenStars.length; i++) {
          const s = visibleScreenStars[i];
          const d = Math.hypot(mx - s.sx, my - s.sy);
          if (d < Math.max(18, s.sr + 12) && d < bestDist) {
            bestDist = d;
            bestStar = s;
          }
        }
        if (bestStar) {
          if (bestStar.sys.planets.length && window.warpToPlanet) {
            window.warpToPlanet(bestStar.sys.planets[0].pl_name);
          }
          flyToSystem(bestStar.sys);
        }
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastMx;
      const dy = e.clientY - lastMy;
      if (Math.hypot(dx, dy) > 3) dragMoved = true;
      lastMx = e.clientX;
      lastMy = e.clientY;

      // Non-Inverted: Mouse Right (+dx) -> Turn Right (+yaw); Mouse Up (-dy) -> Look Up (+pitch)
      if (roamMode === 'bridge') {
        bridgeCam.targetYaw = null;
        bridgeCam.yaw   += dx * 0.005;
        bridgeCam.pitch  = Math.max(-0.55, Math.min(0.55, bridgeCam.pitch - dy * 0.004));
      } else {
        shipFlight.autopilot = false;
        shipFlight.yaw   += dx * 0.005;
        shipFlight.pitch  = Math.max(-1.05, Math.min(1.05, shipFlight.pitch - dy * 0.004));
        shipFlight.bank   = Math.max(-0.45, Math.min(0.45, dx * 0.015));
      }
    });
  }

  function flyToSystem(sys) {
    if (!sys) return;
    shipFlight.targetSys = sys;
    shipFlight.stopDistance = 14;
    shipFlight.autopilot = true;
    setRoamSubMode('flight');
    showShipBanner(`AUTOPILOT ENGAGED -> ${sys.hostname.toUpperCase()} (${sys.planets.length} PLANET(S) | ${sys.realDistPc.toFixed(1)} PC)`);
  }

  function jumpToSector(sectorId) {
    const sec = GALACTIC_SECTORS.find(s => s.id === sectorId);
    if (!sec) return;
    setRoamSubMode('flight');
    shipFlight.autopilot = false;
    shipFlight.x = sec.x;
    shipFlight.y = sec.y + 12;
    shipFlight.z = sec.z - 55;
    shipFlight.yaw = 0;
    shipFlight.pitch = -0.06;

    // Lock onto the closest star system in this sector so its planetary system is immediately visible
    let closest = null, bestD = Infinity;
    for (const s of starSystems3D) {
      const d = Math.hypot(s.x - sec.x, s.y - sec.y, s.z - sec.z);
      if (d < bestD) { bestD = d; closest = s; }
    }
    if (closest && closest.planets.length && window.warpToPlanet) {
      window.warpToPlanet(closest.planets[0].pl_name);
    }
    showShipBanner(`WARPED TO ${sec.name} — ${sec.desc.toUpperCase()}`);
  }

  function flyToNearestUnvisitedSystem() {
    setRoamSubMode('flight');
    const currentHost = window.selectedPlanet ? window.selectedPlanet.hostname : '';
    let best = null, bestD = Infinity;
    for (const s of starSystems3D) {
      if (s.hostname === currentHost) continue;
      const d = Math.hypot(s.x - shipFlight.x, s.y - shipFlight.y, s.z - shipFlight.z);
      if (d > 8 && d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best) {
      if (best.planets.length && window.warpToPlanet) window.warpToPlanet(best.planets[0].pl_name);
      flyToSystem(best);
    }
  }

  function setPadHold(dir, state) {
    padHold[dir] = state;
    if (state) {
      bridgeCam.targetX = null;
      bridgeCam.targetZ = null;
      bridgeCam.targetYaw = null;
      shipFlight.autopilot = false;
    }
  }

  function resetCameraView() {
    if (roamMode === 'bridge') {
      bridgeCam.x = 0; bridgeCam.z = -55; bridgeCam.yaw = 0; bridgeCam.pitch = 0.02;
      bridgeCam.targetX = null; bridgeCam.targetZ = null; bridgeCam.targetYaw = null;
      showShipBanner('BRIDGE CAMERA CENTERED ON OBSERVATION DECK');
    } else {
      shipFlight.pitch = 0; shipFlight.bank = 0;
      showShipBanner('STARSHIP ATTITUDE LEVELED TO GALACTIC PLANE');
    }
  }

  function toggleFlightCameraView() {
    flightCamView = (flightCamView === 'chase') ? 'cockpit' : 'chase';
    const btn = document.getElementById('btn-flight-cam-view');
    if (btn) {
      btn.textContent = flightCamView === 'chase' ? 'VIEW: 3D STARSHIP CHASE CAM' : 'VIEW: 1ST-PERSON COCKPIT';
    }
    setRoamSubMode('flight');
  }

  function setRoamSubMode(mode) {
    roamMode = mode;
    const bBtn = document.getElementById('roam-btn-bridge');
    const fBtn = document.getElementById('roam-btn-flight');
    if (bBtn && fBtn) {
      bBtn.className = mode === 'bridge' ? 'scifi-btn scifi-btn-active px-3 py-1.5' : 'scifi-btn px-3 py-1.5';
      fBtn.className = mode === 'flight' ? 'scifi-btn scifi-btn-active px-3 py-1.5' : 'scifi-btn px-3 py-1.5';
    }
  }

  function setWarpLevel(lvl) {
    shipFlight.warpLevel = lvl;
    [1, 2, 3, 4].forEach(n => {
      const el = document.getElementById('warp-lvl-' + n);
      if (el) el.className = (n === lvl) ? 'scifi-btn scifi-btn-active px-2.5 py-1' : 'scifi-btn px-2.5 py-1';
    });
  }

  function showShipBanner(msg) {
    bannerMsg = msg;
    bannerTimer = 220;
  }

  function engageAutopilotToSelected() {
    if (!window.selectedPlanet) return;
    const sys = starSystems3D.find(s => s.hostname === window.selectedPlanet.hostname);
    if (sys) flyToSystem(sys);
  }

  function teleportToStation(stationId) {
    const st = STATIONS.find(s => s.id === stationId);
    if (!st) return;
    setRoamSubMode('bridge');
    bridgeCam.targetX = st.x * 0.70;
    bridgeCam.targetZ = st.z - 48;
    bridgeCam.targetYaw = Math.atan2(st.x - bridgeCam.targetX, st.z - bridgeCam.targetZ);
    bridgeCam.pitch = 0.02;
    showShipBanner(`GLIDING TO ${st.name}`);
  }

  function triggerActiveStationOrAutopilot() {
    if (roamMode === 'flight') {
      engageAutopilotToSelected();
      return;
    }
    const st = nearestStation || STATIONS[1];
    if (st.id === 'helm') {
      engageAutopilotToSelected();
    } else if (st.id === 'holo') {
      if (window.triggerRandomDiscovery) window.triggerRandomDiscovery();
      showShipBanner('3D HOLO-ROTUNDA UPDATED — LOCKED ONTO NEW DEEP-SPACE EXOPLANET!');
    } else if (st.id === 'xeno') {
      const p = window.selectedPlanet;
      if (p) showShipBanner(`XENOBIOLOGY REPORT // ${p.pl_name}: ESI ${Number(p.esi).toFixed(3)} | ${p.hz_status} | Teq ${p.pl_eqt} K`);
    } else if (st.id === 'probe') {
      const p = window.selectedPlanet;
      if (p) showShipBanner(`LONG-RANGE PROBE LAUNCHED TO ${p.pl_name.toUpperCase()} — HIGH-RES TELEMETRY LINKED!`);
    } else if (st.id === 'warp') {
      if (window.triggerRandomDiscovery) window.triggerRandomDiscovery();
      engageAutopilotToSelected();
    }
  }

  function updateAndRender(canvas, animPhase) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    if (bannerTimer > 0) bannerTimer--;

    if (roamMode === 'bridge') {
      updateBridgePhysics();
      renderBridgeInterior(ctx, w, h, animPhase);
    } else {
      updateFlightPhysics();
      renderSpaceFlight(ctx, w, h, animPhase);
    }
  }

  function updateBridgePhysics() {
    const manualInput = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'] ||
                        keys['ArrowUp'] || keys['ArrowDown'] || keys['ArrowLeft'] || keys['ArrowRight'] ||
                        padHold.fwd || padHold.back || padHold.left || padHold.right || padHold.turnL || padHold.turnR;
    if (manualInput) {
      bridgeCam.targetX = null;
      bridgeCam.targetZ = null;
      bridgeCam.targetYaw = null;
    }

    if (bridgeCam.targetX !== null && bridgeCam.targetZ !== null) {
      bridgeCam.x += (bridgeCam.targetX - bridgeCam.x) * 0.12;
      bridgeCam.z += (bridgeCam.targetZ - bridgeCam.z) * 0.12;
      if (bridgeCam.targetYaw !== null) {
        let diff = bridgeCam.targetYaw - bridgeCam.yaw;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        bridgeCam.yaw += diff * 0.14;
      }
      if (Math.hypot(bridgeCam.targetX - bridgeCam.x, bridgeCam.targetZ - bridgeCam.z) < 1.5) {
        bridgeCam.targetX = null;
        bridgeCam.targetZ = null;
      }
    }

    const moveSpeed = (keys['ShiftLeft'] || keys['ShiftRight']) ? 4.2 : 2.6;
    const turnSpeed = 0.032;

    if (keys['ArrowLeft'] || keys['KeyQ'] || padHold.turnL)  bridgeCam.yaw -= turnSpeed;
    if (keys['ArrowRight'] || keys['KeyE'] || padHold.turnR) bridgeCam.yaw += turnSpeed;
    if (padHold.up)   bridgeCam.pitch = Math.min(0.50, bridgeCam.pitch + 0.02);
    if (padHold.down) bridgeCam.pitch = Math.max(-0.50, bridgeCam.pitch - 0.02);

    const fwdX = Math.sin(bridgeCam.yaw), fwdZ = Math.cos(bridgeCam.yaw);
    const rightX = Math.cos(bridgeCam.yaw), rightZ = -Math.sin(bridgeCam.yaw);

    if (keys['KeyW'] || keys['ArrowUp'] || padHold.fwd)   { bridgeCam.x += fwdX * moveSpeed; bridgeCam.z += fwdZ * moveSpeed; }
    if (keys['KeyS'] || keys['ArrowDown'] || padHold.back) { bridgeCam.x -= fwdX * moveSpeed; bridgeCam.z -= fwdZ * moveSpeed; }
    if (keys['KeyA'] || padHold.left)  { bridgeCam.x -= rightX * moveSpeed; bridgeCam.z -= rightZ * moveSpeed; }
    if (keys['KeyD'] || padHold.right) { bridgeCam.x += rightX * moveSpeed; bridgeCam.z += rightZ * moveSpeed; }

    bridgeCam.x = Math.max(-175, Math.min(175, bridgeCam.x));
    bridgeCam.z = Math.max(-180, Math.min(175, bridgeCam.z));

    nearestStation = null;
    let bestDist = 82;
    for (const st of STATIONS) {
      const d = Math.hypot(bridgeCam.x - st.x, bridgeCam.z - st.z);
      if (d < bestDist) { bestDist = d; nearestStation = st; }
    }
  }

  function renderBridgeInterior(ctx, w, h, animPhase) {
    const fov = 540;
    const p = window.selectedPlanet;
    stationScreenBoxes = [];

    window.drawSciFiStarfield(ctx, w, h, 777123);

    if (p) {
      const starProj = project3D(-175, 88, 430, bridgeCam, w, h, fov);
      if (starProj) {
        const starInfo = window.getStarColors(p.st_teff, p.st_spectype);
        window.drawStarWithDiffractionSpikes(ctx, starProj.sx, starProj.sy, Math.max(18, 44 * starProj.scale * 0.4), starInfo, animPhase);
      }
      const plProj = project3D(65, 55, 370, bridgeCam, w, h, fov);
      if (plProj) {
        const pr = Math.max(28, Math.min(175, 126 * plProj.scale * 0.65));
        window.renderRaycastPlanetGlobe(ctx, plProj.sx, plProj.sy, pr, p, animPhase * 0.45, true, false);
      }
    }

    for (let z = 160; z >= -180; z -= 40) {
      for (let x = -180; x < 180; x += 45) {
        const isWalkway = Math.abs(x + 22.5) < 48 || Math.abs(z) < 45;
        draw3DPolygon(ctx, [
          [x, 0, z], [x + 45, 0, z], [x + 45, 0, z + 40], [x, 0, z + 40]
        ], bridgeCam, w, h, fov,
        isWalkway ? 'rgba(8, 28, 52, 0.88)' : 'rgba(4, 14, 28, 0.92)',
        isWalkway ? 'rgba(0, 240, 255, 0.38)' : 'rgba(0, 180, 255, 0.16)', 1.1);
      }
    }

    for (let z = 160; z >= -180; z -= 40) {
      draw3DPolygon(ctx, [[-180, 0, z], [-205, 52, z], [-205, 52, z + 40], [-180, 0, z + 40]], bridgeCam, w, h, fov, 'rgba(6, 18, 36, 0.86)', 'rgba(0, 240, 255, 0.35)', 1.5);
      draw3DPolygon(ctx, [[180, 0, z], [205, 52, z], [205, 52, z + 40], [180, 0, z + 40]], bridgeCam, w, h, fov, 'rgba(6, 18, 36, 0.86)', 'rgba(0, 240, 255, 0.35)', 1.5);
      draw3DPolygon(ctx, [[-110, 118, z + 6], [110, 118, z + 6], [110, 118, z + 34], [-110, 118, z + 34]], bridgeCam, w, h, fov, 'rgba(0, 240, 255, 0.08)', 'rgba(0, 240, 255, 0.32)', 1.2);
    }

    [-180, -90, 0, 90, 180].forEach(wx => {
      draw3DPolygon(ctx, [[wx - 4, 0, 200], [wx + 4, 0, 200], [wx * 0.88 + 4, 118, 215], [wx * 0.88 - 4, 118, 215]], bridgeCam, w, h, fov, 'rgba(15, 35, 65, 0.92)', '#00f0ff', 1.8);
    });

    const sortedStations = [...STATIONS].map(st => ({ st, prj: project3D(st.x, 20, st.z, bridgeCam, w, h, fov) }))
      .filter(x => x.prj !== null).sort((a, b) => b.prj.rz - a.prj.rz);

    for (const { st } of sortedStations) {
      const s = st.x, z = st.z;
      draw3DPolygon(ctx, [[s - 22, 0, z - 16], [s + 22, 0, z - 16], [s + 18, 22, z - 12], [s - 18, 22, z - 12]], bridgeCam, w, h, fov, 'rgba(8, 24, 48, 0.95)', st.color, 2.0);
      draw3DPolygon(ctx, [[s - 18, 22, z - 12], [s + 18, 22, z - 12], [s + 18, 22, z + 12], [s - 18, 22, z + 12]], bridgeCam, w, h, fov, 'rgba(0, 240, 255, 0.18)', st.color, 1.6);

      const base = project3D(st.x, 0, st.z, bridgeCam, w, h, fov);
      const top  = project3D(st.x, 42, st.z, bridgeCam, w, h, fov);
      if (!base || !top) continue;
      const ringR = Math.max(12, 42 * base.scale);

      ctx.save();
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(base.sx, base.sy, ringR * 1.15, ringR * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (st.id === 'holo' && p) {
        const holoR = Math.max(8, Math.min(34, ringR * 0.48));
        window.renderRaycastPlanetGlobe(ctx, top.sx, top.sy - holoR * 0.3, holoR, p, animPhase * 0.9, true, false);
      } else if (st.id === 'warp') {
        const ceil = project3D(st.x, 118, st.z, bridgeCam, w, h, fov);
        if (ceil) {
          const coreW = Math.max(8, 28 * base.scale);
          ctx.strokeStyle = '#ff2a6d';
          ctx.lineWidth = coreW;
          ctx.beginPath(); ctx.moveTo(base.sx, base.sy); ctx.lineTo(ceil.sx, ceil.sy); ctx.stroke();
        }
      }

      const tagY = top.sy - ringR * 0.55 - 12;
      ctx.fillStyle = 'rgba(3, 10, 24, 0.88)';
      ctx.strokeStyle = st.color;
      ctx.lineWidth = 1.4;
      ctx.fillRect(top.sx - 115, tagY - 18, 230, 36);
      ctx.strokeRect(top.sx - 115, tagY - 18, 230, 36);

      ctx.fillStyle = st.color;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(st.name, top.sx, tagY - 2);
      ctx.fillStyle = '#e2f1ff';
      ctx.font = '12px monospace';
      ctx.fillText(`[CLICK TO GLIDE HERE]`, top.sx, tagY + 13);
      ctx.textAlign = 'left';
      ctx.restore();

      stationScreenBoxes.push({ id: st.id, sx: top.sx, sy: tagY, r: 95 });
    }

    drawBridgeMinimap(ctx);
    drawShipHudBanners(ctx, w, h);
  }

  function drawBridgeMinimap(ctx) {
    const mx = 18, my = 18, mw = 152, mh = 152;
    ctx.save();
    ctx.fillStyle = 'rgba(3, 9, 22, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('BRIDGE DECK RADAR', mx + 10, my + 16);

    const toMapX = x => mx + mw * 0.5 + (x / 210) * (mw * 0.42);
    const toMapY = z => my + mh * 0.56 - (z / 210) * (mh * 0.40);

    STATIONS.forEach(st => {
      ctx.fillStyle = st.color;
      ctx.beginPath(); ctx.arc(toMapX(st.x), toMapY(st.z), 4.5, 0, Math.PI * 2); ctx.fill();
    });

    const px = toMapX(bridgeCam.x), py = toMapY(bridgeCam.z);
    ctx.fillStyle = 'rgba(0, 255, 157, 0.25)';
    ctx.strokeStyle = '#00ff9d';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.sin(bridgeCam.yaw - 0.42) * 28, py - Math.cos(bridgeCam.yaw - 0.42) * 28);
    ctx.lineTo(px + Math.sin(bridgeCam.yaw + 0.42) * 28, py - Math.cos(bridgeCam.yaw + 0.42) * 28);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // ============================================================================
  // EXPANDED 3D GALACTIC SPACE FLIGHT ENGINE (MACRO-TO-MICRO PLANETARY ORBITS)
  // ============================================================================
  function updateFlightPhysics() {
    const speeds = { 1: 0.45, 2: 2.2, 3: 8.5, 4: 28.0 };
    const spd = speeds[shipFlight.warpLevel] || 2.2;

    if (shipFlight.autopilot && shipFlight.targetSys) {
      const t = shipFlight.targetSys;
      const dx = t.x - shipFlight.x;
      const dy = (t.y + 4) - shipFlight.y;
      const dz = (t.z - shipFlight.stopDistance) - shipFlight.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 1.8) {
        shipFlight.autopilot = false;
        shipFlight.speed = 0;
        shipFlight.bank *= 0.82;
        // Face directly toward the star & its orbiting planets!
        shipFlight.yaw = Math.atan2(t.x - shipFlight.x, t.z - shipFlight.z);
        shipFlight.pitch = Math.asin(Math.max(-0.8, Math.min(0.8, (t.y - shipFlight.y) / Math.max(1, Math.hypot(t.x - shipFlight.x, t.y - shipFlight.y, t.z - shipFlight.z)))));
        showShipBanner(`ARRIVED AT ${t.hostname.toUpperCase()} — ${t.planets.length} ORBITING PLANET(S) EXPANDED IN 3D SPACE!`);
      } else {
        shipFlight.yaw = Math.atan2(dx, dz);
        shipFlight.pitch = Math.asin(Math.max(-0.9, Math.min(0.9, dy / dist)));
        const step = Math.max(0.6, Math.min(dist * 0.14, 32.0));
        shipFlight.vx = (dx / dist) * step;
        shipFlight.vy = (dy / dist) * step;
        shipFlight.vz = (dz / dist) * step;
        shipFlight.x += shipFlight.vx;
        shipFlight.y += shipFlight.vy;
        shipFlight.z += shipFlight.vz;
        shipFlight.speed = step;
      }
      return;
    }

    let turning = 0;
    if (keys['ArrowLeft'] || keys['KeyQ'] || padHold.turnL)  { shipFlight.yaw -= 0.03; turning = -1; }
    if (keys['ArrowRight'] || keys['KeyE'] || padHold.turnR) { shipFlight.yaw += 0.03; turning = 1; }
    if (padHold.up)   shipFlight.pitch = Math.min(1.0, shipFlight.pitch + 0.022);
    if (padHold.down) shipFlight.pitch = Math.max(-1.0, shipFlight.pitch - 0.022);

    shipFlight.bank += (turning * 0.32 - shipFlight.bank) * 0.15;

    const fx = Math.sin(shipFlight.yaw) * Math.cos(shipFlight.pitch);
    const fy = Math.sin(shipFlight.pitch);
    const fz = Math.cos(shipFlight.yaw) * Math.cos(shipFlight.pitch);
    const rx = Math.cos(shipFlight.yaw), rz = -Math.sin(shipFlight.yaw);

    shipFlight.vx *= 0.85; shipFlight.vy *= 0.85; shipFlight.vz *= 0.85;
    shipFlight.speed *= 0.85;

    if (keys['KeyW'] || keys['ArrowUp'] || padHold.fwd) {
      shipFlight.vx = fx * spd; shipFlight.vy = fy * spd; shipFlight.vz = fz * spd;
      shipFlight.x += shipFlight.vx; shipFlight.y += shipFlight.vy; shipFlight.z += shipFlight.vz;
      shipFlight.speed = spd;
    }
    if (keys['KeyS'] || keys['ArrowDown'] || padHold.back) {
      shipFlight.vx = -fx * spd; shipFlight.vy = -fy * spd; shipFlight.vz = -fz * spd;
      shipFlight.x += shipFlight.vx; shipFlight.y += shipFlight.vy; shipFlight.z += shipFlight.vz;
      shipFlight.speed = spd * 0.6;
    }
    if (keys['KeyA'] || padHold.left)  { shipFlight.x -= rx * spd * 0.75; shipFlight.z -= rz * spd * 0.75; shipFlight.speed = spd * 0.5; }
    if (keys['KeyD'] || padHold.right) { shipFlight.x += rx * spd * 0.75; shipFlight.z += rz * spd * 0.75; shipFlight.speed = spd * 0.5; }
    if (keys['Space']) shipFlight.y += spd * 0.65;
    if (keys['KeyC'])  shipFlight.y -= spd * 0.65;
  }

  function renderSpaceFlight(ctx, w, h, animPhase) {
    window.drawSciFiStarfield(ctx, w, h, 314159);
    const fov = 540;
    visibleScreenStars = [];
    visibleScreenPlanets = [];

    // 1. Render 3D Volumetric Galactic Nebulae in true 3D world coordinates
    for (const neb of volumetricNebulae) {
      const np = project3D(neb.x, neb.y, neb.z, shipFlight, w, h, fov);
      if (!np) continue;
      const nr = Math.min(480, Math.max(60, neb.r * np.scale));
      const g = ctx.createRadialGradient(np.sx, np.sy, nr * 0.05, np.sx, np.sy, nr);
      g.addColorStop(0, neb.col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(np.sx, np.sy, nr, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render 3D Galactic Sector Waypoint Beacons
    for (const sec of GALACTIC_SECTORS) {
      const sp = project3D(sec.x, sec.y + 45, sec.z, shipFlight, w, h, fov);
      if (!sp || sp.sx < 0 || sp.sx > w || sp.sy < 0 || sp.sy > h) continue;
      ctx.save();
      ctx.strokeStyle = sec.color;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sp.sx, sp.sy, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = sec.color;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(sec.name, sp.sx + 18, sp.sy + 4);
      ctx.restore();
    }

    // 3. Project Star Systems within 1,400 units (vast 3D sight distance!)
    const projected = [];
    for (let i = 0; i < starSystems3D.length; i++) {
      const s = starSystems3D[i];
      const prj = project3D(s.x, s.y, s.z, shipFlight, w, h, fov);
      if (!prj || prj.sx < -120 || prj.sx > w + 120 || prj.sy < -120 || prj.sy > h + 120) continue;
      if (prj.rz > 1400) continue;
      projected.push({ sys: s, prj: prj });
    }
    projected.sort((a, b) => b.prj.rz - a.prj.rz);

    const activeHost = window.selectedPlanet ? window.selectedPlanet.hostname : '';

    // Limit to closest 600 visible stars for 60fps performance
    const renderList = projected.length > 600 ? projected.slice(projected.length - 600) : projected;

    for (let i = 0; i < renderList.length; i++) {
      const { sys, prj } = renderList[i];
      const isTarget = sys.hostname === activeHost;
      const sCol = window.getStarColors(sys.teff, sys.spectype);
      const starRadius = Math.max(1.6, Math.min(34, (68 / prj.rz)));

      // Soft coronal glow around nearby stars
      if (prj.rz < 180 || isTarget) {
        const haloR = starRadius * (isTarget ? 4.2 : 2.6);
        const halo = ctx.createRadialGradient(prj.sx, prj.sy, starRadius * 0.2, prj.sx, prj.sy, haloR);
        halo.addColorStop(0, sCol.core);
        halo.addColorStop(0.35, isTarget ? '#00ff9d' : sCol.corona);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(prj.sx, prj.sy, haloR, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = sCol.corona;
        ctx.beginPath();
        ctx.arc(prj.sx, prj.sy, starRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      visibleScreenStars.push({ sx: prj.sx, sy: prj.sy, sr: starRadius, sys: sys });

      // True 3D World-Space Planetary Orbits when within 65 units of a star system (or locked target)!
      if (prj.rz < 65 || isTarget) {
        if (starRadius > 5) {
          window.drawStarWithDiffractionSpikes(ctx, prj.sx, prj.sy, starRadius, sCol, animPhase);
        }

        const numP = Math.min(8, sys.planets.length);
        for (let pIdx = 0; pIdx < numP; pIdx++) {
          const pl = sys.planets[pIdx];
          // True 3D world-space orbit radius around (sys.x, sys.y, sys.z)
          const orbitWorldR = 2.4 + pIdx * 1.85;
          const period = Math.max(0.8, Number(pl.pl_orbper) || (4 + pIdx * 8));
          const ang = animPhase * (4.5 / Math.pow(period, 0.55)) + pIdx * 1.35;

          // Draw 3D orbital ring in world space (24 segments)
          ctx.beginPath();
          let started = false;
          for (let seg = 0; seg <= 24; seg++) {
            const sa = (seg / 24) * Math.PI * 2;
            const ox = sys.x + Math.cos(sa) * orbitWorldR;
            const oy = sys.y + Math.sin(sa) * (orbitWorldR * 0.18);
            const oz = sys.z + Math.sin(sa) * orbitWorldR;
            const op = project3D(ox, oy, oz, shipFlight, w, h, fov);
            if (!op) continue;
            if (!started) { ctx.moveTo(op.sx, op.sy); started = true; }
            else ctx.lineTo(op.sx, op.sy);
          }
          ctx.strokeStyle = isTarget ? 'rgba(0, 255, 157, 0.38)' : 'rgba(0, 240, 255, 0.22)';
          ctx.lineWidth = isTarget ? 1.4 : 1.0;
          ctx.stroke();

          // Planet 3D world coordinates
          const pwx = sys.x + Math.cos(ang) * orbitWorldR;
          const pwy = sys.y + Math.sin(ang) * (orbitWorldR * 0.18);
          const pwz = sys.z + Math.sin(ang) * orbitWorldR;
          const pProj = project3D(pwx, pwy, pwz, shipFlight, w, h, fov);
          if (!pProj) continue;

          const pr = Math.max(4, Math.min(36, (16 / pProj.rz) * Math.pow(Number(pl.pl_rade) || 1, 0.55)));
          const isSelectedPlanet = window.selectedPlanet && pl.pl_name === window.selectedPlanet.pl_name;

          if (pr >= 7 || isSelectedPlanet) {
            window.renderRaycastPlanetGlobe(ctx, pProj.sx, pProj.sy, Math.max(8, pr), pl, animPhase * 0.6, true, false);
          } else {
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.arc(pProj.sx, pProj.sy, pr, 0, Math.PI * 2);
            ctx.fill();
          }

          if (isSelectedPlanet) {
            ctx.strokeStyle = '#00ff9d';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(pProj.sx, pProj.sy, Math.max(8, pr) + 5, 0, Math.PI * 2);
            ctx.stroke();
          }

          if (pProj.rz < 35 || isSelectedPlanet) {
            ctx.fillStyle = isSelectedPlanet ? '#00ff9d' : '#e2f1ff';
            ctx.font = isSelectedPlanet ? 'bold 12px monospace' : '12px monospace';
            ctx.fillText(`${pl.pl_name} (${Number(pl.pl_orbsmax).toFixed(3)} AU)`, pProj.sx + pr + 6, pProj.sy + 4);
          }

          visibleScreenPlanets.push({ sx: pProj.sx, sy: pProj.sy, pr: Math.max(8, pr), planet: pl });
        }

        ctx.fillStyle = isTarget ? '#00ff9d' : '#bae6fd';
        ctx.font = isTarget ? 'bold 12px monospace' : '12px monospace';
        ctx.fillText(`${sys.hostname} [${sys.planets.length}p | ${sys.realDistPc.toFixed(1)} pc]`, prj.sx + starRadius + 8, prj.sy - 4);
      }
    }

    // 4. Render 3D Space-Dust Motion Particles wrapping around ship
    for (let i = 0; i < spaceDust3D.length; i++) {
      const d = spaceDust3D[i];
      // Wrap modularly within [-80, +80] cube around shipFlight
      const wx = shipFlight.x + ((((d.ox - shipFlight.x) % 160) + 240) % 160 - 80);
      const wy = shipFlight.y + ((((d.oy - shipFlight.y) % 160) + 240) % 160 - 80);
      const wz = shipFlight.z + ((((d.oz - shipFlight.z) % 160) + 240) % 160 - 80);
      const dp = project3D(wx, wy, wz, shipFlight, w, h, fov);
      if (!dp) continue;
      const alpha = Math.max(0.1, Math.min(0.75, 1.0 - dp.rz / 90));
      ctx.fillStyle = d.col;
      ctx.globalAlpha = alpha;
      ctx.fillRect(dp.sx, dp.sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    if (flightCamView === 'chase') {
      draw3DSpaceshipExterior(ctx, w, h, animPhase);
    } else {
      drawCockpitCanopyOverlay(ctx, w, h);
    }
    drawShipHudBanners(ctx, w, h);
  }

  function draw3DSpaceshipExterior(ctx, w, h, animPhase) {
    const cx = w * 0.5;
    const cy = h * 0.74;
    const thrust = shipFlight.speed > 0.02 || shipFlight.autopilot ? 1.0 : 0.35;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(shipFlight.bank);

    const wingGrad = ctx.createLinearGradient(-150, 0, 150, 0);
    wingGrad.addColorStop(0, '#0f172a');
    wingGrad.addColorStop(0.5, '#334155');
    wingGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = wingGrad;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -68);
    ctx.lineTo(148, 26);
    ctx.lineTo(95, 38);
    ctx.lineTo(38, 18);
    ctx.lineTo(-38, 18);
    ctx.lineTo(-95, 38);
    ctx.lineTo(-148, 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -84);
    ctx.lineTo(34, 24);
    ctx.lineTo(-34, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.lineTo(14, -12);
    ctx.lineTo(-14, -12);
    ctx.closePath();
    ctx.fill();

    [-108, 108].forEach(nx => {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 1.6;
      ctx.fillRect(nx - 10, -14, 20, 48);
      ctx.strokeRect(nx - 10, -14, 20, 48);
    });

    [-22, 22, -108, 108].forEach((tx, idx) => {
      const isMain = idx < 2;
      const plumeLen = (isMain ? 52 : 36) * thrust + Math.sin(animPhase * 18 + idx) * 8;
      const rad = isMain ? 14 : 9;
      const pGrad = ctx.createRadialGradient(tx, 26, 2, tx, 26 + plumeLen * 0.4, plumeLen);
      pGrad.addColorStop(0, '#ffffff');
      pGrad.addColorStop(0.35, isMain ? '#00f0ff' : '#00ff9d');
      pGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(tx, 26 + plumeLen * 0.35, rad, plumeLen, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    const distFromSol = Math.hypot(shipFlight.x, shipFlight.y, shipFlight.z);
    ctx.fillStyle = 'rgba(3, 9, 22, 0.88)';
    ctx.fillRect(18, 18, 325, 76);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.strokeRect(18, 18, 325, 76);
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`CSV ASTRONAV-PRIME // 3D GALACTIC FLIGHT`, 30, 38);
    ctx.fillStyle = '#e2f1ff';
    ctx.font = '12px monospace';
    ctx.fillText(`GALACTIC XYZ: [${shipFlight.x.toFixed(0)}, ${shipFlight.y.toFixed(0)}, ${shipFlight.z.toFixed(0)}]`, 30, 58);
    ctx.fillText(`SOL RANGE: ${distFromSol.toFixed(1)} PC | STARS: 4,847 (360° 3D)`, 30, 78);
  }

  function drawCockpitCanopyOverlay(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.14); ctx.lineTo(w * 0.22, 0);
    ctx.moveTo(w, h * 0.14); ctx.lineTo(w * 0.78, 0);
    ctx.moveTo(0, h * 0.82); ctx.lineTo(w * 0.18, h);
    ctx.moveTo(w, h * 0.82); ctx.lineTo(w * 0.82, h);
    ctx.stroke();

    const cx = w * 0.5, cy = h * 0.5;
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.65)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawShipHudBanners(ctx, w, h) {
    if (roamMode === 'bridge' && nearestStation) {
      ctx.save();
      ctx.fillStyle = 'rgba(3, 12, 28, 0.94)';
      ctx.strokeStyle = nearestStation.color;
      ctx.lineWidth = 1.8;
      const bw = 540, bh = 36;
      ctx.fillRect(w * 0.5 - bw * 0.5, h - 84, bw, bh);
      ctx.strokeRect(w * 0.5 - bw * 0.5, h - 84, bw, bh);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`AT ${nearestStation.name} — PRESS [F] TO ${nearestStation.action}`, w * 0.5, h - 61);
      ctx.restore();
    }

    if (bannerTimer > 0 && bannerMsg) {
      ctx.save();
      ctx.fillStyle = 'rgba(3, 14, 30, 0.92)';
      ctx.strokeStyle = '#00f0ff';
      const bw = 680, bh = 32;
      ctx.fillRect(w * 0.5 - bw * 0.5, 16, bw, bh);
      ctx.strokeRect(w * 0.5 - bw * 0.5, 16, bw, bh);
      ctx.fillStyle = '#00ff9d';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(bannerMsg, w * 0.5, 37);
      ctx.restore();
    }
  }

  return {
    build3DStarCatalog,
    initControls,
    setPadHold,
    resetCameraView,
    toggleFlightCameraView,
    setRoamSubMode,
    setWarpLevel,
    jumpToSector,
    flyToNearestUnvisitedSystem,
    engageAutopilotToSelected,
    teleportToStation,
    triggerActiveStationOrAutopilot,
    updateAndRender
  };
})();
