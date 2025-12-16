# Convite Ceia de Natal (Netlify)

## O que este projeto faz
- Link do WhatsApp abre uma cena “Noite de Natal” com estrela interativa.
- Mensagem bíblica (Isaías 9:6).
- Botão de local abre o Google Maps.
- Amigo secreto:
  - Formulário salva participantes.
  - Contador regressivo até 17/12/2025 11:00 (UTC-3).
  - Sorteio automático por função agendada e envio de e-mails via SendGrid.
- Painel admin escondido: toque 5x no rodapé → status / simular / enviar / reset.

## Endpoints
- POST /api/register
- POST /api/admin-status (header x-admin-token)
- POST /api/admin-draw (header x-admin-token, body {dryRun:true|false})
- POST /api/admin-reset (header x-admin-token)

## Variáveis de ambiente no Netlify
- SENDGRID_API_KEY
- FROM_EMAIL
- FROM_NAME
- ADMIN_TOKEN
