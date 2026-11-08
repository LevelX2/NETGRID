import { afterEach, expect, it } from "vitest";
import checkpoint from "./fixtures/meta640-d105-program-trash.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { AI_HINTS_BY_CARD } from "../../ai-hints";

afterEach(resetResidentPlanPortfolioMemory);

it("uses the compiled breaker role when native affordable-coverage losses tie", () => {
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  expect(AI_HINTS_BY_CARD.get("onr_v1_039_krash")?.roles).toContain("icebreaker");
  expect(AI_HINTS_BY_CARD.get("onr_v1_046_pattels-virus")?.roles).toContain(
    "icebreaker_support",
  );
  const decisions = [0, 1].map(() => {
    resetResidentPlanPortfolioMemory();
    const input = structuredClone(
      checkpoint.input,
    ) as AiDecisionInputWithDeckCapabilities;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      structuredClone(checkpoint.runtime) as AiRuntimeCheckpointV1,
    );
    const before = JSON.stringify(input.playerView);
    const decision = chooseAiAction(input);
    expect(JSON.stringify(input.playerView)).toBe(before);
    expect(decision).toMatchObject({
      actionId: "corp.resolve_choice",
      selectedChoices: {
        choiceId: "trash_installed_program_104",
        selectedOptionIds: ["card_runner_onr_v1_039_krash_2"],
      },
      fallbackUsed: false,
      timeoutUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
          leafExecutorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
          route: { actionId: "corp.resolve_choice", stateVersion: 104 },
        },
      },
    });
    return decision.selectedChoices;
  });
  expect(decisions[0]).toEqual(decisions[1]);
});
