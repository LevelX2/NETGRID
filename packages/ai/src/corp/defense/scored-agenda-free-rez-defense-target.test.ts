import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import { corpScoredAgendaFreeRezDefenseTarget } from "./scored-agenda-free-rez-defense-target";

const fixture = (name: string) =>
  JSON.parse(
    readFileSync(
      new URL(`./test-fixtures/${name}.json`, import.meta.url),
      "utf8",
    ),
  );
const sourceAgendaId = "corp_onr_v1_212_priority-requisition_1";

describe("Defense-owned scored-agenda free rez", () => {
  it.each([
    ["free-rez-central-loss", "corp_onr_v1_273_triggerman_1"],
    ["free-rez-single-remote", "corp_onr_v1_278_wall-of-ice_1"],
  ])(
    "preserves the native Score executor and exact choice binding: %s",
    (name, targetId) => {
      const capture = fixture(name);
      expect(
        Object.values(capture.validation).every((value) => value === true),
      ).toBe(true);
      const input: AiDecisionInput = {
        ...capture.input,
        ...buildAiDecisionInputDto(capture.input),
      };
      restoreAiRuntimeCheckpoint(
        input,
        capture.input.ownDeckSnapshot.deckSnapshotId,
        capture.runtime,
      );
      const score = chooseAiAction(input);
      const scoreAction = input.legalActions.find(
        (action) => action.type === "score_agenda",
      )!;
      expect(score.actionId).toBe(scoreAction.actionId);
      const beforeChoice = residentPlanPortfolioSnapshot(input)!;
      const executor = beforeChoice.instances.find(
        (instance) => instance.instanceId === beforeChoice.executorInstanceId,
      )!;
      expect(executor.moduleId).toBe("corp.score_agenda");
      expect(executor.executionState).toBe("executor");
      expect(executor.moduleState).toMatchObject({
        choiceContinuation: {
          family: "corp_scored_agenda_on_score",
          selectedActionId: score.actionId,
          selectedAtStateVersion: input.playerView.stateVersion,
          targetCardId: sourceAgendaId,
          freeRezChoiceBinding: {
            targetCardId: targetId,
            selectedVariantId: "fixed",
            selectedOptionId: `rez_${targetId}_fixed`,
          },
        },
      });
      const choiceInput: AiDecisionInput = {
        ...capture.choiceInput,
        ...buildAiDecisionInputDto(capture.choiceInput),
      };
      expect(choiceInput.playerView.stateVersion).toBe(
        input.playerView.stateVersion + 1,
      );
      const choice = chooseAiAction(choiceInput);
      const legalChoice = choiceInput.legalActions.find(
        (action) => action.type === "resolve_choice",
      )!;
      expect(choice.actionId).toBe(legalChoice.actionId);
      expect(choice.selectedChoices?.selectedOptionIds).toEqual([
        `rez_${targetId}_fixed`,
      ]);
      expect(
        residentPlanPortfolioSnapshot(choiceInput)?.executorInstanceId,
      ).toBe(executor.instanceId);
    },
  );

  it("prioritizes current R&D agenda exposure over the more expensive HQ ICE", () => {
    const { input } = fixture("free-rez-central-loss");
    const target = corpScoredAgendaFreeRezDefenseTarget(input, sourceAgendaId)!;
    expect(target.card.instanceId).toBe("corp_onr_v1_273_triggerman_1");
    expect(target.rezCredits).toBe(7);
    expect(
      input.playerView.servers
        .find((server: { id: string }) => server.id === "hq")
        .ice.find(
          (card: { instanceId: string }) =>
            card.instanceId === "corp_onr_v1_278_wall-of-ice_1",
        ).effectiveRezCostQuote.finalCredits,
    ).toBe(13);
  });

  it("rejects missing central access facts instead of substituting a cost ranking", () => {
    const { input } = fixture("free-rez-central-loss");
    delete input.playerView.corpCentralAccessQuotes;
    expect(() =>
      corpScoredAgendaFreeRezDefenseTarget(input, sourceAgendaId),
    ).toThrow(PlanResolutionFailure);
    try {
      corpScoredAgendaFreeRezDefenseTarget(input, sourceAgendaId);
      expect.fail("missing Defense facts must fail closed");
    } catch (error) {
      expect(error).toMatchObject({
        code: "missing_plan_module_coverage",
        context: {
          owner: "plan_module",
          removalCondition: expect.stringContaining("current central access"),
        },
      });
    }
  });
});
