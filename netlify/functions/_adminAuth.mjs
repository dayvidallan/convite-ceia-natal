function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function requireAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return { ok: false, res: json(500, { error: "ADMIN_TOKEN não configurado no Netlify." }) };

  const token = req.headers.get("x-admin-token") || "";
  if (token !== expected) return { ok: false, res: json(401, { error: "Não autorizado." }) };

  return { ok: true };
}

export { json };
