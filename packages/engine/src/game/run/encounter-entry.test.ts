import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import {
  approachIceExposeCanBeOfferedForCurrentIce,
  beginEncounter,
  continueAfterCorpRootRezIfWindowIsComplete,
  isApproachIceExposeViewingWindowOpen,
  isApproachIceExposeWindowOpen,
  resolveApproachIceExposeAbility,
  resolveApproachIceExposeViewingDecision,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  type EncounterEntryHost,
} from "./encounter-entry";

function instance(
  id: string,
  definitionId: number,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverIce", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(
  id: number,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: options.title ?? id,
    side: options.side ?? "corp",
    type: options.type ?? "ice",
    ...options,
  } as CardDefinition;
}

function makeState(
  options: {
    iceDefinitionId?: number;
    iceRezzed?: boolean;
    rootDefinitionId?: number;
    runnerProgramDefinitionId?: number;
    phase?: NonNullable<GameState["run"]>["phase"];
    timingPoint?: GameState["timingPoint"];
    activeSide?: GameState["activeSide"];
    positionKind?: "ice" | "server";
  } = {},
): GameState {
  const iceId = "ice_1" as CardInstanceId;
  const rootId = "root_1" as CardInstanceId;
  const programId = "program_1" as CardInstanceId;
  const rootDefinitionId = options.rootDefinitionId ?? 606;
  const runnerProgramDefinitionId = options.runnerProgramDefinitionId;
  const cardInstances: Record<CardInstanceId, CardInstance> = {
    [iceId]: instance(iceId, options.iceDefinitionId ?? 2394377751, {
      rezzed: options.iceRezzed ?? true,
    }),
    [rootId]: instance(rootId, rootDefinitionId, {
      zone: { side: "corp", zone: "serverRoot", serverId: "rd" },
      rezzed: true,
    }),
  };
  const runnerPrograms: CardInstanceId[] = [];
  if (runnerProgramDefinitionId) {
    runnerPrograms.push(programId);
    cardInstances[programId] = instance(programId, runnerProgramDefinitionId, {
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      rezzed: true,
    });
  }
  return {
    stateVersion: 8,
    activeSide: options.activeSide ?? "runner",
    phase: "run",
    timingPoint: options.timingPoint ?? "run.approach_ice",
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
      rig: { programs: runnerPrograms, hardware: [], resources: [] },
    },
    corp: {
      credits: 5,
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
          ice: [iceId],
          root: [rootId],
        },
      ],
    },
    cardInstances,
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: options.phase ?? "approach_ice",
      position:
        options.positionKind === "server"
          ? { kind: "server", serverId: "rd" }
          : { kind: "ice", serverId: "rd", iceIndex: 0 },
      approachedIceId: iceId,
      brokenSubroutineIndexes: [1],
      resolvedSubroutineIndexes: [2],
      traceSuccessBySubroutineIndex: { 0: true },
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definitionsFor(state: GameState): Record<string, CardDefinition> {
  const definitions: Record<string, CardDefinition> = {
    2394377751: definition(2394377751),
    3585206199: definition(3585206199, { subtypes: ["sentry"] }),
    simple_upgrade: definition(606, {
      title: "Simple Upgrade",
      type: "upgrade",
    }),
    472: definition(472, { title: "Pocket Virtual Reality" }),
    onr_v1_065_smarteye: definition(277, {
      title: "Smarteye",
      side: "runner",
      type: "program",
    }),
    279: definition(279, {
      title: "Speed Trap",
      side: "runner",
      type: "program",
    }),
  };
  for (const card of Object.values(state.cardInstances)) {
    definitions[card.definitionId] ??= definition(card.definitionId);
  }
  return definitions;
}

function hostFor(
  state: GameState,
  options: { rootRezActionsAvailable?: boolean } = {},
): {
  host: EncounterEntryHost;
  calls: {
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
  };
} {
  const definitions = definitionsFor(state);
  const calls: {
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
  } = { finish: [] };
  return {
    calls,
    host: {
      state,
      cards: {
        definitionFor: (cardId) =>
          definitions[state.cardInstances[cardId]!.definitionId]!,
        cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
        runnerInstalledCardIds: () => [
          ...state.runner.rig.programs,
          ...state.runner.rig.hardware,
          ...state.runner.rig.resources,
        ],
        effectiveSubtypesForCard: (_cardId, definition) =>
          definition.subtypes ?? [],
      },
      servers: {
        mustServer: (serverId) => {
          const server = state.corp.servers.find(
            (candidate) => candidate.id === serverId,
          );
          if (!server) throw new Error(`Server fehlt: ${serverId}`);
          return server as CorpServer;
        },
        publicServerLabel: () => "R&D",
      },
      run: {
        corpRootRezActionsAvailable: () =>
          options.rootRezActionsAvailable ?? false,
      },
      callbacks: {
        finishRun: (successful, legalAction) => {
          calls.finish.push({
            successful,
            ...(legalAction ? { legalAction } : {}),
          });
          delete state.run;
        },
      },
    },
  };
}

function runnerAction(
  state: GameState,
  payload?: LegalAction["payload"],
): LegalAction {
  return buildLegalAction(
    state,
    "runner",
    "trigger_ability",
    "trigger_ability",
    "program_1",
    [],
    payload,
  );
}

describe("encounter entry", () => {
  it("initializes encounter state for the approached ICE", () => {
    const state = makeState({ iceDefinitionId: 2394377751 });
    state.run!.nextEncounterNoBreakSubroutines = true;
    state.run!.nextEncounterJackOutLock = true;
    state.run!.nextEncounterFatalDamage = 2;
    state.run!.nextEncounterFatalDamageSourceDefinitionId = 2126181695;
    const { host } = hostFor(state);

    const result = beginEncounter(host, "ice_1" as CardInstanceId);

    expect(result).toMatchObject({
      handled: true,
      encounterStarted: true,
      iceId: "ice_1",
      sourceDefinitionId: 2394377751,
    });
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: "ice_1",
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      traceSuccessBySubroutineIndex: {},
      noBreakSubroutinesActive: true,
      jackOutLockedUntilEncounterEnds: true,
      fatalDamageActiveForEncounter: true,
      fatalDamageAmountForEncounter: 2,
      fatalDamageSourceDefinitionId: 2126181695,
      nextEncounterFatalDamage: 0,
    });
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
  });

  it("consumes Social Engineering only after entering the chosen ICE encounter", () => {
    const state = makeState({ iceDefinitionId: 2394377751 });
    state.run!.secretSpendGuessRunAutoPassIceId = "ice_1" as CardInstanceId;
    const { host } = hostFor(state);
    const firstAction = runnerAction(state);

    const first = beginEncounter(host, "ice_1" as CardInstanceId, firstAction);

    expect(first).toMatchObject({
      handled: true,
      encounterStarted: true,
      iceId: "ice_1",
    });
    expect(state.run).toMatchObject({
      phase: "encounter_ice",
      encounteredIceId: "ice_1",
    });
    expect(state.run?.secretSpendGuessRunAutoPassIceId).toBeUndefined();
    expect(firstAction.payload).toMatchObject({
      autoPassChosenIce: true,
      secretSpendGuessRunAutoPassedIce: true,
      targetCardDefinitionId: 2394377751,
    });

    state.run!.phase = "approach_ice";
    state.timingPoint = "run.approach_ice";
    const secondAction = runnerAction(state);
    const second = beginEncounter(
      host,
      "ice_1" as CardInstanceId,
      secondAction,
    );

    expect(second).toMatchObject({ handled: true, encounterStarted: true });
    expect(secondAction.payload).not.toMatchObject({
      secretSpendGuessRunAutoPassedIce: true,
    });
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
  });

  it("attaches a paid run-wide encounter tax and its public ICE target to the entry action", () => {
    const state = makeState({ iceDefinitionId: 2394377751 });
    state.run!.encounterTaxForFutureIce = 2;
    state.run!.encounterTaxSourceDefinitionId = "tax_source" as never;
    const { host, calls } = hostFor(state);
    const legalAction = runnerAction(state);

    const result = beginEncounter(host, "ice_1" as CardInstanceId, legalAction);

    expect(result).toMatchObject({
      handled: true,
      encounterStarted: true,
      sourceDefinitionId: 2394377751,
    });
    expect(state.runner.credits).toBe(3);
    expect(legalAction.payload).toMatchObject({
      encounterTaxForFutureIce: 2,
      encounterTaxPaid: 2,
      encounterTaxSource: "tax_source",
      targetIceDefinitionId: 2394377751,
    });
    expect(calls.finish).toEqual([]);
  });

  it("binds pending next-sentry free breaks only to the next encountered ICE", () => {
    const sentryState = makeState({ iceDefinitionId: 3585206199 });
    sentryState.run!.breakerState = {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [
        {
          sourceBreakerInstanceId: "bulldozer",
          sourceAbilityId:
            "140:break_wall_with_stealth_tradeoff_and_sentry_reward",
          iceSubtype: "sentry",
          remainingUses: 1,
          mustBeNextEncounteredIce: true,
        },
      ],
    };
    beginEncounter(hostFor(sentryState).host, "ice_1" as CardInstanceId);
    expect(
      sentryState.run?.breakerState?.pendingFreeBreaks[0]?.targetIceId,
    ).toBe("ice_1");

    const nonSentryState = makeState({ iceDefinitionId: 2394377751 });
    nonSentryState.run!.breakerState = {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [
        {
          sourceBreakerInstanceId: "bulldozer",
          sourceAbilityId:
            "140:break_wall_with_stealth_tradeoff_and_sentry_reward",
          iceSubtype: "sentry",
          remainingUses: 1,
          mustBeNextEncounteredIce: true,
        },
      ],
    };
    beginEncounter(hostFor(nonSentryState).host, "ice_1" as CardInstanceId);
    expect(nonSentryState.run?.breakerState?.pendingFreeBreaks).toEqual([]);

    const laterSentryState = makeState({ iceDefinitionId: 3585206199 });
    laterSentryState.run!.breakerState = {
      strengthModifiersByBreakerInstanceId: {},
      brokenSubroutineCountByBreakerInstanceId: {},
      pendingFreeBreaks: [
        {
          sourceBreakerInstanceId: "bulldozer",
          sourceAbilityId:
            "140:break_wall_with_stealth_tradeoff_and_sentry_reward",
          iceSubtype: "sentry",
          remainingUses: 1,
          mustBeNextEncounteredIce: true,
          targetIceId: "old_sentry",
        },
      ],
    };
    beginEncounter(hostFor(laterSentryState).host, "ice_1" as CardInstanceId);
    expect(laterSentryState.run?.breakerState?.pendingFreeBreaks).toEqual([]);
  });

  it("sets Pocket Virtual Reality encounter trace credits without running cleanup", () => {
    const state = makeState({
      iceDefinitionId: 472,
    });
    const { host, calls } = hostFor(state);
    const legalAction = runnerAction(state);

    const result = beginEncounter(host, "ice_1" as CardInstanceId, legalAction);

    expect(result).toMatchObject({
      handled: true,
      temporaryTraceCredits: 4,
      sourceDefinitionId: 472,
    });
    expect(state.run?.encounterTemporaryTraceCredits).toEqual({
      sourceIceId: "ice_1",
      sourceDefinitionId: 472,
      remaining: 4,
      usableFor: "this_ice_printed_trace_subroutines",
    });
    expect(legalAction.payload).toMatchObject({
      temporaryTraceCredits: 4,
      temporaryTraceCreditsSourceDefinitionId: 472,
    });
    expect(calls.finish).toEqual([]);
  });

  it("keeps the approach open while root rez actions or expose windows remain", () => {
    const state = makeState({ iceRezzed: true });
    const guarded = hostFor(state, { rootRezActionsAvailable: true });

    expect(
      continueAfterCorpRootRezIfWindowIsComplete(guarded.host).handled,
    ).toBe(false);
    expect(state.timingPoint).toBe("run.approach_ice");

    const open = hostFor(state, { rootRezActionsAvailable: false });
    const result = continueAfterCorpRootRezIfWindowIsComplete(open.host);

    expect(result).toMatchObject({ handled: true, encounterStarted: true });
    expect(state.timingPoint).toBe("run.encounter_ice");
  });

  it("builds and resolves Smarteye approach-expose without leaking extra state", () => {
    const state = makeState({
      iceRezzed: false,
      runnerProgramDefinitionId: 277,
    });
    const { host } = hostFor(state);

    expect(approachIceExposeCanBeOfferedForCurrentIce(host)).toBe(true);
    expect(isApproachIceExposeWindowOpen(host)).toBe(true);
    const actions = runnerApproachIceExposeActions(host);
    expect(actions.map((action) => action.payload)).toEqual([
      expect.objectContaining({
        cardId: "program_1",
        iceId: "ice_1",
        approachIceExposeDecision: "expose",
      }),
      expect.objectContaining({
        cardId: "program_1",
        iceId: "ice_1",
        approachIceExposeDecision: "decline",
      }),
    ]);

    resolveApproachIceExposeAbility(host, actions[0]!);

    expect(state.run?.approachIceExposeViewingIceId).toBe("ice_1");
    expect(state.run?.approachIceExposeViewingSourceCardId).toBe("program_1");
    expect(actions[0]!.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose",
      publicRevealKind: "expose",
      publicRevealDefinitionId: 2394377751,
      exposedCardDefinitionId: 2394377751,
    });
    expect(JSON.stringify(actions[0]!.payload)).not.toMatch(
      /"cardInstances"|"hq"|"rd"|"grip"/,
    );
    expect(isApproachIceExposeViewingWindowOpen(host)).toBe(true);

    const finishAction = runnerApproachIceExposeViewingActions(host)[0]!;
    resolveApproachIceExposeViewingDecision(host, finishAction);
    expect(state.run?.approachIceExposeViewingIceId).toBeUndefined();
    expect(finishAction.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "approach_ice_expose_finish",
    });
    expect(state.activeSide).toBe("corp");
  });
});
