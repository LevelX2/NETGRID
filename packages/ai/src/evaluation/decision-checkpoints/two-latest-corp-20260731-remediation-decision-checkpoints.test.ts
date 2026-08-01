import { describe, expect, it } from "vitest";

import earlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-723d40-latest-01-early-defense-d3.json";
import sameTurnScoreD34Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-723d40-latest-02-same-turn-score-d34.json";
import sirenEarlyDefenseD3Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-01-early-defense-d3.json";
import startScoreRemoteD19Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-02-start-score-remote-d19.json";
import bindNewRemoteD20Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-02-bind-new-remote-d20.json";
import hardenBoundRemoteD88Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-03-harden-bound-remote-d88.json";
import continueTychoD89Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-03-continue-tycho-d89.json";
import installBeforeOverflowD94Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-04-install-score-before-overflow-d94.json";
import rezHauntingD78Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-05-rez-haunting-d78.json";
import rezDataWallD84Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-06-rez-data-wall-d84.json";
import preserveScoreReserveD52Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-07-preserve-score-reserve-d52.json";
import retainTychoDiscardCfoD97Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-daed3ad-latest-08-retain-tycho-discard-cfo-d97.json";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";

describe("two latest Corp matches 2026-07-31 remediation checkpoints", () => {
  it.each([
    ["Rent to Own", earlyDefenseD3Json],
    ["Siren Fortress", sirenEarlyDefenseD3Json],
  ])(
    "chooses a productive early defense route over an unbound basic credit for %s",
    (_deck, json) => {
      const result = runAiDecisionCheckpoint(fixture(json));
      expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    },
  );

  it("converts the exact guaranteed same-turn agenda line before ordinary defense", () => {
    const result = runAiDecisionCheckpoint(fixture(sameTurnScoreD34Json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it.each([
    ["starts a scoring remote or honors terminal central defense", startScoreRemoteD19Json],
    ["binds the created scoring remote", bindNewRemoteD20Json],
    [
      "installs score material before agenda overflow",
      installBeforeOverflowD94Json,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("honors terminal central defense or continues a bound score campaign", () => {
    const hardening = runAiDecisionCheckpoint(
      fixture(hardenBoundRemoteD88Json),
    );
    expect(hardening.ok, `${hardening.code}: ${hardening.message}`).toBe(true);

    if (hardening.selectedAction?.payload?.serverId !== "remote_1") return;

    const continuation = fixture(continueTychoD89Json);
    const resident = residentPlanPortfolioSnapshot(hardening.input);
    expect(resident).toBeDefined();
    if (!resident) throw new Error("missing resident score campaign");
    continuation.runtime.residentPlanPortfolio = resident;
    const result = runAiDecisionCheckpoint(continuation);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it.each([
    ["rezzes the materially taxing Haunting Inquisition", rezHauntingD78Json],
    ["rezzes the exact affordable Data Wall", rezDataWallD84Json],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not spend the score reserve on a pure Washington Grid overflow conversion", () => {
    const result = runAiDecisionCheckpoint(
      fixture(preserveScoreReserveD52Json),
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("retains Tycho and discards the lower-value CFO through the hand plan", () => {
    const result = runAiDecisionCheckpoint(
      fixture(retainTychoDiscardCfoD97Json),
    );
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}
