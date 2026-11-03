import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

afterEach(resetResidentPlanPortfolioMemory);

it("retains counter creation ahead of a transfer operation without an installed counter source", () => {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta586-g11-d65-advancement-retention.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.resolve_choice");
  expect(decision.selectedChoices).toEqual({
    choiceId: "discard_corp_64",
    selectedOptionIds: ["card_corp_onr_v1_291_falsified-transactions-expert_1"],
  });
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.hand_and_agenda_management");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
