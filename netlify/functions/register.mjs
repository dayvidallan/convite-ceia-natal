import { getParticipants, setParticipants } from "./_store.mjs";

const DEADLINE = "2025-12-17T11:00:00-03:00";

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function norm(s) { return String(s || "").trim().toLowerCase(); }
function makeKey(name, email) { return `${norm(name)}|${norm(email)}`; }

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  // enforce deadline server-side
  if (Date.now() >= new Date(DEADLINE).getTime()) {
    return json(403, { error: "Prazo encerrado." });
  }

  let body;
  try { body = await req.json(); }
  catch { return json(400, { error: "JSON inválido." }); }

  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const hint = String(body?.hint || "").trim();

  if (name.length < 2) return json(400, { error: "Nome inválido." });
  if (!email || !email.includes("@")) return json(400, { error: "E-mail inválido." });
  if (name.length > 80) return json(400, { error: "Nome muito longo." });
  if (hint.length > 80) return json(400, { error: "Dica muito longa." });

  const participants = await getParticipants();
  const key = makeKey(name, email);
  const idx = participants.findIndex(p => p.key === key);

  const item = { key, name, email, hint, updatedAt: new Date().toISOString() };

  if (idx >= 0) participants[idx] = { ...participants[idx], ...item };
  else participants.push({ ...item, createdAt: new Date().toISOString() });

  await setParticipants(participants);
  return json(200, { ok: true, count: participants.length });
}
