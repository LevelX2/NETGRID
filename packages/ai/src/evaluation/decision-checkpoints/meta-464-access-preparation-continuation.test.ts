import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { expect, it } from "vitest";
import start from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r2-g32-d9.json";
import encounter from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r2-g32-d11.json";
import choice from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-464-r2-g32-d12.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
function fixture() {
  return structuredClone(start) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function prepareHqAccess(input: AiDecisionInputWithDeckCapabilities) {
  const definitions = visibleSourceDefinitionsByInstanceId(input.playerView);
  const preparation = input.legalActions.find((a) =>
    a.type === "play_event" && definitions[a.source] === 176,
  );
  if (!preparation) throw new Error("Missing current Prearranged Drop offer");
  return preparation;
}
it("develops the admitted payoff under the resident HQ pressure owner", () => {
  const { input, runtime } = fixture();
  resetResidentPlanPortfolioMemory();
  restoreResidentPlanPortfolioMemorySnapshot(input, runtime.residentPlanPortfolio);
  const preparation = prepareHqAccess(input);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(preparation.actionId);
  expect(decision.decisionDebug?.planFirstDecision?.selectedPlan).toMatchObject({
    moduleId: "runner.pressure_central",
    phase: "develop_payoff",
  });
});
it("retains the admitted HQ access purpose through the original committed run and choice", () => {
  const { input, runtime } = fixture();
  const preparation = prepareHqAccess(input);
  // Isolate the original run head while retaining the same admitted HQ purpose.
  input.legalActions = input.legalActions.filter((a) => a.actionId !== preparation.actionId);
  input.playerView.legalActions = input.legalActions;
  resetResidentPlanPortfolioMemory();
  restoreResidentPlanPortfolioMemorySnapshot(input, runtime.residentPlanPortfolio);
  expect(chooseAiAction(input).actionId).toBe("runner.start_run.hq");
  const p = residentPlanPortfolioSnapshot(input)!;
  const ex = p.instances.find((i) => i.instanceId === p.executorInstanceId)!;
  expect(ex.moduleId).toBe("runner.pressure_central");
  expect(ex.moduleState).toMatchObject({
    kind: "central_pressure",
    signal: {
      serverId: "hq",
      accessCommitment: { intendedAction: expect.any(String) },
      runRiskContract: expect.any(Object),
    },
  });
  const next = structuredClone(
    encounter.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  expect(chooseAiAction(next).actionId).toBe(next.legalActions[0]!.actionId);
  const final = structuredClone(
    choice.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const decision = chooseAiAction(final);
  expect(decision.actionId).toBe("runner.resolve_choice");
  expect(decision.selectedChoices).toMatchObject({
    choiceId: final.playerView.pendingChoice!.choiceId,
  });
  expect(residentPlanPortfolioSnapshot(final)?.executorInstanceId).toBe(
    p.executorInstanceId,
  );
});
it("still rejects a captured continuation whose access purpose is absent", () => {
  const c = structuredClone(choice) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreResidentPlanPortfolioMemorySnapshot(
    c.input,
    c.runtime.residentPlanPortfolio,
  );
  expect(() => chooseAiAction(c.input)).toThrow(/window_origin_missing/);
});
