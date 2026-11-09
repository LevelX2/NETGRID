import { afterEach, expect, it } from "vitest";
import checkpoint from "./fixtures/meta712-d245-program-continuity.json";
import {
  aiLiveRuntimeDependencies,
  chooseAiAction,
} from "../../ai-runtime-public-entrypoints";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { cardRolesForId } from "../../runtime/card-role-lookup";
import { createRunnerProgramInstallTrashContext } from "../../runtime/runner-program-install-trash-context";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";

afterEach(resetResidentPlanPortfolioMemory);
const services = createRunnerProgramInstallTrashContext({
  ...aiLiveRuntimeDependencies,
  rolesForCardId: (id) => cardRolesForId(id, AI_HINTS_BY_CARD),
});

it("does not declare the only stable breaker redundant to an incoming random-loss breaker", () => {
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  const input = structuredClone(
    checkpoint.input,
  ) as AiDecisionInputWithDeckCapabilities;
  const choice = input.playerView.pendingChoice!;
  const assessment = services.runnerProgramInstallTrashAssessment(
    input,
    choice,
    choice.options,
  );
  expect(
    assessment.candidates.find((c) => c.card?.instanceId.endsWith("krash_2")),
  ).toMatchObject({ protectedRole: true });
  expect(
    services.selectedRunnerProgramInstallTrashOptionIds(
      input,
      choice,
      choice.options,
    ),
  ).toEqual(["card_runner_onr_v1_059_self-modifying-code_2"]);
});

it("preserves the previously bound historical choice and its plan owner", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    structuredClone(checkpoint.runtime) as AiRuntimeCheckpointV1,
  );
  restoreResidentPlanPortfolioMemorySnapshot(
    input,
    structuredClone(checkpoint.runtime.residentPlanPortfolio) as Parameters<
      typeof restoreResidentPlanPortfolioMemorySnapshot
    >[1],
  );
  const before = JSON.stringify(input.playerView);
  const result = chooseAiAction(input);
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(result).toMatchObject({
    actionId: "runner.resolve_choice",
    selectedChoices: {
      choiceId: "runner_program_trash_before_install_244",
      selectedOptionIds: ["card_runner_onr_v1_039_krash_2"],
    },
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_universal%3Aefficiency%3Ard%3Arun%3Arunner.start_run.rd",
        leafExecutorInstanceId:
          "plan:runner.rig_and_coverage:coverage%3Abreaker_universal%3Aefficiency%3Ard%3Arun%3Arunner.start_run.rd",
      },
    },
  });
});
