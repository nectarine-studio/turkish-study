// Serves the static site from ./public and exposes POST /api/image,
// which generates a picture with Cloudflare Workers AI (no API key to manage).
const MODEL = "@cf/black-forest-labs/flux-1-schnell";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/image") return env.ASSETS.fetch(request);

    if (request.method !== "POST") return json({ error: "Use POST." }, 405);
    // Only the site itself may call this endpoint from a browser.
    if (request.headers.get("origin") !== url.origin) return json({ error: "Not allowed." }, 403);

    let prompt;
    try { ({ prompt } = await request.json()); } catch (e) { return json({ error: "Invalid request." }, 400); }
    if (typeof prompt !== "string" || prompt.trim().length < 3 || prompt.length > 400) {
      return json({ error: "Prompt must be 3 to 400 characters." }, 400);
    }

    try {
      const result = await env.AI.run(MODEL, { prompt: prompt.trim(), steps: 4, seed: Math.floor(Math.random() * 1e9) });
      if (!result || !result.image) return json({ error: "The model returned no image." }, 502);
      return json({ image: result.image });
    } catch (e) {
      console.error("image generation failed", e && e.message);
      return json({ error: "Image generation failed. Check that Workers AI is enabled for this account." }, 502);
    }
  }
};
