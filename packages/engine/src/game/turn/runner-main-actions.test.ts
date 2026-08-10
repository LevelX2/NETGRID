import type { CardInstanceId, GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
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

  it.each([
    ["actions", { runLockActionsPending: 2 }],
    ["credits", { runnerRunLockCreditCost: 3 }],
  ])(
    "omits basic, bonus, and event runs while the %s lock is open",
    (_kind, lock) => {
      const state = minimalRunnerMainState(`runner-run-lock-${_kind}`);
      const eventCardId = "locked_run_event" as CardInstanceId;
      state.runner.grip = [eventCardId];
      state.runnerTurnFlags = {
        ...(state.runnerTurnFlags ?? {}),
        bonusRunPending: true,
        ...lock,
      } as NonNullable<GameState["runnerTurnFlags"]>;
      state.cardInstances[eventCardId] = {
        id: eventCardId,
        instanceId: eventCardId,
        definitionId: "locked_run_event",
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "grip" },
        faceup: false,
        rezzed: false,
        advancementCounters: 0,
        strengthModifier: 0,
      } as never;
      const host = testRunnerMainHost(state);
      host.cards.definitionFor = () =>
        ({
          id: "locked_run_event",
          title: "Locked Run Event",
          side: "runner",
          type: "event",
          cost: 0,
          playCost: { kind: "fixed", credits: 0 },
        }) as never;
      host.cards.isUniqueCard = () => false;
      host.cards.hasInstalledUniqueCardDefinition = () => false;
      host.constants.RUNNER_EVENT_RESOLVERS = {
        locked_run_event: {
          name: "locked_run_event",
          startsRun: true,
          requiresServer: true,
          resolve: () => undefined,
        },
      };

      const actions = buildRunnerMainActions(host);

      expect(actions.some((candidate) => candidate.type === "start_run")).toBe(
        false,
      );
      expect(actions.some((candidate) => candidate.type === "play_event")).toBe(
        false,
      );
    },
  );

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
    expect(actions[0]?.actionId).toBe(
      "runner.start_run.rd.bonus_run.onr_proteus_116_pirate-broadcast",
    );
  });

  it("gives the immediate Bodyweight decision priority over normal actions and pending run sequences", () => {
    const state = minimalRunnerMainState("bodyweight-immediate-window");
    const sourceCardId = "bodyweight_1" as CardInstanceId;
    state.runner.rig.hardware = [sourceCardId];
    state.cardInstances[sourceCardId] = {
      id: sourceCardId,
      instanceId: sourceCardId,
      definitionId: "bodyweight_data_creche",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    } as never;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      bonusRunPending: true,
      successfulRunExtraRunPending: true,
      successfulRunExtraRunUsedThisTurn: false,
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
    const host = testRunnerMainHost(state);
    host.cards.definitionFor = (_state, cardId) => {
      if (cardId !== sourceCardId)
        throw new Error(`Unexpected card: ${cardId}`);
      return {
        id: "bodyweight_data_creche",
        title: "Bodyweight Data Crèche",
        side: "runner",
        type: "hardware",
      } as never;
    };
    host.cardImplementation.cardImplementationForDefinitionId = (
      definitionId,
    ) =>
      definitionId === "bodyweight_data_creche"
        ? {
            successfulRunFollowups: [
              { kind: "optional_make_run_after_successful_run" },
            ],
          }
        : undefined;

    const actions = buildRunnerMainActions(host);

    expect(actions).toHaveLength(4);
    expect(
      actions.filter((candidate) => candidate.type === "start_run"),
    ).toHaveLength(3);
    expect(
      actions.every(
        (candidate) =>
          (candidate.type === "start_run" &&
            candidate.payload?.bonusRunNoClick === true &&
            candidate.payload?.bonusRunSource === "bodyweight_data_creche" &&
            candidate.payload?.multiServerSuccessSequenceRun !== true) ||
          (candidate.type === "trigger_ability" &&
            candidate.payload?.runnerAbility ===
              "decline_successful_run_extra_run"),
      ),
    ).toBe(true);
  });

  it("offers a generic immediate decline for an optional bonus run and preserves normal actions after it", () => {
    const state = minimalRunnerMainState("optional-bonus-run-decline-window");
    const sourceCardId = "all_nighter_1" as CardInstanceId;
    state.runner.heap = [sourceCardId];
    state.cardInstances[sourceCardId] = {
      id: sourceCardId,
      instanceId: sourceCardId,
      definitionId: "all_nighter",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    } as never;
    state.runner.clicks = 3;
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      bonusRunPending: true,
    } as NonNullable<GameState["runnerTurnFlags"]>;

    const host = testRunnerMainHost(state);
    host.cards.definitionFor = (_state, cardId) => {
      if (cardId !== sourceCardId)
        throw new Error(`Unexpected card: ${cardId}`);
      return {
        id: "all_nighter",
        title: "All-Nighter",
        side: "runner",
        type: "event",
      } as never;
    };
    host.cardImplementation.cardImplementationForDefinitionId = (definitionId) =>
      definitionId === "all_nighter"
        ? {
            abilities: [
              {
                kind: "on_play",
                effects: [
                  { kind: "make_run", followupRunOnEnd: "optional" },
                ],
              },
            ],
          }
        : undefined;

    const actions = buildRunnerMainActions(host);

    expect(actions.every((candidate) => candidate.type !== "gain_credit")).toBe(
      true,
    );
    expect(actions.filter((candidate) => candidate.type === "start_run")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            bonusRunNoClick: true,
            optionalBonusRun: true,
          }),
        }),
      ]),
    );
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: "trigger_ability",
        payload: expect.objectContaining({
          runnerAbility: "decline_optional_bonus_run",
        }),
      }),
    );
  });

  it("requires two clicks for Classic double prep events", () => {
    const eventCardId = "classic_networking_1" as CardInstanceId;
    const state = minimalRunnerMainState("classic-03-runner-double-prep");
    state.runner.grip = [eventCardId];
    state.cardInstances[eventCardId] = {
      id: eventCardId,
      instanceId: eventCardId,
      definitionId: "onr_classic_041_networking",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    } as never;
    const host = testRunnerMainHost(state);
    host.cards.definitionFor = () =>
      ({
        id: "onr_classic_041_networking",
        title: "Networking",
        side: "runner",
        type: "event",
        cost: 0,
        playCost: { kind: "fixed", credits: 0 },
      }) as never;
    host.cards.isUniqueCard = () => false;
    host.cards.hasInstalledUniqueCardDefinition = () => false;
    host.cardImplementation.cardImplementationForDefinitionId = (
      definitionId,
    ) => cardImplementationForDefinitionId(definitionId);
    host.cardImplementation.canPlayPrintedCostOnPlayImplementation = () => true;

    state.runner.clicks = 1;
    expect(
      buildRunnerMainActions(host).some(
        (candidate) =>
          candidate.type === "play_event" &&
          candidate.payload?.cardId === eventCardId,
      ),
    ).toBe(false);

    state.runner.clicks = 2;
    const action = buildRunnerMainActions(host).find(
      (candidate) =>
        candidate.type === "play_event" &&
        candidate.payload?.cardId === eventCardId,
    );

    expect(action?.costs).toEqual([{ clicks: 2, credits: 0 }]);
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
      buildRunnerHostedProgramInstallAction: unexpected(
        "hosted program install",
      ),
      buildRunnerAgendaPointInstallAction: unexpected("agenda point install"),
      buildRunnerHardwareInstallAction: unexpected("hardware install"),
      buildRunnerSelectedServerInstallAction: unexpected(
        "selected server install",
      ),
      buildRunnerResourceInstallAction: unexpected("resource install"),
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
    },
  };
}
