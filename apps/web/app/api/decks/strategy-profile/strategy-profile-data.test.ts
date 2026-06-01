import { describe, expect, it } from "vitest";
import type { AiDeckStrategyProfile } from "@netgrid/ai";
import type { DeckSnapshot, EditableDeck } from "@netgrid/decks";
import snapshotsData08 from "../../../../../../data/decks/deck-snapshots-0.8.json";
import {
  buildDeckStrategyProfileViewer,
  deckStrategyProfileViewerResponse,
} from "./strategy-profile-data";

const snapshots = snapshotsData08.snapshots as DeckSnapshot[];

describe("AI007 DeckDoctrine strategy profile view model", () => {
  it("builds a dynamic Runner viewer with strategy scores and side profiles", () => {
    const response = deckStrategyProfileViewerResponse(
      editableDeckFromSnapshot("onr_origin_runner_ai_snapshot_v1"),
    );
    const viewer = expectAvailable(response);

    expect(viewer.source).toMatchObject({
      label: "Diagnostisches KI-Deckprofil",
      aggregation: "AI006 strategy aggregation",
      plannerEffect: "none",
    });
    expect(viewer.statusEntries.map((entry) => entry.value)).toContain(
      "AI006 strategy aggregation aus neuer KI-Semantik",
    );
    expect(viewer.statusEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Analysequelle", value: "Diagnostisches KI-Deckprofil" }),
        expect.objectContaining({ label: "Plannerwirkung", value: "Noch keine direkte Plannerwirkung" }),
        expect.objectContaining({ label: "Legacy-Signale", value: "getrennt gezählt" }),
      ]),
    );
    expect(viewer.diagnosticNotice).toContain("Strategieprofile werden aus neuer KI-Semantik berechnet");
    expect(viewer.diagnosticNotice).toContain("Noch keine direkte Plannerwirkung");
    expect(viewer.diagnosticNotice).toContain("Legacy-PlanWeights");
    expect(viewer.strategies.length).toBeGreaterThan(3);
    expect(viewer.strategies[0]?.finalScore).toBeGreaterThanOrEqual(
      viewer.strategies[1]?.finalScore ?? 0,
    );
    expect(viewer.strategies.some((strategy) => strategy.strategyId.startsWith("runner."))).toBe(true);
    expect(viewer.sideProfileGroups.map((section) => section.title)).toEqual([
      "Coverage",
      "Economy",
      "Setup",
      "Pressure",
      "Defense",
    ]);
    expect(flattenEntries(viewer.sideProfileGroups)).toContain("Wall");
    expect(flattenEntries(viewer.sideProfileGroups)).toContain("R&D");
    expect(flattenEntries(viewer.functionSignalCounts)).toContain("breaker.");
  });

  it("builds a dynamic Corp viewer with strategy scores and side profiles", () => {
    const response = deckStrategyProfileViewerResponse(
      editableDeckFromSnapshot("onr_origin_corp_ai_tag_ops_snapshot_v1"),
    );
    const viewer = expectAvailable(response);

    expect(viewer.strategies.some((strategy) => strategy.strategyId.startsWith("corp."))).toBe(true);
    expect(viewer.sideProfileGroups.map((section) => section.title)).toEqual([
      "ICE",
      "Score",
      "Economy",
      "Punish",
      "Remote",
    ]);
    expect(flattenEntries(viewer.sideProfileGroups)).toContain("Tag sources");
    expect(flattenEntries(viewer.sideProfileGroups)).toContain("Trace density");
    expect(viewer.strategies.map((strategy) => strategy.finalScore)).toEqual(
      [...viewer.strategies.map((strategy) => strategy.finalScore)].sort(
        (left, right) => right - left,
      ),
    );
  });

  it("exposes anchor evidence, support evidence, gaps and legacy counts separately", () => {
    const evidenceResponse = deckStrategyProfileViewerResponse(
      editableDeckFromSnapshot("onr_origin_runner_ai_snapshot_v1"),
    );
    const evidenceViewer = expectAvailable(evidenceResponse);
    const gapResponse = deckStrategyProfileViewerResponse(
      editableDeckFromSnapshot("king_of_the_road_runner_ai_snapshot_v1"),
    );
    const gapViewer = expectAvailable(gapResponse);
    const evidenceText = JSON.stringify(evidenceViewer.evidenceGroups);

    expect(evidenceViewer.evidenceGroups.length).toBeGreaterThan(0);
    expect(evidenceText).toMatch(/anchorEvidence/);
    expect(evidenceText).toMatch(/supportEvidence/);
    expect(evidenceViewer.evidenceGroups.some((group) => group.anchorEvidence.length > 0)).toBe(true);
    expect(evidenceViewer.evidenceGroups.some((group) => group.supportEvidence.length > 0)).toBe(true);
    expect(gapViewer.strategies.some((strategy) => strategy.gapCount > 0)).toBe(true);
    const legacyGroupTitles = gapViewer.legacySignalGroups.map((group) => group.title);
    expect(legacyGroupTitles).toEqual(expect.arrayContaining(["Legacy roles", "Legacy planRoles"]));
    expect(legacyGroupTitles.every((title) => title.startsWith("Legacy"))).toBe(true);
  });

  it("does not expose planner, action-score or runtime-only fields", () => {
    const response = deckStrategyProfileViewerResponse(
      editableDeckFromSnapshot("onr_origin_corp_ai_snapshot_v1"),
    );
    expect(response.status).toBe("available");
    const serialized = JSON.stringify(response);

    expect(serialized).not.toMatch(
      /"(?:planWeights|actionScores|actionScore|legalActions|playerActions|stateHash|stateVersion|cardInstances|privatePayload|GameState)"\s*:/i,
    );
  });

  it("returns a non-crashing unavailable response for empty or malformed decks", () => {
    const emptyDeck = {
      ...editableDeckFromSnapshot("onr_origin_runner_ai_snapshot_v1"),
      cards: [],
    };

    expect(deckStrategyProfileViewerResponse(emptyDeck)).toMatchObject({
      status: "unavailable",
      reason: "Deck enthält keine Karten",
    });
    expect(deckStrategyProfileViewerResponse({ side: "unknown", cards: [] })).toMatchObject({
      status: "unavailable",
      reason: "Deckprofil konnte nicht berechnet werden",
    });
  });

  it("renders a partial AI006 profile without side-profile fields", () => {
    const profile: AiDeckStrategyProfile = {
      schemaVersion: "ai-deck-strategy-profile-v1",
      taskId: "AI006",
      deckId: "partial-runner",
      side: "runner",
      cardCount: 1,
      strategyScores: {
        "runner.rnd_pressure": {
          anchorScore: 70,
          supportScore: 20,
          finalScore: 50,
          anchorEvidence: [
            {
              cardId: "onr_v1_139_r-and-d-interface",
              quantity: 1,
              source: "derivedStrategyAnchor",
              strategyId: "runner.rnd_pressure",
              reason: "test_anchor",
            },
          ],
          supportEvidence: [
            {
              cardId: "onr_v1_021_dwarf",
              quantity: 1,
              source: "functionSignal",
              signal: "breaker.wall",
              reason: "support:breakerCoverage",
            },
          ],
          supportGaps: ["weak_sentry_coverage"],
          confidence: "medium",
        },
      },
      primaryStrategies: ["runner.rnd_pressure"],
      secondaryStrategies: [],
      functionSignalCounts: { "breaker.wall": 1 },
      legacySignalCounts: { "role:program": 1 },
      warnings: [],
      source: {
        mode: "diagnostic_only",
        strategyGoals: "data/ai/strategy-goals-v1.json",
        compiledHints: "data/ai/ai-card-hints-compiled.json",
        inspectorIndex: "data/ai/ai-hint-inspector-index.json",
        plannerEffect: "none",
      },
    };

    const viewer = buildDeckStrategyProfileViewer(
      profile,
      { name: "Partial Runner", deckHash: "fnv1a:test" },
      {
        deckId: "partial-runner",
        name: "Partial Runner",
        side: "runner",
      },
    );

    expect(viewer.sideProfileGroups).toEqual([]);
    expect(viewer.evidenceGroups[0]?.supportGaps).toEqual([
      { gapName: "weak_sentry_coverage", strategyId: "runner.rnd_pressure", tone: "warning" },
    ]);
  });
});

function editableDeckFromSnapshot(snapshotId: string): EditableDeck {
  const snapshot = snapshots.find((candidate) => candidate.deckSnapshotId === snapshotId);
  if (!snapshot) throw new Error(`Missing snapshot ${snapshotId}`);
  return {
    deckId: snapshot.sourceDeckId,
    deckVersion: snapshot.deckVersion,
    name: snapshot.name,
    side: snapshot.side,
    identityCardId: snapshot.identityCardId,
    cardPoolSnapshotId: snapshot.cardPoolSnapshotId,
    ...(snapshot.cardPoolVersion ? { cardPoolVersion: snapshot.cardPoolVersion } : {}),
    formatProfileId: snapshot.formatProfileId,
    ...(snapshot.formatProfileVersion ? { formatProfileVersion: snapshot.formatProfileVersion } : {}),
    cards: snapshot.cards.map((card) => ({
      cardId: card.cardId,
      quantity: card.quantity,
    })),
    createdAt: "2026-05-31T00:00:00.000Z",
    updatedAt: "2026-05-31T00:00:00.000Z",
  };
}

function expectAvailable(
  response: ReturnType<typeof deckStrategyProfileViewerResponse>,
) {
  expect(response.status).toBe("available");
  if (response.status !== "available") throw new Error(response.reason);
  return response.viewer;
}

function flattenEntries(value: Array<{ entries: Array<{ label: string; value: string }> }> | Array<{ label: string; value: string }>): string {
  const entries = "entries" in (value[0] ?? {})
    ? (value as Array<{ entries: Array<{ label: string; value: string }> }>).flatMap((section) => section.entries)
    : (value as Array<{ label: string; value: string }>);
  return entries.map((entry) => `${entry.label} ${entry.value}`).join("\n");
}
