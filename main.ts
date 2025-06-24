import { Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.11.7/middleware.ts";

// Initialize app with configuration
export function initializeApp() {
  const app = new Hono();

  // Serve static files
  app.use("/*", serveStatic({ root: "./static" }));
  // app.get("/*", serveStatic({ root: "./static" }));

  return app;
}

// Start server if this is the main module
if (import.meta.main) {
  const app = await initializeApp();
  console.log("Server running on http://localhost:8000");
  Deno.serve({ port: 8000 }, app.fetch);
}
