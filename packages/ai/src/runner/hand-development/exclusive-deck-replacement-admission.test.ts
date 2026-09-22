import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";

afterEach(resetResidentPlanPortfolioMemory);

describe("exclusive deck replacement admission", () => {
  it.each(["g1-d123", "g4-d230"])(
    "honors the already satisfied replacement assessment in original %s",
    (reference) => {
      const checkpoint = JSON.parse(
        readFileSync(
          new URL(
            `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-456-exclusive-deck-${reference}.json`,
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
          entry.persistentInstallEvaluation?.replacementAssessment.status ===
          "already_satisfied",
      )!;
      expect(evaluation).toMatchObject({
        deferReason: "duplicate",
        persistentInstallEvaluation: {
          replacementAssessment: {
            admitted: false,
            gainedFunctionalCoverage: [],
            lostFunctionalCoverage: [],
          },
        },
      });
      restoreAiRuntimeCheckpoint(
        input,
        checkpoint.input.ownDeckSnapshot.deckSnapshotId,
        checkpoint.runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision.actionId).not.toBe(evaluation.legalActionId);
      expect(decision.fallbackUsed).toBe(false);
      expect(
        input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
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
        decision.evidence!.some((e) => e.startsWith("plan_step_id:")),
      ).toBe(true);
      expect(
        decision.evidence!.some((e) => e.startsWith("plan_scheduler:route:")),
      ).toBe(true);
    },
  );
});
