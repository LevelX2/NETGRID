import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-r1-g27-d297-agenda-payment.json";
import fundingCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-536-exact-g27-d424-obligation-funding.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("projects a known agenda payment on the native zero-click ACME payout route", () => {
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
  const action = input.legalActions.find(
    (action) => action.type === "rez_card",
  )!;
  expect(input.playerView.own).toMatchObject({
    clicks: 0,
    credits: 3,
    agendaPoints: 3,
  });
  expect(action.payload).toMatchObject({
    agendaPointCost: 1,
    rootRezCreditOutcomeQuoteNetCreditGain: 12,
  });
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toMatch(/^plan:corp\.economy:/);
});

it("preserves the current payment reserve when an unfinished score needs funding", () => {
  const { input, runtime } = structuredClone(fundingCheckpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "corp.gain_credit",
    fallbackUsed: false,
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toMatch(/^plan:corp\.economy:/);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:corp\.score_agenda:/,
  );
});
