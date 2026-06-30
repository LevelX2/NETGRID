import {
  type CardDefinition,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type PlayerAction,
  type SubroutineDefinition,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { encounterResolutionHost } from "./encounter-resolution";
import {
  encounterPrintedNonTraceHost,
  resolveClassicDeflectorChoice,
  resolveDirectTrashProgramSubroutine,
  resolveEncounterPrintedNonTraceEffect,
  type EncounterPrintedNonTraceHost,
} from "./encounter-printed-nontrace-effects";

function definition(
  id: string,
  title: string,
  type: CardDefinition["type"],
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title,
    type,
    ...options,
  } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: zone.side,
    controller: zone.side,
    zone,
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    counters: options.counters,
    ...options,
  } as CardInstance;
}

function makeState(): GameState {
  return {
    stateVersion: 9,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter_ice",
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      identity: "runner_identity" as CardInstanceId,
      rig: {
        programs: ["cheap_program", "expensive_program"] as CardInstanceId[],
        hardware: [],
        resources: [],
      },
      heap: [],
      scoreArea: [],
    },
    corp: {
      credits: 4,
      hq: [],
      rd: ["rd_1", "rd_2"] as CardInstanceId[],
      archives: [],
      servers: [
        {
          id: "rd",
          kind: "rd",
          ice: ["ice_1" as CardInstanceId],
          root: [],
        },
        { id: "hq", kind: "hq", ice: [], root: [] },
        { id: "archives", kind: "archives", ice: [], root: [] },
      ],
    },
    cardInstances: {
      runner_identity: instance("runner_identity", "runner_identity", {
        side: "runner",
        zone: "rig",
      }),
      ice_1: instance("ice_1", "test_ice", {
        side: "corp",
        zone: "serverIce",
        serverId: "rd",
      }),
      cheap_program: instance("cheap_program", "cheap_program_def", {
        side: "runner",
        zone: "rig",
      }),
      expensive_program: instance("expensive_program", "expensive_program_def", {
        side: "runner",
        zone: "rig",
      }),
      rd_1: instance("rd_1", "rd_card_1", { side: "corp", zone: "rd" }),
      rd_2: instance("rd_2", "rd_card_2", { side: "corp", zone: "rd" }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIceId: "ice_1" as CardInstanceId,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
    },
  } as unknown as GameState;
}

function makeHost(
  state: GameState,
  options: {
    definitions?: Record<string, CardDefinition>;
    preventTrash?: boolean;
    runnerForgo?: () => void;
    revealCorpRdTop?: (legalAction: LegalAction) => void;
    startCorpRdArrangeChoice?: EncounterPrintedNonTraceHost["choices"]["startCorpRdArrangeChoice"];
  } = {},
): EncounterPrintedNonTraceHost {
  const definitions: Record<string, CardDefinition> = {
    test_ice: definition("test_ice", "Test ICE", "ice"),
    "onr_v1_250_ice-pick-willie": definition(
      "onr_v1_250_ice-pick-willie",
      "Ice Pick Willie",
      "ice",
    ),
    "onr_v1_272_too-many-doors": definition(
      "onr_v1_272_too-many-doors",
      "Secret Spend Compare",
      "ice",
    ),
    cheap_program_def: definition("cheap_program_def", "Cheap Program", "program", {
      installCost: 1,
      memoryCost: 2,
    }),
    expensive_program_def: definition(
      "expensive_program_def",
      "Expensive Program",
      "program",
      { installCost: 5, memoryCost: 1 },
    ),
    rd_card_1: definition("rd_card_1", "R&D Card 1", "operation"),
    rd_card_2: definition("rd_card_2", "R&D Card 2", "operation"),
    ...(options.definitions ?? {}),
  };
  const mustServer = (serverId: string) => {
    const server = state.corp.servers.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error(`missing server ${serverId}`);
    return server;
  };
  const definitionFor = (cardId: CardInstanceId): CardDefinition => {
    const instance = state.cardInstances[cardId];
    const found = instance ? definitions[instance.definitionId] : undefined;
    if (!found) throw new Error(`missing definition for ${cardId}`);
    return found;
  };
  return encounterPrintedNonTraceHost(state, {
    cards: { definitionFor },
    servers: {
      mustServer,
      publicServerLabel: (serverId) => String(serverId).toUpperCase(),
    },
    encounter: {
      resolutionHost: encounterResolutionHost(state, {
        applyRunnerForgoNextAction:
          options.runnerForgo ??
          (() => {
            state.runnerTurnFlags ??= {
              stoleAgendaThisTurn: false,
              stoleAgendaLastTurn: false,
            };
            state.runnerTurnFlags.forgoNextActionsPending =
              (state.runnerTurnFlags.forgoNextActionsPending ?? 0) + 1;
          }),
      }),
    },
    payment: {
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
    },
    trash: {
      openRunnerInstalledTrashPreventionWindow: (_targetIds, source) => {
        expect(source).toBe("trash_program_subroutine");
        return options.preventTrash ?? false;
      },
      trashRunnerInstalledProgram: (cardId) => {
        state.runner.rig.programs = state.runner.rig.programs.filter(
          (candidate) => candidate !== cardId,
        );
        state.runner.heap.push(cardId);
        state.cardInstances[cardId] = {
          ...state.cardInstances[cardId]!,
          zone: { side: "runner", zone: "heap" },
        };
      },
    },
    choices: {
      selectedChoiceIds: (selectedChoices) =>
        ((selectedChoices?.optionIds ?? []) as string[]),
      revealCorpRdTop:
        options.revealCorpRdTop ??
        ((legalAction) => {
          legalAction.payload = {
            ...(legalAction.payload ?? {}),
            hiddenZoneAction: "reveal_corp_rd_top",
          };
        }),
      startCorpRdArrangeChoice:
        options.startCorpRdArrangeChoice ??
        ((input) => {
          state.pendingChoice = {
            choiceId: "arrange_choice",
            side: "corp",
            source: `arrange:${input.sourceIceId}:${input.subroutineIndex}`,
            prompt: "Arrange",
            kind: "select_cards",
            options: [],
            minSelections: 1,
            maxSelections: 1,
            stateVersion: state.stateVersion + 1,
            visibility: "hidden_info_barrier",
          };
        }),
    },
    callbacks: {
      resetBreakerStrength: () => undefined,
    },
  });
}

describe("encounter printed non-trace effects boundary", () => {
  it("resolves direct end-run subroutines through the existing resolved-effect shape", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("test_ice", "Test ICE", "ice"),
      subroutine: { id: "end", type: "end_the_run" } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(result).toMatchObject({
      handled: true,
      runShouldEnd: true,
      sourceDefinitionId: "test_ice",
      iceId: "ice_1",
    });
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "test_ice",
        subroutineIndex: 0,
        subroutineType: "end_the_run",
        endedRun: true,
      }),
    ]);
  });

  it("schedules end-of-turn trash for printed Puzzle-style end-run subroutines", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;

    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("onr_classic_013_puzzle", "Puzzle", "ice"),
      subroutine: {
        id: "puzzle_etr_trash",
        type: "end_the_run_and_trash_source_at_end_of_turn",
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(result).toMatchObject({
      handled: true,
      runShouldEnd: true,
      sourceDefinitionId: "onr_classic_013_puzzle",
      iceId: "ice_1",
      stateChanged: true,
    });
    expect(state.runnerTurnFlags?.delayedCorpInstalledCardTrashAtTurnEndIds).toEqual([
      "ice_1",
    ]);
    expect(legalAction.payload).toMatchObject({
      delayedCorpInstalledCardTrashAtTurnEnd: true,
      delayedCorpInstalledCardTrashAtTurnEndId: "ice_1",
      sourceDefinitionId: "onr_classic_013_puzzle",
    });
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({
        kind: "resolve_subroutine",
        sourceDefinitionId: "onr_classic_013_puzzle",
        subroutineType: "end_the_run_and_trash_source_at_end_of_turn",
        endedRun: true,
      }),
    ]);
  });

  it("preserves pay-or-end-run resolved effects for paid and unpaid subroutines", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const paid = new Set([0]);

    const paidResult = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("test_ice", "Test ICE", "ice"),
      subroutine: {
        id: "pay",
        type: "end_the_run_unless_runner_pays",
        amount: 2,
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
      paidPayOrEndRunIndexes: paid,
    });
    const unpaidResult = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("test_ice", "Test ICE", "ice"),
      subroutine: {
        id: "unpaid",
        type: "end_the_run_unless_runner_pays",
        amount: 3,
      } as SubroutineDefinition,
      subroutineIndex: 1,
      legalAction,
      paidPayOrEndRunIndexes: paid,
    });

    expect(paidResult).toMatchObject({ handled: true, runShouldEnd: false });
    expect(unpaidResult).toMatchObject({ handled: true, runShouldEnd: true });
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({ subroutineIndex: 0, paidCredits: 2 }),
      expect.objectContaining({
        subroutineIndex: 1,
        paidCredits: 0,
        endedRun: true,
      }),
    ]);
  });

  it("trashes the deterministic installed program target and keeps payload metadata stable", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("test_ice", "Test ICE", "ice"),
      subroutine: {
        id: "trash_program",
        type: "trash_installed_program",
      } as SubroutineDefinition,
      subroutineIndex: 1,
      legalAction,
    });

    expect(result).toMatchObject({
      handled: true,
      trashedCardIds: ["expensive_program"],
    });
    expect(state.runner.rig.programs).toEqual(["cheap_program"]);
    expect(state.runner.heap).toEqual(["expensive_program"]);
    expect(legalAction.payload).toMatchObject({
      trashedCardDefinitionId: "expensive_program_def",
      trashedCardType: "program",
      trashedCount: 1,
    });
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({
        subroutineType: "trash_installed_program",
        cardDefinitionId: "expensive_program_def",
        cardTitle: "Expensive Program",
        cardsTrashed: 1,
      }),
    ]);
  });

  it("uses the same trash-prevention source without leaking hidden target metadata", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveDirectTrashProgramSubroutine(
      makeHost(state, { preventTrash: true }),
      {
        definition: definition("test_ice", "Test ICE", "ice"),
        subroutine: {
          id: "trash_program",
          type: "trash_installed_program",
        } as SubroutineDefinition,
        subroutineIndex: 1,
        legalAction,
      },
    );

    expect(result).toMatchObject({
      handled: true,
      trashedCardIds: [],
      programTrashPreventionWindowOpened: true,
    });
    expect(state.runner.rig.programs).toEqual([
      "cheap_program",
      "expensive_program",
    ]);
    expect(legalAction.payload).toEqual({});
    expect(legalAction.resolvedEffects).toEqual([
      expect.objectContaining({
        subroutineType: "trash_installed_program",
        cardsTrashed: 0,
      }),
    ]);
  });

  it("delegates direct action-forgo markers through the encounter-resolution callback", () => {
    const state = makeState();
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("test_ice", "Test ICE", "ice"),
      subroutine: {
        id: "forgo",
        type: "set_runner_forgo_next_action",
      } as SubroutineDefinition,
      subroutineIndex: 0,
    });

    expect(result).toMatchObject({
      handled: true,
      runnerForgoNextActions: 1,
    });
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);
  });

  it("applies Haunting-style cannot-run lock with the existing payload values", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("haunting", "Haunting Inquisition", "ice"),
      subroutine: {
        id: "run_lock",
        type: "set_runner_run_lock_actions",
        amount: 6,
      } as SubroutineDefinition,
      subroutineIndex: 1,
      legalAction,
    });

    expect(result).toMatchObject({
      handled: true,
      cannotRunUntilActionsSpent: 6,
    });
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(6);
    expect(legalAction.payload).toMatchObject({
      v1922CorpIceAbility: "direct_run_lock",
      runLockActionsAdded: 6,
      runLockActionsPending: 6,
      sourceDefinitionId: "haunting",
    });
  });

  it("keeps next-ICE cannot-break and cannot-jack-out markers in encounter-resolution", () => {
    const state = makeState();
    const noBreak = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("shock", "Shock.r", "ice"),
      subroutine: {
        id: "next_no_break",
        type: "set_next_encounter_no_break_subroutines",
      } as SubroutineDefinition,
      subroutineIndex: 0,
    });
    const lock = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("shock", "Shock.r", "ice"),
      subroutine: {
        id: "next_lock",
        type: "set_next_encounter_lock",
      } as SubroutineDefinition,
      subroutineIndex: 1,
    });

    expect(noBreak).toMatchObject({
      handled: true,
      nextIceCannotBreak: true,
      setRunMarkers: ["nextEncounterNoBreakSubroutines"],
    });
    expect(lock).toMatchObject({
      handled: true,
      nextIceCannotBreak: true,
      cannotJackOutUntilAfterEncounter: true,
      setRunMarkers: [
        "nextEncounterNoBreakSubroutines",
        "nextEncounterJackOutLock",
      ],
    });
    expect(state.run?.nextEncounterNoBreakSubroutines).toBe(true);
    expect(state.run?.nextEncounterJackOutLock).toBe(true);
  });

  it("opens the existing R&D reorder choice with stable source context", () => {
    const state = makeState();
    state.cardInstances.ice_1 = {
      ...state.cardInstances.ice_1!,
      definitionId: "onr_v1_272_too-many-doors",
    };
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition(
        "onr_v1_272_too-many-doors",
        "Secret Spend Compare",
        "ice",
      ),
      subroutine: {
        id: "reorder",
        type: "reorder_corp_rd_top2",
      } as SubroutineDefinition,
      subroutineIndex: 2,
      legalAction,
    });

    expect(result).toMatchObject({ handled: true, suspended: true });
    expect(state.pendingChoice).toMatchObject({
      source: "arrange:ice_1:2",
      visibility: "hidden_info_barrier",
    });
    expect(state.run?.resolvedSubroutineIndexes).toEqual([2]);
  });

  it("redirects a fixed Deflector target to the outermost rezzed ICE", () => {
    const state = makeState();
    state.corp.servers.find((server) => server.id === "archives")!.ice = [
      "archives_inner" as CardInstanceId,
      "archives_outer" as CardInstanceId,
    ];
    state.cardInstances.archives_inner = instance(
      "archives_inner",
      "archives_ice",
      { side: "corp", zone: "serverIce", serverId: "archives" },
      { rezzed: false, faceup: false },
    );
    state.cardInstances.archives_outer = instance(
      "archives_outer",
      "archives_ice",
      { side: "corp", zone: "serverIce", serverId: "archives" },
      { rezzed: true, faceup: true },
    );
    const legalAction = { payload: {} } as LegalAction;

    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("onr_classic_009_dumpster", "Dumpster", "ice"),
      subroutine: {
        id: "dumpster_deflect",
        type: "deflect_run",
        deflectorTarget: "archives",
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(result).toMatchObject({ handled: true, runRedirected: true });
    expect(state.run).toMatchObject({
      attackedServerId: "archives",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "archives", iceIndex: 1 },
      encounteredIceId: "archives_outer",
      jackOutLockedUntilEncounterEnds: true,
    });
    expect(legalAction.payload).toMatchObject({
      classicDeflector: true,
      deflectedRun: true,
      redirectedServerId: "archives",
      redirectedToIceId: "archives_outer",
      redirectedToRezzedIce: true,
    });
  });

  it("moves a Deflector target with no rezzed ICE to the server jack-out window", () => {
    const state = makeState();
    state.corp.servers.find((server) => server.id === "archives")!.ice = [
      "archives_inner" as CardInstanceId,
    ];
    state.cardInstances.archives_inner = instance(
      "archives_inner",
      "archives_ice",
      { side: "corp", zone: "serverIce", serverId: "archives" },
      { rezzed: false, faceup: false },
    );
    const legalAction = { payload: {} } as LegalAction;

    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("onr_classic_009_dumpster", "Dumpster", "ice"),
      subroutine: {
        id: "dumpster_deflect",
        type: "deflect_run",
        deflectorTarget: "archives",
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(result).toMatchObject({ handled: true, runRedirected: true });
    expect(state.timingPoint).toBe("run.jack_out_window");
    expect(state.run).toMatchObject({
      attackedServerId: "archives",
      phase: "movement",
      position: { kind: "server", serverId: "archives" },
      lastPassedIceId: "archives_inner",
    });
    expect(state.run?.encounteredIceId).toBeUndefined();
    expect(legalAction.payload).toMatchObject({
      redirectedToRezzedIce: false,
      lastPassedIceId: "archives_inner",
    });
  });

  it("opens and resolves a paid Deflector target choice", () => {
    const state = makeState();
    state.cardInstances.ice_1!.definitionId = "onr_classic_010_entrapment";
    const entrapmentDefinition = definition(
      "onr_classic_010_entrapment",
      "Entrapment",
      "ice",
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: ["remote_outer" as CardInstanceId],
      root: [],
    });
    state.cardInstances.remote_outer = instance(
      "remote_outer",
      "remote_ice",
      { side: "corp", zone: "serverIce", serverId: "remote_1" },
      { rezzed: true, faceup: true },
    );
    const legalAction = { payload: {} } as LegalAction;
    const host = makeHost(state, {
      definitions: { [entrapmentDefinition.id]: entrapmentDefinition },
    });

    const opened = resolveEncounterPrintedNonTraceEffect(host, {
      definition: entrapmentDefinition,
      subroutine: {
        id: "entrapment_deflect",
        type: "deflect_run",
        deflectorTarget: "any_data_fort",
        deflectorCost: 2,
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(opened).toMatchObject({ handled: true, suspended: true });
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });

    resolveClassicDeflectorChoice(
      host,
      { payload: {} } as LegalAction,
      {
        matchId: "match_1",
        side: "corp",
        actionId: "choice",
        clientKnownStateVersion: 10,
        selectedChoices: { optionIds: ["server_remote_1"] },
      } as PlayerAction,
    );

    expect(state.corp.credits).toBe(2);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.run).toMatchObject({
      attackedServerId: "remote_1",
      phase: "encounter_ice",
      encounteredIceId: "remote_outer",
      jackOutLockedUntilEncounterEnds: true,
    });
  });

  it("auto-breaks Trapdoor-style Deflectors when there are no subsidiary data forts", () => {
    const state = makeState();
    const legalAction = { payload: {} } as LegalAction;
    const result = resolveEncounterPrintedNonTraceEffect(makeHost(state), {
      definition: definition("onr_classic_014_trapdoor", "Trapdoor", "ice"),
      subroutine: {
        id: "trapdoor_deflect",
        type: "deflect_run",
        deflectorTarget: "subsidiary_data_fort",
        deflectorAutoBreakIfNoTarget: true,
      } as SubroutineDefinition,
      subroutineIndex: 0,
      legalAction,
    });

    expect(result).toMatchObject({ handled: true, stateChanged: false });
    expect(state.pendingChoice).toBeUndefined();
    expect(state.run?.resolvedSubroutineIndexes).toEqual([0]);
    expect(legalAction.payload).toMatchObject({
      classicDeflector: true,
      deflectedRun: false,
      deflectorAutoBroken: true,
    });
  });
});
