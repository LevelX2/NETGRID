import type {
  CardInstanceId,
  CounterType,
  GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runnerCardImplementationAbilityLimitHost } from "../../ability-engine/card-implementation-ability-limits";
import {
  createCounterLifecycleCardImplementationRuntimeDeps,
  type CounterLifecycleRuntimeDepsHost,
} from "./counter-lifecycle-runtime-deps";

const sourceCardId = "source" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 10,
    pendingChoice: undefined,
    randomCounter: 0,
    runner: {
      credits: 5,
      clicks: 1,
      tags: 2,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [],
    },
    cardInstances: {},
    eventLog: [],
  } as unknown as GameState;
}

function host(input: {
  calls?: string[];
  counterValue?: number;
  successfulHqRun?: boolean;
  liberatedSubtype?: boolean;
  scoredBlackOpsLastTurn?: boolean;
} = {}): CounterLifecycleRuntimeDepsHost {
  return {
    counters: {
      cardCounter: (_state, _cardId, counterType) => {
        input.calls?.push(`card_counter:${counterType}`);
        return input.counterValue ?? 3;
      },
      addCounterToAllInstalledRunnerIcebreakers: (
        _state,
        counterType,
        amount,
      ) => {
        input.calls?.push(`add_icebreaker_counter:${counterType}:${amount}`);
        return {
          amount,
          counterType: counterType as Extract<
            CounterType,
            "militech" | "breaker_strength_penalty"
          >,
          countersAfter: 5,
          publicPayload: {
            counterType,
            addedCounterAmount: amount,
            remainingCounters: 5,
          },
        };
      },
    },
    lifecycle: {
      hasSuccessfulHqRunThisTurn: () => input.successfulHqRun ?? true,
      runnerLiberatedAgendaSubtypeThisTurn: (_state, subtype) => {
        input.calls?.push(`liberated:${subtype}`);
        return input.liberatedSubtype ?? true;
      },
      corpScoredBlackOpsAgendaLastTurn: () =>
        input.scoredBlackOpsLastTurn ?? true,
    },
  };
}

describe("counter/lifecycle card implementation runtime deps", () => {
  it("creates only the counter/lifecycle runtime properties", () => {
    const deps = createCounterLifecycleCardImplementationRuntimeDeps(host());

    expect(Object.keys(deps)).toEqual([
      "cardCounter",
      "runnerRunAttemptsLastTurn",
      "runnerRunAttemptsThisGame",
      "runnerTrashedNodeLastTurn",
      "runnerTrashedAdvertisementThisTurn",
      "runnerTrashedTransactionsThisTurn",
      "runnerInstalledResourceLastTurn",
      "runnerMadeSuccessfulRunOnServerThisTurn",
      "runnerLiberatedAgendaSubtypeThisTurn",
      "corpScoredAgendaSubtypeLastTurn",
      "addCounterToAllInstalledRunnerIcebreakers",
      "removeRunnerTags",
      "avoidNextTag",
      "abilityLimits",
    ]);
  });

  it("delegates counter queries and icebreaker counter mutation unchanged", () => {
    const calls: string[] = [];
    const deps = createCounterLifecycleCardImplementationRuntimeDeps(
      host({ calls, counterValue: 7 }),
    );
    const gameState = state();

    expect(deps.cardCounter(gameState, sourceCardId, "virus")).toBe(7);
    expect(
      deps.addCounterToAllInstalledRunnerIcebreakers(
        gameState,
        "militech",
        2,
      ),
    ).toEqual({
      amount: 2,
      counterType: "militech",
      countersAfter: 5,
      publicPayload: {
        counterType: "militech",
        addedCounterAmount: 2,
        remainingCounters: 5,
      },
    });
    expect(calls).toEqual([
      "card_counter:virus",
      "add_icebreaker_counter:militech:2",
    ]);
  });

  it("delegates tag removal and avoidance callbacks unchanged", () => {
    const deps = createCounterLifecycleCardImplementationRuntimeDeps(host());
    const gameState = state();

    expect(deps.removeRunnerTags(gameState, "amount", 1)).toEqual({
      removedTags: 1,
      runnerTagsAfter: 1,
      publicPayload: {
        removedTags: 1,
        runnerTagsAfter: 1,
      },
    });
    expect(deps.avoidNextTag(gameState, 1)).toEqual({
      amount: 1,
      publicPayload: {
        avoidNextTag: true,
        tagAvoidanceCreditsAfter: 1,
      },
    });
    expect(gameState.runner.tags).toBe(1);
    expect(gameState.runnerTagAvoidanceCredits).toBe(1);
  });

  it("delegates lifecycle facts without changing condition semantics", () => {
    const calls: string[] = [];
    const deps = createCounterLifecycleCardImplementationRuntimeDeps(
      host({
        calls,
        successfulHqRun: true,
        liberatedSubtype: false,
        scoredBlackOpsLastTurn: true,
      }),
    );
    const gameState = state();
    gameState.runnerTurnFlags = {
      runAttemptsLastTurn: 4,
    } as NonNullable<GameState["runnerTurnFlags"]>;

    expect(deps.runnerRunAttemptsLastTurn(gameState)).toBe(4);
    expect(deps.runnerMadeSuccessfulRunOnServerThisTurn(gameState, "hq")).toBe(
      true,
    );
    expect(
      deps.runnerLiberatedAgendaSubtypeThisTurn(gameState, "black_ops"),
    ).toBe(false);
    expect(deps.corpScoredAgendaSubtypeLastTurn(gameState, "black_ops")).toBe(
      true,
    );
    expect(calls).toEqual(["liberated:black_ops"]);
  });

  it("keeps ability limit storage on the existing ability limit host", () => {
    const deps = createCounterLifecycleCardImplementationRuntimeDeps(host());

    expect(deps.abilityLimits).toBe(runnerCardImplementationAbilityLimitHost);
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./counter-lifecycle-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});
