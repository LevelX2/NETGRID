import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([
  { name: "g25-d46", onlyHq: false },
  { name: "g25-d46", onlyHq: true },
  { name: "g38-d208", onlyHq: false },
])(
  "binds coverage or HQ funding in $name with only HQ offered=$onlyHq",
  ({ name, onlyHq }) => {
    const fixture = JSON.parse(
      readFileSync(
        new URL(`fixtures/meta490-${name}.json`, import.meta.url),
        "utf8",
      ),
    );
    expect(Object.keys(fixture.validation)).toHaveLength(9);
    expect(
      Object.values(fixture.validation).every((value) => value === true),
    ).toBe(true);
    const input = {
      ...fixture.input,
      ...buildAiDecisionInputDto(fixture.input),
    } as AiDecisionInput;
    bindPublicBoardStealQuoteCompanion(input);
    if (onlyHq) {
      // Isolate the certified HQ need from the other current run offers.
      input.legalActions = input.legalActions.filter(
        (action) => action.payload?.serverId !== "rd" &&
          action.payload?.serverId !== "archives",
      );
      input.playerView.legalActions = input.legalActions;
    }
    if (name === "g38-d208") {
      const target = evaluateRunnerRunTargets({ input }).find(
        (entry) => entry.actionId === "rs.r1",
      )!;
      expect(target).toMatchObject({
        pathPassability: "blocked_unpayable",
        accessPayoffContestable: false,
        accessPayoffRequiresFunding: true,
      });
      const unquoted = structuredClone(input);
      delete unquoted.playerView.servers.find(
        (server) => server.id === "r1",
      )!.runnerAgendaStealCostQuote;
      expect(
        evaluateRunnerRunTargets({ input: unquoted }).find(
          (entry) => entry.actionId === target.actionId,
        )?.accessPayoffRequiresFunding,
      ).toBeUndefined();
    }
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      fixture.input.ownDeckSnapshot.deckSnapshotId,
      fixture.runtime,
    );
    restoreResidentPlanPortfolioMemorySnapshot(
      input,
      structuredClone(fixture.runtime.residentPlanPortfolio),
    );

    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    if (onlyHq) {
      expect(decision.actionId).toBe("rb");
      expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
        rootPlanInstanceId: "pa7nez1ioecg7mf06q1uwqq57o",
        leafExecutorInstanceId: "p3bckraiba865d5xfnzk3r03v0",
        route: {
          actionId: decision.actionId,
          stateVersion: input.playerView.stateVersion,
        },
      });
      return;
    }
    expect(decision.actionId).toBe("r8");
    expect(
      input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: "r8",
      capabilityId: "draw_for_answer_breaker_wall",
      stateVersion: input.playerView.stateVersion,
    });
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    const executor = portfolio.instances.find(
      (entry) => entry.instanceId === portfolio.executorInstanceId,
    )!;
    expect(executor.moduleId).toBe("runner.rig_and_coverage");
    expect(executor.moduleState).toMatchObject({
      phase: "draw_for_answer",
      gap: {
        needKind: "cost_ineffective_coverage",
        requiredRole: "breaker_wall",
        answerInHand: false,
        installActionIds: [],
        recoveryMode: "draw_for_known_role",
        drawForAnswerActionIds: expect.arrayContaining(["r8"]),
      },
    });
    expect(
      decision.decisionDebug?.actionAlternatives?.find(
        (action) => action.actionId === "r8",
      )?.excluded,
    ).not.toBe(true);
  },
);
