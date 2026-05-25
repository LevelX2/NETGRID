import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
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
  resolveSpeedTrapRezInterruptChoice,
  runnerApproachIceExposeActions,
  runnerApproachIceExposeViewingActions,
  startSpeedTrapRezInterruptChoice,
  type EncounterEntryHost,
} from "./encounter-entry";

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
    zone: options.zone ?? { side: "corp", zone: "serverIce", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function definition(
  id: string,
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
    iceDefinitionId?: string;
    iceRezzed?: boolean;
    rootDefinitionId?: string;
    runnerProgramDefinitionId?: string;
    phase?: NonNullable<GameState["run"]>["phase"];
    timingPoint?: GameState["timingPoint"];
    activeSide?: GameState["activeSide"];
    positionKind?: "ice" | "server";
  } = {},
): GameState {
  const iceId = "ice_1" as CardInstanceId;
  const rootId = "root_1" as CardInstanceId;
  const programId = "program_1" as CardInstanceId;
  const rootDefinitionId = options.rootDefinitionId ?? "simple_upgrade";
  const runnerProgramDefinitionId = options.runnerProgramDefinitionId;
  const cardInstances: Record<CardInstanceId, CardInstance> = {
    [iceId]: instance(iceId, options.iceDefinitionId ?? "simple_ice", {
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
    simple_ice: definition("simple_ice"),
    simple_upgrade: definition("simple_upgrade", {
      title: "Simple Upgrade",
      type: "upgrade",
    }),
    "onr_v1_260_pocket-virtual-reality": definition(
      "onr_v1_260_pocket-virtual-reality",
      { title: "Pocket Virtual Reality" },
    ),
    "onr_v1_065_smarteye": definition("onr_v1_065_smarteye", {
      title: "Smarteye",
      side: "runner",
      type: "program",
    }),
    "onr_v1_067_speed-trap": definition("onr_v1_067_speed-trap", {
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
    rootRezEffects: Array<{ cardId: CardInstanceId; legalAction?: LegalAction }>;
  };
} {
  const definitions = definitionsFor(state);
  const calls: {
    finish: Array<{ successful: boolean; legalAction?: LegalAction }>;
    rootRezEffects: Array<{ cardId: CardInstanceId; legalAction?: LegalAction }>;
  } = { finish: [], rootRezEffects: [] };
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
      choices: {
        selectedChoiceIds: (selectedChoices) => {
          const raw = selectedChoices?.selectedOptionIds;
          return Array.isArray(raw)
            ? raw.filter((value): value is string => typeof value === "string")
            : [];
        },
      },
      callbacks: {
        finishRun: (successful, legalAction) => {
          calls.finish.push({
            successful,
            ...(legalAction ? { legalAction } : {}),
          });
          delete state.run;
        },
        resolveCorpRootRezEffect: (cardId, legalAction) => {
          calls.rootRezEffects.push({
            cardId,
            ...(legalAction ? { legalAction } : {}),
          });
          return true;
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

function choiceAction(selectedOptionId: string): PlayerAction {
  return {
    matchId: "match_1",
    side: "runner",
    actionId: "choice",
    clientKnownStateVersion: 8,
    selectedChoices: {
      choiceId: "choice",
      selectedOptionIds: [selectedOptionId],
    },
  };
}

describe("encounter entry", () => {
  it("initializes encounter state for the approached ICE", () => {
    const state = makeState({ iceDefinitionId: "simple_ice" });
    state.run!.nextEncounterNoBreakSubroutines = true;
    state.run!.nextEncounterJackOutLock = true;
    state.run!.nextEncounterFatalDamage = 2;
    const { host } = hostFor(state);

    const result = beginEncounter(host, "ice_1" as CardInstanceId);

    expect(result).toMatchObject({
      handled: true,
      encounterStarted: true,
      iceId: "ice_1",
      sourceDefinitionId: "simple_ice",
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
      nextEncounterFatalDamage: 0,
    });
    expect(state.timingPoint).toBe("run.encounter_ice");
    expect(state.activeSide).toBe("runner");
  });

  it("sets Pocket Virtual Reality encounter trace credits without running cleanup", () => {
    const state = makeState({
      iceDefinitionId: "onr_v1_260_pocket-virtual-reality",
    });
    const { host, calls } = hostFor(state);
    const legalAction = runnerAction(state);

    const result = beginEncounter(host, "ice_1" as CardInstanceId, legalAction);

    expect(result).toMatchObject({
      handled: true,
      temporaryTraceCredits: 4,
      sourceDefinitionId: "onr_v1_260_pocket-virtual-reality",
    });
    expect(state.run?.encounterTemporaryTraceCredits).toEqual({
      sourceIceId: "ice_1",
      sourceDefinitionId: "onr_v1_260_pocket-virtual-reality",
      remaining: 4,
      usableFor: "this_ice_printed_trace_subroutines",
    });
    expect(legalAction.payload).toMatchObject({
      temporaryTraceCredits: 4,
      temporaryTraceCreditsSourceDefinitionId:
        "onr_v1_260_pocket-virtual-reality",
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
      runnerProgramDefinitionId: "onr_v1_065_smarteye",
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
      publicRevealDefinitionId: "simple_ice",
      exposedCardDefinitionId: "simple_ice",
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

  it("opens and resolves Speed Trap root-rez interrupt through callbacks", () => {
    const state = makeState({
      runnerProgramDefinitionId: "onr_v1_067_speed-trap",
      positionKind: "server",
      timingPoint: "run.jack_out_window",
      activeSide: "corp",
    });
    const { host, calls } = hostFor(state);
    const legalAction = buildLegalAction(
      state,
      "corp",
      "rez_ice",
      "Rez",
      "root_1",
      [],
      { cardId: "root_1", rootRez: true },
    );

    const startResult = startSpeedTrapRezInterruptChoice(
      host,
      "root_1",
      legalAction,
    );

    expect(startResult).toMatchObject({
      handled: true,
      choiceOpened: true,
      sourceDefinitionId: "onr_v1_067_speed-trap",
      sourceCardId: "program_1",
    });
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("v1922.speed_trap:program_1:root_1"),
      kind: "select_option",
      visibility: "public",
    });
    expect(legalAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      sourceDefinitionId: "onr_v1_067_speed-trap",
      speedTrapSourceCardId: "program_1",
      rezzedCardDefinitionId: "simple_upgrade",
      serverLabel: "R&D",
      speedTrapChoiceOpened: true,
    });

    const resolveAction = buildLegalAction(
      state,
      "runner",
      "resolve_choice",
      "Resolve",
      "game_rule",
      [],
    );
    const result = resolveSpeedTrapRezInterruptChoice(
      host,
      resolveAction,
      choiceAction("jack_out"),
    );

    expect(result).toMatchObject({
      handled: true,
      runnerJackedOut: true,
      successfulRunWithoutAccess: true,
    });
    expect(calls.finish).toHaveLength(1);
    expect(calls.finish[0]?.successful).toBe(true);
    expect(calls.rootRezEffects).toEqual([]);
    expect(resolveAction.payload).toMatchObject({
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
      speedTrapUsed: true,
      successfulRunWithoutAccess: true,
      rezzedCardDefinitionId: "simple_upgrade",
    });
  });
});
