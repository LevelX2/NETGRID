import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  CounterType,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyPostBreakStealthLoss,
  clearActivityGatedFortRunMarkers,
  isActivityGatedFortRunBlocked,
  markFortActivityForRunGate,
  fortTraceBitPoolSource,
  fortTraceBitPoolTotal,
  resolveAardvarkInterceptionChoice,
  runnerCanUseBreakerOnCurrentFort,
  shouldOpenAardvarkInterception,
  spendFortTraceBitPool,
  startAardvarkInterceptionChoice,
  validateActivityGatedFortRun,
  type FortRunSideFamiliesHost,
} from "./fort-run-side-families";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverRoot", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    advancementCounters: options.advancementCounters ?? 0,
    counters: options.counters ?? {},
    ...options,
  } as CardInstance;
}

function definition(
  id: string,
  title: string,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title,
    side: options.side ?? "corp",
    type: options.type ?? "upgrade",
    subtypes: options.subtypes ?? [],
    rezCost: options.rezCost ?? 0,
    ...options,
  } as CardDefinition;
}

function makeState(): GameState {
  const aardvark = "aardvark_1" as CardInstanceId;
  const roving = "roving_1" as CardInstanceId;
  const paris = "paris_1" as CardInstanceId;
  const ice = "ice_1" as CardInstanceId;
  const worm = "worm_1" as CardInstanceId;
  const stealth = "stealth_1" as CardInstanceId;
  const breaker = "breaker_1" as CardInstanceId;
  return {
    stateVersion: 12,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [worm, breaker, stealth], hardware: [], resources: [] },
    },
    corp: {
      credits: 4,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: [ice],
          root: [aardvark, roving, paris],
        },
      ],
    },
    cardInstances: {
      [aardvark]: instance(aardvark, "onr_v1_349_aardvark", {
        faceup: false,
        rezzed: false,
      }),
      [roving]: instance(roving, "onr_v1_368_roving-submarine", {
        counters: { mark: 0 },
      }),
      [paris]: instance(paris, "onr_v1_365_paris-city-grid", {
        counters: { bit: 3 },
      }),
      [ice]: instance(ice, "ice_definition", {
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      }),
      [worm]: instance(worm, "worm_definition", {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
      }),
      [breaker]: instance(breaker, "onr_v1_053_ramming-piston", {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
      }),
      [stealth]: instance(stealth, "stealth_definition", {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        counters: { recurring_credit: 2 },
      }),
    },
    run: {
      attackedServerId: "rd",
      phase: "encounter",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId: ice,
      approachIceId: undefined,
      passedIceIds: [],
      successful: false,
      accessCount: 1,
    },
  } as unknown as GameState;
}

function definitions(): Record<string, CardDefinition> {
  return {
    onr_v1_349_aardvark: definition("onr_v1_349_aardvark", "Aardvark", {
      rezCost: 1,
    }),
    "onr_v1_368_roving-submarine": definition(
      "onr_v1_368_roving-submarine",
      "Roving Submarine",
    ),
    "onr_v1_365_paris-city-grid": definition(
      "onr_v1_365_paris-city-grid",
      "Paris City Grid",
    ),
    ice_definition: definition("ice_definition", "Simple ICE", { type: "ice" }),
    worm_definition: definition("worm_definition", "Worm", {
      side: "runner",
      type: "program",
      subtypes: ["worm"],
    }),
    "onr_v1_053_ramming-piston": definition(
      "onr_v1_053_ramming-piston",
      "Ramming Piston",
      { side: "runner", type: "program" },
    ),
    stealth_definition: definition("stealth_definition", "Stealth Source", {
      side: "runner",
      type: "program",
      subtypes: ["stealth"],
    }),
  };
}

function hostFor(state: GameState): FortRunSideFamiliesHost {
  const defs = definitions();
  return {
    state,
    cards: {
      definitionFor: (cardId) => defs[state.cardInstances[cardId]!.definitionId]!,
      cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
      cardHasSubtype: (card, subtype) => card.subtypes?.includes(subtype) ?? false,
      runnerInstalledCardIds: () => [
        ...state.runner.rig.hardware,
        ...state.runner.rig.programs,
        ...state.runner.rig.resources,
      ],
    },
    servers: {
      mustServer: (serverId) =>
        state.corp.servers.find((server) => server.id === serverId) as CorpServer,
      publicServerLabel: (serverId) =>
        state.corp.servers.find((server) => server.id === serverId)?.label,
    },
    counters: {
      cardCounter: (cardId, counterType) =>
        Math.max(
          0,
          Math.floor(
            state.cardInstances[cardId]?.counters?.[counterType as CounterType] ?? 0,
          ),
        ),
      setCardCounter: (cardId, counterType, amount) => {
        const instance = state.cardInstances[cardId]!;
        instance.counters = {
          ...(instance.counters ?? {}),
          [counterType]: Math.max(0, Math.floor(amount)),
        };
      },
      spendCardCounter: (cardId, counterType, amount) => {
        const instance = state.cardInstances[cardId]!;
        const current = Math.max(
          0,
          Math.floor(instance.counters?.[counterType] ?? 0),
        );
        instance.counters = {
          ...(instance.counters ?? {}),
          [counterType]: Math.max(0, current - amount),
        };
      },
    },
    payment: {
      hostedPaymentCredits: (cardId) =>
        Math.max(0, Math.floor(state.cardInstances[cardId]?.counters?.recurring_credit ?? 0)),
      spendHostedPaymentCredits: (cardId, amount) => {
        const instance = state.cardInstances[cardId]!;
        instance.counters = {
          ...(instance.counters ?? {}),
          recurring_credit: Math.max(
            0,
            Math.floor(instance.counters?.recurring_credit ?? 0) - amount,
          ),
        };
      },
      rezCostForCard: (cardId) => defs[state.cardInstances[cardId]!.definitionId]!.rezCost ?? 0,
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
    },
    breaker: {
      breakAbilityForLegalAction: () => ({
        id: "ramming",
        abilityId: "ramming",
        type: "break_subroutine",
        cost: { credits: 1 },
        timingPoint: "encounter",
        breakCost: 1,
        count: 1,
        postBreakStealthLoss: 2,
      } as unknown as ReturnType<FortRunSideFamiliesHost["breaker"]["breakAbilityForLegalAction"]>),
    },
    effects: {
      executeEffectCommands: (commands) => {
        (state as unknown as { lastEffectCommands?: unknown }).lastEffectCommands =
          commands;
      },
      trashRunnerInstalledProgram: (cardId) => {
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
        state.runner.heap.push(cardId);
      },
    },
  };
}

describe("fort run side families", () => {
  it("opens and resolves Aardvark interception without exposing extra hidden data", () => {
    const state = makeState();
    const host = hostFor(state);
    const worm = "worm_1" as CardInstanceId;
    const action = {
      side: "runner",
      type: "pump_breaker",
      source: worm,
      costs: [{ credits: 1 }],
      payload: { breakerId: worm },
    } as unknown as LegalAction;

    expect(runnerCanUseBreakerOnCurrentFort(host, worm)).toBe(true);
    expect(shouldOpenAardvarkInterception(host, worm)).toBe(true);

    startAardvarkInterceptionChoice(host, worm, "pump_breaker", action);

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source:
        "v199.aardvark:aardvark_1:worm_1:ice_1:pump_breaker:none:1",
      kind: "select_option",
      visibility: "private_to_side",
    });
    expect(action.payload).toMatchObject({
      hiddenZoneAction: "aardvark_interception_window",
      aardvarkWindowOpened: true,
    });

    resolveAardvarkInterceptionChoice(host, action, {
      side: "corp",
      actionId: "choice",
      selectedChoices: { selectedOptionIds: ["rez_trash_worm"] },
    } as unknown as PlayerAction);

    expect(state.cardInstances.aardvark_1?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(3);
    expect(state.runner.heap).toContain(worm);
    expect(action.payload).toMatchObject({
      publicRevealDefinitionId: "onr_v1_349_aardvark",
      hiddenZoneAction: "aardvark_rez_trash_worm",
      aardvarkRezzed: true,
      aardvarkWormTrashed: true,
    });
  });

  it("keeps Roving Submarine run gate and activity markers stable", () => {
    const state = makeState();
    const host = hostFor(state);
    const action = { payload: {} } as LegalAction;

    expect(isActivityGatedFortRunBlocked(host, "rd")).toBe(true);
    expect(() => validateActivityGatedFortRun(host, "rd")).toThrow(
      /Roving Submarine/,
    );

    markFortActivityForRunGate(host, "rd", action);

    expect(state.cardInstances.roving_1?.counters?.mark).toBe(1);
    expect(action.payload).toMatchObject({
      fortRunGateActivityMarked: true,
      fortRunGateSourceCount: 1,
      targetServerLabel: "R&D",
    });
    expect(validateActivityGatedFortRun(host, "rd")).toMatchObject({
      runAllowed: true,
      sourceDefinitionId: "onr_v1_368_roving-submarine",
    });

    clearActivityGatedFortRunMarkers(host);
    expect(state.cardInstances.roving_1?.counters?.mark).toBe(0);
  });

  it("spends Paris City Grid trace-pool bits only for the active fort run", () => {
    const state = makeState();
    const host = hostFor(state);

    expect(fortTraceBitPoolSource(host)).toEqual({
      cardId: "paris_1",
      serverId: "rd",
    });
    expect(fortTraceBitPoolTotal(host)).toBe(3);
    expect(spendFortTraceBitPool(host, "paris_1", "rd", 2)).toBe(2);
    expect(state.cardInstances.paris_1?.counters?.bit).toBe(1);
    expect(() =>
      spendFortTraceBitPool(host, "paris_1", "hq", 1),
    ).toThrow(/Fort-Trace-Bit-Pool/);
  });

  it("applies post-break stealth loss through existing hosted-credit callbacks", () => {
    const state = makeState();
    const host = hostFor(state);
    const action = {
      side: "runner",
      type: "break_subroutine",
      source: "breaker_1",
      costs: [{ credits: 1 }],
      payload: { breakerId: "breaker_1" },
    } as unknown as LegalAction;

    applyPostBreakStealthLoss(host, "breaker_1" as CardInstanceId, action);

    expect(state.cardInstances.stealth_1?.counters?.recurring_credit).toBe(0);
    expect(action.payload).toMatchObject({
      postBreakStealthLoss: 2,
      v1922RunnerProgramAbility: "post_break_stealth_loss",
    });
  });
});
