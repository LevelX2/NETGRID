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

  it("turns runner remote contest doctrine into diagnostic contest or coverage goals", () => {
    const complete = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "complete", false, [
        strategy("runner.remote_contest", "complete"),
      ]),
    );
    const partial = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "partial", false, [
        strategy("runner.remote_contest", "partial", ["weak_breaker_coverage"]),
      ]),
    );

    expect(complete).toEqual([
      expect.objectContaining({
        goalId: "runner.doctrine.remote_contest",
        family: "remote_contest",
        evidence: expect.arrayContaining(["doctrine_goal:remote_contest"]),
      }),
    ]);
    expect(partial).toEqual([
      expect.objectContaining({
        goalId: "runner.doctrine.remote_contest_coverage",
        family: "coverage",
        evidence: expect.arrayContaining([
          "missing_breaker_coverage:doctrine_v2",
        ]),
      }),
    ]);
  });

  it("synthesizes broader runner doctrine lines only from strategy anchors", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "complete", false, [
        strategy("runner.hq_pressure", "complete"),
        strategy("runner.search.breaker", "complete"),
        strategy("runner.survival_defense", "complete"),
        strategy("runner.economy_first", "complete"),
      ]),
    );

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "runner.doctrine.hq_pressure_access",
      "runner.doctrine.survival",
      "runner.doctrine.breaker_search",
      "runner.doctrine.economy_engine",
    ]);
    expect(goals.map((goal) => goal.family)).toEqual([
      "pressure",
      "risk_control",
      "coverage",
      "economy",
    ]);
  });

  it("keeps support-only runner strategy diagnostics from creating goals", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "complete", false, [
        strategy("runner.hq_pressure", "complete", [], {
          anchorScore: 0,
          anchorEvidenceCount: 0,
          supportScore: 95,
          supportEvidenceCount: 4,
          finalScore: 55,
        }),
      ]),
    );

    expect(goals).toEqual([]);
  });

  it("turns partial runner strategy diagnostics into setup or coverage work", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("runner", "partial", false, [
        strategy("runner.hq_pressure", "partial"),
        strategy("runner.rnd_pressure", "partial", ["missing_wall_coverage"]),
      ]),
    );

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "runner.doctrine.rnd_pressure_coverage",
      "runner.doctrine.hq_pressure_setup",
    ]);
    expect(goals.some((goal) => goal.goalId.endsWith("_access"))).toBe(false);
    expect(goals.map((goal) => goal.family)).toEqual(["coverage", "setup"]);
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

  it("synthesizes broader corp doctrine lines from their strategy anchors", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("corp", "complete", false, [
        strategy("corp.fast_advance", "complete"),
        strategy("corp.ice_tax_glacier", "complete"),
        strategy("corp.asset_economy", "complete"),
        strategy("corp.central_stabilize", "complete"),
        strategy("corp.ambush_bluff", "complete"),
      ]),
    );

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "corp.doctrine.fast_advance",
      "corp.doctrine.ice_tax",
      "corp.doctrine.hq_defense",
      "corp.doctrine.rnd_defense",
      "corp.doctrine.asset_economy",
      "corp.doctrine.remote_ambush",
    ]);
    expect(goals.map((goal) => goal.family)).toEqual([
      "corp_scoreline",
      "corp_ice_defense",
      "corp_ice_defense",
      "corp_ice_defense",
      "economy",
      "damage_pressure",
    ]);
  });

  it("does not turn partial corp doctrine into scoreline or ambush payoff goals", () => {
    const goals = synthesizeDoctrineTacticalGoals(
      diagnostic("corp", "partial", false, [
        strategy("corp.fast_advance", "partial"),
        strategy("corp.remote_scoring", "partial"),
        strategy("corp.ambush_bluff", "partial"),
      ]),
    );

    expect(goals.map((goal) => goal.goalId)).toEqual([
      "corp.doctrine.remote_scoring_setup",
      "corp.doctrine.fast_advance_setup",
      "corp.doctrine.remote_ambush_setup",
    ]);
    expect(goals.every((goal) => goal.family === "setup")).toBe(true);
    expect(goals.some((goal) => goal.family === "corp_scoreline")).toBe(false);
    expect(goals.some((goal) => goal.family === "damage_pressure")).toBe(false);
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
  overrides: Partial<DeckDoctrineV2StrategyDiagnostic> = {},
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
    ...overrides,
  };
}
