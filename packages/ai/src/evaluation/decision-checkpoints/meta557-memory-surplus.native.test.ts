import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import {
  aiLiveRuntimeDependencies,
  chooseAiAction,
} from "../../ai-runtime-public-entrypoints";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { cardRolesForId } from "../../runtime/card-role-lookup";
import { createRunnerProgramInstallTrashContext } from "../../runtime/runner-program-install-trash-context";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

function fixture(name: string) {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta557-memory-" +
          name +
          ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}

const context = createRunnerProgramInstallTrashContext({
  ...aiLiveRuntimeDependencies,
  rolesForCardId: (id) => cardRolesForId(id, AI_HINTS_BY_CARD),
});

beforeEach(resetResidentPlanPortfolioMemory);

describe("pairing 557 memory sacrifice values only the current deficit", () => {
  it("binds the lower-loss sufficient sacrifice before installation", () => {
    const cp = fixture("install");
    const action = cp.input.legalActions.find(
      (a: any) =>
        a.actionId ===
        "runner.install_card.runner_onr_v1_074_worm_2.runner_onr_v1_074_worm_2.runner_program_trash_before_install.runner_onr_v1_075_zetatech-software-installer_1.2.2",
    );
    expect(action).toBeDefined();
    const assessment = context.runnerProgramInstallTrashAssessmentForAction(
      cp.input,
      action,
    );
    expect(assessment).toMatchObject({
      requiredMemoryToFree: 1,
      canFreeRequiredMemory: true,
      memoryFreedBySelectedCandidates: 1,
    });
    expect(assessment?.selectedCandidates[0]?.card?.definitionId).toBe(
      "onr_v1_075_zetatech-software-installer",
    );
  });

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])("preserves exact Choice ownership DTO=%s resident=%s", (dto, resident) => {
    const install = fixture("install");
    const cp = fixture("choice");
    expect(Object.values(cp.validation).every(Boolean)).toBe(true);
    if (dto) {
      install.input = {
        ...install.input,
        ...buildAiDecisionInputDto(install.input),
      };
      cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      install.input.planningStateIdentity = buildPlanningStateIdentity(
        install.input,
      );
      cp.input.planningStateIdentity = buildPlanningStateIdentity(cp.input);
    }
    if (resident)
      restoreAiRuntimeCheckpoint(
        install.input,
        install.input.ownDeckSnapshot.deckSnapshotId,
        install.runtime,
      );
    const selectedInstall = chooseAiAction(install.input);
    expect(selectedInstall.actionId).toBe(
      cp.input.playerView.pendingChoice.continuation.originActionId,
    );
    const installPlan = selectedInstall.decisionDebug!.planFirstDecision!;
    expect(installPlan.turnPlanning?.coverage).toMatchObject({
      status: "pass",
      coveragePercent: 100,
    });
    const before = JSON.stringify(cp.input);
    const result = chooseAiAction(cp.input);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    expect(result.actionId).toBe("runner.resolve_choice");
    expect(result.selectedChoices).toEqual({
      choiceId: "runner_program_trash_before_install_172",
      selectedOptionIds: [
        "card_runner_onr_v1_075_zetatech-software-installer_1",
      ],
    });
    expect(pf.executionOrigin).toMatchObject({
      rootPlanInstanceId: installPlan.rootPlanInstanceId,
      leafPlanInstanceId: installPlan.leafExecutorInstanceId,
      windowId: cp.input.playerView.pendingChoice.choiceId,
      stateVersion: cp.stateVersion,
    });
    expect(pf.selectedStep).toMatchObject({
      planInstanceId: installPlan.leafExecutorInstanceId,
      stepId: cp.input.playerView.pendingChoice.choiceId,
    });
    expect(JSON.stringify(cp.input)).toBe(before);
  });

  it("honors an already committed historical sacrifice instead of reopening it", () => {
    const cp = fixture("choice");
    restoreAiRuntimeCheckpoint(
      cp.input,
      cp.input.ownDeckSnapshot.deckSnapshotId,
      cp.runtime,
    );
    expect(chooseAiAction(cp.input).selectedChoices).toEqual({
      choiceId: "runner_program_trash_before_install_172",
      selectedOptionIds: ["card_runner_onr_v1_045_newsgroup-filter_1"],
    });
  });

  it("fails closed without the originating install plan", () => {
    expect(() => chooseAiAction(fixture("choice").input)).toThrow(
      "window_origin_missing",
    );
  });
});
