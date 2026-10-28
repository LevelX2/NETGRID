import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpHostedBankInvestments } from "./hosted-credit-bank-investment";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta565-department-no-carry-horizon.json",
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

it("bounds an unsafe-to-carry investment to the currently quoted complete cycle", () => {
  const saved = fixture(),
    input = saved.input;
  expect(Object.values(saved.validation).every(Boolean)).toBe(true);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  const investment = corpHostedBankInvestments(input, candidates, []).get(
    "corp_onr_v1_318_department-of-truth-enhancement_1",
  )!.development!;
  expect(investment.hostedCreditBankInvestment).toMatchObject({
    additionalLoadExecutions: 1,
    canCarryAcrossTurn: false,
  });
  expect(investment.payback).toMatchObject({
    projectedCredits: 3,
    projectedNetCredits: 1,
    horizonTurns: 0,
  });
});

it("takes the available three-credit operation before an overstated two-action bank investment", () => {
  const saved = fixture(),
    input = saved.input;
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    saved.runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId),
  ).toMatchObject({
    type: "play_operation",
    payload: { gainCreditsAmount: 3 },
  });
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "corp.economy" },
    route: { actionId: result.actionId, stateVersion: 138 },
  });
});

it("rejects a stale current-turn quote instead of valuing an unbound future payout", () => {
  const { input } = fixture();
  const load = input.legalActions.find(
    (action) => action.payload?.hostedCreditBankCycleQuoteJson,
  )!;
  const quote = JSON.parse(
    String(load.payload!.hostedCreditBankCycleQuoteJson),
  );
  quote.stateVersion--;
  load.payload!.hostedCreditBankCycleQuoteJson = JSON.stringify(quote);
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  expect(() => corpHostedBankInvestments(input, candidates, [])).toThrow();
});
