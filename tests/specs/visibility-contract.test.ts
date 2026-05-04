import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { catalogDetailResponse, catalogListResponse, catalogStatusSummaryResponse } from "../../apps/web/app/api/cards/catalog-data";
import { deckSnapshotsResponse, deckTemplatesResponse, deckValidationResponse } from "../../apps/web/app/api/decks/deck-data";

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

  it("keeps the V0.7 UI shell image-ready with local asset gates", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("function CardView");
    expect(page).toContain("function RunTimeline");
    expect(page).toContain("function LegalActionsPanel");
    expect(page).toContain("function DiagnosticsDrawer");
    expect(page).toContain("side-filtered");
    expect(page).toContain("localCardImageUrl");
    expect(page).toContain("cardBackImageUrl");
    expect(page).toContain("src={visualImageUrl}");
    expect(page).not.toContain("imageAssetId");
    expect(page).not.toContain("localImagePath");
  });

  it("keeps the S01 result overlay side-safe and outside engine authority", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("function GameOverModal");
    expect(page).toContain("GameResultSummary");
    expect(page).toContain("Du hast das Spiel gewonnen.");
    expect(page).toContain("Du hast das Spiel verloren.");
    expect(page).toContain("playResultSound");
    expect(page).toContain("AudioSettings");
    expect(page).toContain("Regelmatch · 7 Agendapunkte");
    expect(page).toContain("Private Matchserie · Seitenwechsel");
    expect(page).toContain("Nächstes Serienspiel");
    expect(page).toContain("seriesAudioOutcome");
    expect(page).not.toContain("resultSummary.cardInstances");
    expect(page).not.toContain("resultSummary.privatePayload");
    expect(page).not.toContain("resultSummary.sessionToken");
  });

  it("renders the player chronicle without normal-mode technical event metadata", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    const chronicle = readFileSync("apps/web/app/chronicle.ts", "utf8");

    expect(page).toContain("function ChroniclePanel");
    expect(page).toContain("function ChronicleTitle");
    expect(page).toContain("Spielchronik");
    expect(page).toContain("formatChronicleEvent");
    expect(page).toContain("chronicle-${item.category}");
    expect(page).toContain("chronicleCardName");
    expect(page).toContain("displayMode={cardDisplayMode}");
    expect(page).toContain("onFocusCard={focusCard}");
    expect(page).toContain("visibleCardFromCatalogDetail");
    expect(page).toContain("function AccessRevealModal");
    expect(page).toContain("accessRevealFromLatestEvent");
    expect(page).toContain("Du hast auf eine Karte in");
    expect(page).not.toContain("chronicleEntry ${item.category}");
    expect(page).not.toContain("<h2>EventLog</h2>");
    expect(page).not.toContain("function EventLogPanel");
    expect(page).not.toContain("function EventLogEntry");
    expect(page).not.toContain("v{event.stateVersionAfter}");
    expect(page).not.toContain("event.publicPayload.aiReasonCode");
    expect(chronicle).not.toContain("stateHashAfter");
    expect(chronicle).not.toContain("stateVersionAfter");
    expect(chronicle).not.toContain("actionId");
    expect(chronicle).not.toContain("idempotencyKey");
  });

  it("keeps card rules text reachable in image display mode without hidden-card leaks", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus");
    expect(page).toContain("cardRulesDetail");
    expect(page).toContain("aria-describedby={tooltipId}");
    expect(page).toContain("visibleKnownCardIds");
    expect(page).toContain("enrichVisibleCard");
    expect(page).toContain("card.known && card.definitionId");
    expect(page).toContain("nearestTooltipBoundary");
    expect(page).toContain('setTooltipPlacement(spaceBelow < 118');
    expect(page).toContain('rulesText: "1 Credit: +1 Stärke.');
    expect(page).toContain('title={tooltipText}');
    expect(page).toContain('card.known && card.rulesText');
  });

  it("keeps Runner server lanes oriented with Root above ICE", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("function serverLanesForSide");
    expect(page).toContain('side === "runner" ? [rootLane, iceLane] : [iceLane, rootLane]');
    expect(page).toContain("serverLanesForSide(activeView.side, server)");
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
      catalogDetailResponse("v08_burst_credit_event").body,
      catalogStatusSummaryResponse().body
    ];

    const serialized = JSON.stringify(payloads);
    expect(serialized).toContain("catalog_preview_operation_001");
    expect(serialized).toContain("catalog_preview_resource_001");
    expect(serialized).toContain("v08_burst_credit_event");
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
    expect(serialized).toContain("demo_runner_008_snapshot_v0_8");
    expect(serialized).not.toContain("cardInstances");
    expect(serialized).not.toContain("privatePayload");
    expect(serialized).not.toContain("sessionToken");
    expect(serialized).not.toContain("reconnectToken");
    expect(serialized).not.toContain("joinToken");
    expect(serialized).not.toContain("stateSnapshots");
    expect(serialized).not.toContain("undoSnapshots");
  });

  it("validates locally playable O:NR cards through the deck API when the local overlay is present", () => {
    if (catalogDetailResponse("onr_v1_079_bodyweight-synthetic-blood").status === 404) return;

    const response = deckValidationResponse({
      deckId: "local_onr_runner_validation_smoke",
      deckVersion: "0.6.0-local",
      name: "O:NR Runner Validation Smoke",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: "onr_v1_079_bodyweight-synthetic-blood", quantity: 3 },
        { cardId: "onr_v1_040_loony-goon", quantity: 3 },
        { cardId: "simple_killer", quantity: 3 },
        { cardId: "simple_economy_event", quantity: 3 }
      ],
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z"
    });

    expect(response.status).toBe(200);
    expect(response.body.validation.ok).toBe(true);
    expect(response.body.validation.errors).toEqual([]);
    expect(JSON.stringify(response.body)).not.toContain("Unknown card onr_v1_079_bodyweight-synthetic-blood");
    expect(JSON.stringify(response.body)).not.toContain("Unknown card onr_v1_040_loony-goon");
  });
});
