import { CURRENT_RULES_BASELINE } from "@netgrid/shared";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "../../plans/turn-planning-contracts";
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
  input.planningRulesContext = buildPlanningRulesContext({
    rulesBaseline: CURRENT_RULES_BASELINE,
    formatProfileId: "program-trash-contract-test",
    cardPoolSnapshotId: "program-trash-contract-test",
  });
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  const dto = buildAiDecisionInputDto({
    ...input,
    profileId: input.profileId!,
  });
  const enriched: AiDecisionInputWithDeckCapabilities = {
    ...dto,
    planningRulesContext: input.planningRulesContext,
    planningStateIdentity: buildPlanningStateIdentity(dto),
  };
  const decision = chooseAiAction(enriched);
  expect(decision.actionId).toBe("corp.resolve_choice");
  expect(decision.selectedChoices).toEqual({
    choiceId: "trash_installed_program_42",
    selectedOptionIds: ["card_runner_onr_v1_014_codecracker_1"],
  });
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    stateVersion: 42,
    lane: "plan",
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
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
