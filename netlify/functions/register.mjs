import { getParticipants, setParticipants } from "./_store.mjs";

const DEADLINE = "2025-12-17T11:00:00-03:00";

// ---------- Helpers (Response / Netlify) ----------
function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Para runtime que usa event/httpMethod (Netlify Function tradicional)
function jsonObject(statusCode, obj) {
  return {
    statusCode,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}

function norm(s) {
  return String(s || "").trim().toLowerCase();
}
function makeKey(name, email) {
  return `${norm(name)}|${norm(email)}`;
}

function deadlineExpired() {
  return Date.now() >= new Date(DEADLINE).getTime();
}

// tenta ler JSON tanto de Request quanto de event.body
async function readJson(reqOrEvent) {
  // Web Request
  if (reqOrEvent && typeof reqOrEvent.json === "function") {
    return await reqOrEvent.json();
  }

  // Netlify event (body string)
  const raw = reqOrEvent?.body;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("JSON inválido.");
  }
}

// detecta método tanto de Request quanto de event.httpMethod
function getMethod(reqOrEvent) {
  return reqOrEvent?.method || reqOrEvent?.httpMethod || "";
}

// devolve resposta no formato certo dependendo do runtime
function respond(reqOrEvent, status, obj) {
  // se for Web Request -> Response
  if (reqOrEvent && typeof reqOrEvent?.json === "function") {
    return jsonResponse(status, obj);
  }
  // senão -> objeto Netlify
  return jsonObject(status, obj);
}

// ---------- Handler ----------
export default async function handler(reqOrEvent) {
  const method = getMethod(reqOrEvent);

  if (method !== "POST") {
    return respond(reqOrEvent, 405, { error: "Método não permitido." });
  }

  if (deadlineExpired()) {
    return respond(reqOrEvent, 403, { error: "Prazo encerrado." });
  }

  let body;
  try {
    body = await readJson(reqOrEvent);
  } catch (e) {
    return respond(reqOrEvent, 400, { error: e?.message || "JSON inválido." });
  }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const hint = String(body?.hint || "").trim();

  if (name.length < 2) return respond(reqOrEvent, 400, { error: "Nome inválido." });
  if (!email || !email.includes("@")) return respond(reqOrEvent, 400, { error: "E-mail inválido." });
  if (name.length > 80) return respond(reqOrEvent, 400, { error: "Nome muito longo." });
  if (hint.length > 80) return respond(reqOrEvent, 400, { error: "Dica muito longa." });

  let participants;
  try {
    participants = await getParticipants();
  } catch (e) {
    // aqui a gente deixa explícito que o problema está no store
    return respond(reqOrEvent, 500, {
      error: "Falha ao carregar participantes (_store).",
      detail: String(e?.message || e),
    });
  }

  if (!Array.isArray(participants)) {
    participants = [];
  }

  const key = makeKey(name, email);
  const idx = participants.findIndex((p) => p?.key === key);

  const item = { key, name, email, hint, updatedAt: new Date().toISOString() };

  if (idx >= 0) participants[idx] = { ...participants[idx], ...item };
  else participants.push({ ...item, createdAt: new Date().toISOString() });

  try {
    await setParticipants(participants);
  } catch (e) {
    return respond(reqOrEvent, 500, {
      error: "Falha ao salvar participantes (_store).",
      detail: String(e?.message || e),
    });
  }

  return respond(reqOrEvent, 200, { ok: true, count: participants.length });
}
