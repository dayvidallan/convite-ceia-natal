import { getStore } from "@netlify/blobs";

export function store() {
  return getStore("secret-santa");
}

export async function getParticipants() {
  const s = store();
  const list = (await s.get("participants", { type: "json" })) || [];
  return Array.isArray(list) ? list : [];
}

export async function setParticipants(list) {
  const s = store();
  await s.set("participants", list, { metadata: { updatedAt: new Date().toISOString() } });
}

export async function getMeta() {
  const s = store();
  return (await s.get("meta", { type: "json" })) || {};
}

export async function setMeta(meta) {
  const s = store();
  await s.set("meta", meta);
}
