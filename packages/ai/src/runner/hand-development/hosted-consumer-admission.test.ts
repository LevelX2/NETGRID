import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";

afterEach(resetResidentPlanPortfolioMemory);

describe("hosted economy consumer admission", () => {
  it.each([54, 120])(
    "does not prepare an unprofitable host upgrade in original D%i",
    (decisionIndex) => {
      const checkpoint = JSON.parse(
        readFileSync(
          new URL(
            `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-hosted-consumer-d${decisionIndex}.json`,
            import.meta.url,
          ),
          "utf8",
        ),
      );
      const input: AiDecisionInput = {
        ...checkpoint.input,
        ...buildAiDecisionInputDto(checkpoint.input),
      };
      const evaluation = evaluateRunnerHandDevelopment({ input }).find(
        (entry) =>
          entry.activationPrerequisites.some(
            (p) => p.kind === "hosted_icebreaker",
          ),
      )!;
      expect(evaluation).toMatchObject({
        currentNeed: "later",
        activationPrerequisites: [
          { kind: "hosted_icebreaker", satisfied: false },
        ],
      });
      restoreAiRuntimeCheckpoint(
        input,
        checkpoint.input.ownDeckSnapshot.deckSnapshotId,
        checkpoint.runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision.fallbackUsed).toBe(false);
      expect(
        input.legalActions.some(
          (action) => action.actionId === decision.actionId,
        ),
      ).toBe(true);
      expect(decision.actionId).not.toBe(evaluation.legalActionId);
      expect(
        decision.decisionDebug?.planFirstDecision?.dispositions,
      ).toContainEqual(
        expect.objectContaining({
          actionId: evaluation.legalActionId,
          disposition: "explicitly_nonproductive",
          ownerModuleId: "runner.develop_board_and_hand",
        }),
      );
      expect(decision.evidence).toContain("plan_first_runtime:true");
      expect(
        decision.evidence!.some((entry) => entry.startsWith("plan_step_id:")),
      ).toBe(true);
      expect(
        decision.evidence!.some((entry) =>
          entry.startsWith("plan_scheduler:route:"),
        ),
      ).toBe(true);
    },
  );
});
