import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";

afterEach(resetResidentPlanPortfolioMemory);

function checkpointInput(reference: string) {
  const checkpoint = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r12-${reference}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...checkpoint.input,
    ...buildAiDecisionInputDto(checkpoint.input),
  };
  return { checkpoint, input };
}

function variant(input: AiDecisionInputWithDeckCapabilities, cardId: string) {
  return evaluateRunnerHandDevelopment({
    input,
    deckCapabilities: input.ownDeckCapabilities!,
    strategicIntent: input.ownRunnerStrategicIntent!,
  }).find((entry) => entry.definitionId === cardId)!;
}

describe("immutable breaker deck-pair admission", () => {
  it.each([
    [
      "g22-d378",
      "onr_v1_016_cyfermaster",
      "runner_matchpoint_remote_reserve_blocks_overlapping_breaker_install",
    ],
    [
      "g39-d61",
      "onr_v1_074_worm",
      "runner_install_has_no_bound_development_or_specialized_plan",
    ],
  ])(
    "preserves the last drawn variant and current owner constraints in %s",
    (reference, cardId, blocker) => {
      const { checkpoint, input } = checkpointInput(reference);
      expect(
        input.ownDeckSnapshot!.cards.find((c) => c.cardId === cardId)!.quantity,
      ).toBeGreaterThan(0);
      expect(
        input.ownDeckCapabilities!.runner!.breakerInventory.find(
          (c) => c.cardId === cardId,
        )!.quantityKnownInDeck,
      ).toBe(0);
      const evaluation = variant(input, cardId);
      expect(evaluation.persistentInstallEvaluation).toMatchObject({
        capabilityDelta: "cost_upgrade",
        duplicateRole: "useful_backup",
      });
      expect(
        evaluation.persistentInstallEvaluation!.finalInstallFit,
      ).toBeGreaterThan(0);
      expect(evaluation.persistentInstallEvaluation!.evidence).toContain(
        "breaker_variant_deck_pair:true",
      );

      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        checkpoint.runtime,
      );
      const decision = chooseAiAction(input);
      const plan = decision.decisionDebug!.planFirstDecision!;
      expect(plan.dispositions).toContainEqual(
        expect.objectContaining({
          actionId: evaluation.legalActionId,
          ownerModuleId: "runner.develop_board_and_hand",
          disposition: "explicitly_nonproductive",
          evidenceCode: blocker,
        }),
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(
        input.legalActions.some((a) => a.actionId === decision.actionId),
      ).toBe(true);
      expect(plan.route).toMatchObject({
        actionId: decision.actionId,
        stateVersion: input.playerView.stateVersion,
        planInstanceId: plan.leafExecutorInstanceId,
        stepId: plan.selectedStep!.stepId,
      });
      expect(plan.executionOrigin!.leafPlanInstanceId).toBe(
        plan.leafExecutorInstanceId,
      );
    },
  );

  it("does not erase a pair when the installed breaker's last copy left the stack", () => {
    const { input } = checkpointInput("g22-d378");
    for (const breaker of input.ownDeckCapabilities!.runner!.breakerInventory) {
      breaker.quantityKnownInDeck = 0;
    }
    expect(
      variant(input, "onr_v1_016_cyfermaster").persistentInstallEvaluation,
    ).toMatchObject({
      capabilityDelta: "cost_upgrade",
      duplicateRole: "useful_backup",
    });
  });

  it.each(["missing_snapshot", "candidate_absent", "installed_partner_absent"])(
    "keeps the deck-pair proof closed for %s despite remaining inventory quantities",
    (countercase) => {
      const { input } = checkpointInput("g22-d378");
      for (const breaker of input.ownDeckCapabilities!.runner!
        .breakerInventory) {
        breaker.quantityKnownInDeck = 2;
      }
      if (countercase === "missing_snapshot") delete input.ownDeckSnapshot;
      else
        input.ownDeckSnapshot!.cards = input.ownDeckSnapshot!.cards.filter(
          (card) =>
            countercase === "candidate_absent"
              ? card.cardId !== "onr_v1_016_cyfermaster"
              : !["onr_v1_039_krash", "onr_v1_066_snowball"].includes(
                  card.cardId,
                ),
        );
      const evaluation = variant(input, "onr_v1_016_cyfermaster");
      expect(evaluation.persistentInstallEvaluation).toMatchObject({
        capabilityDelta: "backup_only",
        duplicateRole: "redundant_duplicate",
      });
      expect(evaluation.persistentInstallEvaluation!.evidence).toContain(
        "breaker_variant_deck_pair:false",
      );
      if (countercase === "missing_snapshot") {
        expect(evaluation.persistentInstallEvaluation!.evidence).toContain(
          "breaker_variant_blockers:deck_does_not_express_breaker_pair,own_deck_snapshot_unavailable",
        );
      }
    },
  );
});
