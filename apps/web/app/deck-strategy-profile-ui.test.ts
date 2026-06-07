import { describe, expect, it } from "vitest";
import {
  containsForbiddenDeckStrategyField,
  deckStrategyProfileJsonExport,
  deckStrategyProfileJsonExportFileName,
  deckStrategyEvidenceKey,
  deckStrategyProfileEntryKey,
  forbiddenDeckStrategyFields,
  formatDeckStrategyValue,
  formatStrategyLabel,
  formatStrategyScore,
  scoreWidthPercent,
  serializeDeckStrategyProfileJsonExport,
  strategyStatusLabel,
  strategyStatusTone,
  type DeckStrategyProfileViewer,
} from "./deck-strategy-profile-ui";

describe("AI007 deck strategy profile UI helpers", () => {
  it("formats strategy IDs, scores and status labels for display", () => {
    expect(formatStrategyLabel("runner.interface_closeout")).toBe("Interface Closeout");
    expect(formatStrategyLabel("corp.tag_trace_punish")).toBe("Tag Trace Punish");
    expect(formatDeckStrategyValue("legacy_lineSupport")).toBe("legacy line support");
    expect(formatStrategyScore(74.4)).toBe("74");
    expect(scoreWidthPercent(124)).toBe("100%");
    expect(strategyStatusLabel("primary")).toBe("Primär");
    expect(strategyStatusLabel("secondary")).toBe("Sekundär");
    expect(strategyStatusTone("unsupported")).toBe("legacy");
  });

  it("creates stable non-JSON render keys", () => {
    expect(
      deckStrategyProfileEntryKey("runner-coverage", { label: "Wall", value: "2", tone: "info" }, 0),
    ).toBe("runner-coverage-0-Wall-2");
    expect(deckStrategyEvidenceKey("runner.rnd_pressure", "anchor", "R&D Interface", 1)).toBe(
      "runner.rnd_pressure-anchor-1-R&D Interface",
    );
  });

  it("detects runtime-only and planner-only field names", () => {
    expect(
      containsForbiddenDeckStrategyField({
        profile: {
          cardInstances: [],
        },
      }),
    ).toBe(true);
    expect(
      forbiddenDeckStrategyFields({
        stateHash: "forbidden",
        nested: {
          planWeights: {},
          actionScores: [],
        },
      }),
    ).toEqual(["actionScores", "planWeights", "stateHash"]);
  });

  it("serializes the diagnostic viewer as a safe JSON export", () => {
    const viewer = sampleViewer();
    const payload = deckStrategyProfileJsonExport(viewer, "2026-06-07T10:00:00.000Z");

    expect(payload).toMatchObject({
      schemaVersion: "ai007-deck-strategy-json-export-v1",
      taskId: "AI007",
      exportKind: "diagnostic_ai_deck_profile",
      exportedAt: "2026-06-07T10:00:00.000Z",
      plannerEffect: "none",
      deck: {
        deckId: "deck-1",
        deckName: "Test Deck",
        side: "runner",
        cardCount: 2,
        deckHash: "fnv1a:test",
      },
      safety: {
        payload: "deck_strategy_profile_viewer_only",
        forbiddenFields: [],
      },
    });
    expect(payload.viewer).toEqual(viewer);
    expect(JSON.parse(serializeDeckStrategyProfileJsonExport(viewer, "2026-06-07T10:00:00.000Z"))).toEqual(payload);
    expect(deckStrategyProfileJsonExportFileName(viewer)).toBe("netgrid-ki-deckprofil-runner-test-deck.json");
  });

  it("blocks JSON exports when forbidden fields are accidentally attached", () => {
    const unsafeViewer = {
      ...sampleViewer(),
      stateHash: "must-not-export",
    } as unknown as DeckStrategyProfileViewer;

    expect(() => deckStrategyProfileJsonExport(unsafeViewer, "2026-06-07T10:00:00.000Z")).toThrow(
      /stateHash/,
    );
  });
});

function sampleViewer(): DeckStrategyProfileViewer {
  return {
    schemaVersion: "ai007-deck-strategy-viewer-v1",
    taskId: "AI007",
    deckId: "deck-1",
    deckName: "Test Deck",
    side: "runner",
    cardCount: 2,
    statusEntries: [{ label: "Deck", value: "Test Deck", tone: "info" }],
    source: {
      label: "Diagnostisches KI-Deckprofil",
      aggregation: "AI006 strategy aggregation",
      profileSchemaVersion: "ai-deck-strategy-profile-v1",
      profileTaskId: "AI006",
      plannerEffect: "none",
      deckHash: "fnv1a:test",
    },
    diagnosticNotice: "Diagnostisches KI-Deckprofil",
    primaryStrategies: ["runner.rnd_pressure"],
    secondaryStrategies: [],
    strategies: [
      {
        strategyId: "runner.rnd_pressure",
        label: "Rnd Pressure",
        anchorScore: 80,
        supportScore: 40,
        finalScore: 65,
        confidence: "medium",
        status: "primary",
        evidenceCount: 1,
        gapCount: 0,
      },
    ],
    sideProfileTitle: "Runner-Profil",
    sideProfileGroups: [],
    evidenceGroups: [],
    functionSignalCounts: [{ label: "function-signals", value: "breaker.wall: 1", tone: "info" }],
    legacySignalGroups: [],
    warnings: [],
  };
}
