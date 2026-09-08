import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-funded-consultants-d308.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildNeutralActionSemanticCandidate } from "../../action-semantic-candidate";
import { applyCostAndTimingProfiles } from "../../actions/action-cost-timing";
import { applyActionEconomyProjection } from "../../actions/action-economy-projection";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";

it("SP-301 funds the exact Accounts → Tycho → Consultants terminal score through Economy support", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const funding = input.legalActions.find((a) =>
    a.source.includes("accounts-receivable"),
  )!;
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(funding.actionId);
  const plan = decision.decisionDebug?.planFirstDecision;
  expect(plan?.rootPlanInstanceId).toMatch(/^plan:corp\.score_agenda:/);
  expect(plan?.leafExecutorInstanceId).toMatch(/^plan:corp\.economy:/);
  expect(plan?.route).toMatchObject({
    actionId: funding.actionId,
    stateVersion: input.playerView.stateVersion,
  });
});

it.each([
  "exact",
  "insufficient_clicks",
  "unaffordable_upfront",
  "missing_gain",
  "contingent",
])("certifies only executable burst funding: %s", (variant) => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const action = input.legalActions.find((a) =>
    a.source.includes("accounts-receivable"),
  )!;
  if (variant === "insufficient_clicks") input.playerView.own.clicks = 2;
  if (variant === "unaffordable_upfront") input.playerView.own.credits = 4;
  if (variant === "missing_gain") delete action.payload!.gainCreditsAmount;
  const candidate = applyActionEconomyProjection(
    applyCostAndTimingProfiles(
      buildNeutralActionSemanticCandidate(action),
      action,
    ),
    action,
  );
  if (variant === "contingent")
    candidate.economyProjection!.reliability = "conditional";
  const paths = corpSameTurnScoreConversionPaths(input, [candidate]).filter(
    (p) => p.fundingPrefix !== undefined,
  );
  if (variant !== "exact") expect(paths).toEqual([]);
  else {
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]).toMatchObject({
      clicksRequired: 3,
      creditsRequired: 17,
      agendaPoints: 4,
      fundingPrefix: {
        actionId: action.actionId,
        clickCost: 1,
        creditCost: 5,
        grossCreditGain: 9,
      },
    });
    expect(paths[0]!.steps.map((s) => s.kind)).toEqual([
      "install_score_target",
      "place_advancement",
      "score_ready",
    ]);
  }
});
