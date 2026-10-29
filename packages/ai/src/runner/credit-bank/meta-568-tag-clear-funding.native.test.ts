import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { quoteRunnerTagClearBankFunding } from "../defense-recovery/tag-clear-bank-funding";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta568-broker-tag-clear-funding.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}
afterEach(resetResidentPlanPortfolioMemory);
it("funds the current Defense tag clear through Broker before losing the three exposed resources", () => {
  const { input, runtime, validation } = fixture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  expect(input.playerView.own).toMatchObject({
    credits: 0,
    clicks: 2,
    tags: 1,
  });
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId),
  ).toMatchObject({
    type: "activated_card_ability",
    source: "runner_onr_v1_154_broker_2",
    payload: { cardImplementationAbilityKey: "withdraw_credits" },
  });
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
    selectedPlan: { moduleId: "runner.credit_bank" },
    route: {
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(
    portfolio.instances.find((p) => p.moduleId === "runner.credit_bank"),
  ).toMatchObject({
    parentInstanceId: "plan:runner.defense_and_recovery:runner",
    parentNeedId: "runner-defense-tag-clear-funding",
    moduleState: { phase: "cash_out", signal: { priorityClass: "P2" } },
  });
});

function quoteParams() {
  const { input } = fixture();
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const cash = candidates.find(
    (c) => c.planOwnerBinding?.route === "cash_out",
  )!;
  return { input, candidates, cash };
}
it("quotes exactly one payout and reserves the final action for the complete tag clear", () => {
  const p = quoteParams(),
    before = JSON.stringify(p);
  expect(quoteRunnerTagClearBankFunding(p.input, p.candidates)).toMatchObject({
    stateVersion: 252,
    status: "covered_guaranteed",
    reliability: "guaranteed",
    horizon: "same_turn",
    projectedGap: 0,
    totalClickCost: 1,
    firstStepActionId: p.cash.actionId,
  });
  expect(JSON.stringify(p)).toBe(before);
});
it.each([
  "last_click",
  "two_tags",
  "no_tag",
  "already_funded",
  "stale",
  "conditional",
  "hand_cost",
  "wrong_source",
] as const)("does not certify the %s cleanup countercase", (kind) => {
  const p = quoteParams();
  if (kind === "last_click") p.input.playerView.own.clicks = 1;
  if (kind === "two_tags") {
    p.input.playerView.own.tags = 2;
    p.input.playerView.own.clicks = 3;
  }
  if (kind === "no_tag") p.input.playerView.own.tags = 0;
  if (kind === "already_funded") p.input.playerView.own.credits = 2;
  if (kind === "stale")
    p.input.legalActions.find((a) => a.actionId === p.cash.actionId)!
      .expiresAtStateVersion--;
  if (kind === "conditional")
    p.cash.economyProjection!.reliability = "conditional";
  if (kind === "hand_cost") p.cash.economyProjection!.netHandDelta = -1;
  if (kind === "wrong_source") p.cash.sourceCardInstanceId = "absent-bank";
  expect(quoteRunnerTagClearBankFunding(p.input, p.candidates)).toBeUndefined();
});
it("does not spend the same finite bank twice through duplicate payout offers", () => {
  const p = quoteParams();
  p.input.playerView.own.tags = 2;
  p.input.playerView.own.clicks = 4;
  const action = p.input.legalActions.find(
    (a) => a.actionId === p.cash.actionId,
  )!;
  p.input.legalActions.push({ ...action, actionId: "duplicate-payout" });
  p.candidates.push({ ...p.cash, actionId: "duplicate-payout" });
  expect(quoteRunnerTagClearBankFunding(p.input, p.candidates)).toBeUndefined();
});
it("includes the bank in the complete horizon even when one of two tags is already affordable", () => {
  const p = quoteParams();
  p.input.playerView.own.tags = 2;
  p.input.playerView.own.clicks = 3;
  p.input.playerView.own.credits = 2;
  expect(quoteRunnerTagClearBankFunding(p.input, p.candidates)).toMatchObject({
    status: "covered_guaranteed",
    totalClickCost: 1,
    firstStepActionId: p.cash.actionId,
  });
});
