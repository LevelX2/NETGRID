import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-score-threshold-d222.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { corpConditionalScoreCreditProfile } from "../../runtime/corp-canonical-card-facts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("funds a reachable conditional score threshold before a nonterminal free score", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.own).toMatchObject({
    credits: 11,
    clicks: 1,
    agendaPoints: 0,
  });
  const score = input.legalActions.find((a) => a.type === "score_agenda")!;
  expect(score.costs).toEqual([]);
  expect(
    input.legalActions.find((a) => a.actionId === "corp.gain_credit"),
  ).toMatchObject({
    costs: [{ clicks: 1 }],
    payload: { gainCreditsAmount: 1 },
  });
  expect(corpConditionalScoreCreditProfile("onr_v1_196_corporate-war")).toEqual(
    { threshold: 12, gainAmount: 12 },
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.gain_credit");
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (p) => p.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.score_agenda");
  const selected = decision.decisionDebug!.planFirstDecision!;
  expect(selected.selectedPlan).toMatchObject({
    moduleId: "corp.economy",
    parentInstanceId: root.instanceId,
    parentNeedId: `score-support:${root.dedupeKey}`,
  });
  expect(selected.selectedStep).toMatchObject({
    parentInstanceId: root.instanceId,
    needId: `score-support:${root.dedupeKey}`,
  });
});

it.each([
  { credits: 11, clicks: 0, agendaPoints: 0, label: "no remaining capacity" },
  { credits: 10, clicks: 1, agendaPoints: 0, label: "unreachable threshold" },
  {
    credits: 12,
    clicks: 1,
    agendaPoints: 0,
    label: "threshold already funded",
  },
  { credits: 11, clicks: 1, agendaPoints: 4, label: "terminal score" },
])("scores immediately with $label", ({ credits, clicks, agendaPoints }) => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  Object.assign(input.playerView.own, { credits, clicks, agendaPoints });
  if (clicks === 0)
    input.legalActions = input.legalActions.filter(
      (a) => !a.costs.some((cost) => (cost.clicks ?? 0) > 0),
    );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(chooseAiAction(input).actionId).toBe(
    input.legalActions.find((a) => a.type === "score_agenda")!.actionId,
  );
});

it("binds a two-credit gap only when both basic credits fit in the current turn", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  Object.assign(input.playerView.own, { credits: 10, clicks: 2 });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.gain_credit");
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  expect(
    portfolio.instances.find(
      (p) => p.instanceId === portfolio.rootForegroundInstanceId,
    )?.moduleId,
  ).toBe("corp.score_agenda");
});
