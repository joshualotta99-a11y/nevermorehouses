const canvas = document.getElementById("promoCanvas");
const ctx = canvas.getContext("2d");
const playButton = document.getElementById("playPromo");
const recordButton = document.getElementById("recordPromo");
const downloadLink = document.getElementById("downloadPromo");
const statusText = document.getElementById("promoStatus");
const dataStore = document.getElementById("promoDataStore");

const W = canvas.width;
const H = canvas.height;
const DURATION = 34000;
const GOLD = "#c8943d";
const GOLD_LIGHT = "#ead1a0";
const CREAM = "#f0dfbd";
const MUTED = "#d3bc91";
const BG = "#030c18";

const imageSources = {
  gate: "assets/ref-home-gate.png",
  home: "preview.png",
  ar: "preview-ar.png",
  route: "assets/ref-route-gate.png",
  interior: "assets/ref-about-interior.png",
  nevermore: "assets/sharp-houses/house-nevermore-sharp.jpg",
  noctis: "assets/sharp-houses/house-noctis-sharp.jpg",
  umbra: "assets/sharp-houses/house-umbra-sharp.jpg",
  ignis: "assets/sharp-houses/house-ignis-sharp.jpg",
};

const images = {};
let animationId = 0;
let playStartedAt = 0;
let imagesReady = false;

function loadImages() {
  return Promise.all(
    Object.entries(imageSources).map(([key, src]) => {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
          images[key] = image;
          resolve();
        };
        image.onerror = resolve;
        image.src = src;
      });
    })
  ).then(() => {
    imagesReady = true;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function ease(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function segmentProgress(time, start, end) {
  return clamp((time - start) / (end - start), 0, 1);
}

function coverImage(image, x, y, width, height, zoom = 1, shiftX = 0, shiftY = 0) {
  if (!image) return;
  const imageRatio = image.width / image.height;
  const frameRatio = width / height;
  let drawW;
  let drawH;
  if (imageRatio > frameRatio) {
    drawH = height * zoom;
    drawW = drawH * imageRatio;
  } else {
    drawW = width * zoom;
    drawH = drawW / imageRatio;
  }
  const drawX = x + (width - drawW) / 2 + shiftX;
  const drawY = y + (height - drawH) / 2 + shiftY;
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
}

function roundRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#061426");
  gradient.addColorStop(0.55, "#030c18");
  gradient.addColorStop(1, "#020814");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, 0, 20, W * 0.5, 0, H * 0.8);
  glow.addColorStop(0, "rgba(80, 41, 105, 0.42)");
  glow.addColorStop(0.5, "rgba(80, 41, 105, 0.08)");
  glow.addColorStop(1, "rgba(80, 41, 105, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
}

function drawFrame(opacity = 1) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = "rgba(200, 148, 61, 0.86)";
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, W - 52, H - 52);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(200, 148, 61, 0.38)";
  ctx.strokeRect(46, 46, W - 92, H - 92);
  ctx.restore();
}

function drawRule(x, y, width) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, "rgba(200, 148, 61, 0)");
  gradient.addColorStop(0.5, "rgba(200, 148, 61, 1)");
  gradient.addColorStop(1, "rgba(200, 148, 61, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, 2);
  ctx.fillStyle = GOLD;
  ctx.font = "30px Georgia";
  ctx.textAlign = "center";
  ctx.fillText("✦", x + width / 2, y + 10);
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, font, color, align = "left") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((item, index) => {
    ctx.fillText(item, x, y + index * lineHeight);
  });
  return lines.length * lineHeight;
}

function drawTitle(title, subtitle, x, y, maxWidth, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "70px Georgia";
  ctx.textAlign = "left";
  drawWrappedText(title, x, y, maxWidth, 76, "70px Georgia", GOLD_LIGHT);
  drawRule(x, y + 104, 360);
  drawWrappedText(subtitle, x, y + 152, maxWidth, 36, "27px Segoe UI, Arial", CREAM);
  ctx.restore();
}

function drawButton(label, x, y, width, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createLinearGradient(x, y, x + width, y + 62);
  gradient.addColorStop(0, "rgba(79, 28, 92, 0.95)");
  gradient.addColorStop(1, "rgba(23, 15, 42, 0.98)");
  ctx.fillStyle = gradient;
  roundRect(x, y, width, 62, 4);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = "23px Georgia";
  ctx.textAlign = "center";
  ctx.fillText(label.toUpperCase(), x + width / 2, y + 40);
  ctx.fillStyle = GOLD;
  ctx.font = "34px Georgia";
  ctx.fillText("›", x + width - 38, y + 42);
  ctx.restore();
}

function drawScreen(image, x, y, width, height, alpha = 1, zoom = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "rgba(2, 8, 20, 0.96)";
  roundRect(x, y, width, height, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(200, 148, 61, 0.84)";
  ctx.lineWidth = 2;
  ctx.stroke();
  coverImage(image, x + 12, y + 12, width - 24, height - 24, zoom);
  ctx.fillStyle = "rgba(2, 8, 20, 0.2)";
  ctx.fillRect(x + 12, y + 12, width - 24, height - 24);
  ctx.restore();
}

function drawHouseCards(progress) {
  const cardW = 218;
  const cardH = 298;
  const gap = 18;
  const startX = (W - cardW * 4 - gap * 3) / 2;
  const y = 330;
  const keys = ["nevermore", "noctis", "umbra", "ignis"];
  keys.forEach((key, index) => {
    const local = ease(segmentProgress(progress, index * 0.12, 0.55 + index * 0.1));
    ctx.save();
    ctx.globalAlpha = local;
    const x = startX + index * (cardW + gap);
    ctx.translate(x, y + (1 - local) * 45);
    ctx.strokeStyle = "rgba(200, 148, 61, 0.88)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, cardW, cardH);
    coverImage(images[key], 0, 0, cardW, cardH, 1.02);
    ctx.restore();
  });
}

function drawCrest(x, y, size, label, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.fillStyle = "#020814";
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, size / 2 - 9, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(200, 148, 61, 0.58)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = GOLD_LIGHT;
  ctx.font = `${Math.round(size * 0.45)}px Georgia`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y + 2);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawKeywords(items, x, y, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "28px Georgia";
  ctx.textAlign = "left";
  items.forEach((item, index) => {
    const yy = y + index * 62;
    drawCrest(x, yy - 11, 34, `${index + 1}`, alpha);
    ctx.fillStyle = CREAM;
    ctx.fillText(item, x + 54, yy);
    ctx.strokeStyle = "rgba(200, 148, 61, 0.25)";
    ctx.beginPath();
    ctx.moveTo(x + 54, yy + 18);
    ctx.lineTo(x + 500, yy + 18);
    ctx.stroke();
  });
  ctx.restore();
}

function drawScanBox(x, y, size, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  const corner = 58;
  ctx.beginPath();
  ctx.moveTo(x, y + corner);
  ctx.lineTo(x, y);
  ctx.lineTo(x + corner, y);
  ctx.moveTo(x + size - corner, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + corner);
  ctx.moveTo(x + size, y + size - corner);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size - corner, y + size);
  ctx.moveTo(x + corner, y + size);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x, y + size - corner);
  ctx.stroke();
  const lineY = y + 40 + ((Date.now() / 18) % (size - 80));
  const gradient = ctx.createLinearGradient(x + 22, lineY, x + size - 22, lineY);
  gradient.addColorStop(0, "rgba(200, 148, 61, 0)");
  gradient.addColorStop(0.5, "rgba(234, 209, 160, 0.9)");
  gradient.addColorStop(1, "rgba(200, 148, 61, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(x + 24, lineY, size - 48, 4);
  drawCrest(x + size / 2, y + size / 2, 116, "N", alpha);
  ctx.restore();
}

function render(time) {
  const t = time % DURATION;
  drawBackground();

  if (t < 5800) {
    const p = ease(segmentProgress(t, 0, 5800));
    coverImage(images.gate, W * 0.48, 76, 560, 500, 1.15 + p * 0.08);
    ctx.fillStyle = "rgba(2, 8, 20, 0.38)";
    ctx.fillRect(0, 0, W, H);
    drawTitle(
      "Nevermore Academy",
      "Niet zomaar een website. Dit is de ingang naar jouw verhaal.",
      92,
      174,
      560,
      ease(segmentProgress(t, 400, 1800))
    );
    drawButton("Start de ontdekking", 96, 516, 330, ease(segmentProgress(t, 1800, 3000)));
  } else if (t < 11200) {
    const p = ease(segmentProgress(t, 5800, 11200));
    drawScreen(images.home, 555 - p * 40, 92, 590, 410, 1, 1.03);
    drawTitle(
      "Een website die meteen sfeer verkoopt",
      "Donkerblauw, goud, mysterie en klassieke typografie. Studenten stappen direct Nevermore binnen.",
      82,
      132,
      500,
      ease(segmentProgress(t, 6000, 7200))
    );
    drawKeywords(["Professionele uitstraling", "Duidelijke navigatie", "Een verhaal dat trekt"], 98, 455, ease(segmentProgress(t, 7600, 9100)));
  } else if (t < 17400) {
    const p = segmentProgress(t, 11200, 17400);
    drawTitle(
      "Vier huizen. Een keuze die persoonlijk voelt.",
      "Studenten klikken, ontdekken hun betekenis en voelen sneller welk huis bij hen past.",
      96,
      80,
      820,
      ease(segmentProgress(t, 11400, 12600))
    );
    drawHouseCards(p);
  } else if (t < 23200) {
    const p = ease(segmentProgress(t, 17400, 23200));
    coverImage(images.ar, 650, 72, 470, 500, 1.08);
    ctx.fillStyle = "rgba(2, 8, 20, 0.45)";
    ctx.fillRect(650, 72, 470, 500);
    drawScanBox(764, 182, 250, p);
    drawTitle(
      "Met AR wordt de site actief",
      "Studenten zoeken een verborgen symbool en krijgen een persoonlijke aanwijzing. Ze kijken niet alleen, ze doen mee.",
      82,
      132,
      540,
      ease(segmentProgress(t, 17600, 18800))
    );
    drawButton("Activeer de AR-scan", 92, 540, 356, ease(segmentProgress(t, 19400, 20700)));
  } else if (t < 28600) {
    const p = ease(segmentProgress(t, 23200, 28600));
    drawScreen(images.home, 86, 104, 470, 326, 1, 1.05);
    drawScreen(images.ar, 596, 142, 390, 280, p, 1.08);
    coverImage(images.interior, 760, 405, 350, 138, 1.04);
    ctx.strokeStyle = "rgba(200, 148, 61, 0.76)";
    ctx.strokeRect(760, 405, 350, 138);
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = "58px Georgia";
    ctx.textAlign = "left";
    ctx.fillText("Daarom willen studenten deze site gebruiken", 86, 560);
    drawWrappedText(
      "Omdat de website niet alleen informatie geeft, maar de student meeneemt in een keuze, een route en een verhaal.",
      86,
      612,
      900,
      34,
      "26px Segoe UI, Arial",
      CREAM
    );
  } else {
    const p = ease(segmentProgress(t, 28600, DURATION));
    coverImage(images.gate, 0, 0, W, H, 2.4);
    ctx.fillStyle = "rgba(2, 8, 20, 0.62)";
    ctx.fillRect(0, 0, W, H);
    drawCrest(W / 2, 174, 118, "N", p);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.textAlign = "center";
    ctx.fillStyle = GOLD_LIGHT;
    ctx.font = "76px Georgia";
    ctx.fillText("De beste Nevermore Academy site", W / 2, 302);
    ctx.font = "32px Segoe UI, Arial";
    ctx.fillStyle = CREAM;
    ctx.fillText("voor studenten die hun plek willen ontdekken.", W / 2, 356);
    drawRule(W / 2 - 245, 398, 490);
    drawButton("Start de mysterieuze toelatingsroute", W / 2 - 285, 476, 570, p);
    ctx.font = "24px Georgia";
    ctx.fillStyle = MUTED;
    ctx.fillText("Nevermore Academy - ontdek, kies, scan en meld je aan.", W / 2, 612);
    ctx.restore();
  }

  drawFrame(0.9);
}

function animate(now) {
  if (!playStartedAt) playStartedAt = now;
  const elapsed = now - playStartedAt;
  render(elapsed);
  if (elapsed < DURATION) {
    animationId = requestAnimationFrame(animate);
  } else {
    playStartedAt = 0;
    statusText.textContent = "Reclame afgelopen. Je kunt hem opnieuw afspelen.";
  }
}

function playPromo() {
  cancelAnimationFrame(animationId);
  playStartedAt = 0;
  statusText.textContent = "Reclame speelt af...";
  animationId = requestAnimationFrame(animate);
}

function chooseMimeType() {
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return types.find((type) => window.MediaRecorder && MediaRecorder.isTypeSupported(type)) || "";
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

async function recordVideo(returnDataUrl = false) {
  if (!canvas.captureStream || !window.MediaRecorder) {
    statusText.textContent = "Video-export wordt niet ondersteund door deze browser.";
    return null;
  }

  statusText.textContent = "Videobestand wordt gemaakt...";
  recordButton.disabled = true;
  downloadLink.hidden = true;
  dataStore.value = "";
  const stream = canvas.captureStream(30);
  const mimeType = chooseMimeType();
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6500000,
  });
  const chunks = [];
  const finished = new Promise((resolve) => {
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
    };
  });

  recorder.start(250);
  const started = performance.now();

  await new Promise((resolve) => {
    function tick(now) {
      const elapsed = now - started;
      render(elapsed);
      if (elapsed < DURATION) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(tick);
  });

  recorder.stop();
  const blob = await finished;
  const url = URL.createObjectURL(blob);
  const dataUrl = await blobToDataUrl(blob);
  downloadLink.href = url;
  downloadLink.hidden = false;
  dataStore.value = dataUrl;
  statusText.textContent = "Videobestand is klaar om te downloaden.";
  recordButton.disabled = false;
  if (returnDataUrl) return dataUrl;
  return blob;
}

playButton.addEventListener("click", playPromo);
recordButton.addEventListener("click", () => recordVideo(false));
window.recordNevermorePromo = () => recordVideo(true);

loadImages().then(() => {
  render(0);
  statusText.textContent = "Klaar om af te spelen.";
});
