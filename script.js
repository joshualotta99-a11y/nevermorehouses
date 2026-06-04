if (window.location.hash) {
  history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  window.addEventListener("load", () => {
    document.querySelector("#home")?.scrollIntoView({ block: "start" });
  });
}

const steps = document.querySelectorAll(".step");
const panels = {
  intro: document.querySelector("#panel-intro"),
  scan: document.querySelector("#panel-scan"),
  hint: document.querySelector("#panel-hint"),
  result: document.querySelector("#panel-result"),
};
const houses = document.querySelectorAll(".house");
const houseSelect = document.querySelector('select[name="talent"]');
const resultCrest = document.querySelector(".result .crest");
const resultCopy = document.querySelector(".result-copy");
const houseDetailSymbol = document.querySelector(".house-detail-symbol");
const houseDetailName = document.querySelector(".house-detail-name");
const houseDetailCopy = document.querySelector(".house-detail-copy");
const houseNextCrest = document.querySelector(".houses .next-band .small-crest");
const houseMeaning = document.querySelector(".house-meaning");
const houseMeaningSymbol = document.querySelector(".house-meaning-symbol");
const houseMeaningName = document.querySelector(".house-meaning-name");
const houseMeaningCopy = document.querySelector(".house-meaning-copy");
const noctisOutcome = {
  name: "Noctis",
  symbol: "☾",
  description: "Voor studenten die nieuwsgierig zijn en verborgen waarheden willen ontdekken.",
};
let selectedHouse = {
  name: "Nevermore",
  symbol: "N",
  description: "Voor studenten die stilte, diepgang en mysterie zoeken.",
};

function showPanel(name) {
  steps.forEach((step) => step.classList.toggle("is-active", step.dataset.panel === name));
  Object.entries(panels).forEach(([panelName, panel]) => {
    panel.classList.toggle("is-active", panelName === name);
  });

  if (name === "scan") {
    forceNoctisOutcome();
    resetMoonScan();
    updateHouseOutcome();
  } else {
    stopCamera();
  }
}

steps.forEach((step) => {
  step.addEventListener("click", () => showPanel(step.dataset.panel));
});

document.querySelectorAll(".next-step").forEach((button) => {
  button.addEventListener("click", () => {
    const nextPanel = button.dataset.next;
    showPanel(nextPanel);

    if (!button.closest(".route-panel") && panels[nextPanel]) {
      panels[nextPanel].scrollIntoView({ block: "start" });
    }
  });
});

function setSelectedHouse(house) {
  selectedHouse = {
    name: house.dataset.house,
    symbol: house.dataset.symbol,
    description: house.dataset.description,
  };
  houses.forEach((item) => {
    const isSelected = item === house;
    item.classList.toggle("is-active", isSelected);
    item.setAttribute("aria-pressed", String(isSelected));
    item.setAttribute("aria-expanded", String(isSelected));
  });
  if (houseMeaning) {
    houseMeaning.hidden = false;
  }
  if (houseSelect) {
    houseSelect.value = selectedHouse.name;
  }
  updateHouseOutcome();
}

houses.forEach((house) => {
  house.addEventListener("click", () => {
    setSelectedHouse(house);
  });
});

document.querySelectorAll(".choice").forEach((choice) => {
  choice.addEventListener("click", () => choice.classList.toggle("primary"));
});

const scanButton = document.querySelector("#scanButton");
const scanner = document.querySelector(".scanner");
const cameraFeed = document.querySelector(".camera-feed");
const scanStatus = document.querySelector(".scan-status");
const arNotice = document.querySelector("#arNotice");
const hiddenSigil = document.querySelector(".hidden-sigil");
const distanceReadout = document.querySelector(".distance-readout");
const signalMeter = document.querySelector(".signal-meter span");
const revealSymbol = document.querySelector(".house-reveal-symbol");
const revealName = document.querySelector(".house-reveal-name");
const revealCopy = document.querySelector(".house-reveal-copy");
const noctisModel = document.querySelector(".noctis-moon-model");
const sigilPosition = {
  x: 136,
  y: 54,
};
const cameraView = {
  x: 50,
  y: 50,
};
const scanAim = {
  x: 50,
  y: 50,
};
const CLICK_HIT_RADIUS = 24;
let scanFound = false;
let scanStarted = false;
let moonReady = false;
let moonRevealTimer = null;
let cameraStream = null;
let orientationStarted = false;
let orientationOrigin = null;
let moonScreenPosition = {
  x: 136,
  y: 54,
};

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setScannerMoonScreenPosition(x, y) {
  moonScreenPosition = {
    x,
    y,
  };
  scanner.style.setProperty("--moon-x", `${x}%`);
  scanner.style.setProperty("--moon-y", `${y}%`);
}

function updateMoonScreenPosition() {
  const screenX = 50 + (sigilPosition.x - cameraView.x);
  const screenY = 50 + (sigilPosition.y - cameraView.y);
  setScannerMoonScreenPosition(screenX, screenY);
  return {
    x: screenX,
    y: screenY,
  };
}

function randomizeMoonPosition() {
  const side = Math.floor(Math.random() * 4);
  const edge = Math.round(130 + Math.random() * 8);
  const inner = Math.round(28 + Math.random() * 44);

  if (side === 0) {
    sigilPosition.x = -edge + 100;
    sigilPosition.y = inner;
  } else if (side === 1) {
    sigilPosition.x = edge;
    sigilPosition.y = inner;
  } else if (side === 2) {
    sigilPosition.x = inner;
    sigilPosition.y = -edge + 100;
  } else {
    sigilPosition.x = inner;
    sigilPosition.y = edge;
  }

  cameraView.x = 50;
  cameraView.y = 50;
  scanAim.x = 50;
  scanAim.y = 50;
  scanner.style.setProperty("--lens-x", "50%");
  scanner.style.setProperty("--lens-y", "50%");
  updateMoonScreenPosition();
}

function forceNoctisOutcome() {
  selectedHouse = { ...noctisOutcome };
  houses.forEach((item) => {
    const isNoctis = item.dataset.house === noctisOutcome.name;
    item.classList.toggle("is-active", isNoctis);
    item.setAttribute("aria-pressed", String(isNoctis));
    item.setAttribute("aria-expanded", String(isNoctis));
  });
  if (houseMeaning) {
    houseMeaning.hidden = false;
  }
  if (houseSelect) {
    houseSelect.value = noctisOutcome.name;
  }
}

function resetMoonScan() {
  clearTimeout(moonRevealTimer);
  moonRevealTimer = null;
  scanFound = false;
  scanStarted = false;
  moonReady = false;
  orientationOrigin = null;
  cameraView.x = 50;
  cameraView.y = 50;
  scanAim.x = 50;
  scanAim.y = 50;
  scanner.classList.remove("is-searching", "is-near", "is-hot", "is-found", "moon-loading", "moon-ready", "moon-visible");
  scanner.style.setProperty("--signal-strength", "0%");
  scanner.style.setProperty("--lens-x", "50%");
  scanner.style.setProperty("--lens-y", "50%");
  setScannerMoonScreenPosition(136, 54);
  signalMeter.style.width = "0%";
  distanceReadout.textContent = "Onbekend";
  scanButton.textContent = "Start camera en scan";
  scanStatus.textContent = "Klik op start, geef camera toestemming en zoek de Noctis-maan...";
  if (arNotice) {
    arNotice.textContent = "Start de camera en kijk langzaam om je heen.";
  }
}

function scheduleNoctisMoonReveal() {
  clearTimeout(moonRevealTimer);
  moonReady = false;
  scanner.classList.remove("moon-ready", "moon-visible", "is-near", "is-hot", "is-found");
  scanner.classList.add("moon-loading");
  randomizeMoonPosition();
  distanceReadout.textContent = "Maan laadt";
  scanStatus.textContent = "Kijk rustig om je heen. De Noctis-maan wordt in de omgeving geplaatst...";
  if (arNotice) {
    arNotice.textContent = "Kijk alvast langzaam rond. De maan is er straks, maar niet meteen recht voor je.";
  }

  moonRevealTimer = setTimeout(() => {
    moonReady = true;
    scanner.classList.remove("moon-loading");
    scanner.classList.add("moon-ready");
    updateSearchFeedback();
    if (arNotice) {
      arNotice.textContent = "De Noctis-maan is geladen, maar niet recht voor je. Kijk om je heen tot je haar tegenkomt.";
    }
  }, 7000);
}

setScannerMoonScreenPosition(moonScreenPosition.x, moonScreenPosition.y);

if (window.customElements?.whenDefined && noctisModel) {
  window.customElements.whenDefined("model-viewer").then(() => {
    scanner.classList.add("has-model-viewer");
  });
}

function updateHouseOutcome() {
  if (houseDetailSymbol) {
    houseDetailSymbol.textContent = selectedHouse.symbol;
  }
  if (houseDetailName) {
    houseDetailName.textContent = selectedHouse.name;
  }
  if (houseDetailCopy) {
    houseDetailCopy.textContent = selectedHouse.description;
  }
  if (houseNextCrest) {
    houseNextCrest.textContent = selectedHouse.symbol;
  }
  if (houseMeaningSymbol) {
    houseMeaningSymbol.textContent = selectedHouse.symbol;
  }
  if (houseMeaningName) {
    houseMeaningName.textContent = selectedHouse.name;
  }
  if (houseMeaningCopy) {
    houseMeaningCopy.textContent = selectedHouse.description;
  }
  hiddenSigil.textContent = noctisOutcome.symbol;
  revealSymbol.textContent = noctisOutcome.symbol;
  revealName.textContent = noctisOutcome.name;
  revealCopy.textContent = noctisOutcome.description;
  if (resultCrest) {
    resultCrest.textContent = selectedHouse.symbol;
  }
  if (resultCopy) {
    resultCopy.textContent = `Het verborgen symbool is gevonden. Je komt in aanmerking voor huis ${selectedHouse.name}: ${selectedHouse.description}`;
  }
}

async function startCamera() {
  if (cameraStream) {
    return true;
  }

  if (!window.isSecureContext) {
    scanStatus.textContent =
      "Camera werkt alleen via localhost of een beveiligde HTTPS-link. Open de site op dit apparaat via 127.0.0.1.";
    return false;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    scanStatus.textContent = "Deze browser ondersteunt geen cameratoegang; gebruik de fallback scan";
    return false;
  }

  const cameraOptions = [
    {
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    },
    {
      video: true,
      audio: false,
    },
  ];

  try {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia(cameraOptions[0]);
    } catch (error) {
      cameraStream = await navigator.mediaDevices.getUserMedia(cameraOptions[1]);
    }

    cameraFeed.srcObject = cameraStream;
    cameraFeed.muted = true;
    cameraFeed.playsInline = true;
    await cameraFeed.play();
    scanner.classList.add("has-camera");
    scanStatus.textContent = "Camera actief. Kijk langzaam om je heen tot de Noctis-maan verschijnt";
    if (arNotice) {
      arNotice.textContent = "Camera actief. Blijf rondkijken: de 3D Noctis-maan laadt nu in.";
    }
    return true;
  } catch (error) {
    const cameraMessages = {
      NotAllowedError: "Camera geweigerd. Geef toestemming in je browser en probeer opnieuw.",
      NotFoundError: "Geen camera gevonden op dit apparaat; gebruik de fallback scan.",
      NotReadableError: "Camera is al in gebruik door een andere app. Sluit die app en probeer opnieuw.",
      OverconstrainedError: "Deze camera-instelling wordt niet ondersteund; probeer opnieuw.",
    };
    scanStatus.textContent = cameraMessages[error.name] || "Camera kon niet starten; fallback scan actief";
    stopCamera();
    return false;
  }
}

function stopCamera() {
  clearTimeout(moonRevealTimer);
  moonRevealTimer = null;
  moonReady = false;
  scanner.classList.remove("moon-loading", "moon-ready", "moon-visible", "is-near", "is-hot");

  if (!cameraStream) {
    return;
  }
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraFeed.srcObject = null;
  scanner.classList.remove("has-camera");
}

async function startOrientationTracking() {
  if (orientationStarted || !("DeviceOrientationEvent" in window)) {
    return;
  }

  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        return;
      }
    } catch (error) {
      return;
    }
  }

  orientationStarted = true;
  orientationOrigin = null;
  window.addEventListener("deviceorientation", handleDeviceOrientation, true);
}

function handleDeviceOrientation(event) {
  if (!scanStarted || scanFound) {
    return;
  }

  const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
  const beta = Number.isFinite(event.beta) ? event.beta : 0;

  if (!orientationOrigin) {
    orientationOrigin = {
      gamma,
      beta,
    };
  }

  const deltaX = clampNumber((gamma - orientationOrigin.gamma) * 2.2, -90, 90);
  const deltaY = clampNumber((beta - orientationOrigin.beta) * 1.45, -90, 90);
  setCameraView(50 + deltaX, 50 + deltaY, 50, 50);
}

function setCameraView(viewX, viewY, aimX, aimY) {
  cameraView.x = clampNumber(viewX, -42, 142);
  cameraView.y = clampNumber(viewY, -42, 142);
  scanAim.x = clampNumber(aimX, 0, 100);
  scanAim.y = clampNumber(aimY, 0, 100);
  scanner.style.setProperty("--lens-x", `${scanAim.x}%`);
  scanner.style.setProperty("--lens-y", `${scanAim.y}%`);
  updateMoonScreenPosition();
  updateSearchFeedback();
}

function updateSearchFeedback() {
  if (!scanStarted || scanFound) {
    return;
  }

  if (!moonReady) {
    distanceReadout.textContent = "Maan laadt";
    scanStatus.textContent = "De Noctis-maan wordt nog geladen. Kijk alvast rustig om je heen.";
    return;
  }

  const isVisible =
    moonScreenPosition.x > 7 &&
    moonScreenPosition.x < 93 &&
    moonScreenPosition.y > 7 &&
    moonScreenPosition.y < 93;
  const distanceToAim = Math.hypot(moonScreenPosition.x - scanAim.x, moonScreenPosition.y - scanAim.y);
  const distanceToCenter = Math.hypot(moonScreenPosition.x - 50, moonScreenPosition.y - 50);
  const strength = isVisible
    ? Math.max(12, Math.round(100 - Math.min(distanceToAim, distanceToCenter) * 2.4))
    : Math.max(0, Math.round(18 - Math.min(Math.abs(moonScreenPosition.x - 50), Math.abs(moonScreenPosition.y - 50)) * 0.15));

  scanner.style.setProperty("--signal-strength", `${strength}%`);
  signalMeter.style.width = `${strength}%`;
  scanner.classList.toggle("moon-visible", isVisible);
  scanner.classList.toggle("is-near", isVisible && distanceToCenter < 36);
  scanner.classList.toggle("is-hot", isVisible && distanceToAim < CLICK_HIT_RADIUS);

  if (!isVisible) {
    distanceReadout.textContent = "Buiten beeld";
    scanStatus.textContent = "De maan is geladen, maar nog niet in beeld. Kijk langzaam verder om je heen.";
    return;
  }

  if (distanceToAim < CLICK_HIT_RADIUS) {
    distanceReadout.textContent = "Maan gevonden";
    scanStatus.textContent = "Tik op de Noctis-maan om je vondst te bevestigen";
    return;
  }

  if (distanceToCenter < 36) {
    distanceReadout.textContent = "Maan in beeld";
    scanStatus.textContent = "Je ziet goud maanlicht. Richt je blik dichter op de Noctis-maan.";
  } else {
    distanceReadout.textContent = "Dichtbij";
    scanStatus.textContent = "De Noctis-maan komt langs je beeld. Blijf rustig zoeken.";
  }
}

function updateScanner(event) {
  if (!scanStarted || scanFound) {
    return;
  }

  const bounds = scanner.getBoundingClientRect();
  const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
  const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
  const x = Math.max(0, Math.min(100, pointerX));
  const y = Math.max(0, Math.min(100, pointerY));
  const viewX = 50 + (x - 50) * 1.82;
  const viewY = 50 + (y - 50) * 1.82;
  setCameraView(viewX, viewY, x, y);
}

function revealSigil() {
  forceNoctisOutcome();
  updateHouseOutcome();
  clearTimeout(moonRevealTimer);
  moonReady = true;
  scanFound = true;
  scanner.classList.add("is-found", "is-hot");
  scanner.classList.remove("is-searching", "moon-loading");
  scanner.classList.add("moon-ready");
  scanner.style.setProperty("--signal-strength", "100%");
  signalMeter.style.width = "100%";
  distanceReadout.textContent = "Noctis gevonden";
  scanStatus.textContent = "Noctis-maan gevonden. Jij komt in aanmerking voor huis Noctis.";
  if (arNotice) {
    arNotice.textContent = "Je hebt de Noctis-maan gevonden.";
  }
  scanButton.textContent = "Bekijk Noctis-resultaat";
}

scanButton.addEventListener("click", async () => {
  if (scanFound) {
    showPanel("result");
    return;
  }

  scanStarted = true;
  scanFound = false;
  moonReady = false;
  orientationOrigin = null;
  forceNoctisOutcome();
  updateHouseOutcome();
  scanner.classList.add("is-searching", "moon-loading");
  scanner.classList.remove("moon-ready", "moon-visible", "is-found", "is-hot", "is-near");
  scanButton.textContent = "Zoek de maan";
  distanceReadout.textContent = "Camera starten";
  scanStatus.textContent = "Camera wordt gestart...";
  await startOrientationTracking();
  const cameraActive = await startCamera();
  if (!cameraActive) {
    scanner.classList.remove("is-searching", "moon-loading");
    scanButton.textContent = "Camera opnieuw proberen";
    return;
  }
  scheduleNoctisMoonReveal();
});

scanner.addEventListener("pointermove", updateScanner);
scanner.addEventListener("pointerdown", (event) => {
  if (!scanStarted) {
    scanButton.click();
  }
  if (event.target === hiddenSigil && moonReady && scanner.classList.contains("moon-visible")) {
    event.preventDefault();
    revealSigil();
    return;
  }
  updateScanner(event);
});

hiddenSigil.addEventListener("click", () => {
  if (moonReady && scanner.classList.contains("moon-visible")) {
    revealSigil();
  }
});

document.querySelector(".signup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = document.querySelector(".form-message");
  message.textContent = "Je uitnodiging is bevestigd. Welkom bij Nevermore Academy.";
  event.currentTarget.reset();
});

updateHouseOutcome();
