import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";
import { boundCurrentStepProjection } from "./turn-projection";

const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep634-restricted-tag-payment-d305.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
afterEach(resetResidentPlanPortfolioMemory);
function source() {
  const input: AiDecisionInputWithDeckCapabilities = {
    ...structuredClone(cp.input),
    ...buildAiDecisionInputDto(structuredClone(cp.input)),
  };
  const action = input.legalActions.find(
    (a) => a.actionId === "runner.remove_tag",
  )!;
  const candidate = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: 304,
  })[0]!;
  return { input, candidate };
}
it("quotes zero liquid payment for the Engine-legal restricted tag removal", () => {
  const { input, candidate } = source();
  expect(input.playerView.own.credits).toBe(0);
  expect(input.playerView.own.tags).toBe(1);
  expect(boundCurrentStepProjection(input, candidate)).toEqual({
    liquidCreditCost: 0,
    boundaryKind: "engine_continuation",
  });
});
it("materializes the original defense step rather than failing current route admission", () => {
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const { input } = source();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView);
  const decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "runner.remove_tag",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe(
    "plan:runner.defense_and_recovery:runner",
  );
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({
    actionId: "runner.remove_tag",
    stateVersion: 304,
  });
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
});

it("uses the typed pool rather than its card name, and quotes the liquid remainder", () => {
  const { input, candidate } = source();
  const card = input.playerView.own.rig!.find((c) =>
    c.counterDisplays?.some((d) => d.creditPool?.uses?.includes("remove_tags")),
  )!;
  card.definitionId = "generic-tag-credit-source";
  card.title = "Generic tag credit source";
  card.counters!.bit = 1;
  card.counterDisplays![0]!.amount = 1;
  expect(boundCurrentStepProjection(input, candidate)).toEqual({
    liquidCreditCost: 1,
    boundaryKind: "engine_continuation",
  });
});

it.each(["empty", "wrong_use", "unrezzed", "hidden", "stale"])(
  "does not spend unavailable tag credits: %s",
  (variant) => {
    const { input, candidate } = source();
    const card = input.playerView.own.rig!.find((c) =>
      c.counterDisplays?.some((d) =>
        d.creditPool?.uses?.includes("remove_tags"),
      ),
    )!;
    if (variant === "empty") {
      card.counters!.bit = 0;
      card.counterDisplays![0]!.amount = 0;
    }
    if (variant === "wrong_use")
      card.counterDisplays![0]!.creditPool!.uses = ["using_killer_during_run"];
    if (variant === "unrezzed") card.rezzed = false;
    if (variant === "hidden") card.known = false;
    if (variant === "stale") input.playerView.stateVersion++;
    expect(boundCurrentStepProjection(input, candidate)).toBeUndefined();
  },
);

it.each(["negative", "duplicate"])(
  "fails closed for malformed pool evidence: %s",
  (variant) => {
    const { input, candidate } = source();
    const card = input.playerView.own.rig!.find((c) =>
      c.counterDisplays?.some((d) =>
        d.creditPool?.uses?.includes("remove_tags"),
      ),
    )!;
    if (variant === "negative") card.counterDisplays![0]!.amount = -1;
    else card.counterDisplays!.push(structuredClone(card.counterDisplays![0]!));
    expect(() => boundCurrentStepProjection(input, candidate)).toThrow(
      /invalid_restricted_tag_credit_pool/,
    );
  },
);
