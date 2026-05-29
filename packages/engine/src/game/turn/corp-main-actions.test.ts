import type { GameState, LegalAction } from "@netgrid/shared";
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

describe("corp main action generation", () => {
  it("returns only end turn when the Corp has no clicks", () => {
    const state = minimalCorpMainState("arch-53-corp-no-clicks");
    state.corp.clicks = 0;

    const before = JSON.stringify(state);
    const actions = buildCorpMainActions(testCorpMainHost(state));

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "corp.end_turn",
    ]);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("keeps basic Corp main-action order stable", () => {
    const state = minimalCorpMainState("arch-53-corp-basic-order");
    state.corp.clicks = 3;
    state.corp.rd = [];
    state.corp.credits = 5;

    const actions = buildCorpMainActions(testCorpMainHost(state));

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "corp.gain_credit",
      "corp.end_turn",
    ]);
    expect(actions.map((candidate) => candidate.type)).toEqual([
      "gain_credit",
      "end_turn",
    ]);
  });

  it("lets action debt override normal Corp main actions", () => {
    const state = minimalCorpMainState("arch-53-corp-action-debt");
    state.corp.clicks = 3;

    const actions = buildCorpMainActions(
      testCorpMainHost(state, {
        corpActionDebtPending: () => 2,
      }),
    );

    expect(actions.map((candidate) => candidate.actionId)).toEqual([
      "corp.forgo_action",
    ]);
    expect(actions[0]?.payload).toMatchObject({
      actionDebtPaid: 1,
      corpActionDebtTotalBefore: 2,
    });
  });

  it("offers Runner-virus purge during normal Corp main actions", () => {
    const state = minimalCorpMainState("arch-53-corp-runner-virus-purge");
    state.corp.clicks = 3;

    const actions = buildCorpMainActions(
      testCorpMainHost(state, {
        purgeableRunnerVirusCounterTotal: () => 2,
      }),
    );

    expect(actions.map((candidate) => candidate.type)).toContain(
      "purge_runner_virus_counters",
    );
    expect(
      actions.find((candidate) => candidate.type === "purge_runner_virus_counters"),
    ).toMatchObject({
      label: "Runner-Virus-Counter purgen (3 Aktionen aussetzen)",
      costs: [],
      payload: {
        purgeModel: "future_action_debt",
        actionDebtAdded: 3,
        timingFamily: "corp_main_action",
      },
    });
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

function testCorpMainHost(
  state: GameState,
  overrides: Partial<{
    corpActionDebtPending: () => number;
    purgeableRunnerVirusCounterTotal: () => number;
  }> = {},
): CorpMainActionGenerationHost {
  const unexpected = (name: string) => () => {
    throw new Error(`Unexpected corp main action host call: ${name}`);
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
        corpActionDebtTotalBefore:
          overrides.corpActionDebtPending?.() ?? 0,
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
    state,
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
    agenda: {
      effectiveAgendaDifficulty: unexpected("effectiveAgendaDifficulty"),
      effectiveAgendaDifficultyDeps: {},
      scoredAgendaKindForDefinition: unexpected("scoredAgendaKindForDefinition"),
      serverChoiceDisplayLabel: unexpected("serverChoiceDisplayLabel"),
      scoredAgendaAbilityHost: () => ({}),
      buildScoredAgendaAbilityActionsForCard: () => ({
        handled: false,
        actions: [],
      }),
    },
    counters: {
      totalCounters: () => 0,
      purgeableRunnerVirusCounterTotal:
        overrides.purgeableRunnerVirusCounterTotal ?? (() => 0),
      spyCountersForServer: () => 0,
    },
    corp: {
      corpActionDebtPending: overrides.corpActionDebtPending ?? (() => 0),
      acmeSavingsAndLoanObligationCount: () => 0,
      canPlayCorpOperation: unexpected("canPlayCorpOperation"),
      cardImplementationOperationLegalActions: () => [],
      corpUtilityImplementationForDefinition: () => undefined,
      powerGridOverloadLegalActions: () => [],
      systematicLayoffsLegalActions: () => [],
      corpAgendaPointTotal: () => 0,
      hasCorpUtilityKind: () => false,
      uniqueDirectLongtailKindForDefinition: () => undefined,
      corpInstalledEconomyActionProfileForDefinition: () => undefined,
      corpInstalledEconomyActionPayload: unexpected(
        "corpInstalledEconomyActionPayload",
      ),
    },
    runner: {
      isConcealedRunnerResource: () => false,
      hiddenRunnerResourceSlotId: unexpected("hiddenRunnerResourceSlotId"),
    },
    install: {
      corpNewDataFortCreationLocked: () => false,
      corpIceInstallTotalCost: unexpected("corpIceInstallTotalCost"),
      canInstallCorpRootCardInServer: unexpected(
        "canInstallCorpRootCardInServer",
      ),
      canInstallCorpRootCardInNewRemote: unexpected(
        "canInstallCorpRootCardInNewRemote",
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
    },
    rez: {
      rootInstallRezzesOnInstall: unexpected("rootInstallRezzesOnInstall"),
      rezCostForCard: unexpected("rezCostForCard"),
      rezCostReductionSourceDefinitionIdsFor: unexpected(
        "rezCostReductionSourceDefinitionIdsFor",
      ),
      isAcmeSavingsAndLoanDefinition: () => false,
    },
    abilities: {
      corpTraceDamageAbilityHost: () => ({}),
      corpSpecialDamageAbilityHost: () => ({}),
      pushCorpTraceDamageOrCardImplementationActions: () => undefined,
      buildCorpSpecialDamageAbilityActionsForCard: () => ({
        handled: false,
        actions: [] as LegalAction[],
      }),
    },
    specialZones: {
      specialZoneHarnessActions: () => [],
      edgerunnerTempsInstallActionsRemaining: () => 0,
    },
    constants: {
      CODE_VIRAL_CACHE_ID: "code_viral_cache",
      HIDDEN_ZONE_REVEAL_ASSET_CARD_IDS: new Set(),
      HIDDEN_ZONE_REORDER_ASSET_CARD_IDS: new Set(),
      CORP_HQ_SHUFFLE_DRAW_CARD_ID: "corp_hq_shuffle_draw",
      COWBOY_SYSOP_INSTALLED_CARD_ASSET_ID: "cowboy_sysop",
      DISINFECTANT_VIRUS_COUNTER_ASSET_ID: "disinfectant",
      COUNTER_UPGRADE_CARD_IDS: new Set(),
      TAG_CONDITION_UPGRADE_CARD_IDS: new Set(),
      COUNTER_ASSET_CARD_IDS: new Set(),
      INFORMATION_LAUNDERING_ADVANCEMENT_ECONOMY_ASSET_ID:
        "information_laundering",
      ACTION_ASSET_CARD_IDS: new Set(),
      SYSTEMATIC_LAYOFFS_ADVANCEMENT_OPERATION_ID: "systematic_layoffs",
    },
  };
}
