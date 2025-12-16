import { getStore } from "@netlify/blobs";

export function store() {
  return getStore("secret-santa");
}

function safeParseJson(raw, fallback) {
  try {
    if (raw == null) return fallback;
    if (typeof raw === "object") return raw; // se já vier objeto (raro), retorna
    return JSON.parse(String(raw));
  } catch {
    return fallback;
  }
}

export async function getParticipants() {
  const s = store();

  // pega como texto e faz parse seguro (evita quebrar se tiver "[object Object]" salvo)
  const raw = await s.get("participants", { type: "text" });
  const list = safeParseJson(raw, []);

  return Array.isArray(list) ? list : [];
}

export async function setParticipants(list) {
  const s = store();

  const safeList = Array.isArray(list) ? list : [];
  await s.set(
    "participants",
    JSON.stringify(safeList), // <-- AQUI é o ponto principal
    { metadata: { updatedAt: new Date().toISOString() } }
  );
}

export async function getMeta() {
  const s = store();

  const raw = await s.get("meta", { type: "text" });
  const meta = safeParseJson(raw, {});

  return meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
}

export async function setMeta(meta) {
  const s = store();

  const safeMeta =
    meta && typeof meta === "object" && !Array.isArray(meta) ? meta : {};
  await s.set("meta", JSON.stringify(safeMeta));
}
