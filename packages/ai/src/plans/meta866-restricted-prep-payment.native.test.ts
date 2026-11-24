import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { buildPlanningStateIdentity } from "./turn-planning-contracts";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "./resident-plan-portfolio-memory";
import { boundCurrentStepProjection } from "./turn-projection";

function historicalPayment() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../evaluation/decision-checkpoints/fixtures/meta866-prep-credit-payment.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const { input } = cp;
  const action = input.legalActions.find((a) => a.actionId === "rh.c8h.c8h")!;
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
  });
  const source = input.playerView.own
    .rig!.flatMap((c) => c.counterDisplays ?? [])
    .find((d) => d.creditPool?.uses?.includes("play_events"))!;
  return { input, action, candidate: candidate!, source, runtime: cp.runtime };
}

afterEach(resetResidentPlanPortfolioMemory);

it("binds the six liquid credits and one matching prep credit to the current seven-credit event", () => {
  const { input, candidate, source } = historicalPayment();
  expect(input.playerView.own.credits).toBe(6);
  expect(source.amount).toBe(1);
  expect(candidate.costProfile.creditCost).toBe(7);
  expect(boundCurrentStepProjection(input, candidate)).toEqual({
    liquidCreditCost: 6,
    boundaryKind: "engine_continuation",
  });
});

it("retains the current rig search head and its normal engine continuation", () => {
  const { input, action, runtime } = historicalPayment();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
    {
      preserveLiveCommitment: true,
    },
  );
  if (runtime.residentPlanPortfolio) {
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      runtime.residentPlanPortfolio,
    );
  }
  const before = JSON.stringify(input);
  const selected = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(selected).toMatchObject({
    actionId: action.actionId,
    fallbackUsed: false,
    timeoutUsed: false,
  });
  expect(
    selected.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.rig_and_coverage");
});

it("excludes exhausted and differently restricted credits from the prep payment", () => {
  const { input, candidate, source } = historicalPayment();
  source.amount = 0;
  expect(boundCurrentStepProjection(input, candidate)).toBeUndefined();
  source.amount = 1;
  source.creditPool!.uses = ["remove_tags"];
  expect(boundCurrentStepProjection(input, candidate)).toBeUndefined();
});
it("rejects malformed matching prep funds before publishing a payment", () => {
  const { input, candidate, source } = historicalPayment();
  source.amount = -1;
  expect(() => boundCurrentStepProjection(input, candidate)).toThrow(
    /invalid_restricted_event_credit_pool/,
  );
});
