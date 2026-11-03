import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerHandDevelopment } from "../hand-development/hand-development-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(`../../runtime/test-fixtures/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
}

function preventionInput() {
  const cp = checkpoint("meta585-g5-d54-prevention");
  return {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
}

function fridgeEvaluation(input: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerHandDevelopment({
    input,
    actionCandidates: buildActionSemanticCandidates({
      legalActions: input.legalActions,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        input.playerView.own.gripOrHq.map((card) => [
          card.instanceId,
          card.definitionId!,
        ]),
      ),
    }),
  }).find((value) => value.definitionId === "onr_v1_121_armored-fridge");
}

it("removes only the generic cash floor from the recognized acute compatible shield", () => {
  expect(fridgeEvaluation(preventionInput())).toMatchObject({
    availability: "legal_now",
    developmentRole: "defense_support",
    currentNeed: "acute",
    deferReason: "none",
    persistentInstallEvaluation: {
      creditsAfterInstall: 0,
      reservePenalty: 0,
      evidence: expect.arrayContaining([
        "persistent_install_acute_damage_prevention_reserve_spend",
      ]),
    },
  });
  expect(fridgeEvaluation(preventionInput())?.fundingNeed).toBeUndefined();
});

it("does not manufacture an affordable install with insufficient current cash", () => {
  const input = preventionInput();
  input.playerView.own.credits = 2;
  input.legalActions = input.legalActions.filter(
    (action) => !action.costs.some((cost) => (cost.credits ?? 0) > 2),
  );
  expect(fridgeEvaluation(input)).toMatchObject({
    availability: "missing_credits",
    deferReason: "missing_credits",
  });
});

it("does not spend the reserve on an unrelated Meat shield without a public compatible threat", () => {
  const input = preventionInput();
  input.eventTail = [];
  input.playerView.publicEvents = [];
  input.playerView.servers = [];
  input.playerView.own.rig = [];
  expect(fridgeEvaluation(input)?.currentNeed).toBe("none");
  expect(
    fridgeEvaluation(input)?.persistentInstallEvaluation?.evidence,
  ).not.toContain("persistent_install_acute_damage_prevention_reserve_spend");
});

it("preserves the native ordinary Wilson setup reserve and the original run head", () => {
  const cp = checkpoint("meta585-g3-d62-wilson");
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("runner.start_run.hq");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.pressure_central");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it("admits the affordable acute Meat shield before an unprotected Broker setup in the real original state", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta585-g5-d54-prevention.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(action?.type).toBe("install_card");
  expect(action?.payload?.cardId).toMatch(/armored-fridge/);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("runner.defense_and_recovery");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
});
