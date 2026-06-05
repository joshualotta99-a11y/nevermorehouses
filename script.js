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
const CLICK_HIT_RADIUS = 58;
const MOON_LOCK_POSITION = {
  x: 50,
  y: 48,
};
let scanFound = false;
let scanStarted = false;
let moonReady = false;
let moonAcquired = false;
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

function shortestAngleDelta(current, origin) {
  return ((current - origin + 540) % 360) - 180;
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
  if (moonAcquired) {
    setScannerMoonScreenPosition(MOON_LOCK_POSITION.x, MOON_LOCK_POSITION.y);
    return {
      ...MOON_LOCK_POSITION,
    };
  }

  const screenX = 50 + (sigilPosition.x - cameraView.x);
  const screenY = 50 + (sigilPosition.y - cameraView.y);
  setScannerMoonScreenPosition(screenX, screenY);
  return {
    x: screenX,
    y: screenY,
  };
}

function randomizeMoonPosition() {
  const side = Math.random() < 0.5 ? 0 : 1;
  const edge = Math.round(96 + Math.random() * 5);
  const inner = Math.round(42 + Math.random() * 16);

  if (side === 0) {
    sigilPosition.x = 100 - edge;
    sigilPosition.y = inner;
  } else if (side === 1) {
    sigilPosition.x = edge;
    sigilPosition.y = inner;
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
  moonAcquired = false;
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
  moonAcquired = false;
  scanner.classList.remove("moon-ready", "moon-visible", "is-near", "is-hot", "is-found");
  scanner.classList.add("moon-loading");
  randomizeMoonPosition();
  distanceReadout.textContent = "Maan laadt";
  scanStatus.textContent = "Kijk rustig om je heen. De Noctis-maan wordt in de omgeving geplaatst...";
  if (arNotice) {
    arNotice.textContent = "Kijk alvast rustig rond. De maan staat straks dichtbij, maar net buiten je eerste blik.";
  }

  moonRevealTimer = setTimeout(() => {
    moonReady = true;
    scanner.classList.remove("moon-loading");
    scanner.classList.add("moon-ready");
    updateSearchFeedback();
    if (arNotice) {
      arNotice.textContent = "De Noctis-maan is geladen. Draai langzaam naar links of rechts tot je haar tegenkomt.";
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
    scanStatus.textContent = "Camera actief. Draai langzaam naar links of rechts tot de Noctis-maan verschijnt";
    if (arNotice) {
      arNotice.textContent = "Camera actief. Blijf rustig draaien: de 3D Noctis-maan laadt nu in.";
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

  const alpha = Number.isFinite(event.alpha) ? event.alpha : null;
  const gamma = Number.isFinite(event.gamma) ? event.gamma : 0;
  const beta = Number.isFinite(event.beta) ? event.beta : 0;

  if (!orientationOrigin) {
    orientationOrigin = {
      alpha,
      gamma,
      beta,
    };
  }

  const yawDelta =
    alpha !== null && orientationOrigin.alpha !== null
      ? shortestAngleDelta(alpha, orientationOrigin.alpha)
      : gamma - orientationOrigin.gamma;
  const pitchDelta = beta - orientationOrigin.beta;
  const targetX = 50 + clampNumber(yawDelta * 1.9, -92, 92);
  const targetY = 50 + clampNumber(pitchDelta * 1.35, -86, 86);
  const smoothX = cameraView.x + (targetX - cameraView.x) * 0.34;
  const smoothY = cameraView.y + (targetY - cameraView.y) * 0.3;
  setCameraView(smoothX, smoothY, 50, 50);
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

  const isNearView =
    moonScreenPosition.x > -6 &&
    moonScreenPosition.x < 106 &&
    moonScreenPosition.y > -6 &&
    moonScreenPosition.y < 106;
  const isCenteredEnough =
    moonScreenPosition.x > 24 &&
    moonScreenPosition.x < 76 &&
    moonScreenPosition.y > 24 &&
    moonScreenPosition.y < 76;

  if (!moonAcquired && isCenteredEnough) {
    moonAcquired = true;
    setScannerMoonScreenPosition(MOON_LOCK_POSITION.x, MOON_LOCK_POSITION.y);
  }

  const isVisible = moonAcquired;
  const distanceToAim = Math.hypot(moonScreenPosition.x - scanAim.x, moonScreenPosition.y - scanAim.y);
  const distanceToCenter = Math.hypot(moonScreenPosition.x - 50, moonScreenPosition.y - 50);
  const strength = isNearView
    ? Math.max(12, Math.round(100 - Math.min(distanceToAim, distanceToCenter) * 2.4))
    : Math.max(0, Math.round(18 - Math.min(Math.abs(moonScreenPosition.x - 50), Math.abs(moonScreenPosition.y - 50)) * 0.15));

  scanner.style.setProperty("--signal-strength", `${strength}%`);
  signalMeter.style.width = `${strength}%`;
  scanner.classList.toggle("moon-visible", isVisible);
  scanner.classList.toggle("is-near", isVisible && distanceToCenter < 36);
  scanner.classList.toggle("is-hot", isVisible && distanceToAim < CLICK_HIT_RADIUS);

  if (!isNearView) {
    distanceReadout.textContent = "Buiten beeld";
    scanStatus.textContent = "De maan is dichtbij. Draai langzaam naar links of rechts tot ze in beeld komt.";
    return;
  }

  if (!isVisible) {
    distanceReadout.textContent = "Bijna";
    scanStatus.textContent = "Je bent dichtbij. Draai nog iets verder tot de maan volledig in beeld komt.";
    return;
  }

  if (distanceToAim < CLICK_HIT_RADIUS) {
    distanceReadout.textContent = "Maan gevonden";
    scanStatus.textContent = "Tik op of rond de Noctis-maan om je vondst te bevestigen";
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

function revealSigil() {
  forceNoctisOutcome();
  updateHouseOutcome();
  clearTimeout(moonRevealTimer);
  moonReady = true;
  moonAcquired = true;
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

function isTapNearMoon(event) {
  if (!moonReady || !scanner.classList.contains("moon-visible")) {
    return false;
  }

  const bounds = scanner.getBoundingClientRect();
  const tapX = ((event.clientX - bounds.left) / bounds.width) * 100;
  const tapY = ((event.clientY - bounds.top) / bounds.height) * 100;
  return Math.hypot(tapX - moonScreenPosition.x, tapY - moonScreenPosition.y) < CLICK_HIT_RADIUS + 18;
}

scanButton.addEventListener("click", async () => {
  if (scanFound) {
    showPanel("result");
    return;
  }

  scanStarted = true;
  scanFound = false;
  moonReady = false;
  moonAcquired = false;
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

scanner.addEventListener("pointerdown", (event) => {
  if (!scanStarted) {
    scanButton.click();
    return;
  }
  event.preventDefault();
  const canConfirmMoon = moonReady && scanner.classList.contains("moon-visible");
  if (canConfirmMoon && (event.target === hiddenSigil || isTapNearMoon(event))) {
    revealSigil();
    return;
  }
});

scanner.addEventListener("dragstart", (event) => {
  event.preventDefault();
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
