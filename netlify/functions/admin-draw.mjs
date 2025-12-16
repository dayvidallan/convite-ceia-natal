import { requireAdmin, json } from "./_adminAuth.mjs";
import { runDraw } from "./_drawCore.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "Método não permitido." });

  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  let body = {};
  try { body = await req.json(); } catch {}

  const dryRun = Boolean(body?.dryRun);
  const force = true; // admin can force re-run after reset

  try {
    const result = await runDraw({ force, dryRun });
    return json(result.ok ? 200 : 400, result);
  } catch (e) {
    return json(500, { error: e?.message || "Erro ao rodar sorteio." });
  }
}
