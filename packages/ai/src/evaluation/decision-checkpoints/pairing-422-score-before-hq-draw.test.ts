import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-score-before-hq-draw-d172.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("removes the only exposed agenda by completing its funded score before a speculative HQ defense draw", () => {
  const { input, runtime } = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.stateVersion).toBe(171);
  expect(input.playerView.own.credits).toBe(27);
  expect(input.playerView.own.clicks).toBe(3);
  expect(input.playerView.opponent.agendaPoints).toBe(6);
  const hqAgendas = input.playerView.own.gripOrHq.filter(
    (card) => card.type === "agenda",
  );
  expect(hqAgendas).toHaveLength(1);
  expect(
    input.playerView.servers
      .flatMap((server) => server.root)
      .filter((card) => card.type === "agenda"),
  ).toHaveLength(0);
  const route = corpSameTurnScoreConversionPaths(input).find(
    (path) =>
      path.targetServerId === "new_remote" &&
      path.agendaCardId === hqAgendas[0]!.instanceId,
  )!;
  expect(route).toMatchObject({
    sameTurnGuaranteed: true,
    clicksRequired: 2,
    creditsRequired: 12,
    agendaPoints: 3,
  });
  expect(route.steps.map((step) => step.kind)).toEqual([
    "install_score_target",
    "place_advancement",
    "score_ready",
  ]);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(route.steps[0]!.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.score_agenda");
  expect(portfolio.executorInstanceId).toBe(root.instanceId);
  expect(root.moduleState).toMatchObject({
    kind: "score",
    signal: {
      agendaInstanceId: hqAgendas[0]!.instanceId,
      serverId: "new_remote",
      preventsTerminalSteal: true,
      sameTurnConversionProof: "engine_quoted_path",
    },
  });
  expect(decision.decisionDebug!.planFirstDecision!.selectedStep?.stepId).toBe(
    `${root.instanceId}:install_agenda`,
  );
});
