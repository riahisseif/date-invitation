/**
 * Cloudflare Worker that forwards her answer to your Telegram.
 * The bot token lives in Cloudflare as a secret, never in your website.
 *
 * Setup:
 * 1. In Telegram, talk to @BotFather → /newbot → copy the bot token.
 * 2. Send your new bot any message, then open
 *      https://api.telegram.org/bot<TOKEN>/getUpdates
 *    and copy "chat":{"id": ...} — that's your CHAT_ID.
 * 3. dash.cloudflare.com → Workers & Pages → Create → Worker → paste this file → Deploy.
 * 4. Worker → Settings → Variables and Secrets → add secrets:
 *      BOT_TOKEN = your bot token
 *      CHAT_ID   = your chat id
 * 5. Set ALLOWED_ORIGIN below to your GitHub Pages origin (no path), redeploy.
 * (Alternative to Formspree; the Formspree version does not need this file.)
 * 6. In script.js set:
 *      backend: { method: "custom", endpoint: "https://your-worker.your-name.workers.dev" }
 */

const ALLOWED_ORIGIN = "https://YOUR-USERNAME.github.io";

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

    let data;
    try { data = await request.json(); }
    catch { return new Response("Invalid JSON", { status: 400, headers: cors }); }

    const clean = (v) => String(v ?? "").slice(0, 200);
    const text =
      `💕 She said YES!\n` +
      `📅 ${clean(data["Selected date"])}\n` +
      `⏰ ${clean(data["Selected time"])}\n` +
      `🙈 Tried to click No ${Number(data["No-button attempts"]) || 0} times`;

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });

    return new Response(JSON.stringify({ ok: tg.ok }), {
      status: tg.ok ? 200 : 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
