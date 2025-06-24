import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.11.7/middleware.ts";

export function initializeApp() {
  const app = new Hono();
  app.use("/*", serveStatic({ root: "./static" }));
  return app;
}

if (import.meta.main) {
  const app = initializeApp();
  console.log("Server running on http://localhost:8000");
  Deno.serve({ port: 8000 }, app.fetch);
}
