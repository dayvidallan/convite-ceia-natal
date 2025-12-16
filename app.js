// ====== CONFIG DO EVENTO ======
const DEADLINE = "2025-12-17T11:00:00-03:00"; // Natal/RN (UTC-3)
const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent(
    "Rua Desembargador Túlio Bezerra de Melo 3720, Condomínio Corais do Alto da Candelária, Apto 602, Natal RN, 59064585"
  );

// ====== ELEMENTOS ======
const intro = document.getElementById("intro");
const content = document.getElementById("content");
const starBtn = document.getElementById("starBtn");
const musicBtn = document.getElementById("musicBtn");
const mapCard = document.getElementById("mapCard");

const dd = document.getElementById("dd");
const hh = document.getElementById("hh");
const mm = document.getElementById("mm");
const ss = document.getElementById("ss");

const secretForm = document.getElementById("secretForm");
const submitBtn = document.getElementById("submitBtn");
const formMsg = document.getElementById("formMsg");
const closedMsg = document.getElementById("closedMsg");

// Admin UI
const footer = document.getElementById("footer");
const adminOverlay = document.getElementById("adminOverlay");
const adminClose = document.getElementById("adminClose");
const adminTokenInput = document.getElementById("adminToken");
const adminOutput = document.getElementById("adminOutput");
const adminRefresh = document.getElementById("adminRefresh");
const adminDryRun = document.getElementById("adminDryRun");
const adminRunDraw = document.getElementById("adminRunDraw");
const adminReset = document.getElementById("adminReset");

// ====== TRANSIÇÃO INTRO -> CONTEÚDO ======
function openInvite() {
  intro.style.opacity = "0";
  intro.style.transform = "scale(1.02)";
  intro.style.transition = "opacity .35s ease, transform .35s ease";
  setTimeout(() => {
    intro.classList.add("hidden");
    content.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 340);
}

starBtn.addEventListener("click", () => {
  openInvite();
  ensureMusic();
});

mapCard.addEventListener("click", () => {
  window.open(MAPS_URL, "_blank", "noopener,noreferrer");
});

// ====== CONTADOR ======
function pad2(n) { return String(n).padStart(2, "0"); }

function updateCountdown() {
  const end = new Date(DEADLINE).getTime();
  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    dd.textContent = "00";
    hh.textContent = "00";
    mm.textContent = "00";
    ss.textContent = "00";

    secretForm.querySelectorAll("input, button").forEach(el => el.disabled = true);
    closedMsg.classList.remove("hidden");
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / (3600 * 24));
  const hours = Math.floor((totalSec % (3600 * 24)) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  dd.textContent = pad2(days);
  hh.textContent = pad2(hours);
  mm.textContent = pad2(mins);
  ss.textContent = pad2(secs);
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ====== FORM SUBMIT (Netlify Function) ======
secretForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formMsg.textContent = "";

  // honeypot
  const hp = document.getElementById("company").value.trim();
  if (hp) return;

  if (Date.now() >= new Date(DEADLINE).getTime()) {
    formMsg.textContent = "⏳ O prazo encerrou. Obrigado!";
    return;
  }

  const payload = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    hint: document.getElementById("hint").value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Falha ao cadastrar. Tente novamente.");

    formMsg.textContent = "✅ Cadastro confirmado! Fique de olho no e-mail após o sorteio.";
    secretForm.reset();
  } catch (err) {
    formMsg.textContent = "⚠️ " + (err?.message || "Erro inesperado.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "✅ Cadastrar no amigo secreto";
  }
});

// ====== MÚSICA (WebAudio simples) ======
let audioCtx = null;
let musicOn = false;
let musicTimer = null;

function ensureMusic() {
  if (!musicOn) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playNotes(sequence, tempoMs = 420) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  const now = audioCtx.currentTime;
  let t = now;

  const gain = audioCtx.createGain();
  gain.gain.value = 0.05;
  gain.connect(audioCtx.destination);

  function oscFor(freq, durationSec) {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + durationSec);
    t += durationSec;
  }

  const NOTE = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
    B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25
  };

  const dur = tempoMs / 1000;

  for (const n of sequence) {
    if (n === "REST") { t += dur; continue; }
    oscFor(NOTE[n], dur * 0.95);
  }
}

function startLoop() {
  stopLoop();
  const seq = [
    "G4","A4","G4","E4",
    "G4","A4","G4","E4",
    "D5","D5","B4",
    "C5","C5","G4",
    "A4","A4","C5","B4","A4","G4"
  ];
  playNotes(seq, 420);
  musicTimer = setInterval(() => playNotes(seq, 420), 10000);
}

function stopLoop() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}

musicBtn.addEventListener("click", async () => {
  musicOn = !musicOn;
  musicBtn.setAttribute("aria-pressed", String(musicOn));
  musicBtn.textContent = musicOn ? "🔊 Música ligada" : "🔈 Música natalina";
  if (musicOn) { ensureMusic(); startLoop(); }
  else stopLoop();
});

// ====== ADMIN PANEL (5 taps no rodapé) ======
let tapCount = 0;
let tapTimer = null;

function openAdmin() {
  adminOverlay.classList.remove("hidden");
  adminTokenInput.value = sessionStorage.getItem("ADMIN_TOKEN") || "";
  adminOutput.textContent = "Painel aberto. Cole o ADMIN_TOKEN e clique em “Atualizar status”.";
}

function closeAdmin() {
  adminOverlay.classList.add("hidden");
}

footer.addEventListener("click", () => {
  tapCount++;
  if (!tapTimer) {
    tapTimer = setTimeout(() => {
      tapCount = 0;
      tapTimer = null;
    }, 1500);
  }
  if (tapCount >= 5) {
    tapCount = 0;
    clearTimeout(tapTimer);
    tapTimer = null;
    openAdmin();
  }
});

adminClose.addEventListener("click", closeAdmin);
adminOverlay.addEventListener("click", (e) => {
  if (e.target === adminOverlay) closeAdmin();
});

function token() {
  const t = (adminTokenInput.value || "").trim();
  if (t) sessionStorage.setItem("ADMIN_TOKEN", t);
  return t;
}

async function callAdmin(path, payload) {
  const t = token();
  if (!t) throw new Error("Informe o ADMIN_TOKEN.");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-admin-token": t,
    },
    body: JSON.stringify(payload || {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Falha na chamada admin.");
  return data;
}

adminRefresh.addEventListener("click", async () => {
  adminOutput.textContent = "Carregando status…";
  try {
    const data = await callAdmin("/api/admin-status", {});
    adminOutput.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    adminOutput.textContent = "⚠️ " + e.message;
  }
});

adminDryRun.addEventListener("click", async () => {
  adminOutput.textContent = "Simulando sorteio (sem e-mail)…";
  try {
    const data = await callAdmin("/api/admin-draw", { dryRun: true });
    adminOutput.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    adminOutput.textContent = "⚠️ " + e.message;
  }
});

adminRunDraw.addEventListener("click", async () => {
  if (!confirm("Isso vai ENVIAR e-mails para os participantes cadastrados. Continuar?")) return;
  adminOutput.textContent = "Rodando sorteio e enviando e-mails…";
  try {
    const data = await callAdmin("/api/admin-draw", { dryRun: false });
    adminOutput.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    adminOutput.textContent = "⚠️ " + e.message;
  }
});

adminReset.addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja ZERAR o cadastro e liberar novo sorteio?")) return;
  adminOutput.textContent = "Zerando cadastro…";
  try {
    const data = await callAdmin("/api/admin-reset", {});
    adminOutput.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    adminOutput.textContent = "⚠️ " + e.message;
  }
});
