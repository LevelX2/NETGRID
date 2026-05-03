import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("Client visibility contract", () => {
  it("keeps the browser page away from full GameState and engine authority", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).not.toContain("@netrunner/engine");
    expect(page).not.toContain("@netrunner/server");
    expect(page).not.toContain("GameState");
    expect(page).toContain("state_update");
    expect(page).toContain("submit_action");
    expect(page).toContain("PlayerView");
  });

  it("returns PlayerView payloads from the web game API", () => {
    const route = readFileSync("apps/web/app/api/game/route.ts", "utf8");
    expect(route).toContain("getPlayerView(state, \"runner\")");
    expect(route).not.toContain("NextResponse.json(gameState");
    expect(route).not.toContain("NextResponse.json(state");
    expect(route).not.toContain("cardInstances:");
  });
});
