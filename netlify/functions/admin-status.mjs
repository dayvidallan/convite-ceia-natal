import { getParticipants, getMeta } from "./_store.mjs";
import { requireAdmin, json } from "./_adminAuth.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  const participants = await getParticipants();
  const meta = await getMeta();

  // sanitize participants (don't expose hints by default)
  const list = participants.map(p => ({
    name: p.name,
    email: p.email,
    hint: p.hint || "",
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  return json(200, {
    ok: true,
    count: participants.length,
    drawnAt: meta?.drawnAt || null,
    participants: list
  });
}
