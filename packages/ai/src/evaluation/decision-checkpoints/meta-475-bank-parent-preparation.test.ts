import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it("withdraws prospective bank funding when the actual remote parent owns ICE preparation", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r5-g4-d325.json",
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
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const engineFacts = JSON.stringify({
    view: input.playerView,
    actions: input.legalActions,
    events: input.eventTail,
  });
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action.type).toBe("play_event");
  expect(action.source).toBe("runner_onr_v1_086_forged-activation-orders_3");
  expect(result.fallbackUsed).toBe(false);
  expect(result.timeoutUsed).toBe(false);
  const pf = result.decisionDebug!.planFirstDecision!;
  expect(pf.rootPlanInstanceId).toBe(
    "plan:runner.contest_remote:remote%3Aremote_1",
  );
  expect(pf.leafExecutorInstanceId).toBe(pf.rootPlanInstanceId);
  expect(pf.selectedPlan!.moduleId).toBe("runner.contest_remote");
  expect(pf.route!.actionId).toBe(action.actionId);
  expect(pf.route!.stateVersion).toBe(324);
  expect(pf.route!.planInstanceId).toBe(pf.leafExecutorInstanceId);
  expect(pf.route!.stepId).toBe(pf.selectedStep!.stepId);
  const root = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) => p.instanceId === pf.rootPlanInstanceId,
  )!;
  expect(root.moduleState).toMatchObject({
    signal: { routePreparation: "targeted_ice_trash" },
    choiceContinuation: {
      selectedActionId: action.actionId,
      selectedAtStateVersion: 324,
      sourceCardInstanceId: action.source,
      ownerModuleId: "runner.contest_remote",
      serverId: "remote_1",
      targetIceInstanceId: "hidden_3fe3f7fe",
      targetIcePosition: 0,
    },
  });
  expect(
    JSON.stringify({
      view: input.playerView,
      actions: input.legalActions,
      events: input.eventTail,
    }),
  ).toBe(engineFacts);
  const bank = residentPlanPortfolioSnapshot(input)!.instances.find(
    (p) =>
      p.instanceId === "plan:runner.credit_bank:runner_onr_v1_154_broker_1",
  )!;
  expect(bank.parentNeedId).toBeUndefined();
  expect(bank.moduleState).toMatchObject({
    kind: "credit_bank",
    phase: "hold",
  });
  expect(
    (
      bank.moduleState as {
        signal: { actionIds: string[]; evidenceCodes: string[] };
      }
    ).signal,
  ).toMatchObject({
    actionIds: [],
    evidenceCodes: expect.arrayContaining([
      "runner_credit_bank_run_funding_parent_need_withdrawn:run-support:remote:remote_1",
    ]),
  });
});
