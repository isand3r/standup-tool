import { assertEquals, assertArrayIncludes } from "@std/assert";

// Mock data for tests
const mockConfig = {
  team: ["Alice", "Bob", "Charlie", "David", "Eve"],
  settings: {
    picksPerWeek: 2
  }
};

let mockHistory = {
  selections: [],
  lastReset: null
};

// Mock file system operations
const originalReadTextFile = Deno.readTextFile;
const originalWriteTextFile = Deno.writeTextFile;

function setupMocks() {
  // Reset mockHistory for each test
  mockHistory = {
    selections: [],
    lastReset: null
  };

  // @ts-ignore: Mocking file system
  Deno.readTextFile = (path: string) => {
    if (path === "./config.json") {
      return JSON.stringify(mockConfig);
    }
    if (path === "./history.json") {
      return JSON.stringify(mockHistory);
    }
    throw new Error(`Unexpected file path: ${path}`);
  };

  // @ts-ignore: Mocking file system
  Deno.writeTextFile = (path: string, content: string) => {
    if (path === "./history.json") {
      mockHistory = JSON.parse(content);
    }
  };
}

function teardownMocks() {
  Deno.readTextFile = originalReadTextFile;
  Deno.writeTextFile = originalWriteTextFile;
}

import { initializeApp } from "./main.ts";

// Setup app for each test
async function createTestApp() {
  setupMocks();
  const app = await initializeApp();
  return app;
}

Deno.test("API - GET /api/team returns team list", async () => {
  const app = await createTestApp();
  const res = await app.request("/api/team");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body, mockConfig.team);
  teardownMocks();
});

Deno.test("API - POST /api/pick returns correct number of names and avoids repetition", async () => {
  const app = await createTestApp();
  const availableNames = ["Alice", "Bob", "Charlie", "David"];

  // First pick should get two unique names
  const res1 = await app.request("/api/pick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availableNames }),
  });

  assertEquals(res1.status, 200);
  const picked1 = await res1.json() as string[];
  assertEquals(picked1.length, mockConfig.settings.picksPerWeek);
  picked1.forEach((name: string) => {
    assertArrayIncludes(availableNames, [name]);
  });
  assertEquals(new Set(picked1).size, picked1.length, "Names in first pick should be unique");

  // Second pick should get two different names
  const res2 = await app.request("/api/pick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availableNames }),
  });

  assertEquals(res2.status, 200);
  const picked2 = await res2.json() as string[];
  assertEquals(picked2.length, mockConfig.settings.picksPerWeek);
  picked2.forEach((name: string) => {
    assertArrayIncludes(availableNames, [name]);
    assertEquals(picked1.includes(name), false, "Second pick should not repeat names from first pick");
  });

  teardownMocks();
});

Deno.test("API - POST /api/pick resets selection after all names have been picked", async () => {
  const app = await createTestApp();
  const availableNames = ["Alice", "Bob", "Charlie", "David"];

  // Make picks for all names
  for (let i = 0; i < 2; i++) {
    await app.request("/api/pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableNames }),
    });
  }

  // Make one more pick, which should reset and pick from all names again
  const res = await app.request("/api/pick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availableNames }),
  });

  assertEquals(res.status, 200);
  const picked = await res.json();
  assertEquals(picked.length, mockConfig.settings.picksPerWeek);
  picked.forEach((name: string) => {
    assertArrayIncludes(availableNames, [name]);
  });

  teardownMocks();
});

Deno.test("API - GET /api/history returns history with correct structure", async () => {
  const app = await createTestApp();

  // Make a pick to add to history
  await app.request("/api/pick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availableNames: mockConfig.team }),
  });

  const res = await app.request("/api/history");
  assertEquals(res.status, 200);
  const body = await res.json();

  assertEquals(body.selections.length, 1);
  assertEquals(typeof body.selections[0].date, "string");
  assertEquals(body.selections[0].names.length, mockConfig.settings.picksPerWeek);
  assertEquals(body.lastReset, null);

  teardownMocks();
});

Deno.test("API - POST /api/reset resets history", async () => {
  const app = await createTestApp();

  // Make a pick to add to history
  await app.request("/api/pick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availableNames: mockConfig.team }),
  });

  // Reset history
  const resetRes = await app.request("/api/reset", {
    method: "POST"
  });
  assertEquals(resetRes.status, 200);
  const resetBody = await resetRes.json();
  assertEquals(resetBody.message, "History reset successfully");

  // Check that history is reset
  const historyRes = await app.request("/api/history");
  const historyBody = await historyRes.json();
  assertEquals(historyBody.selections.length, 0);
  assertEquals(typeof historyBody.lastReset, "string");

  teardownMocks();
});

Deno.test("API - Static files are served", async () => {
  const mockHtml = "<!DOCTYPE html><html><body>Test</body></html>";
  const originalReadFile = Deno.readFile;
  const originalExists = Deno.stat;

  // @ts-ignore: Mocking file system
  Deno.readFile = (path: string) => {
    if (path.endsWith("/index.html")) {
      return new TextEncoder().encode(mockHtml);
    }
    throw new Error(`Unexpected file path: ${path}`);
  };

  // @ts-ignore: Mocking file system
  Deno.stat = (path: string) => {
    if (path.endsWith("/index.html")) {
      return {} as Deno.FileInfo;
    }
    throw new Error("File not found");
  };

  const app = await createTestApp();
  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("Content-Type"), "text/html; charset=utf-8");

  // Ensure response body is consumed and closed
  await res.text();

  // Restore original functions
  Deno.readFile = originalReadFile;
  Deno.stat = originalExists;
  teardownMocks();
});

Deno.test("API - Returns 404 for non-existent paths", async () => {
  const app = await createTestApp();
  const res = await app.request("/non-existent-path");
  assertEquals(res.status, 404);
  // Ensure response body is consumed and closed
  await res.text();
  teardownMocks();
});
