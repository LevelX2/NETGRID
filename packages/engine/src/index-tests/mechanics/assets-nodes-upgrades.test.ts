import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  DEMO_DECKS,
  eventVisibilityForAction,
  getLegalActions,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  quoteCorpRezCost,
  replayEvents,
  validateDeckDefinition,
  validateGameState,
} from "../../index";
import { collectActiveModifiers } from "../../ability-engine/active-modifiers";
import { executeCardImplementationEffects } from "../../ability-engine/effect-interpreter";
import {
  cardImplementationCoverageForDefinitionId,
} from "../../card-implementations/coverage";
import {
  cardImplementationForDefinitionId,
} from "../../card-implementations/registry";
import { buildPublicAbilitySchemaContext } from "../../mechanics/public-payload-schema";
import { publicContextForAction } from "../../public-context";
import {
  MECHANIC_SMOKE_CARD_IDS,
  MECHANIC_SMOKE_DECKS,
  MECHANIC_SMOKE_GAMES,
  ONR_V1_0_5K_FINAL_CARD_IDS,
  ONR_V1_0_6K_FINAL_CARD_IDS,
  ONR_V1_1_2K_FINAL_CARD_IDS,
  ONR_V1_2_3_FINAL_CARD_IDS,
  ONR_V1_6_1_FINAL_CARD_IDS,
  ONR_V1_6_2_FINAL_CARD_IDS,
  ONR_V1_6_3_FINAL_CARD_IDS,
  ONR_V1_7_0_FINAL_CARD_IDS,
  ONR_V1_7_1_FINAL_CARD_IDS,
  ONR_V1_7_2_FINAL_CARD_IDS,
  ONR_V1_8_0_FINAL_CARD_IDS,
  ONR_V1_8_1_FINAL_CARD_IDS,
  ONR_V1_9_0_FINAL_CARD_IDS,
  ONR_V1_9_1_FINAL_CARD_IDS,
  ONR_V1_9_2_FINAL_CARD_IDS,
  ONR_V1_9_3_FINAL_CARD_IDS,
  ONR_V1_9_4_FINAL_CARD_IDS,
  ONR_V1_9_5_FINAL_CARD_IDS,
  ONR_V1_9_6_FINAL_CARD_IDS,
  ONR_V1_9_7_FINAL_CARD_IDS,
  ONR_V1_9_8_FINAL_CARD_IDS,
  ONR_V1_9_9_FINAL_CARD_IDS,
  ONR_V1_0_5K_RUNNER_DECK,
  ONR_V1_0_5K_CORP_DECK,
  ONR_V1_0_6K_RUNNER_DECK,
  ONR_V1_0_6K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_2_3_RUNNER_DECK,
  ONR_V1_2_3_CORP_DECK,
  ONR_V1_6_1_RUNNER_DECK,
  ONR_V1_6_1_CORP_DECK,
  ONR_V1_6_2_RUNNER_DECK,
  ONR_V1_6_2_CORP_DECK,
  ONR_V1_6_3_RUNNER_DECK,
  ONR_V1_6_3_CORP_DECK,
  ONR_V1_7_0_RUNNER_DECK,
  ONR_V1_7_0_CORP_DECK,
  ONR_V1_7_1_RUNNER_DECK,
  ONR_V1_7_1_CORP_DECK,
  ONR_V1_7_2_RUNNER_DECK,
  ONR_V1_7_2_CORP_DECK,
  ONR_V1_8_0_RUNNER_DECK,
  ONR_V1_8_0_CORP_DECK,
  ONR_V1_8_1_RUNNER_DECK,
  ONR_V1_8_1_CORP_DECK,
  ONR_V1_9_0_RUNNER_DECK,
  ONR_V1_9_0_CORP_DECK,
  ONR_V1_9_1_RUNNER_DECK,
  ONR_V1_9_1_CORP_DECK,
  ONR_V1_9_2_RUNNER_DECK,
  ONR_V1_9_2_CORP_DECK,
  ONR_V1_9_3_RUNNER_DECK,
  ONR_V1_9_3_CORP_DECK,
  ONR_V1_9_4_RUNNER_DECK,
  ONR_V1_9_4_CORP_DECK,
  ONR_V1_9_5_RUNNER_DECK,
  ONR_V1_9_5_CORP_DECK,
  ONR_V1_9_6_RUNNER_DECK,
  ONR_V1_9_6_CORP_DECK,
  ONR_V1_9_7_RUNNER_DECK,
  ONR_V1_9_7_CORP_DECK,
  ONR_V1_9_8_RUNNER_DECK,
  ONR_V1_9_8_CORP_DECK,
  ONR_V1_9_9_RUNNER_DECK,
  ONR_V1_9_9_CORP_DECK,
  ONR_V1_RUNNER_DECK,
  ONR_V1_CORP_DECK,
  V094_RUNNER_DECK,
  V094_CORP_DECK,
  V111_CORP_DECK,
  V095_RUNNER_DECK,
  V095_CORP_DECK,
  v094DamageGame,
  onrV1Game,
  v105kCardReleaseGame,
  v106kCardReleaseGame,
  v112kCardReleaseGame,
  v123CardReleaseGame,
  v161CardReleaseGame,
  v162CardReleaseGame,
  v163CardReleaseGame,
  v170CardReleaseGame,
  v171CardReleaseGame,
  v172CardReleaseGame,
  v180CardReleaseGame,
  v181CardReleaseGame,
  v190CardReleaseGame,
  v191CardReleaseGame,
  v192CardReleaseGame,
  v193CardReleaseGame,
  v194CardReleaseGame,
  v195CardReleaseGame,
  v196CardReleaseGame,
  v197CardReleaseGame,
  v198CardReleaseGame,
  v199CardReleaseGame,
  v095ResourceGame,
  v096TraceGame,
  v097RunGame,
  v098IdentityGame,
  v099CounterHostingGame,
  installedResourceCorpTurn,
  originalsetReorderCounterRunlockGame,
  encounterIce,
  breakCurrentSubroutine,
  apply,
  applyChoice,
  applyChoices,
  mustAction,
  toRunnerTurn,
  toRunnerTurnFromCorpMain,
  sourceDefinition,
  agendaPoints,
  cardCounterAmount,
  setCardCounterForTest,
  choiceRequest,
  moveRunnerCardToGrip,
  scoreRunnerAgendaForTest,
  scoreCorpAgendaForTest,
  moveRunnerCardCopyToGrip,
  putRunnerCardOnTopOfStack,
  drawRunnerCardsForTest,
  moveCorpCardToHq,
  moveCorpCardCopyToHq,
  moveCorpCardToArchives,
  keepOnlyCorpHqCard,
  keepOnlyCorpHqCards,
  keepOnlyCorpArchivesCards,
  putCorpCardOnTopOfRd,
  putCorpIceOnServer,
  putCorpIceCopyOnServer,
  putCorpRootInRemote,
  installRunnerProgramForTest,
  installRunnerHardwareForTest,
  installRunnerResourceForTest,
  installRunnerProgramCopyForTest,
  emptyRunnerGripForTest,
  scoreTwoAgendasForTest,
  findCard,
  removeEverywhere,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type ChoiceRequest,
  type CounterType,
  type DeckDefinition,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";

import {
  expectCurrentRulesBaseline,
  continueRunAction,
  continueRunThroughMovement,
  continueRunThroughMovementWindow,
  enterEncounterFromMovementWindow,
  passCorpApproachRezWindowIfOpen,
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.17 Generic Asset/Node WIP", () => {
  it("adds all V1.9.17 WIP runtime definitions without release-promoting the next slice", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.assetNodeEffects).toHaveLength(18);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.assetNodeEffects) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("corp");
      expect(definition?.type, definitionId).toBe("asset");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /generic_asset_node|access_ambush|trace|hosting|recurring|damage|hidden_zone|hq_agenda_reveal|hq_shuffle_into_rd/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("keeps ESA Contract install, rez, activated draw, access and trash side-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-generic-asset-install-rez-access");
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const assetId = moveCorpCardToHq(state, "onr_v1_321_esa-contract");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === assetId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbility === "activated" &&
          action.payload?.cardId === assetId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.cardImplementationAbility === "activated",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_321_esa-contract",
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(assetId),
    );
    expect(remote?.id).toBe("remote_1");
    expect(state.cardInstances[assetId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === assetId)?.definitionId,
    ).toBe("onr_v1_321_esa-contract");

    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    const hqBeforeAbility = state.corp.hq.length;
    const rdBeforeAbility = state.corp.rd.length;
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.cardImplementationAbility === "activated",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === assetId,
    );
    expect(state.corp.hq.length).toBe(hqBeforeAbility + 2);
    expect(state.corp.rd.length).toBe(rdBeforeAbility - 2);
    expect(state.corp.credits).toBe(creditsBeforeAbility);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 1);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_321_esa-contract",
      cardImplementationAbility: "activated",
      sourceDefinitionId: "onr_v1_321_esa-contract",
      drawnCards: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_321_esa-contract",
          sourceTitle: "ESA Contract",
          reason: "card_resolver",
        }),
      ],
    });
    expect(
      JSON.stringify(state.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-generic-asset-access-trash"),
    );
    accessState.runner.credits = 10;
    const accessedAssetId = putCorpRootInRemote(
      accessState,
      "onr_v1_321_esa-contract",
    );
    accessState.cardInstances[accessedAssetId] = {
      ...accessState.cardInstances[accessedAssetId]!,
      faceup: true,
      rezzed: true,
    };
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_321_esa-contract",
    });
    expect(
      JSON.stringify(accessState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);

    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(accessState.corp.archives).toContain(accessedAssetId);
    expect(
      getPlayerView(accessState, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === accessedAssetId)
        ?.definitionId,
    ).toBe("onr_v1_321_esa-contract");
    expect(validateGameState(accessState).ok).toBe(true);
  });

  it("applies rezzed V1.9.17 recurring campaign credits at Corp turn start", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-recurring-campaign-start-turn");
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const campaignId = moveCorpCardToHq(state, "onr_v1_326_holovid-campaign");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === campaignId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_326_holovid-campaign",
    );
    const creditsBeforeNextCorpTurn = state.corp.credits;

    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.activeSide).toBe("corp");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.corp.credits).toBe(creditsBeforeNextCorpTurn + 1);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("does not offer legacy manual economy actions for start-of-turn campaign assets", () => {
    const economyAssets = [
      "onr_v1_311_braindance-campaign",
      "onr_v1_326_holovid-campaign",
    ] as const;
    for (const definitionId of economyAssets) {
      let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(`v1917-economy-asset-${definitionId}`);
      state.corp.credits = 10;
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      const assetId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === assetId &&
          action.payload?.serverId === "new_remote",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "gain_credit" &&
            action.payload?.v1917AssetAbility === "gain_credits" &&
            action.payload?.cardId === assetId,
        ),
      ).toBe(false);
      expect(validateGameState(state).ok, definitionId).toBe(true);
    }
  });

  it("replaces the basic Corp credit action with an optional Investment Firm credit choice", () => {
    let noFirm = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-no-source",
    );
    noFirm = apply(noFirm, "corp", (action) => action.type === "mandatory_draw");
    const noFirmCreditsBefore = noFirm.corp.credits;
    noFirm = apply(
      noFirm,
      "corp",
      (action) => action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(noFirm.corp.credits).toBe(noFirmCreditsBefore + 1);
    expect(noFirm.pendingChoice).toBeUndefined();

    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-credit-choice",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firmId = moveCorpCardToHq(state, "onr_v1_329_investment-firm");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === firmId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_329_investment-firm",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1917AssetAbility === "gain_credits" &&
          action.payload?.cardId === firmId,
      ),
    ).toBe(false);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;
    const clicksBefore = state.corp.clicks;

    state = apply(
      state,
      "corp",
      (action) => action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(state.corp.credits).toBe(creditsBefore);
    expect(state.corp.clicks).toBe(clicksBefore - 1);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("corp_installed_economy.credit_choice"),
      minSelections: 1,
      maxSelections: 1,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.options.map((option) => option.id)).toEqual(
      expect.arrayContaining(["take_credit", `corp_installed_economy_credit_${firmId}`]),
    );
    const resolve = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: resolve.actionId,
        clientKnownStateVersion: state.stateVersion,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: [`corp_installed_economy_credit_${firmId}`],
        },
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: resolve.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        selectedChoices: {
          choiceId: state.pendingChoice?.choiceId,
          selectedOptionIds: [`corp_installed_economy_credit_${firmId}`],
        },
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    let normalState = structuredClone(state);
    const normalResult = applyAction(normalState, {
      matchId: normalState.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: normalState.stateVersion,
      selectedChoices: {
        choiceId: normalState.pendingChoice?.choiceId,
        selectedOptionIds: ["take_credit"],
      },
      idempotencyKey: "v1917-investment-firm-normal-credit",
    });
    expect(normalResult.ok).toBe(true);
    if (!normalResult.ok) throw new Error(normalResult.error.message);
    normalState = normalResult.state;
    expect(normalState.corp.credits).toBe(creditsBefore + 1);
    expect(cardCounterAmount(normalState, firmId, "recurring_credit")).toBe(0);
    expect(normalState.pendingChoice).toBeUndefined();

    const storeResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolve.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`corp_installed_economy_credit_${firmId}`],
      },
      idempotencyKey: "v1917-investment-firm-store-credit",
    });
    expect(storeResult.ok).toBe(true);
    if (!storeResult.ok) throw new Error(storeResult.error.message);
    state = storeResult.state;
    expect(state.corp.credits).toBe(creditsBefore);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(2);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "remote_1")
        ?.root.find((card) => card.instanceId === firmId)?.counters
        ?.recurring_credit,
    ).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      cardDefinitionId: "onr_v1_329_investment-firm",
      counterType: "recurring_credit",
      addedCounterAmount: 2,
      remainingCounters: 2,
      gainedCredits: 0,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const creditsBeforeTurnStartDrain = state.corp.credits;
    const startTurnInitial = structuredClone(state);
    const startTurnReplayStart = state.eventLog.length;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(creditsBeforeTurnStartDrain + 1);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(1);
    expect(state.corp.archives).not.toContain(firmId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        effectId: expect.stringContaining("corp.start.installed_economy_credit"),
        kind: "gain_credits",
        amount: 1,
        sourceDefinitionId: "onr_v1_329_investment-firm",
      }),
    );
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        effectId: expect.stringContaining("corp.start.installed_economy_credit.counter"),
        kind: "counter_change",
        counterType: "recurring_credit",
        removedCounterAmount: 1,
        remainingCounters: 1,
        sourceDefinitionId: "onr_v1_329_investment-firm",
      }),
    );
    const startTurnReplay = replayEvents(
      startTurnInitial,
      state.eventLog.slice(startTurnReplayStart),
    );
    expect(startTurnReplay.ok).toBe(true);
    expect(hashState(startTurnReplay.state)).toBe(hashState(state));

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const creditsBeforeSecondTurnStartDrain = state.corp.credits;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(creditsBeforeSecondTurnStartDrain + 1);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        effectId: expect.stringContaining("corp.start.installed_economy_credit.counter"),
        kind: "counter_change",
        counterType: "recurring_credit",
        removedCounterAmount: 1,
        remainingCounters: 0,
        sourceDefinitionId: "onr_v1_329_investment-firm",
      }),
    );

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const creditsBeforeEmptyFirmTurnStart = state.corp.credits;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.corp.credits).toBe(creditsBeforeEmptyFirmTurnStart);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(0);
    const emptyFirmTurnStartEffects = (state.eventLog.at(-1)?.publicPayload
      .resolvedEffects ?? []) as Array<{
      kind?: string;
      sourceDefinitionId?: string;
    }>;
    expect(
      emptyFirmTurnStartEffects.some(
        (effect) =>
          effect.sourceDefinitionId === "onr_v1_329_investment-firm" &&
          effect.kind === "gain_credits",
      ),
    ).toBe(false);

    let multi = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-multiple",
    );
    multi = apply(multi, "corp", (action) => action.type === "mandatory_draw");
    const firstFirm = putCorpRootInRemote(multi, "onr_v1_329_investment-firm");
    const secondFirm = `${firstFirm}_copy` as typeof firstFirm;
    const firstFirmZone = multi.cardInstances[firstFirm]?.zone;
    const firstFirmServerId =
      firstFirmZone?.zone === "serverRoot" ? firstFirmZone.serverId : "remote_1";
    multi.cardInstances[secondFirm] = {
      ...multi.cardInstances[firstFirm]!,
      instanceId: secondFirm,
      zone: { side: "corp", zone: "serverRoot", serverId: firstFirmServerId },
    };
    multi.corp.servers
      .find((server) => server.id === firstFirmServerId)
      ?.root.push(secondFirm);
    for (const cardId of [firstFirm, secondFirm]) {
      multi.cardInstances[cardId] = {
        ...multi.cardInstances[cardId]!,
        faceup: true,
        rezzed: true,
      };
    }
    multi = apply(
      multi,
      "corp",
      (action) => action.type === "gain_credit" && action.source === "basic_action",
    );
    const multiOptions = multi.pendingChoice?.options.map((option) => option.id);
    expect(multiOptions).toHaveLength(3);
    expect(multiOptions).toEqual(
      expect.arrayContaining([
        "take_credit",
        `corp_installed_economy_credit_${firstFirm}`,
        `corp_installed_economy_credit_${secondFirm}`,
      ]),
    );
    expect(validateGameState(state).ok).toBe(true);
    expect(validateGameState(multi).ok).toBe(true);
  });

  it("loads and spends Spinn Public Relations bits through CardImplementation", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-spinn-public-relations-pool");
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const spinnId = moveCorpCardToHq(
      state,
      "onr_v1_344_spinn-public-relations",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === spinnId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) ===
          "onr_v1_344_spinn-public-relations",
    );
    const creditsBeforeLoad = state.corp.credits;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === spinnId,
    );

    expect(state.corp.credits).toBe(creditsBeforeLoad);
    expect(cardCounterAmount(state, spinnId, "bit")).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_344_spinn-public-relations",
      cardImplementationAbility: "activated",
      hostedCreditsAdded: 3,
      hostedCreditsAfter: 3,
    });

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    for (let turns = 0; turns < 3; turns += 1) {
      state = toRunnerTurnFromCorpMain(state);
      state = apply(state, "runner", (action) => action.type === "end_turn");
      if (turns < 2)
        state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    }

    expect(cardCounterAmount(state, spinnId, "bit")).toBe(0);
    expect(state.corp.credits).toBe(creditsBeforeLoad + 3);
    expect(state.corp.archives).not.toContain(spinnId);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("refreshes all scoped V1.9.17 recurring assets together without hidden payloads", () => {
    const recurringAssets = [
      "onr_v1_311_braindance-campaign",
      "onr_v1_329_investment-firm",
    ] as const;
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-recurring-all-assets"),
    );
    for (const definitionId of recurringAssets) {
      const assetId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[assetId] = {
        ...state.cardInstances[assetId]!,
        faceup: true,
        rezzed: true,
      };
      if (definitionId === "onr_v1_311_braindance-campaign")
        setCardCounterForTest(state, assetId, "bit", 12);
      if (definitionId === "onr_v1_329_investment-firm")
        setCardCounterForTest(state, assetId, "recurring_credit", 1);
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.corp.credits).toBe(creditsBefore + 3);
    expect(
      state.corp.servers.some((server) =>
        server.root.some(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId ===
              "onr_v1_311_braindance-campaign" &&
            cardCounterAmount(state, cardId, "bit") === 10,
        ),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.some((server) =>
        server.root.some(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId ===
              "onr_v1_329_investment-firm" &&
            cardCounterAmount(state, cardId, "recurring_credit") === 0,
        ),
      ),
    ).toBe(true);
    expect(validateGameState(state).ok).toBe(true);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("cascades hosted V1.9.17 Corp cards to Archives when the host is trashed on access", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-hosted-corp-asset-trash"),
    );
    state.runner.credits = 10;
    const hostId = putCorpRootInRemote(
      state,
      "onr_v1_309_bbs-whispering-campaign",
    );
    const hostedId = putCorpRootInRemote(
      state,
      "onr_v1_318_department-of-truth-enhancement",
    );
    state.cardInstances[hostId] = {
      ...state.cardInstances[hostId]!,
      faceup: true,
      rezzed: true,
    };
    state.cardInstances[hostedId] = {
      ...state.cardInstances[hostedId]!,
      faceup: true,
      rezzed: true,
      hostedOn: hostId,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBe(hostId);
    state = apply(
      state,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );

    expect(state.corp.archives).toEqual(
      expect.arrayContaining([hostId, hostedId]),
    );
    expect(state.cardInstances[hostId]?.hostedOn).toBeUndefined();
    expect(state.cardInstances[hostedId]?.hostedOn).toBeUndefined();
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.some((card) => card.instanceId === hostedId),
    ).toBe(true);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("starts V1.9.17 trace asset abilities through the side-safe trace window", () => {
    const traceAssets = [
      ["onr_v1_310_blood-cat", 5],
    ] as const;
    for (const [definitionId, baseTraceStrength] of traceAssets) {
      let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
        `v1917-trace-asset-window-${definitionId}`,
      );
      state.corp.credits = 10;
      state.runner.credits = 5;
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      const assetId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === assetId &&
          action.payload?.serverId === "new_remote" &&
          action.payload?.placement === "root",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === assetId,
      );

      expect(state.trace).toMatchObject({
        status: "corp_bid",
        baseTraceStrength,
        sourceDefinitionId: definitionId,
      });
      expect(state.pendingChoice?.side).toBe("corp");
      expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
      expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "activated_card_ability",
        traceStarted: true,
        sourceDefinitionId: definitionId,
      });
      expect(validateGameState(state).ok).toBe(true);
    }
  });

  it("uses Krumz as a trace-only bit source and refreshes it at Corp turn start", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-krumz-trace-bit-source");
    state.corp.credits = 10;
    state.runner.credits = 0;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const krumzId = moveCorpCardToHq(state, "onr_v1_330_krumz");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === krumzId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_330_krumz",
    );
    expect(cardCounterAmount(state, krumzId, "bit")).toBe(1);
    const bloodCatId = moveCorpCardToHq(state, "onr_v1_310_blood-cat");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === bloodCatId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_310_blood-cat",
    );
    state.corp.credits = 0;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === bloodCatId,
    );
    expect(state.pendingChoice?.options.some((option) => option.id === "bid_1")).toBe(
      true,
    );
    state = applyChoice(state, "corp", "bid_1");

    expect(cardCounterAmount(state, krumzId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      corpBid: 1,
      corpCreditBid: 0,
      recurringTraceCreditPoolSpent: 1,
    });

    state = applyChoice(state, "runner", "bid_0");
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(cardCounterAmount(state, krumzId, "bit")).toBe(1);
  });

  it("resolves Corporate Negotiating Center as start-of-turn HQ agenda reveal", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects(
        "v1917-corporate-negotiating-center-hq",
      ),
    );
    state.corp.credits = 10;
    const negotiatingCenterId = putCorpRootInRemote(
      state,
      "onr_v1_314_corporate-negotiating-center",
    );
    state.cardInstances[negotiatingCenterId] = {
      ...state.cardInstances[negotiatingCenterId]!,
      faceup: true,
      rezzed: true,
    };
    const agendaId = moveCorpCardToHq(state, "simple_agenda");
    const operationId = moveCorpCardToHq(state, "simple_economy_operation");
    const creditsBefore = state.corp.credits;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.pendingChoice?.source).toContain(
      "p3_36.show_hq_agendas_for_credits",
    );
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(1);
    expect(getPlayerView(state, "corp").pendingChoice?.options[0]?.value).toBe(
      agendaId,
    );
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.map(
        (option) => option.publicLabel,
      ),
    ).toEqual(
      expect.arrayContaining(["HQ-Agenda", "HQ-Agenda"]),
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      operationId,
    );

    state = applyChoices(state, "corp", [`card_${agendaId}`]);

    expect(state.corp.hq).toEqual(expect.arrayContaining([agendaId, operationId]));
    expect(state.corp.credits).toBe(creditsBefore + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corp_hq_agenda_reveal",
      sourceDefinitionId: "onr_v1_314_corporate-negotiating-center",
      sourceTitle: "Corporate Negotiating Center",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "simple_agenda",
      publicRevealTitles: "Simple Agenda",
      revealedAgendaDefinitionIds: "simple_agenda",
      revealedCount: 1,
      gainedCredits: 1,
    });
    const corpPublicEvent = getPlayerView(state, "corp").publicEvents.at(-1);
    const runnerPublicEvent = getPlayerView(state, "runner").publicEvents.at(-1);
    expect(corpPublicEvent?.publicPayload).toMatchObject(
      runnerPublicEvent?.publicPayload ?? {},
    );
    expect(runnerPublicEvent?.publicPayload).toMatchObject({
      publicRevealDefinitionIds: "simple_agenda",
      publicRevealTitles: "Simple Agenda",
      revealedCount: 1,
    });
    expect(JSON.stringify(runnerPublicEvent?.publicPayload)).not.toContain(
      operationId,
    );
    expect(JSON.stringify(runnerPublicEvent?.publicPayload)).not.toContain(
      "simple_economy_operation",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves Rescheduler as deterministic HQ shuffle into R&D and draw", () => {
    let reorderState = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-rescheduler-hq-shuffle");
    reorderState.corp.credits = 10;
    reorderState = apply(
      reorderState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const reschedulerId = moveCorpCardToHq(
      reorderState,
      "onr_v1_336_rescheduler",
    );
    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === reschedulerId &&
        action.payload?.serverId === "new_remote",
    );
    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(reorderState, action) === "onr_v1_336_rescheduler",
    );
    const hqAgendaId = moveCorpCardToHq(reorderState, "simple_agenda");
    const hqOperationId = moveCorpCardToHq(
      reorderState,
      "simple_economy_operation",
    );
    const hqCount = reorderState.corp.hq.length;
    const initial = structuredClone(reorderState);
    const replayStart = reorderState.eventLog.length;

    reorderState = apply(
      reorderState,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1917AssetAbility === "rescheduler_hq_shuffle_draw",
    );

    expect(reorderState.corp.hq.length).toBe(hqCount);
    expect(reorderState.corp.hq).not.toEqual(
      expect.arrayContaining([hqAgendaId, hqOperationId]),
    );
    expect(reorderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_rescheduler_hq_shuffle_draw",
      hqCardCount: hqCount,
      drawnCount: hqCount,
    });
    const replay = replayEvents(
      initial,
      reorderState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(reorderState));
  });

  it("resolves V1.9.17 Solo Squad damage through a typed rezzed asset LegalAction", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-solo-squad-damage");
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const soloSquadId = moveCorpCardToHq(state, "onr_v1_342_solo-squad");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === soloSquadId &&
        action.payload?.serverId === "new_remote",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_342_solo-squad",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === soloSquadId,
      ),
    ).toBe(false);
    state.runner.tags = 1;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === soloSquadId,
    );
    const tagDrift = structuredClone(state);
    tagDrift.runner.tags = 0;
    const driftResult = applyAction(tagDrift, {
      matchId: tagDrift.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: tagDrift.stateVersion,
      idempotencyKey: "v1917-solo-squad-tag-drift",
    });
    expect(driftResult.ok).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === soloSquadId,
    );

    expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - 1));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
      resolvedEffects: [
        expect.objectContaining({
          kind: "damage",
          sourceDefinitionId: "onr_v1_342_solo-squad",
        }),
      ],
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Cowboy Sysop and Disinfectant, Inc. through visible installed-card targets", () => {
    let cowboyState = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-cowboy-installed-target");
    cowboyState.corp.credits = 10;
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const corpTargetId = putCorpRootInRemote(
      cowboyState,
      "onr_v1_309_bbs-whispering-campaign",
    );
    const cowboyId = moveCorpCardToHq(cowboyState, "onr_v1_316_cowboy-sysop");
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === cowboyId &&
        action.payload?.serverId === "new_remote",
    );
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(cowboyState, action) === "onr_v1_316_cowboy-sysop",
    );
    const cowboyInitial = structuredClone(cowboyState);
    const cowboyReplayStart = cowboyState.eventLog.length;

    cowboyState = apply(
      cowboyState,
      "corp",
      (action) =>
        action.payload?.v1951CorpUtilityAbility ===
          "corp_installed_card_to_hq" &&
        action.payload?.targetCardId === corpTargetId,
    );

    expect(cowboyState.corp.hq).toContain(corpTargetId);
    expect(
      cowboyState.corp.servers.some((server) =>
        server.root.includes(corpTargetId),
      ),
    ).toBe(false);
    expect(cowboyState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corp_installed_card_to_hq",
    });
    expect(
      JSON.stringify(cowboyState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
    const cowboyReplay = replayEvents(
      cowboyInitial,
      cowboyState.eventLog.slice(cowboyReplayStart),
    );
    expect(cowboyReplay.ok).toBe(true);
    expect(hashState(cowboyReplay.state)).toBe(hashState(cowboyState));

    let disinfectantState = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-disinfectant-virus-counter",
    );
    disinfectantState.corp.credits = 10;
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const virusTargetId = installRunnerProgramForTest(
      disinfectantState,
      "simple_decoder",
    );
    disinfectantState.cardInstances[virusTargetId] = {
      ...disinfectantState.cardInstances[virusTargetId]!,
      counters: { virus: 2 },
    };
    const disinfectantId = moveCorpCardToHq(
      disinfectantState,
      "onr_v1_319_disinfectant-inc",
    );
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === disinfectantId &&
        action.payload?.serverId === "new_remote",
    );
    disinfectantState = apply(
      disinfectantState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(disinfectantState, action) ===
          "onr_v1_319_disinfectant-inc",
    );
    expect(
      getLegalActions(disinfectantState, "corp").some(
        (action) => action.payload?.v1917AssetAbility === "remove_virus_counter",
      ),
    ).toBe(false);
    expect(
      disinfectantState.cardInstances[virusTargetId]?.counters?.virus,
    ).toBe(2);
  });

  it("triggers Setup! and TRAP! only from legal access windows without leaking hidden payloads", () => {
    const ambushes = [
      {
        definitionId: "onr_v1_340_setup",
        expectedTagsAdded: 0,
        damageAmount: 2,
      },
      {
        definitionId: "onr_v1_345_trap",
        expectedTagsAdded: 1,
        damageAmount: 3,
      },
    ] as const;
    for (const { definitionId, expectedTagsAdded, damageAmount } of ambushes) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.assetNodeEffects(
          `v1917-access-ambush-${definitionId}`,
        ),
      );
      state.corp.credits = 10;
      state.runner.credits = 10;
      const ambushId = putCorpRootInRemote(state, definitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const tagsBefore = state.runner.tags;
      const gripBefore = state.runner.grip.length;

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      state = passRootRezWindowBeforeAccessIfOpen(state);
      state = apply(state, "runner", (action) => action.type === "access_card");
      if (definitionId === "onr_v1_345_trap") {
        expect(state.pendingChoice?.source).toContain("p3_35.access_payment");
        state = applyChoice(state, "corp", "pay");
      }

      expect(state.run?.accessedCardId).toBe(ambushId);
      expect(state.runner.tags).toBe(tagsBefore + expectedTagsAdded);
      expect(state.runner.grip.length).toBe(Math.max(0, gripBefore - damageAmount));
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1917_access_ambush",
        ambushDefinitionId: definitionId,
        damageResolved: true,
        damageType: "net",
        damageAmount,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });
});

describe("V1.9.18 Generic Upgrade/Root/Server WIP", () => {
  it("adds all V1.9.18 WIP runtime definitions without release-promoting the next slice", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.serverUpgrades).toHaveLength(15);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.serverUpgrades) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("corp");
      expect(definition?.type, definitionId).toBe("upgrade");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /generic_upgrade_root_server|access_ambush|trace|city_grid|run_flow|tag|counter|hidden_zone|stealth/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("keeps generic V1.9.18 upgrade install, rez, access and trash side-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1918-generic-upgrade-install-rez-access",
    );
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const upgradeId = moveCorpCardToHq(state, "onr_v1_354_crybaby");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_354_crybaby",
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(upgradeId),
    );
    expect(remote?.id).toBe("remote_1");
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === upgradeId)?.definitionId,
    ).toBe("onr_v1_354_crybaby");

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects(
        "v1918-generic-upgrade-access-trash",
      ),
    );
    accessState.runner.credits = 10;
    const accessedUpgradeId = putCorpRootInRemote(
      accessState,
      "onr_v1_354_crybaby",
    );
    accessState.cardInstances[accessedUpgradeId] = {
      ...accessState.cardInstances[accessedUpgradeId]!,
      faceup: true,
      rezzed: true,
    };
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_354_crybaby",
    });
    expect(
      JSON.stringify(accessState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);

    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(accessState.corp.archives).toContain(accessedUpgradeId);
    expect(
      getPlayerView(accessState, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === accessedUpgradeId)
        ?.definitionId,
    ).toBe("onr_v1_354_crybaby");
    expect(validateGameState(accessState).ok).toBe(true);
  });

  it("applies Crybaby access counters, trace link reduction and runner removal", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects(
        "v1918-crybaby-counter-link-removal",
      ),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const crybabyId = putCorpRootInRemote(state, "onr_v1_354_crybaby");
    state.cardInstances[crybabyId] = {
      ...state.cardInstances[crybabyId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(cardCounterAmount(state, state.runner.identity, "crying")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_354_crybaby",
      hiddenZoneAction: "v1918_crybaby_access_counter",
      remainingCounters: 1,
    });
    state = apply(state, "runner", (action) => action.type === "decline_trash");

    let traceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-crybaby-link-trace"),
    );
    traceState.corp.credits = 5;
    traceState.runner.credits = 0;
    setCardCounterForTest(traceState, traceState.runner.identity, "crying", 1);
    const turbeauId = putCorpRootInRemote(
      traceState,
      "onr_v1_372_turbeau-delacroix",
    );
    traceState.cardInstances[turbeauId] = {
      ...traceState.cardInstances[turbeauId]!,
      faceup: true,
      rezzed: true,
    };
    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "access_card",
    );
    traceState = applyChoice(traceState, "corp", "bid_0");
    expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
      runnerLink: 0,
      cryingCounterCount: 1,
      cryingLinkReduction: 2,
    });

    traceState = applyChoice(traceState, "runner", "bid_0");
    traceState.activeSide = "runner";
    traceState.phase = "runner_action_phase";
    traceState.timingPoint = "runner_action.main";
    traceState.runner.clicks = 4;
    traceState.runner.credits = 20;
    traceState = apply(
      traceState,
      "runner",
      (action) => action.payload?.runnerAbility === "remove_crying_counter",
    );
    expect(cardCounterAmount(traceState, traceState.runner.identity, "crying")).toBe(0);
    expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      runnerAbility: "remove_crying_counter",
      removedCounterAmount: 1,
      remainingCounters: 0,
    });
  });

  it("resolves V1.9.18 upgrade access ambush damage without public hidden-info leaks", () => {
    const cases = [
      {
        definitionId: "onr_v1_356_dedicated-response-team",
        damageType: "meat",
        damageAmount: 3,
        startingTags: 1,
      },
      {
        definitionId: "onr_v1_357_dieter-esslin",
        damageType: "net",
        damageAmount: 1,
        startingTags: 0,
      },
    ] as const;

    for (const { definitionId, damageType, damageAmount, startingTags } of cases) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.assetNodeEffects(
          `v1918-upgrade-access-ambush-${definitionId}`,
        ),
      );
      state.runner.credits = 10;
      state.runner.tags = startingTags;
      const upgradeId = putCorpRootInRemote(state, definitionId);
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
      const gripBefore = state.runner.grip.length;
      const tagsBefore = state.runner.tags;
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === "remote_1",
      );
      state = apply(state, "runner", (action) => action.type === "access_card");

      expect(state.run?.accessedCardId).toBe(upgradeId);
      expect(state.runner.tags).toBe(tagsBefore);
      expect(state.runner.grip.length).toBe(
        Math.max(0, gripBefore - damageAmount),
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1918_upgrade_access_ambush",
        ambushDefinitionId: definitionId,
        damageResolved: true,
        damageType,
        damageAmount,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"hq"|"rd"/,
      );
      expect(validateGameState(state).ok).toBe(true);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("skips Dedicated Response Team damage for an untagged Runner without adding tags", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects(
        "v1918-dedicated-response-untagged",
      ),
    );
    state.runner.credits = 10;
    state.runner.tags = 0;
    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_356_dedicated-response-team",
    );
    state.cardInstances[upgradeId] = {
      ...state.cardInstances[upgradeId]!,
      faceup: true,
      rezzed: true,
    };
    const gripBefore = state.runner.grip.length;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.tags).toBe(0);
    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushDefinitionId: "onr_v1_356_dedicated-response-team",
      tagConditionMet: false,
      damageSkippedReason: "runner_not_tagged",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("starts Turbeau Delacroix through the side-safe access trace window", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-turbeau-access-trace"),
    );
    state.corp.credits = 5;
    state.runner.credits = 5;
    const upgradeId = putCorpRootInRemote(
      state,
      "onr_v1_372_turbeau-delacroix",
    );
    state.cardInstances[upgradeId] = {
      ...state.cardInstances[upgradeId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 10,
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
    });
    expect(state.pendingChoice?.side).toBe("corp");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      traceStarted: true,
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: "onr_v1_372_turbeau-delacroix",
      oncePerRunConsumed: true,
      baseTraceStrength: 10,
    });

    state = applyChoice(state, "corp", "bid_0");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Red Herrings as a server-bound agenda steal tax", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-red-herrings-steal-tax"),
    );
    state.runner.credits = 7;
    const redHerringsId = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");

    const stealAction = getLegalActions(state, "runner").find(
      (action) => action.type === "steal_agenda",
    );
    expect(stealAction?.costs).toEqual([{ credits: 5 }]);
    expect(stealAction?.payload).toMatchObject({
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostSourceDefinitionIds: "onr_v1_366_red-herrings",
      stealCostSourceTitles: "Red Herrings",
    });

    const stale = structuredClone(state);
    stale.cardInstances[redHerringsId] = {
      ...stale.cardInstances[redHerringsId]!,
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "runner",
        actionId: stealAction!.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "v1918-red-herrings-stale",
      }).ok,
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.credits).toBe(2);
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "steal_agenda",
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostSourceDefinitionIds: "onr_v1_366_red-herrings",
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("limits Red Herrings steal_cost to rezzed same-fort agenda access", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("p311-red-herrings-scope"),
    );
    state.runner.credits = 4;
    const redHerringsId = putCorpRootInRemote(state, "onr_v1_366_red-herrings");
    putCorpRootInRemote(state, "simple_agenda");
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "steal_agenda",
      ),
    ).toBe(false);
    expect(
      mustAction(state, "runner", (action) => action.type === "decline_trash")
        .payload,
    ).toMatchObject({
      stealCost: 5,
      stealBlockedByCost: true,
    });

    let unrezzed = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("p311-red-herrings-unrezzed"),
    );
    const unrezzedId = putCorpRootInRemote(unrezzed, "onr_v1_366_red-herrings");
    putCorpRootInRemote(unrezzed, "simple_agenda");
    unrezzed.cardInstances[unrezzedId] = {
      ...unrezzed.cardInstances[unrezzedId]!,
      faceup: false,
      rezzed: false,
    };
    unrezzed = apply(
      unrezzed,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    unrezzed = passRootRezWindowBeforeAccessIfOpen(unrezzed);
    unrezzed = apply(unrezzed, "runner", (action) => action.type === "access_card");
    unrezzed = apply(unrezzed, "runner", (action) => action.type === "decline_trash");
    unrezzed = apply(unrezzed, "runner", (action) => action.type === "access_card");
    expect(mustAction(unrezzed, "runner", (action) => action.type === "steal_agenda").costs).toEqual([]);

    let otherFort = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("p311-red-herrings-other-fort"),
    );
    const otherId = putCorpRootInRemote(otherFort, "onr_v1_366_red-herrings");
    otherFort.cardInstances[otherId] = {
      ...otherFort.cardInstances[otherId]!,
      faceup: true,
      rezzed: true,
    };
    const agendaId = moveCorpCardToHq(otherFort, "simple_agenda");
    keepOnlyCorpHqCard(otherFort, agendaId);
    otherFort = apply(
      otherFort,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    otherFort = apply(otherFort, "runner", (action) => action.type === "access_card");
    expect(mustAction(otherFort, "runner", (action) => action.type === "steal_agenda").costs).toEqual([]);
  });

  it("keeps V1.9.18 city-grid region replacement server-bound and visible", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-city-grid-region-install");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstGridId = moveCorpCardToHq(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === firstGridId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );

    const secondGridId = moveCorpCardToHq(state, "onr_v1_365_paris-city-grid");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const replacementAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );
    expect(replacementAction.payload?.regionReplacementWarning).toBe(true);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );

    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(remote?.root).toContain(secondGridId);
    expect(remote?.root).not.toContain(firstGridId);
    expect(state.corp.archives).toContain(firstGridId);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === firstGridId)?.definitionId,
    ).toBe("onr_v1_355_crystal-palace-station-grid");
    const replacementEvent = state.eventLog.at(-1);
    expect(replacementEvent?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_card",
          reason: "region_limit",
          sourceDefinitionId: "onr_v1_365_paris-city-grid",
          cardDefinitionId: "onr_v1_355_crystal-palace-station-grid",
          cardTitle: "Crystal Palace Station Grid",
        }),
      ]),
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps hidden old region names out of replacement events", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-hidden-region-replacement");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstGridId = moveCorpCardToHq(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === firstGridId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state.cardInstances[firstGridId] = {
      ...state.cardInstances[firstGridId]!,
      faceup: false,
      rezzed: false,
    };

    const secondGridId = moveCorpCardToHq(state, "onr_v1_365_paris-city-grid");
    const replacementAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );
    expect(replacementAction.payload?.regionReplacementWarning).toBe(true);

    state = apply(
      state,
      "corp",
      (action) => action.actionId === replacementAction.actionId,
    );

    expect(state.corp.archives).toContain(firstGridId);
    const eventText = JSON.stringify(state.eventLog.at(-1)?.publicPayload);
    expect(eventText).not.toContain("Crystal Palace Station Grid");
    expect(eventText).not.toContain("onr_v1_355_crystal-palace-station-grid");
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_card",
          reason: "region_limit",
          sourceDefinitionId: "onr_v1_365_paris-city-grid",
          redactedKind: "installed_card",
        }),
      ]),
    );
    expect(validateGameState(state).ok).toBe(true);
  });

  it("applies the generic region install baseline for P3.12 city grids", () => {
    const p312Ids = new Set([
      "onr_v1_360_jerusalem-city-grid",
      "onr_v1_362_new-galveston-city-grid",
      "onr_v1_374_washington-d-c-city-grid",
      "simple_upgrade",
    ]);
    let state = createGameAfterSetup({
      seed: "p312-region-baseline",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p312_region_baseline_corp",
        name: "P3.12 Region Baseline Corp",
        cards: [
          { id: "onr_v1_360_jerusalem-city-grid", quantity: 1 },
          { id: "onr_v1_362_new-galveston-city-grid", quantity: 1 },
          { id: "onr_v1_374_washington-d-c-city-grid", quantity: 1 },
          { id: "simple_upgrade", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (entry) => !p312Ids.has(entry.id),
          ),
        ],
      },
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const jerusalemId = moveCorpCardToHq(
      state,
      "onr_v1_360_jerusalem-city-grid",
    );
    state.corp.credits = 1;
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === jerusalemId,
      ),
    ).toBe(false);

    state.corp.credits = 2;
    const installJerusalem = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === jerusalemId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    expect(installJerusalem.costs).toEqual([{ clicks: 1, credits: 2 }]);
    state = apply(state, "corp", (action) => action.actionId === installJerusalem.actionId);
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[jerusalemId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });

    const nonRegionId = moveCorpCardToHq(state, "simple_upgrade");
    expect(
      mustAction(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === nonRegionId &&
          action.payload?.serverId === "remote_1",
      ).costs,
    ).toEqual([{ clicks: 1 }]);

    state.corp.credits = 7;
    const washingtonId = moveCorpCardToHq(
      state,
      "onr_v1_374_washington-d-c-city-grid",
    );
    const replaceWithWashington = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === washingtonId &&
        action.payload?.serverId === "remote_1",
    );
    expect(replaceWithWashington.costs).toEqual([{ clicks: 1, credits: 7 }]);
    expect(replaceWithWashington.payload?.regionReplacementWarning).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === replaceWithWashington.actionId,
    );
    expect(state.corp.archives).toContain(jerusalemId);
    expect(state.cardInstances[washingtonId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });

    state.corp.credits = 1;
    const newGalvestonId = moveCorpCardToHq(
      state,
      "onr_v1_362_new-galveston-city-grid",
    );
    const installOtherFortRegion = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === newGalvestonId &&
        action.payload?.serverId === "new_remote",
    );
    expect(installOtherFortRegion.payload?.regionReplacementWarning).toBeUndefined();
    state = apply(
      state,
      "corp",
      (action) => action.actionId === installOtherFortRegion.actionId,
    );
    expect(state.corp.archives).not.toContain(washingtonId);
    expect(state.cardInstances[newGalvestonId]).toMatchObject({
      faceup: true,
      rezzed: true,
    });
  });

  it("covers V1.9.18 counter and hidden-zone upgrade actions with migrated tag-condition suppression", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-counter-tag-hidden-actions");
    state.corp.credits = 10;
    state.runner.tags = 1;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const drDreffId = putCorpRootInRemote(state, "onr_v1_358_dr-dreff");
    const parisId = putCorpRootInRemote(state, "onr_v1_365_paris-city-grid");
    const galvestonId = putCorpRootInRemote(
      state,
      "onr_v1_362_new-galveston-city-grid",
    );
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    for (const upgradeId of [drDreffId, parisId, galvestonId]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1918UpgradeAbility === "add_power_counter",
    );
    expect(cardCounterAmount(state, drDreffId, "power")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      v1918UpgradeAbility: "add_power_counter",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1918UpgradeAbility === "tag_condition_credit" &&
          action.payload?.cardId === parisId,
      ),
    ).toBe(false);

    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1918UpgradeAbility === "reveal_rd_top",
      ),
    ).toBe(false);
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"/,
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Crystal Palace Station Grid break_subroutine_cost only on its fort", () => {
    const approachIce = (
      seed: string,
      targetServerId: "remote_1" | "rd",
      rezzedCrystal: boolean,
      withTesseract = false,
    ): { state: GameState; crystalId: CardInstanceId } => {
      let state = createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          cards: [
            ...ONR_V1_6_2_RUNNER_DECK.cards,
            { id: "simple_decoder", quantity: 1 },
          ],
        },
        corpDeck: {
          ...ONR_V1_6_2_CORP_DECK,
          cards: [
            ...ONR_V1_6_2_CORP_DECK.cards,
            {
              id: "onr_v1_355_crystal-palace-station-grid",
              quantity: 1,
            },
            ...(withTesseract
              ? [
                  {
                    id: "onr_v1_370_tesseract-fort-construction",
                    quantity: 1,
                  },
                ]
              : []),
          ],
        },
        agendaPointsToWin: 7,
      });
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state.corp.credits = 30;
      state.runner.credits = 20;
      const crystalId = putCorpRootInRemote(
        state,
        "onr_v1_355_crystal-palace-station-grid",
      );
      state.cardInstances[crystalId] = {
        ...state.cardInstances[crystalId]!,
        faceup: rezzedCrystal,
        rezzed: rezzedCrystal,
      };
      if (withTesseract) {
        const tesseractId = putCorpRootInRemote(
          state,
          "onr_v1_370_tesseract-fort-construction",
        );
        state.cardInstances[tesseractId] = {
          ...state.cardInstances[tesseractId]!,
          faceup: true,
          rezzed: true,
        };
      }
      putCorpIceOnServer(state, targetServerId, "onr_v1_230_cortical-scanner");
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      const decoderId = moveRunnerCardToGrip(state, "simple_decoder");
      state = apply(
        state,
        "runner",
        (action) => action.type === "install_card" && action.source === decoderId,
      );
      state.runner.credits = 20;
      state.runner.clicks = 4;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === targetServerId,
      );
      state = apply(state, "corp", (action) => action.type === "rez_ice");
      state = passCorpApproachRezWindowIfOpen(state);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) === "simple_decoder",
      );
      return { state, crystalId };
    };

    const { state: sameFort, crystalId } = approachIce(
      "p316-crystal-break-cost",
      "remote_1",
      true,
    );
    const breakActions = getLegalActions(sameFort, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sameFort, action) === "simple_decoder",
    );
    expect(breakActions).toHaveLength(3);
    expect(breakActions.map((action) => action.costs)).toEqual([
      [{ credits: 2 }],
      [{ credits: 2 }],
      [{ credits: 2 }],
    ]);
    expect(breakActions[0]?.payload).toMatchObject({
      breakSubroutineBaseCost: 1,
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
      breakSubroutineCostPerSubroutine: 1,
      breakSubroutineCostSourceDefinitionIds:
        "onr_v1_355_crystal-palace-station-grid",
      breakSubroutineCostSourceTitles: "Crystal Palace Station Grid",
    });
    expect(JSON.stringify(breakActions[0]?.payload)).not.toContain(crystalId);
    const paid = apply(
      sameFort,
      "runner",
      (action) => action.actionId === breakActions[0]?.actionId,
    );
    expect(paid.runner.credits).toBe(sameFort.runner.credits - 2);

    const stale = structuredClone(sameFort);
    stale.cardInstances[crystalId] = {
      ...stale.cardInstances[crystalId]!,
      faceup: false,
      rezzed: false,
    };
    const staleResult = applyAction(stale, {
      matchId: stale.matchId,
      side: "runner",
      actionId: breakActions[1]?.actionId ?? "",
      clientKnownStateVersion: stale.stateVersion,
      idempotencyKey: "p316-crystal-stale-break-cost",
    });
    expect(staleResult.ok).toBe(true);
    if (staleResult.ok)
      expect(staleResult.state.runner.credits).toBe(sameFort.runner.credits - 1);

    const { state: otherFort } = approachIce(
      "p316-crystal-other-fort",
      "rd",
      true,
    );
    expect(
      mustAction(
        otherFort,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(otherFort, action) === "simple_decoder",
      ).costs,
    ).toEqual([{ credits: 1 }]);

    const { state: unrezzed } = approachIce(
      "p316-crystal-unrezzed",
      "remote_1",
      false,
    );
    expect(
      mustAction(
        unrezzed,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(unrezzed, action) === "simple_decoder",
      ).costs,
    ).toEqual([{ credits: 1 }]);

    let tesseractState = approachIce(
      "p316-crystal-tesseract",
      "remote_1",
      true,
      true,
    ).state;
    for (const subroutineIndex of [0, 1, 2]) {
      tesseractState = apply(
        tesseractState,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(tesseractState, action) === "simple_decoder" &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    expect(
      mustAction(
        tesseractState,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(tesseractState, action) === "simple_decoder",
      ).costs,
    ).toEqual([{ credits: 2 }]);
  });

  it("uses the generic region install baseline for Crystal Palace Station Grid", () => {
    const p316Ids = new Set([
      "onr_v1_355_crystal-palace-station-grid",
      "onr_v1_360_jerusalem-city-grid",
    ]);
    let state = createGameAfterSetup({
      seed: "p316-crystal-region-baseline",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p316_crystal_region_corp",
        name: "P3.16 Crystal Region Corp",
        cards: [
          { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
          { id: "onr_v1_360_jerusalem-city-grid", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (entry) => !p316Ids.has(entry.id),
          ),
        ],
      },
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const crystalId = moveCorpCardToHq(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state.corp.credits = 4;
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === crystalId,
      ),
    ).toBe(false);

    state.corp.credits = 7;
    const jerusalemId = moveCorpCardToHq(
      state,
      "onr_v1_360_jerusalem-city-grid",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === jerusalemId &&
        action.payload?.serverId === "new_remote",
    );
    expect(state.cardInstances[jerusalemId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });

    state.corp.credits = 5;
    const installCrystal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === crystalId &&
        action.payload?.serverId === "remote_1",
    );
    expect(installCrystal.costs).toEqual([{ clicks: 1, credits: 5 }]);
    expect(installCrystal.payload?.regionReplacementWarning).toBe(true);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === installCrystal.actionId,
    );
    expect(state.cardInstances[crystalId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });
    expect(state.corp.archives).toContain(jerusalemId);
  });

  it("adds Crystal Palace Station Grid cost once per Pile Driver subroutine target", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p316-crystal-pile-driver",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "p316_crystal_pile_driver_runner",
          name: "P3.16 Crystal Pile Driver Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_047_pile-driver", quantity: 1 },
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "p316_crystal_pile_driver_corp",
          name: "P3.16 Crystal Pile Driver Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_355_crystal-palace-station-grid", quantity: 1 },
            { id: "onr_v1_278_wall-of-ice", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const crystalId = putCorpRootInRemote(
      state,
      "onr_v1_355_crystal-palace-station-grid",
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    installRunnerProgramForTest(state, "onr_v1_047_pile-driver");
    const cloakId = installRunnerProgramForTest(state, "onr_v1_011_cloak");
    setCardCounterForTest(state, cloakId, "bit", 3);
    const iceId = putCorpIceOnServer(
      state,
      "remote_1",
      "onr_v1_278_wall-of-ice",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.multiBreakSubroutines === true &&
        action.payload?.subroutineIndexes === "0,1,2,3",
    );
    expect(breakAction.costs).toEqual([{ credits: 7 }]);
    expect(breakAction.payload).toMatchObject({
      breakSubroutineCount: 4,
      breakSubroutineBaseCost: 3,
      breakSubroutineAdditionalCost: 4,
      breakSubroutineTotalCost: 7,
      breakSubroutineCostPerSubroutine: 1,
      breakSubroutineCostSourceDefinitionIds:
        "onr_v1_355_crystal-palace-station-grid",
    });
  });

  it("applies Washington D.C. City Grid as a same-fort agenda_difficulty modifier", () => {
    const p312Ids = new Set([
      "onr_v1_374_washington-d-c-city-grid",
      "simple_agenda",
    ]);
    let state = createGameAfterSetup({
      seed: "p312-washington-difficulty",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p312_washington_corp",
        name: "P3.12 Washington Corp",
        cards: [
          { id: "onr_v1_374_washington-d-c-city-grid", quantity: 1 },
          { id: "simple_agenda", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (entry) => !p312Ids.has(entry.id),
          ),
        ],
      },
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 10;
    const washingtonId = putCorpRootInRemote(
      state,
      "onr_v1_374_washington-d-c-city-grid",
    );
    const agendaId = putCorpRootInRemote(state, "simple_agenda");
    const printedDifficulty =
      DEMO_CARDS_BY_ID.simple_agenda?.advancementRequirement ?? 0;
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      advancementCounters: printedDifficulty - 1,
    };
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          action.payload?.cardId === agendaId,
      ),
    ).toBe(false);

    state.cardInstances[washingtonId] = {
      ...state.cardInstances[washingtonId]!,
      faceup: true,
      rezzed: true,
    };
    const scoreAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        action.payload?.cardId === agendaId,
    );
    expect(
      getPlayerView(state, "corp")
        .servers.flatMap((server) => server.root)
        .find((card) => card.instanceId === agendaId)?.advancementRequirement,
    ).toBe(printedDifficulty - 1);
    expect(
      collectActiveModifiers(state).filter(
        (modifier) =>
          modifier.kind === "agenda_difficulty" &&
          modifier.sourceDefinitionId === "onr_v1_374_washington-d-c-city-grid",
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: -1,
          duration: "while_rezzed",
          visibility: "public",
        }),
      ]),
    );

    const stale = structuredClone(state);
    stale.cardInstances[washingtonId] = {
      ...stale.cardInstances[washingtonId]!,
      faceup: false,
      rezzed: false,
    };
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "corp",
        actionId: scoreAction.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "p312-washington-stale",
      }).ok,
    ).toBe(false);

    const otherFort = structuredClone(state);
    otherFort.corp.servers.push({
      id: "remote_2",
      kind: "remote",
      label: "Remote 2",
      ice: [],
      root: [agendaId],
    });
    const remoteOne = otherFort.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remoteOne) throw new Error("remote_1 missing");
    remoteOne.root = remoteOne.root.filter((id) => id !== agendaId);
    otherFort.cardInstances[agendaId] = {
      ...otherFort.cardInstances[agendaId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_2" },
    };
    expect(
      getLegalActions(otherFort, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          action.payload?.cardId === agendaId,
      ),
    ).toBe(false);
  });

  it("covers V1.9.18 city-grid trace pool and fort stealth block paths", () => {
    let traceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-paris-city-grid-trace"),
    );
    traceState.corp.credits = 5;
    traceState.runner.credits = 0;
    const parisId = putCorpRootInRemote(
      traceState,
      "onr_v1_365_paris-city-grid",
    );
    traceState.cardInstances[parisId] = {
      ...traceState.cardInstances[parisId]!,
      faceup: true,
      rezzed: true,
      counters: { bit: 3 },
    };
    const turbeauId = putCorpRootInRemote(
      traceState,
      "onr_v1_372_turbeau-delacroix",
    );
    traceState.cardInstances[turbeauId] = {
      ...traceState.cardInstances[turbeauId]!,
      faceup: true,
      rezzed: true,
    };
    const traceServer = traceState.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    if (traceServer) traceServer.root = [turbeauId, parisId];
    const traceInitial = structuredClone(traceState);
    const traceReplayStart = traceState.eventLog.length;

    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(traceState.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 10,
      corpBidMax: 8,
      sourceDefinitionId: "onr_v1_372_turbeau-delacroix",
      fortTraceBitPoolSourceCardInstanceId: parisId,
      fortTraceBitPoolServerId: "remote_1",
    });
    traceState = applyChoice(traceState, "corp", "bid_6");
    expect(cardCounterAmount(traceState, parisId, "bit")).toBe(0);
    expect(traceState.corp.credits).toBe(2);
    expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      corpBid: 6,
      corpCreditBid: 3,
      fortTraceBitPoolSpent: 3,
      fortTraceBitPoolRemaining: 0,
      fortTraceBitPoolServerId: "remote_1",
    });
    traceState = applyChoice(traceState, "runner", "bid_0");
    expect(traceState.runner.tags).toBe(1);
    expect(validateGameState(traceState).ok).toBe(true);
    const traceReplay = replayEvents(
      traceInitial,
      traceState.eventLog.slice(traceReplayStart),
    );
    expect(traceReplay.ok).toBe(true);
    expect(hashState(traceReplay.state)).toBe(hashState(traceState));

    let runState = toRunnerTurn(MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-stealth-block"));
    runState.runner.credits = 20;
    const surveillanceId = putCorpRootInRemote(
      runState,
      "onr_v1_373_twenty-four-hour-surveillance",
    );
    runState.cardInstances[surveillanceId] = {
      ...runState.cardInstances[surveillanceId]!,
      faceup: true,
      rezzed: true,
    };
    const breakerId = addInstalledRunnerProgramForTest(
      runState,
      "onr_v1_014_codecracker",
      "stealth_block_codecracker",
    );
    const stealthId = addInstalledRunnerProgramForTest(
      runState,
      "onr_v1_035_invisibility",
      "stealth_block_invisibility",
    );
    addRezzedCorpIceForTest(
      runState,
      "onr_v1_261_quandary",
      "remote_1",
      "stealth_block_quandary",
    );
    runState.cardInstances[stealthId] = {
      ...runState.cardInstances[stealthId]!,
      counters: { bit: 1 },
    };
    runState.runner.credits = 0;

    const runAction = getLegalActions(runState, "runner").find(
      (action) =>
        action.type === "start_run" &&
        action.payload?.serverId === "remote_1",
    );
    expect(runAction?.payload?.v1918UpgradeAbility).toBeUndefined();
    expect(runAction?.costs).toEqual([{ clicks: 1 }]);
    runState = apply(
      runState,
      "runner",
      (action) => action.actionId === runAction?.actionId,
    );

    expect(
      getLegalActions(runState, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          action.payload?.breakerId === breakerId,
      ),
    ).toBe(false);
    runState.runner.credits = 1;
    const runInitial = structuredClone(runState);
    const runReplayStart = runState.eventLog.length;
    runState = apply(
      runState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === breakerId,
    );
    expect(cardCounterAmount(runState, stealthId, "bit")).toBe(1);
    expect(runState.runner.credits).toBe(0);
    expect(runState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
    });
    expect(validateGameState(runState).ok).toBe(true);
    const runReplay = replayEvents(
      runInitial,
      runState.eventLog.slice(runReplayStart),
    );
    expect(runReplay.ok).toBe(true);
    expect(hashState(runReplay.state)).toBe(hashState(runState));
  });
});
