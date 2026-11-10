import { expect, it } from "vitest";
import checkpoint from "../../../../data/scenarios/ai-decision-checkpoints/cp-p719-r05-g27-d211-composite-funding.json";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { evaluateRunnerRunTargets } from "../runner-run-target-evaluation";
import { runnerBankRunFundingContinuation } from "./runner-bank-run-funding-continuation";

function facts() {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
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
  const target = evaluateRunnerRunTargets({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
  }).find((entry) => entry.actionId === "runner.start_run.remote_1")!;
  const bank = candidates.find((entry) =>
    entry.actionId.endsWith(":withdraw_credits"),
  )!;
  return { input, candidates, target, bank };
}

it("certifies the complete composite route while exposing only the bank's current first step", () => {
  const { input, candidates, target, bank } = facts();
  const quote = runnerBankRunFundingContinuation(
    input,
    candidates,
    input.ownDeckCapabilities!,
    target,
    bank.actionId,
  );
  expect(quote).toMatchObject({
    parentPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    needId: "run-support:remote:remote_1",
    routeActionIds: [bank.actionId],
    routeAssessment: {
      status: "covered_guaranteed",
      totalClickCost: 2,
      projectedGap: 0,
      firstStepActionId: bank.actionId,
    },
  });
});

it.each([
  "insufficient_total_exit",
  "no_run_click",
  "unheld_loan",
  "wrong_run",
  "stale_bank",
  "empty_bank",
  "nonfinite_source",
  "central_consumer",
] as const)("does not bind an unsupported composite prefix: %s", (variant) => {
  const { input, candidates, target, bank } = facts();
  if (variant === "insufficient_total_exit") input.playerView.own.credits = 12;
  if (variant === "no_run_click") input.playerView.own.clicks = 2;
  if (variant === "unheld_loan")
    input.playerView.own.gripOrHq = input.playerView.own.gripOrHq.filter(
      (card) => card.definitionId !== "onr_v1_168_loan-from-chiba",
    );
  if (variant === "wrong_run") target.actionId = "runner.start_run.hq";
  if (variant === "central_consumer") target.accessTargetKind = "hq";
  if (variant === "stale_bank")
    input.legalActions.find((entry) => entry.actionId === bank.actionId)!
      .expiresAtStateVersion--;
  if (variant === "empty_bank") bank.economyProjection!.storedCreditsTaken = 0;
  if (variant === "nonfinite_source")
    bank.economyProjection!.sourcePool = "unknown";
  expect(
    runnerBankRunFundingContinuation(
      input,
      candidates,
      input.ownDeckCapabilities!,
      target,
      bank.actionId,
    ),
  ).toBeUndefined();
});
