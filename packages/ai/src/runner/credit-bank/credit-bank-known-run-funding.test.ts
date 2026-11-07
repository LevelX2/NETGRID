import { expect, it } from "vitest";
import cp from "../../../../../data/scenarios/ai-decision-checkpoints/cp-d153-12-cashout-for-rd-d185.json";
import type { AiDecisionCheckpointV1 } from "../../evaluation/decision-checkpoints/checkpoint-types";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  quoteRunnerRunAfterGuaranteedBankCashouts,
} from "../../runner-run-target-evaluation";
import { assessRunnerRunFundingAdmission } from "../../runtime/runner-run-funding-admission";
import { creditBankFundsKnownUrgentRun } from "./credit-bank-known-run-funding";

function params() {
  const fixture = structuredClone(cp) as AiDecisionCheckpointV1;
  const state = fixture.engine.testOnlyGameState;
  state.eventLog = structuredClone(fixture.engine.eventPrefix);
  const input = buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: fixture.deckSnapshot,
  });
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  const economy = buildRunnerEconomyPosture({ input });
  const targets = evaluateRunnerRunTargets({ input });
  const target = targets.find(
    (entry) => entry.actionId === "runner.start_run.remote_1",
  )!;
  const admission = assessRunnerRunFundingAdmission({
    input,
    target,
    runTargets: targets,
    economy,
  });
  const cashOutActionIds = candidates
    .filter((candidate) => candidate.planOwnerBinding?.route === "cash_out")
    .map((candidate) => candidate.actionId);
  return {
    input,
    candidates,
    economy,
    target,
    admission,
    cashOutActionIds,
    quoteAfterCashouts: (
      target: (typeof targets)[number],
      ids: readonly string[],
    ) =>
      quoteRunnerRunAfterGuaranteedBankCashouts({
        input,
        deckCapabilities: input.ownDeckCapabilities!,
        fundingCandidates: ids.map(
          (id) => candidates.find((candidate) => candidate.actionId === id)!,
        ),
        runActionId: target.actionId,
        targetServerId: target.targetServerId,
      }),
  };
}

it("quotes the complete funded payoff before rejecting an unfunded negative-score route", () => {
  const p = params(),
    before = JSON.stringify(p);
  expect(p.target.score).toBeLessThan(0);
  expect(p.target.pathPassability).toBe("blocked_unpayable");
  const route = creditBankFundsKnownUrgentRun(p);
  expect(JSON.stringify(p)).toBe(before);
  expect(route?.runFunding).toMatchObject({
    parentPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
    runActionId: "runner.start_run.remote_1",
    stateVersion: p.input.playerView.stateVersion,
    routeAssessment: {
      status: "covered_guaranteed",
      totalClickCost: 1,
      firstStepActionId: p.cashOutActionIds[0],
    },
  });
});

it.each([
  "missing",
  "wrong_action",
  "wrong_server",
  "unpaid",
  "unknown_ice",
  "conditional",
  "trace",
  "damage",
  "no_payoff",
  "steal_unfunded",
  "no_score",
])("rejects an incomplete or unsafe funded consumer quote: %s", (fault) => {
  const p = params();
  const funded = structuredClone(
    p.quoteAfterCashouts(p.target, p.cashOutActionIds)!,
  );
  if (fault === "wrong_action") funded.actionId = "other-run";
  if (fault === "wrong_server") funded.targetServerId = "hq";
  if (fault === "unpaid") funded.routeQuote!.fundingGap = 1;
  if (fault === "unknown_ice") funded.routeQuote!.unknownIceCount = 1;
  if (fault === "conditional")
    funded.routeQuote!.conditionalReasons.push("unknown_ice_on_route");
  if (fault === "trace") funded.visibleTraceTagHazardUnavoidable = true;
  if (fault === "damage") funded.unavoidableVisibleIceHazardCount = 1;
  if (fault === "no_payoff")
    funded.knownAccessState = "known_no_current_payoff";
  if (fault === "steal_unfunded") funded.accessPayoffContestable = false;
  if (fault === "no_score") funded.score = 0;
  p.quoteAfterCashouts = () => (fault === "missing" ? undefined : funded);
  expect(creditBankFundsKnownUrgentRun(p)).toBeUndefined();
});

it("retains the run click and requires an admitted parent", () => {
  const p = params();
  p.input.playerView.own.clicks = 1;
  expect(creditBankFundsKnownUrgentRun(p)).toBeUndefined();
  p.input.playerView.own.clicks = 4;
  p.admission.admitted = false;
  expect(creditBankFundsKnownUrgentRun(p)).toBeUndefined();
});
