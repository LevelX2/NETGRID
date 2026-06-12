import { describe, expect, it } from "vitest";
import type {
  DeckDoctrineV2Diagnostic,
  DeckDoctrineV2DiagnosticStatus,
  DeckDoctrineV2StrategyDiagnostic,
} from "../deck-doctrine-strategy";
import { synthesizeDoctrineTacticalGoals } from "./doctrine-goal-synthesis";

describe("doctrine goal synthesis", () => {
  it("turns anchorless doctrine into a neutral setup goal", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "anchorless", true, []),
    );

    expect(goals).toEqual([
      expect.objectContaining({
        goalId: "runner.doctrine.neutral",
        family: "setup",
        source: "deck",
      }),
    ]);
  });

  it("turns complete runner R&D pressure into a run-access bias", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "complete", false, [
        strategy("runner.rnd_pressure", "complete"),
      ]),
    );

    expect(goals).toEqual([
      expect.objectContaining({
        goalId: "runner.doctrine.rnd_pressure_access",
        family: "pressure",
        evidence: expect.arrayContaining(["doctrine_goal:run_access"]),
      }),
    ]);
  });

  it("turns incomplete runner R&D pressure with coverage gaps into setup work", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "partial", false, [
        strategy("runner.rnd_pressure", "partial", ["missing_wall_coverage"]),
      ]),
    );

    expect(goals).toEqual([
      expect.objectContaining({
        goalId: "runner.doctrine.rnd_pressure_coverage",
        family: "coverage",
        evidence: expect.arrayContaining([
          "missing_breaker_coverage:doctrine_v2",
        ]),
      }),
    ]);
  });

  it("turns complete corp remote scoring into scoreline and defense goals", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("corp", "complete", false, [
        strategy("corp.remote_scoring", "complete"),
      ]),
    );

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "corp.doctrine.remote_scoring_scoreline",
      "corp.doctrine.remote_scoring_ice_defense",
    ]);
    expect(goals.map((goal) => goal.family)).toEqual([
      "corp_scoreline",
      "corp_ice_defense",
    ]);
  });

  it("does not synthesize punish or damage goals from unsupported payoffs", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("corp", "complete", false, [
        strategy("corp.tag_trace_punish", "complete", [
          "low_punish_payoff_density",
        ]),
        strategy("corp.damage_kill", "complete", ["payoff_without_enablers"]),
      ]),
    );

    expect(goals.some((goal) => goal.family === "tag_punish")).toBe(false);
    expect(goals.some((goal) => goal.family === "damage_pressure")).toBe(false);
  });
});

function diagnostic(
  side: "runner" | "corp",
  status: DeckDoctrineV2DiagnosticStatus,
  neutralDoctrine: boolean,
  strategies: DeckDoctrineV2StrategyDiagnostic[],
): DeckDoctrineV2Diagnostic {
  return {
    schemaVersion: "deck-doctrine-v2-diagnostic-v1",
    scope: "diagnostic_only",
    productiveUseAllowed: false,
    deckSnapshotId: `${side}-test`,
    side,
    status,
    neutralDoctrine,
    strategyDiagnostics: strategies,
    rolesStatus: {
      status,
      cardCount: 0,
      cardRows: 0,
      completeCards: 0,
      partialCards: 0,
      anchorlessCards: 0,
      cardsWithoutRoles: [],
      roleSignalCount: 0,
      functionSignalCount: 0,
      strategyAnchorCount: 0,
    },
    cardRoles: [],
    warnings: [],
    source: {
      strategyProfile: "buildDeckStrategyProfile",
      mode: "report_only",
      plannerEffect: "none",
    },
    noEffectFlags: {
      actionSelection: false,
      plannerWeights: false,
      scoring: false,
      legalActionGeneration: false,
      engineMutation: false,
      hiddenInfoProjection: false,
    },
  };
}

function strategy(
  strategyId: string,
  status: Exclude<DeckDoctrineV2DiagnosticStatus, "unknown_snapshot">,
  supportGaps: string[] = [],
): DeckDoctrineV2StrategyDiagnostic {
  return {
    strategyId,
    status,
    anchorScore: status === "complete" ? 80 : 35,
    supportScore: status === "complete" ? 80 : 20,
    finalScore: status === "complete" ? 80 : 35,
    confidence: status === "complete" ? "high" : "medium",
    anchorEvidenceCount: status === "anchorless" ? 0 : 1,
    supportEvidenceCount: supportGaps.length > 0 ? 0 : 1,
    supportGaps,
  };
}
