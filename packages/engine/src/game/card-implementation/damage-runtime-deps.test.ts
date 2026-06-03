import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  ImminentEvent,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createDamageCardImplementationRuntimeDeps,
  type DamageRuntimeDepsHost,
} from "./damage-runtime-deps";

const sourceCardId = "source" as CardInstanceId;
const sourceDefinitionId = "source_def" as CardDefinitionId;

function state(): GameState {
  return {
    matchId: "match",
    stateVersion: 7,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    pendingChoice: undefined,
    randomCounter: 0,
    runner: {
      credits: 5,
      clicks: 1,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 4,
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

function action(payload: LegalAction["payload"] = {}): LegalAction {
  return {
    actionId: "play:damage",
    id: "play:damage",
    side: "corp",
    timingPoint: "corp_action.main",
    type: "play_card",
    label: "Play damage",
    source: sourceCardId,
    payload,
    costs: [],
    targetRequirements: [],
  } as unknown as LegalAction;
}

function host(input: {
  replacementWindow?: boolean;
  eventModificationWindow?: boolean;
  calls?: { kind: string; value: unknown }[];
} = {}): DamageRuntimeDepsHost {
  return {
    damage: {
      createDamageImminentEvent: (_state, request) => {
        input.calls?.push({ kind: "create", value: request });
        return {
          payload: {
            baseDamageAmount: request.amount,
            bioweaponsEngineeringModifier: 1,
          },
        } as unknown as ImminentEvent;
      },
      openReplacementWindow: (_state, event) => {
        input.calls?.push({ kind: "replacement", value: event.payload });
        return input.replacementWindow ?? false;
      },
      openEventModificationWindow: (_state, event) => {
        input.calls?.push({ kind: "modification", value: event.payload });
        return input.eventModificationWindow ?? false;
      },
      openDamageResolutionWindow: (_state, event) => {
        input.calls?.push({ kind: "replacement", value: event.payload });
        if (input.replacementWindow) return true;
        input.calls?.push({ kind: "modification", value: event.payload });
        return input.eventModificationWindow ?? false;
      },
      resolveDamageImminentEvent: (_state, event) => {
        input.calls?.push({ kind: "resolve", value: event.payload });
        return {
          damageType: "net",
          amount: 2,
          cardsTrashed: 2,
          flatline: false,
          runnerGripBefore: 4,
          runnerGripAfter: 2,
          runnerMaxHandSizeAfter: 5,
        };
      },
      resolveUnpreventableDamage: (_state, request) => {
        input.calls?.push({ kind: "unpreventable", value: request });
        return {
          damageType: request.damageType,
          amount: request.amount,
          cardsTrashed: request.amount,
          flatline: false,
          runnerGripBefore: 3,
          runnerGripAfter: 2,
          ...(request.damageType === "core" ? { coreDamageAfter: 1 } : {}),
        };
      },
    },
  };
}

describe("damage card implementation runtime deps", () => {
  it("creates only the damage runtime properties", () => {
    const deps = createDamageCardImplementationRuntimeDeps(host());

    expect(Object.keys(deps)).toEqual([
      "runnerWasDamagedDuringLastThreeActions",
      "damageRunner",
      "unpreventableDamageRunner",
    ]);
  });

  it("keeps the recent damage runtime check local to the damage family", () => {
    const gameState = state();
    gameState.runnerTurnFlags = {
      runnerActionsTakenThisTurn: 4,
      lastDamageRunnerActionOrdinal: 2,
    } as NonNullable<GameState["runnerTurnFlags"]>;
    const deps = createDamageCardImplementationRuntimeDeps(host());

    expect(deps.runnerWasDamagedDuringLastThreeActions(gameState)).toBe(true);
  });

  it("delegates preventable damage through the existing damage windows", () => {
    const calls: { kind: string; value: unknown }[] = [];
    const deps = createDamageCardImplementationRuntimeDeps(host({ calls }));

    const result = deps.damageRunner(
      state(),
      action(),
      sourceDefinitionId,
      "net",
      2,
    );

    expect(calls.map((call) => call.kind)).toEqual([
      "create",
      "replacement",
      "modification",
      "resolve",
    ]);
    expect(calls[0]?.value).toEqual({
      damageId: "match.7.source_def",
      damageType: "net",
      amount: 2,
      source: "operation:source_def",
    });
    expect(result).toEqual({
      resolved: true,
      damageType: "net",
      amount: 2,
      cardsTrashed: 2,
      flatline: false,
      publicPayload: {
        damageResolved: true,
        damageType: "net",
        damageAmount: 2,
        cardsTrashed: 2,
        flatline: false,
        runnerGripBefore: 4,
        runnerGripAfter: 2,
        runnerMaxHandSizeAfter: 5,
        baseDamageAmount: 2,
        bioweaponsEngineeringModifier: 1,
      },
    });
  });

  it("preserves unresolved damage payload when a prevention or replacement window opens", () => {
    const calls: { kind: string; value: unknown }[] = [];
    const legalAction = action({ existingPayload: true });
    const deps = createDamageCardImplementationRuntimeDeps(
      host({ calls, replacementWindow: true }),
    );

    const result = deps.damageRunner(
      state(),
      legalAction,
      sourceDefinitionId,
      "meat",
      3,
    );

    expect(calls.map((call) => call.kind)).toEqual(["create", "replacement"]);
    expect(result).toEqual({
      resolved: false,
      damageType: "meat",
      amount: 0,
      cardsTrashed: 0,
      flatline: false,
      publicPayload: { existingPayload: true },
    });
  });

  it("delegates unpreventable damage to the existing unpreventable damage primitive", () => {
    const calls: { kind: string; value: unknown }[] = [];
    const deps = createDamageCardImplementationRuntimeDeps(host({ calls }));

    const result = deps.unpreventableDamageRunner(
      state(),
      action(),
      sourceDefinitionId,
      "core",
      1,
    );

    expect(calls).toEqual([
      {
        kind: "unpreventable",
        value: {
          damageId: "match.7.source_def.unpreventable",
          damageType: "core",
          amount: 1,
          source: "unpreventable:source_def",
        },
      },
    ]);
    expect(result).toEqual({
      resolved: true,
      damageType: "core",
      amount: 1,
      cardsTrashed: 1,
      flatline: false,
      publicPayload: {
        damageResolved: true,
        damageType: "core",
        damageAmount: 1,
        cardsTrashed: 1,
        flatline: false,
        runnerGripBefore: 3,
        runnerGripAfter: 2,
        coreDamageAfter: 1,
        preventableDamage: false,
        unpreventableDamage: true,
      },
    });
  });

  it("does not import from the public engine index", () => {
    const source = readFileSync(
      new URL("./damage-runtime-deps.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain('from "../index"');
    expect(source).not.toContain("from '../index'");
    expect(source).not.toContain('from "../../index"');
    expect(source).not.toContain("from '../../index'");
  });
});
