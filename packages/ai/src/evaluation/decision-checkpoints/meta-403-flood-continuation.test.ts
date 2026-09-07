import { describe, expect, it } from "vitest";
import twoClicks from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-flood-continuation-d418.json";
import lastClick from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-flood-continuation-d419.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

describe("meta 403 deckout flood score continuation", () => {
  it.each([0, 20])(
    "keeps the ordinary deadline boundaries at %i R&D cards",
    (remainingCards) => {
      const { input, runtime } = structuredClone(lastClick) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      input.playerView.own.stackOrRdCount = remainingCards;
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        runtime,
      );
      const result = chooseAiAction(input);
      const action = input.legalActions.find(
        (a) => a.actionId === result.actionId,
      )!;
      if (remainingCards === 0) {
        expect(action.type).not.toBe("advance_card");
      } else {
        expect(
          result.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
        ).toBe("P4");
      }
      expect(result.fallbackUsed).toBe(false);
    },
  );
  it.each([
    [418, twoClicks],
    [419, lastClick],
  ])(
    "advances an installed winning agenda at D%i instead of opening another score project",
    (_index, json) => {
      const { input, runtime } = structuredClone(json) as unknown as {
        input: AiDecisionInputWithDeckCapabilities;
        runtime: AiRuntimeCheckpointV1;
      };
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        runtime,
      );
      const result = chooseAiAction(input);
      const action = input.legalActions.find(
        (a) => a.actionId === result.actionId,
      )!;
      expect(action.type).toBe("advance_card");
      expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
      const agenda = input.playerView.servers
        .flatMap((s) => s.root)
        .find((c) => c.instanceId === action.source)!;
      expect(
        agenda.agendaPoints! + input.playerView.own.agendaPoints,
      ).toBeGreaterThanOrEqual(input.playerView.agendaPointsToWin);
      expect(result.fallbackUsed).toBe(false);
      const plan = result.decisionDebug?.planFirstDecision;
      expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
      expect(plan?.selectedPlan?.phase).toBe("advance_agenda");
      expect(plan?.rootPlanInstanceId).toBe(plan?.leafExecutorInstanceId);
      expect(plan?.selectedStep?.planInstanceId).toBe(plan?.rootPlanInstanceId);
      expect(plan?.priority?.effectiveClass).toBe("P3");
    },
  );
});
