import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint(game: 23 | 26) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r3-g${game}-d${game === 23 ? 91 : 71}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const action = input.legalActions.find((a) => a.type === "rez_ice")!;
  const server = input.playerView.servers.find((s) => s.id === "hq")!;
  const sourceCard = server.ice.find((c) => c.instanceId === action.source)!;
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      server.ice.map((c) => [c.instanceId, c.definitionId!]),
    ),
  }).find((c) => c.actionId === action.actionId)!;
  const route = projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard,
    targetServerId: server.id,
  })!;
  expect(route).toBeDefined();
  return { input, runtime: cp.runtime, action, route };
}

describe("pairing 475: current-run reserve requires a fundable inner stopping rez", () => {
  it.each([23, 26] as const)(
    "does not reserve an unaffordable ten-credit inner ICE in original game %i",
    (game) => {
      const { input, route } = checkpoint(game);
      expect(input.playerView.own.credits).toBe(game === 23 ? 7 : 4);
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input,
          route,
          scoreProjects: [],
        }),
      ).toMatchObject({
        preservesReserve: true,
        requiredCreditsAfterRez: game === 23 ? 0 : 2,
      });
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input,
          route,
          scoreProjects: [],
        }).currentRunFollowupIceId,
      ).toBeUndefined();
    },
  );

  it.each([23, 26] as const)(
    "uses the original legal current rez through the existing defense root and step in game %i",
    (game) => {
      const { input, runtime, action } = checkpoint(game);
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot!.deckSnapshotId,
        runtime,
      );
      const decision = chooseAiAction(input);
      expect(decision).toMatchObject({
        actionId: action.actionId,
        fallbackUsed: false,
        timeoutUsed: false,
      });
      const plan = decision.decisionDebug!.planFirstDecision!;
      expect(plan.rootPlanInstanceId).toBe(
        "plan:corp.defend_servers:server-defense-portfolio",
      );
      expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
      expect(plan.selectedStep!.planInstanceId).toBe(plan.rootPlanInstanceId);
      expect(plan.route).toMatchObject({
        actionId: action.actionId,
        stateVersion: input.playerView.stateVersion,
        planInstanceId: plan.rootPlanInstanceId,
        stepId: plan.selectedStep!.stepId,
      });
    },
  );

  it.each([
    [23, 9, true, 0],
    [23, 10, false, 10],
    [23, 15, false, 10],
    [26, 9, true, 2],
    [26, 10, false, 12],
    [26, 12, true, 12],
  ] as const)(
    "keeps exact inner stopping reserve at game %i / %i credits",
    (game, credits, preservesReserve, requiredCreditsAfterRez) => {
      const { input, route } = checkpoint(game);
      input.playerView.own.credits = credits;
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input,
          route,
          scoreProjects: [],
        }),
      ).toMatchObject({ preservesReserve, requiredCreditsAfterRez });
    },
  );
});
