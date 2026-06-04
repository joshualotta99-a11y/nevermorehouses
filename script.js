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
  x: 64,
  y: 38,
};
let scanFound = false;
let scanStarted = false;
let moonReady = false;
let moonRevealTimer = null;
let cameraStream = null;

function setScannerMoonPosition(x, y) {
  sigilPosition.x = x;
  sigilPosition.y = y;
  scanner.style.setProperty("--moon-x", `${sigilPosition.x}%`);
  scanner.style.setProperty("--moon-y", `${sigilPosition.y}%`);
}

function randomizeMoonPosition() {
  const x = Math.round(24 + Math.random() * 52);
  const y = Math.round(26 + Math.random() * 42);
  setScannerMoonPosition(x, y);
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
  scanner.classList.remove("is-searching", "is-near", "is-hot", "is-found", "moon-loading", "moon-ready");
  scanner.style.setProperty("--signal-strength", "0%");
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
  scanner.classList.remove("moon-ready", "is-near", "is-hot", "is-found");
  scanner.classList.add("moon-loading");
  randomizeMoonPosition();
  distanceReadout.textContent = "Maan laadt";
  scanStatus.textContent = "Kijk rustig om je heen. De Noctis-maan verschijnt over 7 seconden...";
  if (arNotice) {
    arNotice.textContent = "Kijk langzaam om je heen. De 3D Noctis-maan wordt geladen...";
  }

  moonRevealTimer = setTimeout(() => {
    moonReady = true;
    scanner.classList.remove("moon-loading");
    scanner.classList.add("moon-ready");
    distanceReadout.textContent = "Maan geladen";
    scanStatus.textContent = "De Noctis-maan is in je omgeving geladen. Zoek het gouden licht en tik erop.";
    if (arNotice) {
      arNotice.textContent = "De Noctis-maan is ergens in beeld geladen. Kijk om je heen en tik wanneer je haar ziet.";
    }
  }, 7000);
}

setScannerMoonPosition(sigilPosition.x, sigilPosition.y);

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
  if (!cameraStream) {
    return;
  }
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraFeed.srcObject = null;
  clearTimeout(moonRevealTimer);
  moonReady = false;
  scanner.classList.remove("has-camera", "moon-loading", "moon-ready", "is-near", "is-hot");
}

function updateScanner(event) {
  if (!scanStarted || scanFound) {
    return;
  }

  if (!moonReady) {
    distanceReadout.textContent = "Maan laadt";
    scanStatus.textContent = "De Noctis-maan wordt nog geladen. Kijk alvast rustig om je heen.";
    return;
  }

  const bounds = scanner.getBoundingClientRect();
  const pointerX = ((event.clientX - bounds.left) / bounds.width) * 100;
  const pointerY = ((event.clientY - bounds.top) / bounds.height) * 100;
  const x = Math.max(0, Math.min(100, pointerX));
  const y = Math.max(0, Math.min(100, pointerY));
  const distance = Math.hypot(x - sigilPosition.x, y - sigilPosition.y);
  const strength = Math.max(0, Math.round(100 - distance * 3.2));

  scanner.style.setProperty("--lens-x", `${x}%`);
  scanner.style.setProperty("--lens-y", `${y}%`);
  scanner.style.setProperty("--signal-strength", `${strength}%`);
  signalMeter.style.width = `${strength}%`;

  scanner.classList.toggle("is-near", distance < 22);
  scanner.classList.toggle("is-hot", distance < 10);

  if (distance < 7) {
    distanceReadout.textContent = "Maan gevonden";
    scanStatus.textContent = "Tik op de Noctis-maan om je vondst te bevestigen";
    scanner.classList.add("is-hot");
    return;
  }

  if (distance < 10) {
    distanceReadout.textContent = "Heel dichtbij";
    scanStatus.textContent = "De Noctis-maan gloeit vlakbij";
  } else if (distance < 22) {
    distanceReadout.textContent = "Dichtbij";
    scanStatus.textContent = "De scanner vangt goud maanlicht op";
  } else {
    distanceReadout.textContent = "Nog zoeken";
    scanStatus.textContent = "Kijk verder om je heen en volg het gouden licht";
  }
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
  forceNoctisOutcome();
  updateHouseOutcome();
  scanner.classList.add("is-searching", "moon-loading");
  scanner.classList.remove("moon-ready", "is-found", "is-hot", "is-near");
  scanButton.textContent = "Zoek de maan";
  distanceReadout.textContent = "Camera starten";
  scanStatus.textContent = "Camera wordt gestart...";
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
  updateScanner(event);
});

hiddenSigil.addEventListener("click", () => {
  if (moonReady && scanner.classList.contains("is-hot")) {
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
