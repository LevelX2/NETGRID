import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { assessCorpTerminalAgendaDefense } from "../../corp/defense/corp-terminal-agenda-defense";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function checkpoint() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-474-r4-g12-d403.json",
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
  return { input, runtime: cp.runtime };
}

function assessment(input: AiDecisionInputWithDeckCapabilities) {
  const server = input.playerView.servers.find((s) => s.id === "rd")!;
  const sourceCard = server.ice.find(
    (c) => c.definitionId === "onr_v1_245_fire-wall",
  )!;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      server.ice.map((c) => [c.instanceId, c.definitionId!]),
    ),
  });
  const rezAction = input.legalActions.find((a) => a.type === "rez_ice")!;
  const candidate = candidates.find((c) => c.actionId === rezAction.actionId)!;
  const route = projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard,
    targetServerId: server.id,
  })!;
  expect(route).toBeDefined();
  const defense = assessCorpTerminalAgendaDefense(
    input,
    server.id,
    "current-terminal-run",
  )!;
  const reserve = assessCorpExactIceRezAgainstScoreReserves({
    input,
    route,
    scoreProjects: [],
  });
  return { route, defense, reserve };
}

describe("pairing 474: reserve the best funded partial terminal defense", () => {
  it("retains the known four-credit inner tax instead of spending five on a weaker outer tax", () => {
    const { input } = checkpoint();
    const { route, defense, reserve } = assessment(input);
    expect(route.after).toMatchObject({
      runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
      runnerCreditsRemainingOnBestAccessPath: 8,
    });
    expect(defense.best).toMatchObject({
      totalSelectedRezCost: 4,
      protection: {
        runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
        runnerCreditsRemainingOnBestAccessPath: 0,
      },
      selectedRezCosts: [
        { iceInstanceId: "corp_onr_v1_252_keeper_1", credits: 4 },
      ],
    });
    expect(reserve).toMatchObject({
      preservesReserve: false,
      availableCreditsAfterRez: 2,
      requiredCreditsAfterRez: 4,
      immediateRezIceIds: ["corp_onr_v1_252_keeper_1"],
    });
  });

  it("declines that rez through the same legal defense root, executor and current step", () => {
    const { input, runtime } = checkpoint();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: "corp.decline_rez",
      fallbackUsed: false,
      timeoutUsed: false,
    });
    expect(
      input.legalActions.some((a) => a.actionId === decision.actionId),
    ).toBe(true);
    const plan = decision.decisionDebug!.planFirstDecision!;
    expect(plan.rootPlanInstanceId).toBe(
      "plan:corp.defend_servers:server-defense-portfolio",
    );
    expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
    expect(plan.selectedStep!.planInstanceId).toBe(plan.rootPlanInstanceId);
    expect(plan.route).toMatchObject({
      actionId: decision.actionId,
      stateVersion: 402,
      planInstanceId: plan.rootPlanInstanceId,
    });
    expect(plan.route!.stepId).toBe(plan.selectedStep!.stepId);
  });

  it.each([
    [8, false],
    [9, true],
  ] as const)(
    "keeps the same exact costs at the %i-credit funding boundary",
    (credits, preservesReserve) => {
      const { input } = checkpoint();
      input.playerView.own.credits = credits;
      const { reserve } = assessment(input);
      expect(reserve).toMatchObject({
        preservesReserve,
        requiredCreditsAfterRez: 4,
        availableCreditsAfterRez: credits - 5,
      });
    },
  );
});
