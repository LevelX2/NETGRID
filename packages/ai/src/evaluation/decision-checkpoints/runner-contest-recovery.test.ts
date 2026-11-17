import { afterEach, describe, expect, it } from "vitest";

import efficientBreakerReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ce27c6b1-d97-efficient-breaker-replay.json";
import terminalSpendReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ce27c6b1-d112-terminal-spend-replay.json";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { runnerFinalClickCentralAccessBeforeTerminalScore } from "../../plans/runner-run-purpose";
import { runnerCostEffectiveCoverageRecovery } from "../../runner/rig-coverage/coverage-recovery";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function capturedInput(fixture: unknown) {
  const { input, runtime, stateVersion, validation } = structuredClone(
    fixture,
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    stateVersion: number;
    validation: Record<string, boolean>;
  };
  const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Expected the captured Runner deck.");
  expect(Object.values(validation).every((value) => value === true)).toBe(true);
  expect(input.playerView.stateVersion).toBe(stateVersion);
  restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);
  const projected = buildAiDecisionInputDto(input);
  return { ...input, ...projected };
}

function cheaperBreakerInstall(input: AiDecisionInputWithDeckCapabilities) {
  const answer = input.playerView.own.gripOrHq.find(
    (card) => card.title === "Loony Goon",
  );
  const install = input.legalActions.find(
    (action) =>
      action.type === "install_card" &&
      action.source === answer?.instanceId &&
      action.payload?.runnerProgramTrashBeforeInstall !== true,
  );
  if (!install) throw new Error("Expected the captured direct installation.");
  return install;
}

function centralAndRemoteRoutes(input: AiDecisionInputWithDeckCapabilities) {
  const routes = evaluateRunnerRunTargets({
    input,
    ...(input.ownDeckCapabilities
      ? { deckCapabilities: input.ownDeckCapabilities }
      : {}),
  });
  const hq = routes.find((route) => route.actionId === "runner.start_run.hq");
  const remote = routes.find(
    (route) => route.actionId === "runner.start_run.remote_1",
  );
  if (!hq || !remote) throw new Error("Expected both recorded run routes.");
  return { hq, remote, routes };
}

afterEach(resetResidentPlanPortfolioMemory);

describe("Runner contest recovery", () => {
  it("binds a cheaper operating route to an exact installing action at decision 97", () => {
    const input = capturedInput(efficientBreakerReplay);
    const install = cheaperBreakerInstall(input);
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(install.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      route: {
        actionId: install.actionId,
        stepId: expect.stringContaining(":install:"),
        stateVersion: input.playerView.stateVersion,
      },
      selectedPlan: { moduleId: "runner.rig_and_coverage" },
    });
  });

  it.each(["equal installation plus run cost", "no remaining click"] as const)(
    "preserves the old route when the upgrade has %s",
    (reason) => {
      const input = capturedInput(efficientBreakerReplay);
      const install = cheaperBreakerInstall(input);
      const hq = evaluateRunnerRunTargets({ input }).find(
        (route) => route.actionId === "runner.start_run.hq",
      );
      if (!hq) throw new Error("Expected the recorded HQ route.");
      expect(hq).toMatchObject({
        pathCost: 12,
        fundingNeed: { reason: "post_run_floor_gap" },
      });
      const candidates = buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: input.side,
        stateVersion: input.playerView.stateVersion,
        visibleSourceDefinitionsByInstanceId: Object.fromEntries(
          input.playerView.own.gripOrHq.map((card) => [
            card.instanceId,
            card.definitionId!,
          ]),
        ),
      });
      const deck = input.ownDeckCapabilities;
      if (!deck) throw new Error("Expected the captured breaker profiles.");
      expect(
        runnerCostEffectiveCoverageRecovery(input, candidates, hq, deck),
      ).toMatchObject({
        installActionId: install.actionId,
        totalRecoveryCost: 11,
      });

      if (reason === "equal installation plus run cost") {
        const cost = install.costs.find((item) => item.credits === 4);
        if (!cost) throw new Error("Expected the recorded install price.");
        cost.credits = 5;
      } else {
        input.playerView.own.clicks = 1;
      }
      expect(
        runnerCostEffectiveCoverageRecovery(input, candidates, hq, deck),
      ).toBeUndefined();
    },
  );

  it("uses the funded central route in the last click at decision 112", () => {
    const input = capturedInput(terminalSpendReplay);
    const { hq, remote } = centralAndRemoteRoutes(input);
    expect(hq).toMatchObject({
      pathCost: 7,
      creditsAfterRun: 9,
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
    });
    expect(remote.prerunReserveQuote).toMatchObject({
      status: "blocked",
      creditGap: 2,
    });
    const decision = chooseAiAction(input);
    expect(decision.actionId).toBe(hq.actionId);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      route: {
        actionId: hq.actionId,
        stepId: expect.stringContaining(":pressure:hq"),
        stateVersion: input.playerView.stateVersion,
      },
    });
  });

  it("keeps the reserve when the remote can be contested in the last click", () => {
    const input = capturedInput(terminalSpendReplay);
    const blocked = centralAndRemoteRoutes(input);
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(
        input,
        blocked.hq,
        blocked.routes,
        1,
      ),
    ).toBe(true);

    input.playerView.own.credits += 2;
    const { hq, remote, routes } = centralAndRemoteRoutes(input);
    expect(hq.fundingNeed.reason).toBe("post_run_floor_gap");
    expect(remote.prerunReserveQuote?.status).toBe("satisfied");
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(input, hq, routes, 1),
    ).toBe(false);
  });

  it("keeps the reserve when visible steal costs would breach the protected floor", () => {
    const input = capturedInput(terminalSpendReplay);
    const { hq, routes } = centralAndRemoteRoutes(input);
    const stealQuote = input.playerView.servers.find(
      (server) => server.id === hq.accessServerId,
    )?.runnerAgendaStealCostQuote;
    if (!stealQuote) throw new Error("Expected the captured steal-cost quote.");
    stealQuote.minimumCreditCost = hq.creditsAfterRun;
    expect(
      runnerFinalClickCentralAccessBeforeTerminalScore(input, hq, routes, 1),
    ).toBe(false);
  });
});
