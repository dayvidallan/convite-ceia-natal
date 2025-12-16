import { runDraw } from "./_drawCore.mjs";

export const config = {
  // 17/12/2025 14:00 UTC == 11:00 Natal/RN (UTC-3)
  schedule: "0 14 17 12 *"
};

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function handler() {
  try {
    const result = await runDraw({ force: false, dryRun: false });
    return json(result.ok ? 200 : 400, result);
  } catch (e) {
    return json(500, { error: e?.message || "Erro no sorteio." });
  }
}
