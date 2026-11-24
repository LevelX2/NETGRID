import { afterEach, expect, it } from "vitest";
import { referencesDefaultDeckCard } from "./compact-card-reference.test-support";
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
  const input = structuredClone<unknown>(
    checkpoint.input,
  ) as AiDecisionInputWithDeckCapabilities;
  const choice = input.playerView.pendingChoice!;
  const assessment = services.runnerProgramInstallTrashAssessment(
    input,
    choice,
    choice.options,
  );
  expect(
    assessment.candidates.find((c) =>
      referencesDefaultDeckCard(c.card?.instanceId, 251, 2),
    ),
  ).toMatchObject({ protectedRole: true });
  expect(
    services.selectedRunnerProgramInstallTrashOptionIds(
      input,
      choice,
      choice.options,
    ),
  ).toEqual(["card_c1oa"]);
});

it("preserves the previously bound historical choice and its plan owner", () => {
  const input = structuredClone<unknown>(
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
    actionId: "rn",
    selectedChoices: {
      choiceId: "runner_program_trash_before_install_244",
      selectedOptionIds: ["card_c1ju"],
    },
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId:
          "pegqo75sg3y86rnv0cxwj4jnrf",
        leafExecutorInstanceId:
          "pegqo75sg3y86rnv0cxwj4jnrf",
      },
    },
  });
});
