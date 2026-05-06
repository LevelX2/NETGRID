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
    expect(page).not.toContain("cardBackImageUrl");
    expect(page).not.toContain("/api/card-images/back_");
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
    expect(page).toContain("primeAudio");
    expect(page).toContain("sharedAudioContext");
    expect(page).toContain("optionsDialogOpen");
    expect(page).toContain("OptionsDialog");
    expect(page).toContain("Runner-Rig");
    expect(page).toContain("RunnerRigStrip");
    expect(page).toContain("runnerRigStrip");
    expect(page).toContain("Regelmatch · 7 Agendapunkte");
    expect(page).toContain("Private Matchserie · Seitenwechsel");
    expect(page).toContain("Nächstes Serienspiel");
    expect(page).toContain("seriesAudioOutcome");
    expect(page).not.toContain("resultSummary.cardInstances");
    expect(page).not.toContain("resultSummary.privatePayload");
    expect(page).not.toContain("resultSummary.sessionToken");
  });

  it("keeps the V1.0.5 matchstart lobby and lifecycle recovery explicit without adding browser authority", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    const matchStart = readFileSync("apps/web/app/match-start.ts", "utf8");
    expect(page).toContain('const APP_STATUS_LABEL = "V1.0.8"');
    expect(matchStart).toContain("Mensch gegen Mensch · privater Link");
    expect(matchStart).toContain("Mensch gegen KI");
    expect(matchStart).toContain("KI gegen KI · Simulation");
    expect(page).toContain("Seitenzuteilung");
    expect(page).toContain("Deine Seite");
    expect(matchStart).toContain("Auslosen");
    expect(page).toContain("Match erstellen");
    expect(page).toContain("Beitreten");
    expect(page).toContain("Startbereitschaftslobby");
    expect(page).toContain("showingStartLobby");
    expect(page).toContain("Ich bin bereit");
    expect(page).toContain("Bereitschaft zurücknehmen");
    expect(page).toContain("Zurück zur Auswahl");
    expect(page).toContain("returnToSetupFromLobby");
    expect(page).toContain("Startet automatisch, sobald beide bereit sind.");
    expect(page).toContain("Zielwert {start.agendaPointsToWin} Agenda-Punkte");
    expect(page).toContain("Agenda-Punkte, die für den Spielsieg erreicht werden müssen.");
    expect(page).toContain("LobbyChatMessage");
    expect(page).toContain("serverDisplayLabel");
    expect(readFileSync("apps/web/app/action-board-ui.ts", "utf8")).toContain('if (serverIdOrLabel === "hq" || serverIdOrLabel === "HQ") return "HQ"');
    expect(page).toContain("netrunner.displayName");
    expect(page).toContain("netrunner.recentSessions");
    expect(page).toContain("Letzte Sitzung");
    expect(page).toContain("Fortsetzen");
    expect(page).toContain("Wieder verbinden über Link");
    expect(page).toContain("Verwerfen");
    expect(page).toContain("storedSessionMatches");
    expect(page).toContain("safeRecentSession");
    expect(page).toContain("sanitizeRecentSession");
    expect(page).not.toContain("RecentSessionInfo = SessionInfo");
    expect(page).not.toContain("{ ...session, savedAt");
    expect(page).not.toContain("typeof session.reconnectToken");
    expect(page).toContain("LifecycleResultSummary");
    expect(page).toContain("cancelMatchLifecycle");
    expect(page).toContain("leaveMatchLifecycle");
    expect(page).toContain("forfeitMatch");
    expect(page).toContain("recreateMatch");
    expect(page).toContain('/cancel`');
    expect(page).toContain('/leave`');
    expect(page).toContain('/forfeit`');
    expect(page).toContain('/recreate`');
    expect(page).toContain("Match abbrechen");
    expect(page).toContain("Lobby verlassen");
    expect(page).toContain("Aufgeben");
    expect(page).toContain("Neu erstellen");
    expect(page).toContain("result.reason");
    expect(page).toContain("forfeit");
    expect(page).toContain("opponentDisplayName");
    expect(page).toContain("function OpponentPanel");
    expect(page).toContain("opponentName");
    expect(page).toContain("displayName");
    expect(page).toContain("Meine Decks");
    expect(page).toContain("Speichern");
    expect(page).toContain("Neues Runner-Deck");
    expect(page).toContain("Neues Corp-Deck");
    expect(page).toContain("deckSideFilter");
    expect(page).toContain("Teilnehmer A · Runner-Deck");
    expect(page).toContain("Teilnehmer A · Corp-Deck");
    expect(page).toContain("Teilnehmer B wählt eigene Decks beim Beitritt.");
    expect(page).toContain("Dein Runner-Deck");
    expect(page).toContain("Mit Decks beitreten");
    expect(page).toContain("Testkonstellation · beide Teilnehmer festlegen");
    expect(page).toContain("KI-Decks");
    expect(page).toContain("Deterministisch zufällig");
    expect(page).toContain("participantADecks");
    expect(page).toContain("participantBDecks");
    expect(page).toContain("pendingDeckHandshake");
    expect(page).toContain("set_ready");
    expect(page).toContain("cancel_countdown");
    expect(page).toContain("send_lobby_chat");
    expect(page).toContain("chatMessagesRef");
    expect(page).toContain("element.scrollTop = element.scrollHeight");
    expect(page).toContain("lobby_update");
    expect(page).toContain("validateDeckForMatch");
    expect(page).toContain("aiDeckPolicy");
    expect(page).toContain("viewerAgendaPoints");
    expect(page).toContain("opponentAgendaPoints");
    expect(page).not.toContain("applyAction(");
    expect(page).not.toContain("createGame(");
  });

  it("keeps the V1.0.5 active board UI presentational and side-safe", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    const helpers = readFileSync("apps/web/app/action-board-ui.ts", "utf8");
    const styles = readFileSync("apps/web/app/globals.css", "utf8");

    expect(page).toContain("Mögliche Aktionen");
    expect(page).toContain("Zurücknehmen");
    expect(page).toContain("Letzte Aktion anfragen");
    expect(page).toContain("Wieder verbinden");
    expect(page).toContain("Getaktet");
    expect(page).toContain("Einzelschritt");
    expect(page).toContain("KI-Schritt");
    expect(page).toContain("activeRunTarget");
    expect(page).toContain("installedCorpCard");
    expect(page).toContain("Ungerezzt");
    expect(page).toContain("Gerezzt");
    expect(page).toContain("cuePositionClassName");
    expect(page).toContain("cueDragHandle");
    expect(page).not.toContain("<BoardHeader");
    expect(page).not.toContain("function BoardHeader");
    expect(page).not.toContain("<h2>LegalActions</h2>");
    expect(page).not.toContain("<h2>Undo</h2>");
    expect(page).not.toContain("Runner View");
    expect(page).not.toContain("Corp View");
    expect(page).not.toContain("Dein Fenster");
    expect(page).not.toContain('<p className="eyebrow">Access</p>');
    expect(helpers).toContain("netrunner.actionCuePosition.v1");
    expect(helpers).toContain("Ausgewählte Karte");
    expect(helpers).toContain("Ausgewähltes Objekt");
    expect(helpers).toContain("splitLegalActions");
    expect(helpers).toContain("runTargetServerIds");
    expect(helpers).toContain("groupRunnerRigCards");
    expect(helpers).toContain("corpInstalledCardState");
    expect(styles).toContain(".activeRunTarget");
    expect(styles).toContain(".unrezzedInstalled");
    expect(styles).toContain(".selectedActionGroup");
    expect(styles).toContain(".cuePosition-center");
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
    expect(page).toContain("accessRevealDescription");
    expect(page).toContain("observedAccessStatus");
    expect(page).toContain("{reveal.description}");
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

  it("keeps V1.0.6 resource and card-display presentation side-safe", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    const helpers = readFileSync("apps/web/app/action-board-ui.ts", "utf8");
    const styles = readFileSync("apps/web/app/globals.css", "utf8");
    const cardImageRoute = readFileSync("apps/web/app/api/card-images/[cardId]/route.ts", "utf8");

    expect(page).toContain("function ActionSlotMeter");
    expect(page).toContain("function CreditBadge");
    expect(page).toContain("function CostChips");
    expect(page).toContain("function CardDisplayModeSelector");
    expect(page).toContain("actionSlotCapacities");
    expect(page).toContain("lastActionSlotTurnRef");
    expect(page).toContain("Aktionen");
    expect(page).toContain("Kartenanzeige");
    expect(page).toContain("Vorschau");
    expect(page).not.toContain('label="Clicks"');
    expect(page).not.toContain('label="Klicks"');
    expect(page).not.toContain("Card Display");
    expect(page).not.toContain(">Preview<");
    expect(page).not.toContain("cardBackImageUrl");
    expect(page).not.toContain("/api/card-images/back_");
    expect(cardImageRoute).not.toContain("back_corp");
    expect(cardImageRoute).not.toContain("back_runner");
    expect(helpers).toContain("baseActionSlotCapacity");
    expect(helpers).toContain("actionSlotDisplay");
    expect(helpers).toContain("actionCostChips");
    expect(styles).toContain(".actionSlot");
    expect(styles).toContain(".creditCoin");
    expect(styles).toContain(".costChip");
    expect(styles).toContain(".cardDisplaySelector");
    expect(styles).toContain(".card.textCard");
    expect(styles).toContain(".card.compactCard");
  });

  it("keeps card rules text reachable in image display mode without hidden-card leaks", () => {
    const page = readFileSync("apps/web/app/page.tsx", "utf8");
    expect(page).toContain("Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus");
    expect(page).toContain("aria-describedby={tooltipId}");
    expect(page).toContain("visibleKnownCardIds");
    expect(page).toContain("enrichVisibleCard");
    expect(page).toContain("card.known && card.definitionId");
    expect(page).toContain("nearestTooltipBoundary");
    expect(page).toContain("const nextTooltipPlacement = spaceBelow < 118");
    expect(page).toContain('const rulesText = card.known ? (card.rulesText ?? "") : ""');
    expect(page).toContain('title={nativeTitle}');
    expect(page).toContain("hasRulesText");
    expect(page).toContain("rulesTextLines");
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
    const localPlayableRunnerCards = catalogListResponse(new URLSearchParams()).body.cards.filter(
      (card) => card.catalogCardId.startsWith("onr_v1_") && card.side === "runner" && card.statuses.playable && card.statuses.deck_legal
    );
    if (localPlayableRunnerCards.length < 2) return;
    const [firstLocalCard, secondLocalCard] = localPlayableRunnerCards;
    if (!firstLocalCard || !secondLocalCard || catalogDetailResponse(firstLocalCard.catalogCardId).status === 404) return;

    const response = deckValidationResponse({
      deckId: "local_onr_runner_validation_smoke",
      deckVersion: "0.6.0-local",
      name: "O:NR Runner Validation Smoke",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      formatProfileId: "local-demo-v0.8",
      cards: [
        { cardId: firstLocalCard.catalogCardId, quantity: 3 },
        { cardId: secondLocalCard.catalogCardId, quantity: 3 },
        { cardId: "simple_killer", quantity: 3 },
        { cardId: "simple_economy_event", quantity: 3 }
      ],
      createdAt: "2026-05-04T00:00:00.000Z",
      updatedAt: "2026-05-04T00:00:00.000Z"
    });

    expect(response.status).toBe(200);
    expect(response.body.validation.ok).toBe(true);
    expect(response.body.validation.errors).toEqual([]);
    expect(JSON.stringify(response.body)).not.toContain(`Unknown card ${firstLocalCard.catalogCardId}`);
    expect(JSON.stringify(response.body)).not.toContain(`Unknown card ${secondLocalCard.catalogCardId}`);
  });
});
