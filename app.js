// === Config ===
const DRAW_DEADLINE_LOCAL = "2025-12-17T11:00:00-03:00"; // Natal/RN (UTC-3)

// Netlify Functions (já existem no seu projeto)
const API_REGISTER    = "/api/register";
const API_ADMIN_STATUS = "/api/admin-status";
const API_ADMIN_DRAW   = "/api/admin-draw";
const API_ADMIN_RESET  = "/api/admin-reset";

// === Helpers ===
const $ = (id) => document.getElementById(id);

function pad2(n){ return String(n).padStart(2,"0"); }

async function postJSON(url, body, adminToken){
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(adminToken ? {"x-admin-token": adminToken} : {})
    },
    body: JSON.stringify(body || {})
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if(!res.ok){
    const msg = data?.error || data?.message || res.statusText || "Erro";
    throw new Error(msg);
  }
  return data;
}

// === Countdown ===
function startCountdown(){
  const target = new Date(DRAW_DEADLINE_LOCAL).getTime();

  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000*60*60*24)); diff -= d*(1000*60*60*24);
    const h = Math.floor(diff / (1000*60*60));    diff -= h*(1000*60*60);
    const m = Math.floor(diff / (1000*60));       diff -= m*(1000*60);
    const s = Math.floor(diff / 1000);

    $("d").textContent = pad2(d);
    $("h").textContent = pad2(h);
    $("m").textContent = pad2(m);
    $("s").textContent = pad2(s);
  };

  tick();
  setInterval(tick, 1000);
}

// === Register form ===
function initRegister(){
  const form = $("form");
  const msg = $("msg");
  const btn = $("submit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    btn.disabled = true;

    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const hint = $("hint").value.trim();

    try{
      await postJSON(API_REGISTER, { name, email, hint });
      msg.textContent = "✅ Cadastro confirmado! Fique de olho no e-mail após o sorteio.";
    }catch(err){
      msg.textContent = "❌ " + (err?.message || "Falha ao cadastrar.");
    }finally{
      btn.disabled = false;
    }
  });
}

// === Admin modal ===
function initAdmin(){
  const adminBtn = $("adminBtn");
  const modal = $("adminModal");
  const close = $("closeAdmin");
  const tokenInput = $("adminToken");
  const out = $("adminOut");

  const token = () => tokenInput.value.trim();

  function print(obj){
    out.textContent = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  }

  adminBtn.addEventListener("click", () => modal.showModal());
  close.addEventListener("click", () => modal.close());

  $("btnStatus").addEventListener("click", async () => {
    print("Carregando status...");
    try{
      const data = await postJSON(API_ADMIN_STATUS, {}, token());
      print(data);
    }catch(err){ print("Erro: " + err.message); }
  });

  $("btnSimular").addEventListener("click", async () => {
    if(!confirm("Simular sorteio (não envia e-mails)?")) return;
    print("Simulando sorteio...");
    try{
      const data = await postJSON(API_ADMIN_DRAW, { dryRun: true }, token());
      print(data);
    }catch(err){ print("Erro: " + err.message); }
  });

  $("btnEnviar").addEventListener("click", async () => {
    if(!confirm("CONFIRMAR: sortear e ENVIAR e-mails agora?")) return;
    print("Sorteando e enviando e-mails...");
    try{
      const data = await postJSON(API_ADMIN_DRAW, { dryRun: false }, token());
      print(data);
    }catch(err){ print("Erro: " + err.message); }
  });

  $("btnReset").addEventListener("click", async () => {
    if(!confirm("CONFIRMAR: zerar TODOS os cadastros? (Isso limpa os testes)")) return;
    print("Zerando cadastros...");
    try{
      const data = await postJSON(API_ADMIN_RESET, {}, token());
      print(data);
    }catch(err){ print("Erro: " + err.message); }
  });

  // Abrir admin automaticamente via hash
  if (location.hash === "#admin") modal.showModal();
}

// === Sky: estrelas + cometa em parábola ===
function initSky(){
  const canvas = $("sky");
  const ctx = canvas.getContext("2d");

  function resize(){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  resize();
  window.addEventListener("resize", resize);

  const stars = Array.from({length: 160}, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.6 + 0.2,
    a: Math.random() * 0.7 + 0.2,
    tw: Math.random() * 0.015 + 0.004
  }));

  // Cometa (quadrática / parábola)
  let t = 0;                 // 0..1
  let arrived = false;
  let pulse = 0;

  // Pontos do "arco" (ajusta a curva como quiser)
  const P0 = { x: -200, y: 140 };
  const P1 = { x: window.innerWidth * 0.35, y: 40 };
  const P2 = { x: window.innerWidth * 0.78, y: 260 };

  function bezier2(p0,p1,p2,t){
    const u = 1-t;
    return {
      x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x,
      y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y
    };
  }

  // Clique no cometa: rola e destaca o card do amigo secreto
  window.addEventListener("click", (e) => {
    if(!arrived) return;
    const c = bezier2(P0,P1,P2,1);
    const dx = e.clientX - c.x;
    const dy = e.clientY - c.y;
    const hit = (dx*dx + dy*dy) < 35*35;
    if(hit){
      const el = document.getElementById("amigo");
      el.scrollIntoView({behavior:"smooth", block:"start"});
      el.animate([{transform:"scale(1)"},{transform:"scale(1.02)"},{transform:"scale(1)"}], {duration:600});
    }
  });

  function draw(){
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);

    // fundo suave
    const g = ctx.createRadialGradient(
      window.innerWidth*0.55, window.innerHeight*0.2, 30,
      window.innerWidth*0.55, window.innerHeight*0.2, window.innerWidth
    );
    g.addColorStop(0, "rgba(80,140,255,0.12)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,window.innerWidth,window.innerHeight);

    // estrelas
    for(const s of stars){
      s.a += (Math.random()-0.5) * s.tw;
      s.a = Math.max(0.12, Math.min(0.95, s.a));
      ctx.globalAlpha = s.a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = "white";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // cometa
    if(!arrived){
      t += 0.004; // velocidade
      if(t >= 1){
        t = 1;
        arrived = true;
      }
    }else{
      pulse += 0.06;
    }

    // atualiza P1/P2 em resize (mantém relativo)
    P1.x = window.innerWidth * 0.35;
    P2.x = window.innerWidth * 0.78;
    P2.y = 260;

    const pos = bezier2(P0,P1,P2,t);

    // cauda (desenha atrás)
    const tailLen = 240;
    const steps = 26;
    for(let i=0;i<steps;i++){
      const tt = Math.max(0, t - (i/steps)*0.12);
      const p = bezier2(P0,P1,P2,tt);
      const a = (1 - i/steps) * 0.22;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10*(1-i/steps), 0, Math.PI*2);
      ctx.fillStyle = "rgba(140,200,255,1)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // cabeça (estrela brilhante)
    const glow = arrived ? (0.55 + 0.2*Math.sin(pulse)) : 0.45;
    const rg = ctx.createRadialGradient(pos.x, pos.y, 2, pos.x, pos.y, 34);
    rg.addColorStop(0, `rgba(255,255,255,${0.95})`);
    rg.addColorStop(0.35, `rgba(170,220,255,${0.85})`);
    rg.addColorStop(1, `rgba(120,180,255,0)`);
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 34, 0, Math.PI*2);
    ctx.fill();

    // “cruz” da estrela (tipo Belém)
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.globalAlpha = arrived ? glow : 0.45;
    ctx.strokeStyle = "rgba(220,245,255,1)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-26,0); ctx.lineTo(26,0);
    ctx.moveTo(0,-26); ctx.lineTo(0,26);
    ctx.stroke();
    ctx.restore();

    requestAnimationFrame(draw);
  }

  draw();
}

// === Boot ===
startCountdown();
initRegister();
initAdmin();
initSky();
