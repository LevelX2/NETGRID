import type { GameState, LegalAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { buildLegalAction, makeActionId } from "./action-builders";
import {
  buildCorpDrawAction,
  buildCorpEndTurnAction,
  buildCorpGainCreditAction,
  buildCorpPurgeVirusAction,
} from "./corp-basic-actions";
import {
  buildCorpMainActions,
  type CorpMainActionGenerationHost,
} from "./corp-main-actions";
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
import {
  createMainActionHostComposition,
  type MainActionHostCompositionHost,
} from "./main-action-hosts";

describe("main-action-hosts", () => {
  it("does not import from index or contain public/player-view wiring", () => {
    const source = readFileSync(
      new URL("./main-action-hosts.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("PlayerView");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("randomPurpose");
  });

  it("creates a Corp main-action host without changing basic action order", () => {
    const state = minimalCorpMainState("arch-95-corp-main-host");
    state.corp.clicks = 3;
    state.corp.rd = [];
    state.corp.credits = 5;

    const composition = createMainActionHostComposition(hostFor(state));
    const actions = buildCorpMainActions(
      composition.corpMainActionGenerationHost(state),
    );

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "corp.gain_credit",
      "corp.end_turn",
    ]);
  });

  it("creates a Runner main-action host without changing basic action order", () => {
    const state = minimalRunnerMainState("arch-95-runner-main-host");
    state.runner.clicks = 4;

    const composition = createMainActionHostComposition(hostFor(state));
    const actions = buildRunnerMainActions(
      composition.runnerMainActionGenerationHost(state),
    );

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "runner.gain_credit",
      "runner.draw_card",
      "runner.start_run.hq",
      "runner.start_run.rd",
      "runner.start_run.archives",
      "runner.end_turn",
    ]);
  });

  it("keeps callback-only edges delegated through generated hosts", () => {
    const state = minimalRunnerMainState("arch-95-callbacks");
    const delegated = legalAction("gain_credit", "corp");
    const composition = createMainActionHostComposition(
      hostFor(state, {
        specialZoneHarnessActions: () => [delegated],
        topHostedProgramOnHardware: () => "program_1",
      }),
    );

    expect(
      composition
        .corpMainActionGenerationHost(state)
        .specialZones.specialZoneHarnessActions(state, "corp"),
    ).toEqual([delegated]);
    expect(
      composition
        .runnerMainActionGenerationHost(state)
        .hiddenZone.topHostedProgramOnHardware(state, "hardware_1"),
    ).toBe("program_1");
  });

  it("fails clearly when a required host group is missing", () => {
    const state = minimalCorpMainState("arch-95-missing-group");

    expect(() =>
      createMainActionHostComposition({
        ...hostFor(state),
        actions: undefined,
      } as unknown as MainActionHostCompositionHost),
    ).toThrow("MainActionHostCompositionHost.actions ist erforderlich.");
  });
});

function minimalCorpMainState(seed: string): GameState {
  const state = createGame({ seed, setupMode: "completed" });
  state.timingPoint = "corp_action.main";
  state.corp.hq = [];
  state.corp.rd = [];
  state.corp.scoreArea = [];
  state.corp.servers = state.corp.servers.map((server) => ({
    ...server,
    ice: [],
    root: [],
  }));
  state.runner.tags = 0;
  state.runner.rig.resources = [];
  return state;
}

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

function legalAction(
  type: LegalAction["type"],
  side: LegalAction["side"],
): LegalAction {
  return {
    actionId: `${side}.${type}`,
    type,
    label: type,
    side,
    source: "game_rule",
    stateVersion: 1,
    timingPoint: `${side}_action.main`,
    costs: [],
    payload: {},
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  } as LegalAction;
}

function hostFor(
  state: GameState,
  overrides: Partial<{
    specialZoneHarnessActions: CorpMainActionGenerationHost["specialZones"]["specialZoneHarnessActions"];
    topHostedProgramOnHardware: RunnerMainActionGenerationHost["hiddenZone"]["topHostedProgramOnHardware"];
  }> = {},
): MainActionHostCompositionHost {
  const unexpected = (name: string) => () => {
    throw new Error(`Unexpected main action host call: ${name}`);
  };
  const forgoAction = () =>
    buildLegalAction(
      state,
      "corp",
      "forgo_action",
      "Aktionsschuld abtragen",
      "game_rule",
      [{ clicks: 1 }],
      {
        actionDebtPaid: 1,
        corpActionDebtTotalBefore: 0,
      },
      { targetRequirements: [] },
    );
  const runnerVirusPurgeAction = () =>
    buildLegalAction(
      state,
      "corp",
      "purge_runner_virus_counters",
      "Runner-Virus-Counter purgen (3 Aktionen aussetzen)",
      "game_rule",
      [],
      {
        purgeModel: "future_action_debt",
        actionDebtAdded: 3,
        timingFamily: "corp_main_action",
      },
      { targetRequirements: [] },
    );

  return {
    actions: {
      buildLegalAction,
      makeActionId,
      buildEndTurnAction: buildCorpEndTurnAction,
      buildForgoActionDebtAction: forgoAction,
      buildPurgeableRunnerVirusPurgeAction: runnerVirusPurgeAction,
      buildPurgeVirusAction: buildCorpPurgeVirusAction,
      buildGainCreditAction: buildCorpGainCreditAction,
      buildDrawAction: buildCorpDrawAction,
      buildTrashNewDataFortCreationLockActions: () => [],
      buildNewRemoteIceInstallAction: unexpected("new remote ice install"),
      buildServerIceInstallAction: unexpected("server ice install"),
      buildNewRemoteRootInstallAction: unexpected("new remote root install"),
      buildServerRootInstallAction: unexpected("server root install"),
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
      mustInstance: unexpected("mustInstance"),
      isUniqueCard: unexpected("isUniqueCard"),
      hasInstalledUniqueCardDefinition: unexpected(
        "hasInstalledUniqueCardDefinition",
      ),
      cardImplementationForDefinitionId: () => undefined,
      rezzedCorpRootCardIds: () => [],
      corpInstalledCardIds: () => [],
      visibleVirusCounterTargetIds: () => [],
    },
    scored: {
      effectiveAgendaDifficulty: unexpected("effectiveAgendaDifficulty"),
      effectiveAgendaDifficultyDeps: {},
      scoredAgendaKindForDefinition: unexpected(
        "scoredAgendaKindForDefinition",
      ),
      serverChoiceDisplayLabel: (_state: GameState, serverId: string) =>
        serverId,
      scoredAgendaAbilityHost: () => ({}),
      buildScoredAgendaAbilityActionsForCard: () => ({
        handled: false,
        actions: [],
      }),
    },
    counters: {
      totalCounters: () => 0,
      purgeableRunnerVirusCounterTotal: () => 0,
      spyCountersForServer: () => 0,
      cardCounter: () => 0,
      runnerTraceCounterEffectDefinitions: () => [],
      runnerCounterDisplayName: () => "",
    },
    corp: {
      corpActionDebtPending: () => 0,
      activeObligationCount: () => 0,
      canPlayCorpOperation: unexpected("canPlayCorpOperation"),
      cardImplementationOperationLegalActions: () => [],
      corpUtilityImplementationForDefinition: () => undefined,
      hardwareTrashByCounterLegalActions: () => [],
      advancementPlacementLegalActions: () => [],
      corpAgendaPointTotal: () => 0,
      hasCorpUtilityKind: () => false,
      uniqueDirectLongtailKindForDefinition: () => undefined,
    },
    runner: {
      isConcealedRunnerResource: () => false,
      hiddenRunnerResourceSlotId: unexpected("hiddenRunnerResourceSlotId"),
      ensureRunnerTurnFlags: () => state.runnerTurnFlags ?? {},
      availableRunnerTagRemovalCredits: () => state.runner.credits,
      availableRunnerProgramInstallCredits: () => state.runner.credits,
      availableRunnerRunStartCredits: () => state.runner.credits,
      runnerDrawActionContext: () => ({
        drawTaxSourceCount: 0,
        projectedDrawCount: 1,
      }),
      runnerUtilityLongtailKindForCard: () => undefined,
      uniqueDirectLongtailImplementationForCard: () => undefined,
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
      corpNewDataFortCreationLocked: () => false,
      corpIceInstallTotalCost: unexpected("corpIceInstallTotalCost"),
      canInstallCorpRootCardInServer: unexpected(
        "canInstallCorpRootCardInServer",
      ),
      isRegionUpgrade: unexpected("isRegionUpgrade"),
      corpRegionUpgradeIdsInServer: unexpected("corpRegionUpgradeIdsInServer"),
      corpRootAgendaOrNodeCapacityInServer: unexpected(
        "corpRootAgendaOrNodeCapacityInServer",
      ),
      corpRootAssetIdsInServer: unexpected("corpRootAssetIdsInServer"),
      corpRootMainCardIdsInServer: unexpected("corpRootMainCardIdsInServer"),
      isInstalledCorpCardAdvanceable: unexpected(
        "isInstalledCorpCardAdvanceable",
      ),
      shouldOfferRunnerProgramTrashBeforeInstall: () => false,
      canOverlayProgramOnInstalledProgramHost: () => false,
      canHostProgramOnDaemon: () => false,
      cardImplementationAgendaPointInstallCost: () => 0,
      pickRunnerAgendaForAgendaPointCost: () => undefined,
      requiresDataFortInstallTarget: () => false,
    },
    rez: {
      rootInstallRezzesOnInstall: unexpected("rootInstallRezzesOnInstall"),
      rezCostForCard: unexpected("rezCostForCard"),
      rezCostReductionSourceDefinitionIdsFor: unexpected(
        "rezCostReductionSourceDefinitionIdsFor",
      ),
      isObligationDebtDefinition: () => false,
    },
    cardImplementation: {
      corpTraceDamageAbilityHost: () => ({}),
      corpSpecialDamageAbilityHost: () => ({}),
      pushCorpTraceDamageOrCardImplementationActions: () => undefined,
      buildCorpSpecialDamageAbilityActionsForCard: () => ({
        handled: false,
        actions: [] as LegalAction[],
      }),
      runtimeDeps: {},
      cardImplementationForDefinitionId: () => undefined,
      pushEndOfRunnerTurnActions: () => undefined,
      canPlayPrintedCostOnPlayImplementation: () => false,
      runnerEventResolver: () => undefined,
      printedCostMakeRunEffect: () => undefined,
      pushActivatedActions: () => undefined,
    },
    specialZones: {
      specialZoneHarnessActions:
        overrides.specialZoneHarnessActions ?? (() => []),
      edgerunnerTempsInstallActionsRemaining: () => 0,
      valuPakProgramInstallActionsRemaining: () => 0,
      runnerInstallableProgramIdsForValuPak: () => [],
      delayedInstallPrepareTargetIds: () => [],
      delayedInstallCounterCost: () => 0,
      delayedInstallPreparedTargetIds: () => [],
    },
    callbacks: {
      mustServer: unexpected("mustServer"),
      serverChoiceDisplayLabel: (_state: GameState, serverId: string) =>
        state.corp.servers.find((server) => server.id === serverId)?.label ??
        serverId,
      runnerMemoryLimit: () => state.runner.memoryLimit,
      exposedCorpCardInServer: () => undefined,
      topHostedProgramOnHardware:
        overrides.topHostedProgramOnHardware ?? (() => undefined),
      hostedProgramIdsOnHardware: () => [],
      topRunnerHeapCardId: () => undefined,
      constants: {
        CODE_VIRAL_CACHE_ID: "code_viral_cache",
        COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID: "cowboy_sysop",
        DISINFECTANT_VIRUS_COUNTER_ASSET_ID: "disinfectant",
        COUNTER_UPGRADE_CARD_IDS: new Set(),
        ADVANCEMENT_PLACEMENT_OPERATION_ID: "systematic_layoffs",
        RUNNER_EVENT_RESOLVERS: {},
        STACK_SEARCH_PROGRAM_CARD_IDS: new Set(),
        SELF_MODIFYING_CODE_ID: "self_modifying_code",
        SHORT_CIRCUIT_RESOURCE_CARD_ID: "short_circuit",
        AUJOURD_OUI_RESOURCE_CARD_ID: "aujourd_oui",
        SERVER_EXPOSE_PROGRAM_CARD_IDS: new Set(),
        COUNTER_STACK_TOP_REVEAL_PROGRAM_CARD_ID: "counter_stack_reveal",
        FAIT_ACCOMPLI_COUNTER_PROGRAM_ID: "fait_accompli",
        BOARDWALK_RANDOM_PROGRAM_CARD_ID: "boardwalk",
        MICROTECH_BACKUP_DRIVE_HOST_RETURN_HARDWARE_ID: "microtech",
        QUEST_FOR_CATTEKIN_RANDOM_RESOURCE_CARD_ID: "quest_for_cattekin",
        STACK_TOP_REORDER_RESOURCE_CARD_ID: "stack_top_reorder",
        JUNKYARD_BBS_ID: "junkyard_bbs",
        SHELL_TRADERS_ID: "shell_traders",
        DANSHIS_SECOND_ID: "danshis_second_id",
        BODYWEIGHT_DATA_CRECHE_ID: "bodyweight_data_creche",
        ALL_NIGHTER_ID: "all_nighter",
      },
    },
  } as unknown as MainActionHostCompositionHost;
}
