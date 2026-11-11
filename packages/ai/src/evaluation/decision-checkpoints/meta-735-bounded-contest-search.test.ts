import { afterEach, expect, it } from "vitest";
import capture from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-735-r1-g12-d175.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = capture as unknown as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
const remoteRoot = "plan:runner.contest_remote:remote%3Aremote_1";
const wallExecutor = "plan:runner.rig_and_coverage:coverage%3Abreaker_wall";
afterEach(resetResidentPlanPortfolioMemory);

function decide(adjust?: (input: AiDecisionInputWithDeckCapabilities) => void) {
  const input = structuredClone(checkpoint.input);
  adjust?.(input);
  if (!input.ownDeckSnapshot) throw new Error("Deck snapshot missing");
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    checkpoint.runtime,
  );
  const search = input.legalActions.find((action) =>
    action.abilityRef?.sourceAbilityId.endsWith(
      "_look_top_stack_take_matching",
    ),
  )!;
  const decision = chooseAiAction(input);
  return { decision, search, portfolio: residentPlanPortfolioSnapshot(input) };
}

it("keeps the legal bounded lookup with the terminal Wall contest while its result stays unknown", () => {
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const { decision, search, portfolio } = decide();
  expect(decision).toMatchObject({
    actionId: search.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: remoteRoot,
        leafExecutorInstanceId: wallExecutor,
      },
    },
  });
  const coverage = portfolio?.instances.find(
    (instance) => instance.instanceId === wallExecutor,
  );
  expect(coverage?.moduleState).toMatchObject({
    phase: "search_answer",
    gap: {
      answerInHand: false,
      directSearchActionIds: [search.actionId],
      recoveryEvidenceCodes: [
        expect.stringContaining("bounded_search_conditional_reveal"),
      ],
    },
  });
});

it.each([
  [
    "one credit short with no spare click",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.own.credits = 11;
      input.playerView.own.clicks = 3;
    },
  ],
] as const)("does not promote the same source with %s", (_name, adjust) => {
  const { decision, search } = decide(adjust);
  expect(
    decision.actionId === search.actionId &&
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId ===
        remoteRoot,
  ).toBe(false);
});

it("leaves the normal nonterminal search outside the bounded terminal quote", () => {
  const { portfolio } = decide((input) => {
    input.playerView.opponent.agendaPoints = 0;
  });
  expect(
    portfolio?.instances.some((instance) =>
      JSON.stringify(instance.moduleState).includes(
        "bounded_search_conditional_reveal",
      ),
    ),
  ).toBe(false);
});
