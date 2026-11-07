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

function isolateScoreThreshold(input: AiDecisionInputWithDeckCapabilities) {
  // The native position also has an independent P2 terminal R&D defense.
  // This control tests funding versus the free Score head itself.
  input.legalActions = input.legalActions.filter(
    (action) => action.type !== "install_card",
  );
  input.playerView.legalActions = input.legalActions;
}

it("funds a reachable conditional score threshold before a nonterminal free score", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  isolateScoreThreshold(input);
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
  isolateScoreThreshold(input);
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
  isolateScoreThreshold(input);
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

it("keeps actual terminal R&D defense ahead of the native nonwinning score payoff", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    "corp.install_card.corp_onr_v1_222_ball-and-chain_1.rd.corp_onr_v1_222_ball-and-chain_1.1",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
  ).toBe("P2");
  expect(residentPlanPortfolioSnapshot(input)!.instances).toContainEqual(
    expect.objectContaining({
      moduleId: "corp.score_agenda",
      moduleState: expect.objectContaining({
        signal: expect.objectContaining({
          fundingGap: 1,
          sameTurnCloseout: true,
        }),
      }),
    }),
  );
});
