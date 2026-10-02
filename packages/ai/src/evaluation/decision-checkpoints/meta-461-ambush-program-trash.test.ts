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
import { selectedCorpAccessInstalledTrashOptionIdsFromResidentAmbushPlan } from "../../corp/ambush/ambush-choice-binding";

function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r8-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  ["g21-d110", "runner_onr_classic_028_matador_2"],
  ["g31-d75", "runner_onr_classic_030_psychic-friend_2"],
])("owns the original program-trash choice %s", (name, target) => {
  const input = fixture(name!);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(input.legalActions[0]!.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.selectedChoices).toEqual({
    choiceId: input.playerView.pendingChoice!.choiceId,
    selectedOptionIds: [`target_${target}`],
  });
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const executor = portfolio.instances.find(
    (p) => p.instanceId === portfolio.executorInstanceId,
  )!;
  expect(executor.moduleId).toBe("corp.ambush_and_bluff");
  expect(executor.moduleState).toMatchObject({
    kind: "ambush",
    signal: {
      accessInstalledTrashChoiceBinding: {
        actionId: decision.actionId,
        observedAtStateVersion: input.playerView.stateVersion,
        selectedOptionIds: decision.selectedChoices!.selectedOptionIds,
      },
    },
  });
  const choice = input.playerView.pendingChoice!;
  expect(() =>
    selectedCorpAccessInstalledTrashOptionIdsFromResidentAmbushPlan(
      input,
      {
        ...input.legalActions[0]!,
        expiresAtStateVersion: input.playerView.stateVersion + 1,
      },
      choice,
      choice.options,
      portfolio,
    ),
  ).toThrow();
  expect(() =>
    selectedCorpAccessInstalledTrashOptionIdsFromResidentAmbushPlan(
      input,
      input.legalActions[0]!,
      { ...choice, sourceCardInstanceId: "other-source" },
      choice.options,
      portfolio,
    ),
  ).toThrow();
});
it.each(["source", "server", "target", "cardinality"])(
  "fails closed for a corrupted %s binding",
  (kind) => {
    const input = fixture("g21-d110");
    const choice = input.playerView.pendingChoice!;
    if (kind === "source")
      choice.sourceCardDefinitionId = "onr_v1_312_chicago-branch";
    if (kind === "server") input.playerView.run!.attackedServerId = "rd";
    if (kind === "target") choice.options[0]!.value = "not-a-visible-program";
    if (kind === "cardinality") choice.minSelections = 2;
    expect(() => chooseAiAction(input)).toThrow();
  },
);
it("binds every required target once when two programs must be trashed", () => {
  const input = fixture("g21-d110");
  const choice = input.playerView.pendingChoice!;
  const source = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.instanceId === choice.sourceCardInstanceId)!;
  source.advancementCounters = 2;
  input.playerView.run!.accessedCard!.advancementCounters = 2;
  choice.minSelections = choice.maxSelections = 2;
  const requirement = input.legalActions[0]!.choiceRequirements![0]!;
  requirement.minSelections = requirement.maxSelections = 2;
  expect(chooseAiAction(input).selectedChoices).toEqual({
    choiceId: choice.choiceId,
    selectedOptionIds: choice.options.map((o) => o.id),
  });
});
