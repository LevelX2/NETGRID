import { afterEach, expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-deck-revision-deadeye-converted-program.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { buildAiDecisionInputDto } from "../../input-dto";

afterEach(resetResidentPlanPortfolioMemory);

it("resolves the real Deadeye window with the converted agenda in the complete legal program set", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const dto = buildAiDecisionInputDto({
    ...input,
    profileId: input.profileId!,
  });
  const decision = chooseAiAction(dto);
  expect(decision.actionId).toBe("corp.resolve_choice");
  expect(decision.selectedChoices).toEqual({
    choiceId: "trash_installed_program_42",
    selectedOptionIds: ["card_runner_onr_v1_014_codecracker_1"],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    stateVersion: 42,
    lane: "engine_window",
    rootPlanInstanceId: "run:run_39",
    leafExecutorInstanceId: "rules.window_resolution",
    selectedStep: {
      planInstanceId: "rules.window_resolution",
      stepId: "run.encounter_ice:42",
    },
    engineWindowAction: { actionId: decision.actionId },
  });
});

it.each(["missing_role", "wrong_controller", "stale_choice", "missing_option"])(
  "keeps the exact target and state binding fail-closed for %s",
  (fault) => {
    const input = structuredClone(
      checkpoint.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const converted = input.playerView.opponent.rig!.find(
      (card) => card.installedAsRunnerProgram,
    )!;
    if (fault === "missing_role") delete converted.installedAsRunnerProgram;
    if (fault === "wrong_controller") converted.controller = "corp";
    if (fault === "stale_choice")
      input.playerView.pendingChoice!.stateVersion--;
    if (fault === "missing_option")
      input.playerView.pendingChoice!.options.pop();
    expect(() => chooseAiAction(input)).toThrow();
  },
);
