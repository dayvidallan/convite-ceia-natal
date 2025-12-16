import { getParticipants, getMeta, setMeta } from "./_store.mjs";

function normEmail(email) { return String(email || "").trim().toLowerCase(); }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildPairs(list) {
  const n = list.length;
  if (n < 3) throw new Error("Mínimo de 3 participantes para sorteio.");

  const giver = [...list];

  for (let tries = 0; tries < 80; tries++) {
    const receiver = shuffle([...list]);
    let ok = true;
    for (let i = 0; i < n; i++) {
      if (giver[i].key === receiver[i].key) { ok = false; break; }
    }
    if (ok) return giver.map((g, i) => ({ giver: g, receiver: receiver[i] }));
  }

  // fallback: rotation (guarantees no self if list has unique keys)
  const receiver = [...list].slice(1).concat(list[0]);
  return giver.map((g, i) => ({ giver: g, receiver: receiver[i] }));
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailTemplate({ giverName, receiverName, receiverHint }) {
  const hintLine = receiverHint ? `<p><strong>💡 Dica:</strong> ${escapeHtml(receiverHint)}</p>` : "";
  return `
  <div style="font-family:Arial,sans-serif; background:#0b1330; color:#f5f7ff; padding:18px; border-radius:14px;">
    <h2 style="margin:0 0 10px; color:#ffefb6;">🎄 Seu Amigo Secreto chegou!</h2>
    <p>Olá, <strong>${escapeHtml(giverName)}</strong>!</p>
    <p>Seu amigo secreto é:</p>
    <div style="font-size:20px; font-weight:800; margin:10px 0; color:#ffefb6;">
      ${escapeHtml(receiverName)}
    </div>
    ${hintLine}
    <hr style="border:0; border-top:1px solid rgba(255,255,255,.12); margin:14px 0;" />
    <p style="margin:0; color:#c7cbea;">
      “Porque um menino nos nasceu, um filho se nos deu.” — Isaías 9:6
    </p>
    <p style="margin:8px 0 0; color:#c7cbea;">✨ Que este Natal seja cheio de luz e alegria.</p>
  </div>`;
}

async function sendSendGridEmail({ to, subject, html, fromEmail, fromName }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY não configurada.");

  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: fromEmail, name: fromName },
    subject,
    content: [{ type: "text/html", value: html }],
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SendGrid falhou (${res.status}): ${txt.slice(0, 400)}`);
  }
}

export async function runDraw({ force = false, dryRun = false } = {}) {
  const meta = await getMeta();
  if (meta?.drawnAt && !force) {
    return { ok: true, skipped: "Already drawn", drawnAt: meta.drawnAt, count: meta.count ?? null };
  }

  const participants = await getParticipants();
  if (participants.length < 3) {
    return { ok: false, error: "Participantes insuficientes para sorteio.", count: participants.length };
  }

  const pairs = buildPairs(participants);

  // If dry run, don't send emails, just return preview (names only)
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      participants: participants.length,
      preview: pairs.map(p => ({
        giver: { name: p.giver.name, email: p.giver.email },
        receiver: { name: p.receiver.name }
      }))
    };
  }

  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME || "Ceia de Natal";
  if (!fromEmail) throw new Error("FROM_EMAIL não configurada.");

  for (const { giver, receiver } of pairs) {
    const subject = "🎅 Seu Amigo Secreto — Ceia de Natal";
    const html = emailTemplate({
      giverName: giver.name,
      receiverName: receiver.name,
      receiverHint: receiver.hint,
    });

    await sendSendGridEmail({
      to: giver.email,
      subject,
      html,
      fromEmail,
      fromName,
    });
  }

  await setMeta({ drawnAt: new Date().toISOString(), count: participants.length });
  return { ok: true, sent: participants.length };
}
