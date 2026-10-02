import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
function fixture() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r1-g21-current-d167.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    provenance: string;
    actor: string;
    stateVersion: number;
  };
  expect(cp.provenance).toBe("current_persisted_state");
  expect(cp.actor).toBe("corp");
  expect(cp.stateVersion).toBe(166);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
it("owns the original public hardware-trash access choice at the Ambush executor", () => {
  const input = fixture(),
    decision = chooseAiAction(input),
    p = residentPlanPortfolioSnapshot(input)!,
    executor = p.instances.find((x) => x.instanceId === p.executorInstanceId)!;
  expect(decision.actionId).toBe(input.legalActions[0]!.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.selectedChoices).toEqual({
    choiceId: input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: ["target_runner_onr_v1_129_hq-interface_2"],
  });
  expect(executor.moduleId).toBe("corp.ambush_and_bluff");
  expect(executor.moduleState).toMatchObject({
    kind: "ambush",
    signal: {
      accessInstalledTrashChoiceBinding: {
        actionId: decision.actionId,
        targetCardType: "hardware",
        observedAtStateVersion: 166,
        targetCardInstanceIds: ["runner_onr_v1_129_hq-interface_2"],
      },
    },
  });
  expect(decision.decisionDebug!.planFirstDecision!.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: 166,
    planInstanceId: p.executorInstanceId,
  });
});
it.each(["source", "server", "target", "cardinality"])(
  "fails closed for corrupted hardware %s",
  (kind) => {
    const input = fixture(),
      c = input.playerView.pendingChoice!;
    if (kind === "source")
      c.sourceCardDefinitionId = "onr_v1_312_chicago-branch";
    if (kind === "server") input.playerView.run!.attackedServerId = "rd";
    if (kind === "target")
      c.options[0]!.value = input.playerView.opponent.rig!.find(
        (x) => x.type === "program",
      )!.instanceId;
    if (kind === "cardinality") c.minSelections = 2;
    expect(() => chooseAiAction(input)).toThrow();
  },
);

it("binds both required hardware targets once in engine order", () => {
  const input = fixture(),
    c = input.playerView.pendingChoice!,
    source = input.playerView.servers
      .flatMap((s) => s.root)
      .find((x) => x.instanceId === c.sourceCardInstanceId)!;
  source.advancementCounters = 2;
  input.playerView.run!.accessedCard!.advancementCounters = 2;
  c.minSelections = c.maxSelections = 2;
  input.legalActions[0]!.choiceRequirements![0]!.minSelections =
    input.legalActions[0]!.choiceRequirements![0]!.maxSelections = 2;
  expect(chooseAiAction(input).selectedChoices).toEqual({
    choiceId: c.choiceId,
    selectedOptionIds: c.options.map((x) => x.id),
  });
});
