import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  abilityUsageSourceUsed,
  canUseCardImplementationAbilityLimit,
  cardImplementationAbilityLimitKey,
  markAbilityUsageSourceUsed,
  markCardImplementationAbilityLimitUsed,
  runnerCardImplementationAbilityLimitHost,
} from "./card-implementation-ability-limits";
import type { CardAbilityLimitImplementation } from "./definition-types";

const SOURCE_A = "source_a" as CardInstanceId;
const SOURCE_B = "source_b" as CardInstanceId;

function state(): GameState {
  return {
    stateVersion: 1,
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    runner: {
      credits: 5,
      clicks: 4,
      tags: 0,
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
    randomCounter: 0,
  } as unknown as GameState;
}

describe("card-implementation-ability-limits", () => {
  it("stores once-per-turn source usage by neutral limit key", () => {
    const current = state();
    const limit: CardAbilityLimitImplementation = {
      kind: "once_per_turn_per_source",
      scope: "any_ability_on_source",
    };

    expect(
      canUseCardImplementationAbilityLimit(
        runnerCardImplementationAbilityLimitHost,
        current,
        SOURCE_A,
        limit,
      ),
    ).toBe(true);

    markCardImplementationAbilityLimitUsed(
      runnerCardImplementationAbilityLimitHost,
      current,
      SOURCE_A,
      limit,
    );

    expect(current.runnerTurnFlags?.abilityUsedSourceIdsByLimitKey).toEqual({
      [cardImplementationAbilityLimitKey(limit)]: [SOURCE_A],
    });
    expect(
      canUseCardImplementationAbilityLimit(
        runnerCardImplementationAbilityLimitHost,
        current,
        SOURCE_A,
        limit,
      ),
    ).toBe(false);
  });

  it("uses run and trace lifecycle state for matching limit scopes", () => {
    const current = state();
    current.run = {
      runId: "run_1",
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      successful: true,
      accessCount: 1,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    };
    const runLimit: CardAbilityLimitImplementation = {
      kind: "once_per_run_per_source",
      scope: "source",
    };

    markCardImplementationAbilityLimitUsed(
      runnerCardImplementationAbilityLimitHost,
      current,
      SOURCE_A,
      runLimit,
    );

    expect(current.run?.successfulRunAbilityUsedSourceIds).toEqual([SOURCE_A]);

    current.trace = {
      traceId: "trace_1",
      sourceCardInstanceId: "trace_source" as CardInstanceId,
      sourceDefinitionId: "trace_definition",
      baseTraceStrength: 2,
      status: "post_bid_link",
      successEffect: { type: "none" },
      postBidLinkSourceIds: [],
    };
    const traceLimit: CardAbilityLimitImplementation = {
      kind: "once_per_trace_per_source",
      scope: "source",
    };

    markCardImplementationAbilityLimitUsed(
      runnerCardImplementationAbilityLimitHost,
      current,
      SOURCE_B,
      traceLimit,
    );

    expect(current.trace.postBidLinkSourceIds).toEqual([SOURCE_B]);
    expect(
      canUseCardImplementationAbilityLimit(
        runnerCardImplementationAbilityLimitHost,
        current,
        SOURCE_B,
        traceLimit,
      ),
    ).toBe(false);
  });

  it("blocks any second base-link source in the same trace attempt", () => {
    const current = state();
    current.trace = {
      traceId: "trace_1",
      sourceCardInstanceId: "trace_source" as CardInstanceId,
      sourceDefinitionId: "trace_definition",
      baseTraceStrength: 2,
      status: "base_link",
      successEffect: { type: "none" },
      baseLinkSourceId: SOURCE_A,
      postBidLinkSourceIds: [],
    };
    const limit: CardAbilityLimitImplementation = {
      kind: "one_base_link_card_per_trace_attempt",
      scope: "trace_attempt",
    };

    expect(
      canUseCardImplementationAbilityLimit(
        runnerCardImplementationAbilityLimitHost,
        current,
        SOURCE_B,
        limit,
      ),
    ).toBe(false);
  });

  it("normalizes reusable source usage helpers", () => {
    const used = markAbilityUsageSourceUsed([SOURCE_B, SOURCE_A], SOURCE_A);

    expect(used).toEqual([SOURCE_A, SOURCE_B]);
    expect(abilityUsageSourceUsed(used, SOURCE_A)).toBe(true);
  });
});
