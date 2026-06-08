let locations = [];
let dataPack = null;
let quantumDrives = {};
let quantumDriveData = null;

const FALLBACK_DATA = {
  schemaVersion: 1,
  gameVersion: "fallback",
  updatedAt: "local",
  distanceModel: "approximate-route-score",
  locations: [
    { id: "nyx-gateway-stanton", name: "Nyx Gateway (Stanton)", system: "Stanton", region: "Gateway", type: "Gateway", aliases: ["sta", "nyx gateway", "ngs"], x: 13, y: 78, z: 23 },
    { id: "pyro-gateway-stanton", name: "Pyro Gateway (Stanton)", system: "Stanton", region: "Gateway", type: "Gateway", aliases: ["sta", "pyro gateway", "pgs"], x: 82, y: 50, z: 20 },
    { id: "stanton-gateway-pyro", name: "Stanton Gateway (Pyro)", system: "Pyro", region: "Gateway", type: "Gateway", aliases: ["sta", "stanton gateway", "sgp"], x: 93, y: 47, z: 20 },
    { id: "area18", name: "Area18", system: "Stanton", region: "ArcCorp", type: "City", aliases: ["a18", "area 18", "arccorp"], x: 71, y: 63, z: 25 },
    { id: "everus-harbor", name: "Everus Harbor", system: "Stanton", region: "Hurston", type: "Station", aliases: ["everus", "eh"], x: 47, y: 40, z: 27 },
    { id: "new-babbage", name: "New Babbage", system: "Stanton", region: "microTech", type: "City", aliases: ["nb", "babbage"], x: 24, y: 15, z: 40 },
    { id: "seraphim-station", name: "Seraphim Station", system: "Stanton", region: "Crusader", type: "Station", aliases: ["seraphim"], x: 31, y: 62, z: 24 }
  ]
};

const state = {
  mode: "collect",
  destination: null,
  start: null,
  pickups: [],
  route: [],
  deliveryNotes: {}
};

const els = {
  destinationInput: document.querySelector("#destinationInput"),
  startInput: document.querySelector("#startInput"),
  pickupInput: document.querySelector("#pickupInput"),
  destinationSuggestions: document.querySelector("#destinationSuggestions"),
  startSuggestions: document.querySelector("#startSuggestions"),
  pickupSuggestions: document.querySelector("#pickupSuggestions"),
  pickupList: document.querySelector("#pickupList"),
  routeSteps: document.querySelector("#routeSteps"),
  legTable: document.querySelector("#legTable"),
  totalDistance: document.querySelector("#totalDistance"),
  totalTime: document.querySelector("#totalTime"),
  legCount: document.querySelector("#legCount"),
  pointCount: document.querySelector("#pointCount"),
  routeMode: document.querySelector("#routeMode"),
  dataVersion: document.querySelector("#dataVersion"),
  dataSummary: document.querySelector("#dataSummary"),
  dataImport: document.querySelector("#dataImport"),
  driveSelect: document.querySelector("#driveSelect"),
  destinationLabel: document.querySelector("#destinationLabel"),
  pickupLabel: document.querySelector("#pickupLabel"),
  selectedListTitle: document.querySelector("#selectedListTitle"),
  startField: document.querySelector("#startField"),
  collectMode: document.querySelector("#collectMode"),
  deliverMode: document.querySelector("#deliverMode")
};

const combos = [
  { input: els.destinationInput, list: els.destinationSuggestions, mode: "destination" },
  { input: els.startInput, list: els.startSuggestions, mode: "start" },
  { input: els.pickupInput, list: els.pickupSuggestions, mode: "pickup" }
];

const SYSTEM_PRIORITY = ["Stanton", "Pyro", "Nyx"];
const ROUTE_TEXT = {
  collect: {
    modeLabel: "\u56de\u53ce -> \u6700\u7d42\u7d0d\u54c1",
    pointUnit: "pickups",
    destinationLabel: "\u6700\u7d42\u914d\u9054\u5730\u70b9",
    pickupLabel: "\u56de\u53ce\u5730\u70b9",
    listTitle: "\u56de\u53ce\u30ea\u30b9\u30c8",
    empty: "\u56de\u53ce\u5730\u70b9\u306a\u3057",
    routeOrigin: "\u56de\u53ce",
    routeEnd: "\u6700\u7d42\u7d0d\u54c1",
    shareTitle: "\u3010ORCA \u56de\u53ce -> \u7d0d\u54c1\u30eb\u30fc\u30c8\u3011",
    fixedPoint: "\u6700\u7d42\u7d0d\u54c1",
    variableCount: "\u56de\u53ce\u6570",
    current: "\u73fe\u5728\u5730"
  },
  deliver: {
    modeLabel: "\u4e00\u62ec\u56de\u53ce -> \u8907\u6570\u7d0d\u54c1",
    pointUnit: "drops",
    destinationLabel: "\u8ca8\u7269\u56de\u53ce\u5730\u70b9",
    pickupLabel: "\u7d0d\u54c1\u5730\u70b9",
    listTitle: "\u7d0d\u54c1\u30ea\u30b9\u30c8",
    empty: "\u7d0d\u54c1\u5730\u70b9\u306a\u3057",
    routeOrigin: "\u8ca8\u7269\u56de\u53ce",
    routeEnd: "\u7d0d\u54c1",
    shareTitle: "\u3010ORCA \u4e00\u62ec\u56de\u53ce -> \u8907\u6570\u7d0d\u54c1\u30eb\u30fc\u30c8\u3011",
    fixedPoint: "\u8ca8\u7269\u56de\u53ce",
    variableCount: "\u7d0d\u54c1\u6570",
    current: ""
  }
};
const FALLBACK_QUANTUM_DRIVES = [
  { id: "atlas", name: "Atlas", size: 1, speedKmS: 231000, speedLabel: "231 Mm/s", overheadSeconds: 14.2 },
  { id: "voyage", name: "Voyage", size: 1, speedKmS: 198000, speedLabel: "198 Mm/s", overheadSeconds: 15.5 },
  { id: "vk-00", name: "VK-00", size: 1, speedKmS: 266000, speedLabel: "266 Mm/s", overheadSeconds: 18.2 },
  { id: "crossfield", name: "Crossfield", size: 2, speedKmS: 231000, speedLabel: "231 Mm/s", overheadSeconds: 29.1 },
  { id: "hemera", name: "Hemera", size: 2, speedKmS: 282000, speedLabel: "282 Mm/s", overheadSeconds: 23.16 },
  { id: "xl-1", name: "XL-1", size: 2, speedKmS: 324000, speedLabel: "324 Mm/s", overheadSeconds: 30.36 },
  { id: "ts-2", name: "TS-2", size: 3, speedKmS: 395000, speedLabel: "395 Mm/s", overheadSeconds: 21.2 }
];

function setInputsEnabled(enabled) {
  combos.forEach((combo) => {
    combo.input.disabled = !enabled;
  });
}

function normalizeData(rawData) {
  if (!rawData || !Array.isArray(rawData.locations)) {
    throw new Error("locations array is missing");
  }

  const normalizedLocations = rawData.locations
    .filter((location) => location && location.id && location.name)
    .map((location) => ({
      ...location,
      aliases: Array.isArray(location.aliases) ? location.aliases : [],
      system: location.system || "Unknown",
      region: location.region || location.system || "Unknown",
      type: location.type || "Location",
      providers: Array.isArray(location.providers) ? location.providers : [],
      x: Number(location.x),
      y: Number(location.y),
      z: Number(location.z)
    }))
    .filter((location) => Number.isFinite(location.x) && Number.isFinite(location.y) && Number.isFinite(location.z));

  if (!normalizedLocations.length) {
    throw new Error("no valid locations found");
  }

  return { ...rawData, locations: normalizedLocations };
}

async function loadLocationData() {
  try {
    const response = await fetch("data/locations.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyDataPack(normalizeData(await response.json()));
  } catch (error) {
    applyDataPack(normalizeData(FALLBACK_DATA));
    showToast(`Data fallback loaded: ${error.message}`);
  }
}

function applyDataPack(pack) {
  dataPack = pack;
  locations = pack.locations;
  state.destination = null;
  state.start = null;
  state.pickups = state.pickups.filter((pickup) => locations.some((location) => location.id === pickup.id));
  state.route = [];
  state.deliveryNotes = {};
  combos.forEach((combo) => {
    combo.input.value = "";
  });
  setInputsEnabled(true);
  render();
}

function normalizeQuantumDriveData(rawData) {
  const drives = Array.isArray(rawData?.drives) ? rawData.drives : rawData;
  if (!Array.isArray(drives)) {
    throw new Error("quantum drives array is missing");
  }

  const normalizedDrives = drives
    .filter((drive) => drive && drive.id && drive.name)
    .map((drive) => ({
      ...drive,
      id: String(drive.id),
      name: String(drive.name),
      size: Number(drive.size),
      speedKmS: Number(drive.speedKmS),
      overheadSeconds: Number(drive.overheadSeconds),
      modelOverheadSeconds: Number.isFinite(Number(drive.modelOverheadSeconds))
        ? Number(drive.modelOverheadSeconds)
        : Number(drive.overheadSeconds)
    }))
    .filter((drive) => (
      drive.size >= 1
      && drive.size <= 3
      && Number.isFinite(drive.speedKmS)
      && drive.speedKmS > 0
      && Number.isFinite(drive.modelOverheadSeconds)
    ))
    .sort((a, b) => a.size - b.size || a.name.localeCompare(b.name, "en"));

  if (!normalizedDrives.length) {
    throw new Error("no valid quantum drives found");
  }

  return { ...rawData, drives: normalizedDrives };
}

async function loadQuantumDriveData() {
  try {
    const response = await fetch("data/quantum-drives.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    applyQuantumDriveData(normalizeQuantumDriveData(await response.json()));
  } catch (error) {
    applyQuantumDriveData({
      schemaVersion: 1,
      gameVersion: "fallback",
      updatedAt: "local",
      drives: FALLBACK_QUANTUM_DRIVES
    });
    showToast(`Quantum Drive fallback loaded: ${error.message}`);
  }
}

function applyQuantumDriveData(pack) {
  quantumDriveData = pack;
  quantumDrives = Object.fromEntries(pack.drives.map((drive) => [drive.id, drive]));
  renderDriveOptions(pack.drives);
  render();
}

function renderDriveOptions(drives) {
  if (!els.driveSelect) return;

  const previousValue = els.driveSelect.value;
  els.driveSelect.innerHTML = "";

  [1, 2, 3].forEach((size) => {
    const groupDrives = drives.filter((drive) => drive.size === size);
    if (!groupDrives.length) return;

    const group = document.createElement("optgroup");
    group.label = `Size ${size}`;
    groupDrives.forEach((drive) => {
      const option = document.createElement("option");
      option.value = drive.id;
      option.textContent = `${drive.name} / ${drive.speedKmS.toLocaleString("ja-JP")} km/s`;
      group.appendChild(option);
    });
    els.driveSelect.appendChild(group);
  });

  if (previousValue && quantumDrives[previousValue]) {
    els.driveSelect.value = previousValue;
    return;
  }

  els.driveSelect.value = quantumDrives["xl-1"] ? "xl-1" : drives[0]?.id || "";
}

function routeText() {
  return ROUTE_TEXT[state.mode];
}

function setRouteMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  state.start = null;
  state.route = [];
  els.startInput.value = "";
  closeSuggestions();
  render();
}

function searchableText(location) {
  return [
    location.name,
    location.system,
    location.region,
    location.type,
    ...(location.providers || []),
    ...(location.aliases || [])
  ].join(" ").toLowerCase();
}

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[()'`.-]/g, " ")
    .replace(/\s+/g, " ");
}

function scoreLocation(location, query) {
  const q = normalize(query);
  const name = normalize(location.name);
  const aliases = (location.aliases || []).map(normalize);
  const haystack = normalize(searchableText(location));

  if (!q) return 1;
  if (q === "sta" && name.startsWith("stanton gateway") && name.includes("nyx")) return 118;
  if (q === "sta" && name.startsWith("stanton gateway")) return 116;
  if (q === "sta" && aliases.includes("sta")) return 110;
  if (name === q) return 120;
  if (name.startsWith(q)) return 100;
  if (aliases.some((alias) => alias === q)) return 96;
  if (aliases.some((alias) => alias.startsWith(q))) return 88;
  if (name.includes(q)) return 72;
  if (haystack.includes(q)) return 58;
  return 0;
}

function searchLocations(query, limit = 9) {
  return locations
    .map((location) => ({ location, score: scoreLocation(location, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff) return scoreDiff;
      const systemDiff = systemRank(a.location.system) - systemRank(b.location.system);
      if (systemDiff) return systemDiff;
      return a.location.name.localeCompare(b.location.name);
    })
    .slice(0, limit)
    .map((entry) => entry.location);
}

function systemRank(system) {
  const index = SYSTEM_PRIORITY.indexOf(system);
  return index === -1 ? 99 : index;
}

function renderSuggestions(combo) {
  const matches = searchLocations(combo.input.value);
  combo.list.innerHTML = "";

  if (!combo.input.value.trim() || matches.length === 0) {
    combo.list.classList.remove("is-open");
    combo.input.setAttribute("aria-expanded", "false");
    return;
  }

  matches.forEach((location, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `suggestion${index === 0 ? " is-active" : ""}`;
    button.setAttribute("role", "option");
    button.innerHTML = `
      <span>
        <strong>${escapeHtml(location.name)}</strong>
        <small>${escapeHtml(location.system)} / ${escapeHtml(location.region)} / ${escapeHtml(location.type)}</small>
      </span>
      <span class="tag">${escapeHtml(location.aliases?.[0] || location.system)}</span>
    `;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      chooseLocation(combo.mode, location);
    });
    combo.list.appendChild(button);
  });

  combo.list.classList.add("is-open");
  combo.input.setAttribute("aria-expanded", "true");
}

function chooseLocation(mode, location) {
  if (mode === "destination") {
    state.destination = location;
    els.destinationInput.value = location.name;
  }

  if (mode === "start") {
    state.start = location;
    els.startInput.value = location.name;
  }

  if (mode === "pickup") {
    addPickup(location);
    els.pickupInput.value = "";
  }

  closeSuggestions();
  render();
}

function resolveInputLocation(input) {
  return searchLocations(input.value, 1)[0] || null;
}

function addPickup(location) {
  if (!location) {
    showToast("\u5019\u88dc\u304b\u3089\u5730\u70b9\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044");
    return;
  }
  if (state.pickups.some((pickup) => pickup.id === location.id)) {
    showToast("\u540c\u3058\u56de\u53ce\u5730\u70b9\u304c\u5165\u3063\u3066\u3044\u307e\u3059");
    return;
  }
  if (state.destination?.id === location.id) {
    showToast(`${routeText().destinationLabel}\u3068\u540c\u3058\u5730\u70b9\u3067\u3059`);
    return;
  }
  state.pickups.push(location);
  state.route = [];
}

function removePickup(id) {
  state.pickups = state.pickups.filter((pickup) => pickup.id !== id);
  state.route = [];
  render();
}

function movePickup(index, delta) {
  const next = index + delta;
  if (next < 0 || next >= state.pickups.length) return;
  const copy = [...state.pickups];
  [copy[index], copy[next]] = [copy[next], copy[index]];
  state.pickups = copy;
  state.route = buildManualRoute(copy);
  updateRouteViews(buildRouteResult(state.route, state.mode === "collect" ? state.start : null));
  renderPickups();
}

function buildManualRoute(points = state.pickups) {
  if (!state.destination) return [];
  return state.mode === "deliver"
    ? [state.destination, ...points]
    : [...points, state.destination];
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function formatDistance(value) {
  const digits = value < 10 ? 1 : 0;
  return `${value.toLocaleString("ja-JP", { maximumFractionDigits: digits })} Gm`;
}

function currentDrive() {
  return quantumDrives[els.driveSelect?.value]
    || quantumDrives["xl-1"]
    || FALLBACK_QUANTUM_DRIVES.find((drive) => drive.id === "xl-1")
    || FALLBACK_QUANTUM_DRIVES[0];
}

function estimateTravelSeconds(distanceGm, drive = currentDrive()) {
  const overhead = Number.isFinite(drive.modelOverheadSeconds) ? drive.modelOverheadSeconds : drive.overheadSeconds;
  return (distanceGm * 1000000) / drive.speedKmS + overhead;
}

function estimateTotalSeconds(legs, drive = currentDrive()) {
  return legs.reduce((sum, leg) => sum + estimateTravelSeconds(leg.distance, drive), 0);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

function optimizeRoute(pickups, destination, start) {
  if (!destination || pickups.length === 0) return null;
  if (pickups.length > 16) return optimizeGreedy(pickups, destination, start);

  const n = pickups.length;
  const memo = new Map();

  for (let i = 0; i < n; i += 1) {
    const mask = 1 << i;
    memo.set(`${mask}|${i}`, {
      cost: start ? distance(start, pickups[i]) : 0,
      previous: -1
    });
  }

  for (let mask = 1; mask < 1 << n; mask += 1) {
    for (let last = 0; last < n; last += 1) {
      const current = memo.get(`${mask}|${last}`);
      if (!current) continue;

      for (let next = 0; next < n; next += 1) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const nextKey = `${nextMask}|${next}`;
        const nextCost = current.cost + distance(pickups[last], pickups[next]);
        const stored = memo.get(nextKey);
        if (!stored || nextCost < stored.cost) {
          memo.set(nextKey, { cost: nextCost, previous: last });
        }
      }
    }
  }

  const fullMask = (1 << n) - 1;
  let best = { cost: Infinity, last: -1 };

  for (let last = 0; last < n; last += 1) {
    const current = memo.get(`${fullMask}|${last}`);
    if (!current) continue;
    const total = current.cost + distance(pickups[last], destination);
    if (total < best.cost) best = { cost: total, last };
  }

  const order = [];
  let mask = fullMask;
  let last = best.last;

  while (last !== -1) {
    order.push(last);
    const current = memo.get(`${mask}|${last}`);
    const previous = current.previous;
    mask ^= 1 << last;
    last = previous;
  }

  order.reverse();
  const route = [...order.map((index) => pickups[index]), destination];
  return buildRouteResult(route, start, best.cost);
}

function optimizeDeliveryRoute(origin, drops) {
  if (!origin || drops.length === 0) return null;
  if (drops.length > 16) return optimizeDeliveryGreedy(origin, drops);

  const n = drops.length;
  const memo = new Map();

  for (let i = 0; i < n; i += 1) {
    const mask = 1 << i;
    memo.set(`${mask}|${i}`, {
      cost: distance(origin, drops[i]),
      previous: -1
    });
  }

  for (let mask = 1; mask < 1 << n; mask += 1) {
    for (let last = 0; last < n; last += 1) {
      const current = memo.get(`${mask}|${last}`);
      if (!current) continue;

      for (let next = 0; next < n; next += 1) {
        if (mask & (1 << next)) continue;
        const nextMask = mask | (1 << next);
        const nextKey = `${nextMask}|${next}`;
        const nextCost = current.cost + distance(drops[last], drops[next]);
        const stored = memo.get(nextKey);
        if (!stored || nextCost < stored.cost) {
          memo.set(nextKey, { cost: nextCost, previous: last });
        }
      }
    }
  }

  const fullMask = (1 << n) - 1;
  let best = { cost: Infinity, last: -1 };

  for (let last = 0; last < n; last += 1) {
    const current = memo.get(`${fullMask}|${last}`);
    if (current && current.cost < best.cost) best = { cost: current.cost, last };
  }

  const order = [];
  let mask = fullMask;
  let last = best.last;

  while (last !== -1) {
    order.push(last);
    const current = memo.get(`${mask}|${last}`);
    const previous = current.previous;
    mask ^= 1 << last;
    last = previous;
  }

  order.reverse();
  const route = [origin, ...order.map((index) => drops[index])];
  return buildRouteResult(route, null, best.cost);
}

function optimizeDeliveryGreedy(origin, drops) {
  const remaining = [...drops];
  const route = [origin];
  let current = origin;

  while (remaining.length) {
    let bestIndex = 0;
    let bestCost = Infinity;
    remaining.forEach((location, index) => {
      const cost = distance(current, location);
      if (cost < bestCost) {
        bestIndex = index;
        bestCost = cost;
      }
    });
    current = remaining.splice(bestIndex, 1)[0];
    route.push(current);
  }

  return buildRouteResult(route);
}

function optimizeGreedy(pickups, destination, start) {
  const remaining = [...pickups];
  const route = [];
  let current = start || destination;

  while (remaining.length) {
    let bestIndex = 0;
    let bestCost = Infinity;
    remaining.forEach((location, index) => {
      const cost = start || route.length ? distance(current, location) : distance(location, destination);
      if (cost < bestCost) {
        bestIndex = index;
        bestCost = cost;
      }
    });
    current = remaining.splice(bestIndex, 1)[0];
    route.push(current);
  }

  route.push(destination);
  return buildRouteResult(route, start);
}

function buildRouteResult(route, start, presetTotal) {
  const points = start ? [start, ...route] : route;
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    legs.push({ from: points[i], to: points[i + 1], distance: distance(points[i], points[i + 1]) });
  }
  const total = Number.isFinite(presetTotal) ? presetTotal : legs.reduce((sum, leg) => sum + leg.distance, 0);
  return { route, legs, total };
}

function calculate() {
  if (!state.destination) {
    state.destination = resolveInputLocation(els.destinationInput);
    if (state.destination) els.destinationInput.value = state.destination.name;
  }

  if (state.mode === "collect" && !state.start && els.startInput.value.trim()) {
    state.start = resolveInputLocation(els.startInput);
    if (state.start) els.startInput.value = state.start.name;
  }

  if (els.pickupInput.value.trim()) {
    addPickup(resolveInputLocation(els.pickupInput));
    els.pickupInput.value = "";
  }

  if (!state.destination || state.pickups.length === 0) {
    showToast(`${routeText().destinationLabel}\u3068${routeText().pickupLabel}\u3092\u5165\u308c\u3066\u304f\u3060\u3055\u3044`);
    render();
    return;
  }

  const result = state.mode === "deliver"
    ? optimizeDeliveryRoute(state.destination, state.pickups)
    : optimizeRoute(state.pickups, state.destination, state.start);
  state.route = result.route;
  updateRouteViews(result);
  render();
}

function updateRouteViews(result) {
  if (!result) {
    els.totalDistance.textContent = "--";
    els.totalTime.textContent = "--";
    els.legCount.textContent = "--";
    els.routeSteps.innerHTML = "";
    els.legTable.innerHTML = "";
    return;
  }

  const drive = currentDrive();
  const totalSeconds = estimateTotalSeconds(result.legs, drive);

  els.totalDistance.textContent = formatDistance(result.total);
  els.totalTime.textContent = formatDuration(totalSeconds);
  els.legCount.textContent = result.legs.length.toString();
  renderRouteSteps(result);

  els.legTable.innerHTML = result.legs.map((leg) => `
    <div class="leg-row">
      <span>${escapeHtml(leg.from.name)} -> ${escapeHtml(leg.to.name)}</span>
      <strong>${formatDistance(leg.distance)} / ${formatDuration(estimateTravelSeconds(leg.distance, drive))}</strong>
    </div>
  `).join("");

}

function renderRouteSteps(result) {
  els.routeSteps.innerHTML = "";

  result.route.forEach((location, index) => {
    const item = document.createElement("li");
    const role = routeStepRole(index, result.route.length);
    const isDeliveryMemoTarget = state.mode === "deliver" && index > 0;

    if (!isDeliveryMemoTarget) {
      item.innerHTML = `
        <div>
          <strong>${escapeHtml(location.name)}</strong>
          <span>${escapeHtml(role)} / ${escapeHtml(location.system)}</span>
        </div>
      `;
      els.routeSteps.appendChild(item);
      return;
    }

    const details = document.createElement("details");
    details.className = "route-note";
    details.innerHTML = `
      <summary>
        <span>
          <strong>${escapeHtml(location.name)}</strong>
          <span>${escapeHtml(role)} / ${escapeHtml(location.system)}</span>
        </span>
      </summary>
      <label class="note-label" for="note-${escapeHtml(location.id)}">\u7d0d\u54c1\u30e1\u30e2</label>
      <textarea class="station-note" id="note-${escapeHtml(location.id)}" data-location-id="${escapeHtml(location.id)}" rows="3" placeholder="\u70ad\u7d20 3 / \u30b3\u30e9\u30f3\u30c0\u30e0 8"></textarea>
    `;
    item.appendChild(details);
    els.routeSteps.appendChild(item);

    const textarea = item.querySelector(".station-note");
    textarea.value = state.deliveryNotes[location.id] || "";
    textarea.addEventListener("input", () => {
      const value = textarea.value.trim();
      if (value) {
        state.deliveryNotes[location.id] = textarea.value;
      } else {
        delete state.deliveryNotes[location.id];
      }
    });
  });
}

function routeStepRole(index, length) {
  if (state.mode === "deliver") {
    return index === 0 ? routeText().routeOrigin : routeText().routeEnd;
  }
  return index === length - 1 ? routeText().routeEnd : routeText().routeOrigin;
}

function renderPickups() {
  els.pickupList.innerHTML = "";

  if (state.pickups.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = routeText().empty;
    els.pickupList.appendChild(empty);
    return;
  }

  state.pickups.forEach((location) => {
    const item = document.createElement("div");
    item.className = "pickup-item";
    item.innerHTML = `
      <span>
        <strong>${escapeHtml(location.name)}</strong>
        <span>${escapeHtml(location.system)} / ${escapeHtml(location.region)} / ${escapeHtml(location.type)}</span>
      </span>
      <span class="mini-actions">
        <button type="button" aria-label="remove ${escapeHtml(location.name)}">×</button>
      </span>
    `;
    item.querySelector("button").addEventListener("click", () => removePickup(location.id));
    els.pickupList.appendChild(item);
  });
}

function renderStatus() {
  const text = routeText();
  els.pointCount.textContent = `${state.pickups.length} ${text.pointUnit}`;
  els.routeMode.textContent = state.mode === "deliver" ? "drop route" : (state.start ? "start fixed" : "free start");
  els.dataVersion.textContent = dataPack ? dataPack.gameVersion : "data loading";
  els.dataSummary.textContent = dataPack
    ? `${dataPack.gameVersion} / ${locations.length} locations`
    : "Loading...";
  els.destinationLabel.textContent = text.destinationLabel;
  els.pickupLabel.textContent = text.pickupLabel;
  els.selectedListTitle.textContent = text.listTitle;
  els.startField.hidden = state.mode === "deliver";
  els.collectMode.classList.toggle("is-active", state.mode === "collect");
  els.deliverMode.classList.toggle("is-active", state.mode === "deliver");
  els.collectMode.setAttribute("aria-pressed", state.mode === "collect" ? "true" : "false");
  els.deliverMode.setAttribute("aria-pressed", state.mode === "deliver" ? "true" : "false");
}

function render() {
  renderPickups();
  renderStatus();
  if (!state.route.length) updateRouteViews(null);
}

function closeSuggestions() {
  combos.forEach((combo) => {
    combo.list.classList.remove("is-open");
    combo.input.setAttribute("aria-expanded", "false");
  });
}

function showToast(message) {
  document.querySelector(".toast")?.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

combos.forEach((combo) => {
  combo.input.addEventListener("input", () => {
    if (combo.mode === "destination") state.destination = null;
    if (combo.mode === "start") state.start = null;
    renderSuggestions(combo);
  });

  combo.input.addEventListener("focus", () => renderSuggestions(combo));

  combo.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const match = searchLocations(combo.input.value, 1)[0];
      if (match) {
        event.preventDefault();
        chooseLocation(combo.mode, match);
      }
    }
    if (event.key === "Escape") closeSuggestions();
  });
});

document.addEventListener("mousedown", (event) => {
  if (!event.target.closest(".combo")) closeSuggestions();
});

document.querySelector("#addPickup").addEventListener("click", () => {
  addPickup(resolveInputLocation(els.pickupInput));
  els.pickupInput.value = "";
  render();
});

document.querySelector("#routeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

document.querySelector("#clearDestination").addEventListener("click", () => {
  state.destination = null;
  els.destinationInput.value = "";
  state.route = [];
  render();
});

document.querySelector("#clearStart").addEventListener("click", () => {
  state.start = null;
  els.startInput.value = "";
  state.route = [];
  render();
});

document.querySelector("#resetAll").addEventListener("click", () => {
  state.destination = null;
  state.start = null;
  state.pickups = [];
  state.route = [];
  state.deliveryNotes = {};
  els.destinationInput.value = "";
  els.startInput.value = "";
  els.pickupInput.value = "";
  render();
});

document.querySelector("#loadSample").addEventListener("click", () => {
  state.start = null;
  if (state.mode === "deliver") {
    state.destination = locations.find((location) => location.id === "sakura-sun-goldenrod-workcenter") || locations[0];
    state.pickups = ["port-tressler", "rayari-deltana", "new-babbage", "shubin-sm0-18", "harpers-point"]
      .map((id) => locations.find((location) => location.id === id))
      .filter(Boolean);
  } else {
    state.destination = locations.find((location) => location.id === "nyx-gateway-stanton") || locations[0];
    state.pickups = ["area18", "everus-harbor", "seraphim-station", "new-babbage", "pyro-gateway-stanton"]
    .map((id) => locations.find((location) => location.id === id))
    .filter(Boolean);
  }
  els.destinationInput.value = state.destination.name;
  els.startInput.value = "";
  calculate();
});

els.driveSelect.addEventListener("change", () => {
  if (!state.route.length) return;
  updateRouteViews(buildRouteResult(state.route, state.mode === "collect" ? state.start : null));
});

els.collectMode.addEventListener("click", () => setRouteMode("collect"));
els.deliverMode.addEventListener("click", () => setRouteMode("deliver"));

els.dataImport.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const pack = normalizeData(JSON.parse(await file.text()));
    applyDataPack(pack);
    showToast(`Loaded ${pack.gameVersion || "custom"} / ${pack.locations.length} locations`);
  } catch (error) {
    showToast(`JSON import failed: ${error.message}`);
  } finally {
    event.target.value = "";
  }
});

setInputsEnabled(false);
render();
loadLocationData();
loadQuantumDriveData();
