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
const sourceAgendaId = "c2md";

describe("Defense-owned scored-agenda free rez", () => {
  it.each([
    ["free-rez-central-loss", "c2zx"],
    ["free-rez-single-remote", "c311"],
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

  it("binds the exact winning Score without requiring a post-game free-rez target", () => {
    const capture = fixture("free-rez-central-loss");
    const view = capture.input.playerView;
    const agenda = view.servers
      .flatMap(
        (server: { root: { instanceId: string; agendaPoints: number }[] }) =>
          server.root,
      )
      .find(
        (card: { instanceId: string }) => card.instanceId === sourceAgendaId,
      )!;
    view.agendaPointsToWin = view.own.agendaPoints + agenda.agendaPoints;
    delete view.corpCentralAccessQuotes;
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
    const legal = input.legalActions.find(
      (action) => action.type === "score_agenda",
    );
    expect(score.actionId).toBe(legal?.actionId);
    expect(score.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (instance) => instance.instanceId === portfolio.executorInstanceId,
    );
    expect(executor?.moduleId).toBe("corp.score_agenda");
    expect(executor?.moduleState).not.toHaveProperty(
      "choiceContinuation.freeRezChoiceBinding",
    );
  });

  it("prioritizes current R&D agenda exposure over the more expensive HQ ICE", () => {
    const { input } = fixture("free-rez-central-loss");
    const target = corpScoredAgendaFreeRezDefenseTarget(input, sourceAgendaId)!;
    expect(target.card.instanceId).toBe("c2zx");
    expect(target.rezCredits).toBe(7);
    expect(
      input.playerView.servers
        .find((server: { id: string }) => server.id === "hq")
        .ice.find(
          (card: { instanceId: string }) =>
            card.instanceId === "c311",
        ).effectiveRezCostQuote.finalCredits,
    ).toBe(13);
  });

  it("only ranks rez targets with payable additional agenda points after scoring", () => {
    const { input } = fixture("free-rez-single-remote");
    const chips = (input as AiDecisionInput).playerView.servers.flatMap(
      (server) => server.ice,
    );
    for (const card of chips) {
      if (card.effectiveRezCostQuote?.complete) {
        card.effectiveRezCostQuote.mandatoryAdditionalCosts.agendaPoints = 20;
      }
    }
    expect(
      corpScoredAgendaFreeRezDefenseTarget(input, sourceAgendaId),
    ).toBeUndefined();
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
