import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction } from "./action-builders";
import {
  buildRunnerEndTurnAction,
  buildRunnerGainCreditAction,
  buildRunnerRemoveTagAction,
} from "./runner-basic-actions";
import { buildRunnerDrawCardActions } from "./runner-draw-actions";
import {
  buildRunnerMainActions,
  type RunnerMainActionGenerationHost,
} from "./runner-main-actions";

describe("runner main action generation", () => {
  it("returns only end turn when the Runner has no clicks", () => {
    const state = minimalRunnerMainState("arch-54-runner-no-clicks");
    state.runner.clicks = 0;

    const before = JSON.stringify(state);
    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "runner.end_turn",
    ]);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("keeps basic Runner main-action order stable", () => {
    const state = minimalRunnerMainState("arch-54-runner-basic-order");
    state.runner.clicks = 4;

    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "runner.gain_credit",
      "runner.draw_card",
      "runner.start_run.hq",
      "runner.start_run.rd",
      "runner.start_run.archives",
      "runner.end_turn",
    ]);
    expect(new Set(actions.map((candidate) => candidate.actionId)).size).toBe(
      actions.length,
    );
  });

  it("keeps tag removal before run actions when the Runner is tagged", () => {
    const state = minimalRunnerMainState("arch-54-runner-remove-tag");
    state.runner.clicks = 4;
    state.runner.tags = 1;
    state.runner.credits = 3;

    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "runner.gain_credit",
      "runner.draw_card",
      "runner.remove_tag",
      "runner.start_run.hq",
      "runner.start_run.rd",
      "runner.start_run.archives",
      "runner.end_turn",
    ]);
    expect(
      actions.find((candidate) => candidate.type === "remove_tag"),
    ).toMatchObject({
      costs: [{ clicks: 1, credits: 2 }],
    });
  });

  it("omits draw when the stack is empty", () => {
    const state = minimalRunnerMainState("arch-54-runner-empty-stack");
    state.runner.stack = [];

    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions.some((candidate) => candidate.type === "draw_card")).toBe(
      false,
    );
  });

  it("forces only the next data-fort run while a multi-server success sequence is pending", () => {
    const state = minimalRunnerMainState("pro013-pirate-forced-run");
    state.runner.clicks = 4;
    state.runner.credits = 5;
    state.runner.tags = 1;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      pendingSequences: [
        {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1",
          sourceDefinitionId: "onr_proteus_116_pirate-broadcast",
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["rd", "archives"],
          successfulServerIds: ["hq"],
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceOnSuccessfulRun: true,
          failOnUnsuccessfulRun: true,
        },
      ],
    } as NonNullable<GameState["runnerTurnFlags"]>;

    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "start_run",
      payload: {
        serverId: "rd",
        bonusRunNoClick: true,
        multiServerSuccessSequenceRun: true,
        bonusRunSource: "onr_proteus_116_pirate-broadcast",
      },
    });
    expect(actions[0]?.actionId).toBe("runner.start_run.rd");
  });

  it("offers only a deterministic sequence-failure action when the next data fort cannot be run", () => {
    const state = minimalRunnerMainState("pro013-pirate-forced-run-blocked");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      pendingSequences: [
        {
          kind: "multi_server_success_sequence",
          sequence: "run_each_data_fort",
          sourceCardId: "pirate_1",
          sourceDefinitionId: "onr_proteus_116_pirate-broadcast",
          sourceTitle: "Pirate Broadcast",
          pendingServerIds: ["remote_99"],
          successfulServerIds: ["hq"],
          onAllSuccessful: "gain_runner_event_agenda_point",
          onAnyUnsuccessful: "forgo_next_action",
          advanceOnSuccessfulRun: true,
          failOnUnsuccessfulRun: true,
        },
      ],
    } as NonNullable<GameState["runnerTurnFlags"]>;

    const actions = buildRunnerMainActions(testRunnerMainHost(state));

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "trigger_ability",
      payload: {
        runnerAbility: "multi_server_success_sequence_failed",
        multiServerSuccessSequenceFailed: true,
        actionDebtAdded: 1,
      },
    });
  });
});

function minimalRunnerMainState(seed: string): GameState {
  const state = createGame({ seed, setupMode: "completed" });
  state.activeSide = "runner";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.runner.tags = 0;
  state.runner.grip = [];
  state.runner.rig = { programs: [], hardware: [], resources: [] };
  state.corp.servers = state.corp.servers.filter((server) =>
    ["hq", "rd", "archives"].includes(server.id),
  );
  return state;
}

function testRunnerMainHost(state: GameState): RunnerMainActionGenerationHost {
  const unexpected = (name: string) => () => {
    throw new Error(`Unexpected runner main action host call: ${name}`);
  };

  return {
    state,
    actions: {
      buildLegalAction,
      buildRunnerEndTurnAction,
      buildRunnerGainCreditAction,
      buildRunnerRemoveTagAction,
      buildRunnerDrawCardActions,
      buildRunnerProgramInstallAction: unexpected("program install"),
      buildRunnerProgramTrashBeforeInstallAction: unexpected(
        "program trash before install",
      ),
      buildRunnerZetatechOverlayInstallAction: unexpected(
        "zetatech overlay install",
      ),
      buildRunnerHostedProgramInstallAction: unexpected(
        "hosted program install",
      ),
      buildRunnerAgendaPointInstallAction: unexpected("agenda point install"),
      buildRunnerHardwareInstallAction: unexpected("hardware install"),
      buildRunnerSelectedServerInstallAction: unexpected(
        "selected server install",
      ),
      buildRunnerResourceInstallAction: unexpected("resource install"),
      buildRunnerStackSearchProgramToGripAction: unexpected(
        "stack search program",
      ),
      buildRunnerValuPakInstallAction: unexpected("valu-pak install"),
      buildRunnerValuPakSequenceEndAction: unexpected("valu-pak end"),
      buildRunnerDelayedInstallSetAsideAction: unexpected(
        "shell traders set aside",
      ),
      buildRunnerDelayedInstallRemoveCounterAction: unexpected(
        "shell traders remove counter",
      ),
    },
    cards: {
      definitionFor: unexpected("definitionFor"),
      isUniqueCard: unexpected("isUniqueCard"),
      hasInstalledUniqueCardDefinition: unexpected(
        "hasInstalledUniqueCardDefinition",
      ),
    },
    runner: {
      ensureRunnerTurnFlags: () => state.runnerTurnFlags ?? {},
      availableRunnerTagRemovalCredits: () => state.runner.credits,
      availableRunnerProgramInstallCredits: () => state.runner.credits,
      runnerCostPenaltySupportCreditCapacity: () => 0,
      availableRunnerRunStartCredits: () => state.runner.credits,
      runnerDrawActionContext: () => ({
        drawTaxSourceCount: 0,
        projectedDrawCount: 1,
      }),
      runnerUtilityLongtailKindForCard: () => undefined,
      uniqueDirectLongtailImplementationForCard: () => undefined,
    },
    servers: {
      mustServer: unexpected("mustServer"),
      serverChoiceDisplayLabel: (_state: GameState, serverId: string) =>
        state.corp.servers.find((server) => server.id === serverId)?.label ??
        serverId,
    },
    run: {
      activeRunActionSpendingCapSourceIds: () => [],
      runDurationPaymentHost: () => ({}),
      isActivityGatedFortRunBlocked: () => false,
      fortRunSideFamiliesHostForState: () => ({}),
      runStartTaxForServerUpgrades: () => ({
        amount: 0,
        sourceDefinitionIds: [],
      }),
      runStartTaxForCorpRootAssets: () => ({
        amount: 0,
        sourceDefinitionIds: [],
      }),
    },
    install: {
      shouldOfferRunnerProgramTrashBeforeInstall: () => false,
      canOverlayProgramOnInstalledProgramHost: () => false,
      canHostProgramOnDaemon: () => false,
      cardImplementationAgendaPointInstallCost: () => 0,
      pickRunnerAgendaForAgendaPointCost: () => undefined,
      requiresDataFortInstallTarget: () => false,
    },
    memory: {
      runnerMemoryLimit: () => state.runner.memoryLimit,
    },
    counters: {
      cardCounter: () => 0,
      runnerTraceCounterEffectDefinitions: () => [],
      runnerCounterDisplayName: () => "",
    },
    hiddenZone: {
      exposedCorpCardInServer: () => undefined,
      topHostedProgramOnHardware: () => undefined,
      hostedProgramIdsOnHardware: () => [],
      topRunnerHeapCardId: () => undefined,
    },
    specialZones: {
      valuPakProgramInstallActionsRemaining: () => 0,
      runnerInstallableProgramIdsForValuPak: () => [],
      specialZoneHarnessActions: () => [],
      delayedInstallPrepareTargetIds: () => [],
      delayedInstallCounterCost: () => 0,
      delayedInstallPreparedTargetIds: () => [],
    },
    cardImplementation: {
      runtimeDeps: {},
      cardImplementationForDefinitionId: () => undefined,
      pushEndOfRunnerTurnActions: () => undefined,
      canPlayPrintedCostOnPlayImplementation: () => false,
      runnerEventResolver: () => undefined,
      printedCostMakeRunEffect: () => undefined,
      pushActivatedActions: () => undefined,
    },
    constants: {
      RUNNER_EVENT_RESOLVERS: {},
      STACK_SEARCH_PROGRAM_SOURCES: new Set(),
      SELF_MODIFYING_CODE_ID: "self_modifying_code",
      SHORT_CIRCUIT_RESOURCE_SOURCE: "short_circuit",
      AUJOURD_OUI_RESOURCE_SOURCE: "aujourd_oui",
      SERVER_EXPOSE_PROGRAM_SOURCES: new Set(),
      COUNTER_STACK_TOP_REVEAL_PROGRAM_SOURCE: "counter_stack_reveal",
      FAIT_ACCOMPLI_COUNTER_PROGRAM_ID: "fait_accompli",
      BOARDWALK_RANDOM_PROGRAM_SOURCE: "boardwalk",
      MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID: "microtech",
      QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_SOURCE: "quest_for_cattekin",
      STACK_TOP_REORDER_RESOURCE_SOURCE: "stack_top_reorder",
      JUNKYARD_BBS_ID: "junkyard_bbs",
      SHELL_TRADERS_ID: "shell_traders",
      DANSHIS_SECOND_ID: "danshis_second_id",
      BODYWEIGHT_DATA_CRECHE_ID: "bodyweight_data_creche",
      ALL_NIGHTER_ID: "all_nighter",
    },
  };
}
