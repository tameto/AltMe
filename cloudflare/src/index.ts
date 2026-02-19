/**
 * Cloudflare Worker entry point for AltMe OpenClaw
 *
 * NOTE: This is a conceptual implementation based on Cloudflare Containers beta API.
 * The actual Container API uses a `Container` binding rather than `DurableObjectNamespace`.
 * Adjust to the latest API per https://developers.cloudflare.com/containers/
 */

interface Env {
  OPENCLAW: DurableObjectNamespace;
  SOUL_KV: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health endpoint — no auth required
    if (url.pathname === "/health") {
      return new Response("ok", { status: 200 });
    }

    // Admin endpoints: /admin/{action}/{userId}
    // Requires Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}
    const adminMatch = url.pathname.match(
      /^\/admin\/(status|restart|stop)\/([^/]+)$/
    );
    if (adminMatch) {
      const [, action, userId] = adminMatch;
      const authHeader = request.headers.get("Authorization");
      const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      return handleAdmin(action, userId, env);
    }

    // WebSocket endpoint: /ws/{userId}
    const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);
    if (!wsMatch) {
      return new Response("Not Found", { status: 404 });
    }

    const userId = wsMatch[1];

    // Verify SOUL.md exists for this user before starting container
    const soulMd = await env.SOUL_KV.get(`soul:${userId}`);
    if (!soulMd) {
      return new Response(JSON.stringify({ error: "soul_not_found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get or create container for this user (keyed by userId)
    const id = env.OPENCLAW.idFromName(userId);
    const stub = env.OPENCLAW.get(id);

    // Forward the original WebSocket upgrade request to the container
    const containerRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    });

    return stub.fetch(containerRequest);
  },
};

async function handleAdmin(
  action: string,
  userId: string,
  env: Env
): Promise<Response> {
  const id = env.OPENCLAW.idFromName(userId);
  const stub = env.OPENCLAW.get(id);

  switch (action) {
    case "status": {
      const resp = await stub.fetch(new Request("http://internal/status"));
      return resp;
    }
    case "restart": {
      const resp = await stub.fetch(
        new Request("http://internal/restart", { method: "POST" })
      );
      return resp;
    }
    case "stop": {
      const resp = await stub.fetch(
        new Request("http://internal/stop", { method: "POST" })
      );
      return resp;
    }
    default:
      return new Response("Unknown action", { status: 400 });
  }
}
