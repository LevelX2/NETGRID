import { describe, expect, it } from "vitest";
import type { GameState, LegalAction } from "@netgrid/shared";
import {
  appendPublicCounterMutation,
  canonicalPublicCounterMutations,
  publicCounterMutation,
  publicCounterMutationsForEvent,
} from "./public-counter-mutations";

describe("public counter mutations", () => {
  const state = {
    cardInstances: {},
    corp: { servers: [] },
  } as unknown as GameState;
  it("derives the changed amount and rejects impossible directions", () => {
    expect(
      publicCounterMutation({
        operation: "remove",
        counterType: "spy",
        scope: { kind: "server", serverId: "remote_1" },
        before: 2,
        after: 1,
      }),
    ).toMatchObject({ before: 2, amount: 1, after: 1 });

    expect(() =>
      publicCounterMutation({
        operation: "remove",
        counterType: "spy",
        scope: { kind: "server", serverId: "remote_1" },
        before: 1,
        after: 2,
      }),
    ).toThrow("darf den Counterwert nicht erhöhen");
  });

  it("sorts aggregate mutations independently of producer order", () => {
    const remote = publicCounterMutation({
      operation: "purge",
      counterType: "virus",
      scope: { kind: "server", serverId: "remote_2" },
      before: 3,
      after: 0,
    });
    const runner = publicCounterMutation({
      operation: "purge",
      counterType: "virus",
      scope: { kind: "side", side: "runner" },
      before: 2,
      after: 0,
    });

    expect(canonicalPublicCounterMutations([runner, remote])).toEqual([
      remote,
      runner,
    ]);
  });

  it("collects direct and resolved-effect mutations into one event list", () => {
    const action = {
      actionId: "corp.trigger.counter",
      side: "corp",
      type: "trigger_ability",
      label: "Counter ändern",
      source: "game_rule",
      timingPoint: "corp_action.main",
      costs: [],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 1,
      resolvedEffects: [],
    } satisfies LegalAction;
    const mutation = publicCounterMutation({
      operation: "remove",
      counterType: "spy",
      scope: { kind: "server", serverId: "remote_1" },
      before: 1,
      after: 0,
    });
    appendPublicCounterMutation(action, mutation);

    expect(publicCounterMutationsForEvent(state, state, action)).toEqual([
      mutation,
    ]);
  });

  it("normalizes legacy public removal fields and keeps private actions closed", () => {
    const publicAction = {
      actionId: "corp.trigger.counter",
      side: "corp",
      type: "trigger_ability",
      label: "Counter ändern",
      source: "game_rule",
      timingPoint: "corp_action.main",
      costs: [],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 1,
      payload: {
        serverId: "remote_1",
        counterType: "spy",
        removedCounterAmount: 1,
        remainingCounters: 1,
      },
    } satisfies LegalAction;

    expect(publicCounterMutationsForEvent(state, state, publicAction)).toEqual([
      expect.objectContaining({
        scope: { kind: "server", serverId: "remote_1" },
        before: 2,
        amount: 1,
        after: 1,
      }),
    ]);
    expect(
      publicCounterMutationsForEvent(state, state, {
        ...publicAction,
        visibility: "private_to_actor",
      }),
    ).toEqual([]);
  });

  it("groups purgeable counters by type and public location", () => {
    const before = {
      cardInstances: {},
      corp: { servers: [] },
      purgeableRunnerVirusCounters: {
        servers: { remote_1: { garbage: 2 } },
        effects: {
          first: { counterType: "garbage", amount: 1, serverId: "remote_1" },
          second: {
            counterType: "garbage",
            amount: 2,
            serverId: "remote_1",
          },
          global: { counterType: "thought", amount: 1 },
        },
      },
    } as unknown as GameState;
    const after = {
      ...before,
      purgeableRunnerVirusCounters: undefined,
    } as unknown as GameState;
    const action = {
      actionId: "corp.purge.runner-virus",
      side: "corp",
      type: "purge_runner_virus_counters",
      label: "Virus-Counter purgen",
      source: "game_rule",
      timingPoint: "corp_action.main",
      costs: [],
      targetRequirements: [],
      visibility: "public",
      expiresAtStateVersion: 1,
    } satisfies LegalAction;

    expect(publicCounterMutationsForEvent(before, after, action)).toEqual([
      expect.objectContaining({
        counterType: "thought",
        scope: { kind: "game" },
        before: 1,
        amount: 1,
        after: 0,
      }),
      expect.objectContaining({
        counterType: "garbage",
        scope: { kind: "server", serverId: "remote_1" },
        before: 5,
        amount: 5,
        after: 0,
      }),
    ]);
  });
});
