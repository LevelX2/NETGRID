import type { GameState, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "../create-game";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
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
      actions.find(
        (candidate) => candidate.type === "purge_runner_virus_counters",
      ),
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

  it("binds a generic Corp operation to its exact CardSpec on-play capability", () => {
    const state = minimalCorpMainState("cs12-corp-operation-capability");
    const cardId = "chance-observation-instance";
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_284_chance-observation"]!;
    state.corp.hq = [cardId as never];
    state.corp.credits = 5;
    state.cardInstances[cardId] = {
      id: cardId,
      definitionId: definition.id,
      owner: "corp",
      zone: "corp.hq",
      installed: false,
      rezzed: false,
      advancementCounters: 0,
      counters: {},
    } as never;
    const host = testCorpMainHost(state);
    host.cards.definitionFor = () => definition;
    host.corp.canPlayCorpOperation = () => true;

    const operation = buildCorpMainActions(host).find(
      (candidate) => candidate.type === "play_operation",
    );

    expect(operation).toMatchObject({
      source: cardId,
      abilityRef: {
        sourceCardInstanceId: cardId,
        sourceAbilityId:
          "onr_v1_284_chance-observation:abilities_on_play_trace",
      },
      payload: {
        cardId,
        cardImplementationCapabilityBindingKind: "card_spec_capability_key",
        cardImplementationAbilityKey: "abilities_on_play_trace",
        cardImplementationAbilityId:
          "onr_v1_284_chance-observation:abilities_on_play_trace",
      },
    });
  });

  it("attaches the exact composite zone projection to Rescheduler", () => {
    const state = minimalCorpMainState("corp-main-rescheduler-projection");
    const cardId = "rescheduler-instance";
    const definition = CARD_DEFINITIONS_BY_ID["onr_v1_336_rescheduler"]!;
    state.cardInstances[cardId] = {
      id: cardId,
      definitionId: definition.id,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      installed: true,
      rezzed: true,
      advancementCounters: 0,
      counters: {},
    } as never;
    const host = testCorpMainHost(state);
    host.cards.definitionFor = () => definition;
    host.cards.rezzedCorpRootCardIds = () => [cardId];
    host.corp.hasCorpUtilityKind = (
      _state: GameState,
      candidateCardId: string,
      kind: string,
    ) =>
      candidateCardId === cardId &&
      kind === "shuffle_hq_into_rd_then_draw_same_count";

    const rescheduler = buildCorpMainActions(host).find(
      (candidate) => candidate.source === cardId,
    );

    expect(rescheduler?.payload).toMatchObject({
      v1917AssetAbility: "rescheduler_hq_shuffle_draw",
      corpZoneTransitionProjectionComplete: true,
      corpZoneTransitionProjectionKind:
        "shuffle_hq_into_rd_then_draw_same_count",
      corpZoneTransitionProjectionGrossDrawCount: 0,
      corpZoneTransitionProjectionHqCardsRecycledBeforeDrawCount: 0,
      corpZoneTransitionProjectionNetHqDelta: 0,
      corpZoneTransitionProjectionNetRdDelta: 0,
      corpZoneTransitionProjectionNetRdConsumption: 0,
    });
  });

  it("attaches the exact composite zone projection and double cost to Corporate Shuffle", () => {
    const state = minimalCorpMainState(
      "corp-main-corporate-shuffle-projection",
    );
    const cardId = "corporate-shuffle-instance";
    const definition =
      CARD_DEFINITIONS_BY_ID["onr_classic_017_corporate-shuffle"]!;
    state.corp.clicks = 2;
    state.corp.hq = [cardId];
    state.corp.rd = ["rd-1", "rd-2", "rd-3", "rd-4", "rd-5"];
    state.cardInstances[cardId] = {
      id: cardId,
      definitionId: definition.id,
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "hq" },
      installed: false,
      rezzed: false,
      advancementCounters: 0,
      counters: {},
    } as never;
    const host = testCorpMainHost(state);
    host.cards.definitionFor = () => definition;
    host.corp.canPlayCorpOperation = () => true;
    host.corp.corpUtilityImplementationForDefinition = () => ({
      capabilityKey: "draw_five_then_shuffle_hq_card",
      addressability: ["plan", "action", "quote", "debug"],
      kind: "draw_corp_cards_then_shuffle_hq_card_into_rd",
      drawCount: 5,
      playCost: { kind: "printed", additionalClicks: 1 },
      visibility: "hidden_info_barrier",
    });

    const corporateShuffle = buildCorpMainActions(host).find(
      (candidate) => candidate.source === cardId,
    );

    expect(corporateShuffle).toMatchObject({
      type: "play_operation",
      costs: [{ clicks: 2, credits: 0 }],
      payload: {
        cardId,
        corpZoneTransitionProjectionComplete: true,
        corpZoneTransitionProjectionKind: "draw_then_shuffle_one_hq_into_rd",
        corpZoneTransitionProjectionGrossDrawCount: 5,
        corpZoneTransitionProjectionNetHqDelta: 3,
        corpZoneTransitionProjectionNetRdDelta: -4,
        corpZoneTransitionProjectionNetRdConsumption: 4,
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
        corpActionDebtTotalBefore: overrides.corpActionDebtPending?.() ?? 0,
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
    },
    agenda: {
      effectiveAgendaDifficulty: unexpected("effectiveAgendaDifficulty"),
      effectiveAgendaDifficultyDeps: {},
      scoredAgendaKindForDefinition: unexpected(
        "scoredAgendaKindForDefinition",
      ),
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
      activeObligationCount: () => 0,
      canPlayCorpOperation: unexpected("canPlayCorpOperation"),
      cardImplementationOperationLegalActions: () => [],
      corpUtilityImplementationForDefinition: () => undefined,
      hardwareTrashByCounterLegalActions: () => [],
      corpAgendaPointTotal: () => 0,
      hasCorpUtilityKind: () => false,
      uniqueDirectLongtailKindForDefinition: () => undefined,
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
      quoteCorpRootRezCost: unexpected("quoteCorpRootRezCost"),
      rezCostReductionSourceDefinitionIdsFor: unexpected(
        "rezCostReductionSourceDefinitionIdsFor",
      ),
      isObligationDebtDefinition: () => false,
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
      COUNTER_UPGRADE_SOURCES: new Set(),
    },
  };
}
