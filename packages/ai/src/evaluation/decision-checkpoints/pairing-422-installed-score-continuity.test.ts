import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-installed-score-continuity-d136.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("finishes the exact installed sole-agenda score before an unrelated rez reserve", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own).toMatchObject({ credits: 12, clicks: 1 });
  expect(input.playerView.opponent.agendaPoints).toBe(6);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const selected = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(selected.type).toBe("play_operation");
  expect(selected.costs).toEqual([{ credits: 12, clicks: 1 }]);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.score_agenda");
  expect(root.phase).toBe("convert_agenda");
  expect(
    decision.decisionDebug!.planFirstDecision!.selectedStep?.planInstanceId,
  ).toBe(root.instanceId);
  expect(
    decision.decisionDebug!.planFirstDecision!.assessmentEvidenceCodes,
  ).toContain("plan_priority_class:P2");
});
