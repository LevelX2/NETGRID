import { describe, expect, it } from "vitest";
import {
  containsForbiddenDeckStrategyField,
  deckStrategyEvidenceKey,
  deckStrategyProfileEntryKey,
  forbiddenDeckStrategyFields,
  formatDeckStrategyValue,
  formatStrategyLabel,
  formatStrategyScore,
  scoreWidthPercent,
  strategyStatusLabel,
  strategyStatusTone,
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
});
