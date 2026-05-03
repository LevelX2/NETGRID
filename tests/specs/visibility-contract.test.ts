import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { catalogDetailResponse, catalogListResponse, catalogStatusSummaryResponse } from "../../apps/web/app/api/cards/catalog-data";
import { deckSnapshotsResponse, deckTemplatesResponse } from "../../apps/web/app/api/decks/deck-data";

describe("Client visibility contract", () => {
  it("keeps the browser page away from full GameState and engine authority", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).not.toContain("@netrunner/engine");
    expect(page).not.toContain("@netrunner/server");
    expect(page).not.toContain("GameState");
    expect(page).toContain("state_update");
    expect(page).toContain("submit_action");
    expect(page).toContain("PlayerView");
    expect(page).toContain("window.sessionStorage");
    expect(page).toContain("DECK_STORAGE_KEY");
    expect(page).not.toContain("window.localStorage.setItem(SESSION_KEY");
    expect(page).not.toContain("window.localStorage.getItem(SESSION_KEY");
  });

  it("keeps the V0.7 UI shell image-ready but asset-gated", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("function CardView");
    expect(page).toContain("function RunTimeline");
    expect(page).toContain("function LegalActionsPanel");
    expect(page).toContain("function DiagnosticsDrawer");
    expect(page).toContain("side-filtered");
    expect(page).not.toContain("<img");
    expect(page).not.toContain("imageAssetId");
    expect(page).not.toContain("localImagePath");
  });

  it("returns PlayerView payloads from the web game API", () => {
    const route = readFileSync("apps/web/app/api/game/route.ts", "utf8");
    expect(route).toContain("getPlayerView(state, \"runner\")");
    expect(route).not.toContain("NextResponse.json(gameState");
    expect(route).not.toContain("NextResponse.json(state");
    expect(route).not.toContain("cardInstances:");
  });

  it("keeps card catalog API payloads free of match and hidden-info data", () => {
    const payloads = [
      catalogListResponse(new URLSearchParams("status=blocked")).body,
      catalogDetailResponse("catalog_preview_operation_001").body,
      catalogStatusSummaryResponse().body
    ];

    const serialized = JSON.stringify(payloads);
    expect(serialized).toContain("catalog_preview_operation_001");
    expect(serialized).toContain("catalog_preview_resource_001");
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("privatePayload");
    expect(serialized).not.toContain("sessionToken");
    expect(serialized).not.toContain("reconnectToken");
    expect(serialized).not.toContain("joinToken");
    expect(serialized).not.toContain("stateSnapshots");
    expect(serialized).not.toContain("undoSnapshots");
  });

  it("keeps deck API payloads free of match and token data", () => {
    const serialized = JSON.stringify([deckTemplatesResponse().body, deckSnapshotsResponse().body]);
    expect(serialized).toContain("demo_runner_004_snapshot_v0_6");
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("privatePayload");
    expect(serialized).not.toContain("sessionToken");
    expect(serialized).not.toContain("reconnectToken");
    expect(serialized).not.toContain("joinToken");
    expect(serialized).not.toContain("stateSnapshots");
    expect(serialized).not.toContain("undoSnapshots");
  });
});
