import { Hono, Context } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.11.7/middleware.ts";

interface HistoryEntry {
  date: string;
  names: string[];
}

interface History {
  selections: HistoryEntry[];
  lastReset: string | null;
}

// Initialize app with configuration
export async function initializeApp() {
  const app = new Hono();
  const config = JSON.parse(await Deno.readTextFile("./config.json"));
  let history: History = JSON.parse(await Deno.readTextFile("./history.json"));

  function pickNames(availableNames: string[]): string[] {
    const unpickedNames = availableNames.filter(name =>
      !history.selections.some(selection => selection.names.includes(name))
    );

    if (unpickedNames.length < config.settings.picksPerWeek) {
      history.selections = [];
      return pickNames(availableNames);
    }

    const picked = [];
    for (let i = 0; i < config.settings.picksPerWeek; i++) {
      const index = Math.floor(Math.random() * unpickedNames.length);
      picked.push(unpickedNames[index]);
      unpickedNames.splice(index, 1);
    }

    history.selections.push({
      date: new Date().toISOString(),
      names: picked
    });

    Deno.writeTextFile("./history.json", JSON.stringify(history, null, 2));

    return picked;
  }

  app.get("/api/team", (c: Context) => c.json(config.team));

  app.post("/api/pick", async (c: Context) => {
    const body = await c.req.json();
    const availableNames = body.availableNames as string[];
    const picked = pickNames(availableNames);
    return c.json(picked);
  });

  app.get("/api/history", (c: Context) => c.json(history));

  app.post("/api/reset", async (c: Context) => {
    history = { selections: [], lastReset: new Date().toISOString() };
    await Deno.writeTextFile("./history.json", JSON.stringify(history, null, 2));
    return c.json({ message: "History reset successfully" });
  });

  // Serve static files
  app.use("/*", serveStatic({ root: "./static" }));
  app.get("/*", serveStatic({ root: "./static" }));

  return app;
}

// Start server if this is the main module
if (import.meta.main) {
  const app = await initializeApp();
  console.log("Server running on http://localhost:8000");
  Deno.serve({ port: 8000 }, app.fetch);
}
