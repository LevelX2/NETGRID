import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r6-g35-d96.json";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { runnerCoverageInstallActionValues } from "../../runner/rig-coverage/coverage-recovery";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function inputAndCandidates() {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "runner",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.flatMap((card) =>
        card.definitionId ? [[card.instanceId, card.definitionId]] : [],
      ),
    ),
  });
  return { input, candidates };
}

it.each(["sentry", "wall", "code_gate"] as const)(
  "binds only the legal %s install variants to that coverage step",
  (subtype) => {
    const { input, candidates } = inputAndCandidates();
    const values = runnerCoverageInstallActionValues(
      input,
      candidates,
      undefined,
      `breaker_${subtype}`,
    );
    const modes = input.legalActions.filter(
      (action) =>
        action.payload?.cardId === "runner_onr_proteus_092_morphing-tool_2",
    );
    expect(modes.length).toBe(6);
    for (const action of modes) {
      expect(Object.hasOwn(values, action.actionId)).toBe(
        action.payload?.selectedSubtype === subtype,
      );
    }
  },
);

it("projects the chosen Gate mode when valuing its known Quandary path", () => {
  const { input, candidates } = inputAndCandidates();
  input.playerView.own.rig = [];
  const values = runnerCoverageInstallActionValues(
    input,
    candidates,
    "hq",
    "breaker_code_gate",
  );
  const action = input.legalActions.find(
    (a) =>
      a.type === "install_card" &&
      a.payload?.cardId === "runner_onr_proteus_092_morphing-tool_2" &&
      a.payload?.selectedSubtype === "code_gate" &&
      !a.payload.runnerProgramTrashBeforeInstall,
  )!;
  expect(values[action.actionId]).toBe(288);
});

it("replans the historical Sentry installation with matching owner, mode and legal route", () => {
  const { input } = inputAndCandidates();
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime) as unknown as AiRuntimeCheckpointV1,
  );
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(decision.fallbackUsed).toBe(false);
  expect(action.type).toBe("install_card");
  expect(action.payload?.selectedSubtype).toBe("sentry");
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toBe("plan:runner.rig_and_coverage:coverage%3Abreaker_sentry");
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 95,
  });
});
