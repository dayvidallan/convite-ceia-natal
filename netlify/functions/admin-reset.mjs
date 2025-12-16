import { setParticipants, setMeta } from "./_store.mjs";
import { requireAdmin, json } from "./_adminAuth.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  await setParticipants([]);
  await setMeta({});
  return json(200, { ok: true, message: "Cadastro e estado do sorteio zerados." });
}
