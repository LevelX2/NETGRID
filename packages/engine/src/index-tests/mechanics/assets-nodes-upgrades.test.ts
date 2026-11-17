import { serializedDefinitionReferences } from "../../test-fixtures/serialized-definition-references";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  applyEffectCommands,
  checkWinConditions,
  createGame,
  createGameAfterSetup,
  CARD_DEFINITIONS_BY_ID,
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
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
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
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.side, String(definitionId)).toBe("corp");
      expect(definition?.type, String(definitionId)).toBe("asset");
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(
        cardImplementationForDefinitionId(definitionId),
        String(definitionId),
      ).toBeDefined();
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
    }
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("keeps ESA Contract install, rez, activated draw, access and trash side-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-generic-asset-install-rez-access",
    );
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const assetId = moveCorpCardToHq(state, 533);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 533,
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(assetId),
    );
    expect(remote?.id).toBe("r1");
    expect(state.cardInstances[assetId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === assetId)?.definitionId,
    ).toBe(533);

    putCorpCardOnTopOfRd(state, 588);
    putCorpCardOnTopOfRd(state, 596);
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
    const esaDrawAction = getLegalActions(state, "corp").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === assetId,
    );
    expect(esaDrawAction).toMatchObject({
      label: "ESA Contract: 2 Karten ziehen",
      payload: {
        cardImplementationAbilityLabel: "ESA Contract: 2 Karten ziehen",
      },
    });
    state = apply(
      state,
      "corp",
      (action) => action.actionId === esaDrawAction?.actionId,
    );
    expect(state.corp.hq.length).toBe(hqBeforeAbility + 2);
    expect(state.corp.rd.length).toBe(rdBeforeAbility - 2);
    expect(state.corp.credits).toBe(creditsBeforeAbility);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 1);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 533,
      cardImplementationAbility: "activated",
      sourceDefinitionId: 533,
      drawnCards: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 2,
          sourceDefinitionId: 533,
          sourceTitle: "ESA Contract",
          reason: "card_resolver",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"/,
    );

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1917-generic-asset-access-trash"),
    );
    accessState.runner.credits = 10;
    const accessedAssetId = putCorpRootInRemote(
      accessState,
      533,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: 533,
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
    ).toBe(533);
    expect(validateGameState(accessState).ok).toBe(true);
  });

  it("applies rezzed V1.9.17 recurring campaign credits at Corp turn start", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-recurring-campaign-start-turn",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const campaignId = moveCorpCardToHq(state, 538);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 538,
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
      523,
      538,
    ] as const;
    for (const definitionId of economyAssets) {
      let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
        `v1917-economy-asset-${definitionId}`,
      );
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
          action.type === "rez_card" &&
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
      expect(validateGameState(state).ok, String(definitionId)).toBe(true);
    }
  });

  it("replaces the basic Corp credit action with an optional Investment Firm credit choice", () => {
    let noFirm = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-no-source",
    );
    noFirm = apply(
      noFirm,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const noFirmCreditsBefore = noFirm.corp.credits;
    noFirm = apply(
      noFirm,
      "corp",
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    expect(noFirm.corp.credits).toBe(noFirmCreditsBefore + 1);
    expect(noFirm.pendingChoice).toBeUndefined();

    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-credit-choice",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firmId = moveCorpCardToHq(state, 541);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 541,
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
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );

    expect(state.corp.credits).toBe(creditsBefore);
    expect(state.corp.clicks).toBe(clicksBefore - 1);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("investment_firm.credit_gain"),
      minSelections: 1,
      maxSelections: 1,
    });
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(expect.arrayContaining(["redirect_0", "redirect_1"]));
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
          selectedOptionIds: ["redirect_1"],
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
          selectedOptionIds: ["redirect_1"],
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
        selectedOptionIds: ["redirect_0"],
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
        selectedOptionIds: ["redirect_1"],
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
        .servers.find((server) => server.id === "r1")
        ?.root.find((card) => card.instanceId === firmId)?.counters
        ?.recurring_credit,
    ).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      gainedCredits: 0,
      amounts: {
        investmentFirmRedirectedAmount: 1,
        investmentFirmCreditsAddedPerSource: 2,
        gainedCredits: 0,
      },
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const creditsBeforeTurnStartDrain = state.corp.credits;
    const startTurnInitial = structuredClone(state);
    const startTurnReplayStart = state.eventLog.length;
    state = toRunnerTurnFromCorpMain(state);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source.startsWith("corp_start.order:"))
      state = applyChoices(state, "corp", [state.pendingChoice.options[0]!.id]);
    expect(state.corp.credits).toBe(creditsBeforeTurnStartDrain + 1);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(1);
    expect(state.corp.archives).not.toContain(firmId);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "gain_credits",
        amount: 1,
        reason: "installed_economy_start_of_corp_turn",
        sourceDefinitionId: 541,
        sourceCardInstanceId: firmId,
      }),
    );
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
      expect.objectContaining({
        kind: "counter_change",
        counterType: "recurring_credit",
        removedCounterAmount: 1,
        remainingCounters: 1,
        reason: "installed_economy_start_of_corp_turn",
        sourceDefinitionId: 541,
        sourceCardInstanceId: firmId,
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
        kind: "counter_change",
        counterType: "recurring_credit",
        removedCounterAmount: 1,
        remainingCounters: 0,
        sourceDefinitionId: 541,
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
      sourceDefinitionId?: number;
    }>;
    expect(
      emptyFirmTurnStartEffects.some(
        (effect) =>
          effect.sourceDefinitionId === 541 &&
          effect.kind === "gain_credits",
      ),
    ).toBe(false);

    let multi = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-investment-firm-multiple",
    );
    multi = apply(multi, "corp", (action) => action.type === "mandatory_draw");
    const firstFirm = putCorpRootInRemote(multi, 541);
    const secondFirm = `${firstFirm}_copy` as typeof firstFirm;
    const firstFirmZone = multi.cardInstances[firstFirm]?.zone;
    const firstFirmServerId =
      firstFirmZone?.zone === "serverRoot"
        ? firstFirmZone.serverId
        : "r1";
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
      (action) =>
        action.type === "gain_credit" && action.source === "basic_action",
    );
    const multiOptions = multi.pendingChoice?.options.map(
      (option) => option.id,
    );
    expect(multiOptions).toEqual([
      "redirect_0",
      "redirect_1_source_1",
      "redirect_1_source_2",
    ]);
    multi = applyChoices(multi, "corp", ["redirect_1_source_2"]);
    expect(cardCounterAmount(multi, firstFirm, "recurring_credit")).toBe(0);
    expect(cardCounterAmount(multi, secondFirm, "recurring_credit")).toBe(2);
    expect(validateGameState(state).ok).toBe(true);
    expect(validateGameState(multi).ok).toBe(true);
  });

  it("applies Investment Firm to multi-credit Operation gains", () => {
    let state = createGameAfterSetup({
      seed: "v1917-investment-firm-operation-gain",
      runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        id: "v1917_investment_firm_operation_gain_corp",
        cards: [
          { id: 502, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firmId = putCorpRootInRemote(state, 541);
    state.cardInstances[firmId] = {
      ...state.cardInstances[firmId]!,
      faceup: true,
      rezzed: true,
    };
    const operationId = moveCorpCardToHq(
      state,
      502,
    );
    const creditsBefore = state.corp.credits;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === operationId,
    );

    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "redirect_0",
      "redirect_1",
      "redirect_2",
      "redirect_3",
    ]);
    expect(state.corp.credits).toBe(creditsBefore);
    state = applyChoices(state, "corp", ["redirect_2"]);
    expect(state.corp.credits).toBe(creditsBefore + 1);
    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(4);
  });

  it("resumes lifecycle effects after an Investment Firm credit choice", () => {
    let state = createGameAfterSetup({
      seed: "v1917-investment-firm-lifecycle-continuation",
      runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        id: "v1917_investment_firm_lifecycle_corp",
        cards: [
          { id: 520, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards,
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    scoreCorpAgendaForTest(state, 588);
    const firmId = putCorpRootInRemote(state, 541);
    state.cardInstances[firmId] = {
      ...state.cardInstances[firmId]!,
      faceup: true,
      rezzed: true,
    };
    const acmeId = putCorpRootInRemote(
      state,
      520,
    );

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === acmeId,
    );

    expect(state.pendingChoice?.source).toContain(
      "investment_firm.credit_gain",
    );
    expect(state.corp.archives).not.toContain(acmeId);
    state = applyChoices(state, "corp", ["redirect_6"]);

    expect(cardCounterAmount(state, firmId, "recurring_credit")).toBe(12);
    expect(state.corp.archives).toContain(acmeId);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("loads and spends Spinn Public Relations bits through CardImplementation", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-spinn-public-relations-pool",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const spinnId = moveCorpCardToHq(
      state,
      556,
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 556,
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
      cardDefinitionId: 556,
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
        state = apply(
          state,
          "corp",
          (action) => action.type === "mandatory_draw",
        );
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
      523,
      541,
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
      if (definitionId === 523)
        setCardCounterForTest(state, assetId, "bit", 12);
      if (definitionId === 541)
        setCardCounterForTest(state, assetId, "recurring_credit", 1);
    }
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    if (state.pendingChoice?.source.startsWith("corp_start.order:"))
      state = applyChoices(state, "corp", [state.pendingChoice.options[0]!.id]);

    expect(state.corp.credits).toBe(creditsBefore + 3);
    expect(
      state.corp.servers.some((server) =>
        server.root.some(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId ===
              523 &&
            cardCounterAmount(state, cardId, "bit") === 10,
        ),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.some((server) =>
        server.root.some(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId ===
              541 &&
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

  it("uses a generic rez_card LegalAction for BBS Whispering Campaign and replays it exactly", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-bbs-generic-card-rez-event",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const bbsId = moveCorpCardToHq(state, 521);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === bbsId &&
        action.payload?.serverId === "new_remote",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const bbsRezAction = getLegalActions(state, "corp").find(
      (action) => action.payload?.cardId === bbsId,
    );

    expect(bbsRezAction?.type).toBe("rez_card");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" && action.payload?.cardId === bbsId,
    );

    expect(state.eventLog.at(-1)).toMatchObject({
      type: "rez_card",
      visibilityClass: "hidden_info_barrier",
      publicPayload: {
        actionType: "rez_card",
        cardDefinitionId: 521,
      },
    });
    expect(cardCounterAmount(state, bbsId, "bit")).toBe(16);
    expect(validateGameState(state).ok).toBe(true);
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
      521,
    );
    const hostedId = putCorpRootInRemote(
      state,
      530,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
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
    const traceAssets = [[522, 5]] as const;
    for (const [definitionId, traceLimit] of traceAssets) {
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
          action.type === "rez_card" &&
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
        traceLimit,
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
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-krumz-trace-bit-source",
    );
    state.corp.credits = 10;
    state.runner.credits = 0;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const krumzId = moveCorpCardToHq(state, 542);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 542,
    );
    expect(cardCounterAmount(state, krumzId, "bit")).toBe(1);
    const bloodCatId = moveCorpCardToHq(state, 522);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 522,
    );
    state.corp.credits = 0;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === bloodCatId,
    );
    expect(
      state.pendingChoice?.options.some((option) => option.id === "bid_1"),
    ).toBe(true);
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
      526,
    );
    state.cardInstances[negotiatingCenterId] = {
      ...state.cardInstances[negotiatingCenterId]!,
      faceup: true,
      rezzed: true,
    };
    const agendaId = moveCorpCardToHq(state, 588);
    const operationId = moveCorpCardToHq(state, 596);
    keepOnlyCorpHqCards(state, [agendaId, operationId]);
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
    ).toEqual(expect.arrayContaining(["HQ-Agenda", "HQ-Agenda"]));
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      operationId,
    );

    state = applyChoices(state, "corp", [`card_${agendaId}`]);

    expect(state.corp.hq).toEqual(
      expect.arrayContaining([agendaId, operationId]),
    );
    expect(state.corp.credits).toBe(creditsBefore + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corp_hq_agenda_reveal",
      sourceDefinitionId: 526,
      sourceTitle: "Corporate Negotiating Center",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: String(588),
      publicRevealTitles: "Simple Agenda",
      revealedAgendaDefinitionIds: "588",
      revealedCount: 1,
      gainedCredits: 1,
    });
    const corpPublicEvent = getPlayerView(state, "corp").publicEvents.at(-1);
    const runnerPublicEvent = getPlayerView(state, "runner").publicEvents.at(
      -1,
    );
    expect(corpPublicEvent?.publicPayload).toMatchObject(
      runnerPublicEvent?.publicPayload ?? {},
    );
    expect(runnerPublicEvent?.publicPayload).toMatchObject({
      publicRevealDefinitionIds: String(588),
      publicRevealTitles: "Simple Agenda",
      revealedCount: 1,
    });
    expect(JSON.stringify(runnerPublicEvent?.publicPayload)).not.toContain(
      operationId,
    );
    expect(serializedDefinitionReferences(JSON.stringify(runnerPublicEvent?.publicPayload))).not.toContain(
      596,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves each Corporate Negotiating Center exactly once", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1917-corporate-negotiating-center-two-copies",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          id: "v1917_corporate_negotiating_center_two_copies",
          name: "Corporate Negotiating Center Two Copies",
          cards: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp.cards.map((card) =>
            card.id === 526
              ? { ...card, quantity: 2 }
              : card,
          ),
        },
        agendaPointsToWin: 7,
      }),
    );
    const centerIds = Object.entries(state.cardInstances)
      .filter(
        ([, card]) =>
          card.definitionId === 526,
      )
      .map(([id]) => id as CardInstanceId);
    expect(centerIds).toHaveLength(2);
    for (const [index, centerId] of centerIds.entries()) {
      removeEverywhere(state, centerId);
      const serverId = `r${index + 1}` as `r${number}`;
      state.corp.servers.push({
        id: serverId,
        kind: "remote",
        label: `Remote ${index + 1}`,
        ice: [],
        root: [centerId],
      });
      state.cardInstances[centerId] = {
        ...state.cardInstances[centerId]!,
        zone: { side: "corp", zone: "serverRoot", serverId },
        faceup: true,
        rezzed: true,
      };
    }
    const firstAgendaId = moveCorpCardToHq(state, 588);
    const secondAgendaId = moveCorpCardCopyToHq(state, 588);
    const creditsBefore = state.corp.credits;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("corp_start.order:"),
      minSelections: 1,
      maxSelections: 1,
    });
    const secondCenterFirst = state.pendingChoice?.options.find(
      (option) => option.value === centerIds[1],
    )?.id;
    if (!secondCenterFirst)
      throw new Error(
        "Missing second Corporate Negotiating Center order option",
      );
    state = applyChoice(state, "corp", secondCenterFirst);
    state = applyChoices(state, "corp", [
      `card_${firstAgendaId}`,
      `card_${secondAgendaId}`,
    ]);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("show_hq_agendas_for_credits"),
    });
    state = applyChoices(state, "corp", [
      `card_${firstAgendaId}`,
      `card_${secondAgendaId}`,
    ]);

    expect(state.corp.credits).toBe(creditsBefore + 4);
    expect(state.pendingChoice).toBeUndefined();
  });

  it("resolves Rescheduler as deterministic HQ shuffle into R&D and draw", () => {
    let reorderState = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-rescheduler-hq-shuffle",
    );
    reorderState.corp.credits = 10;
    reorderState = apply(
      reorderState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const reschedulerId = moveCorpCardToHq(
      reorderState,
      548,
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
        action.type === "rez_card" &&
        sourceDefinition(reorderState, action) === 548,
    );
    addRezzedCorpRootForTest(
      reorderState,
      29,
      "r2",
      "rescheduler_spg",
    );
    const hqAgendaId = moveCorpCardToHq(reorderState, 588);
    const hqOperationId = moveCorpCardToHq(
      reorderState,
      596,
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

    expect(reorderState.corp.hq.length).toBe(0);
    expect(reorderState.pendingCorpDraw).toMatchObject({
      baseDrawCount: hqCount,
      replacementDrawCount: 1,
    });
    expect(reorderState.pendingChoice?.options).toHaveLength(hqCount + 1);
    expect(reorderState.corp.hq).not.toEqual(
      expect.arrayContaining([hqAgendaId, hqOperationId]),
    );
    expect(reorderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1917_rescheduler_hq_shuffle_draw",
      hqCardCount: hqCount,
      drawnCount: hqCount,
    });
    reorderState = applyChoice(
      reorderState,
      "corp",
      String(reorderState.pendingChoice?.options[0]?.id),
    );
    expect(reorderState.corp.hq.length).toBe(hqCount);
    expect(reorderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      strategicPlanningGroupBaseDrawCount: hqCount,
      strategicPlanningGroupAdditionalDrawCount: 1,
      strategicPlanningGroupNetDrawCount: hqCount,
    });
    const replay = replayEvents(
      initial,
      reorderState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(reorderState));
  });

  it("resolves V1.9.17 Solo Squad damage through a typed rezzed asset LegalAction", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-solo-squad-damage",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const soloSquadId = moveCorpCardToHq(state, 554);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 554,
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
    expect(legal.label).toBe("Solo Squad: Dem Runner 1 Meat Damage zufügen");
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
          sourceDefinitionId: 554,
        }),
      ],
    });
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Cowboy Sysop and Disinfectant, Inc. through visible installed-card targets", () => {
    let cowboyState = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1917-cowboy-installed-target",
    );
    cowboyState.corp.credits = 10;
    cowboyState = apply(
      cowboyState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const corpTargetId = putCorpRootInRemote(
      cowboyState,
      521,
    );
    const cowboyId = moveCorpCardToHq(cowboyState, 528);
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
        action.type === "rez_card" &&
        sourceDefinition(cowboyState, action) === 528,
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
      591,
    );
    disinfectantState.cardInstances[virusTargetId] = {
      ...disinfectantState.cardInstances[virusTargetId]!,
      counters: { virus: 2 },
    };
    const disinfectantId = moveCorpCardToHq(
      disinfectantState,
      531,
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
        action.type === "rez_card" &&
        sourceDefinition(disinfectantState, action) ===
          531,
    );
    expect(
      getLegalActions(disinfectantState, "corp").some(
        (action) =>
          action.payload?.v1917AssetAbility === "remove_virus_counter",
      ),
    ).toBe(false);
    expect(
      disinfectantState.cardInstances[virusTargetId]?.counters?.virus,
    ).toBe(2);
  });

  it("triggers Setup! and TRAP! only from legal access windows without leaking hidden payloads", () => {
    const ambushes = [
      {
        definitionId: 552,
        expectedTagsAdded: 0,
        damageAmount: 2,
      },
      {
        definitionId: 557,
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
          action.payload?.serverId === "r1",
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      state = passRootRezWindowBeforeAccessIfOpen(state);
      state = apply(state, "runner", (action) => action.type === "access_card");
      if (definitionId === 557) {
        expect(state.pendingChoice?.source).toContain("p3_35.access_payment");
        state = applyChoice(state, "corp", "pay");
      }

      expect(state.run?.accessedCardId).toBe(ambushId);
      expect(state.runner.tags).toBe(tagsBefore + expectedTagsAdded);
      expect(state.runner.grip.length).toBe(
        Math.max(0, gripBefore - damageAmount),
      );
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
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.side, String(definitionId)).toBe("corp");
      expect(definition?.type, String(definitionId)).toBe("upgrade");
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(
        cardImplementationForDefinitionId(definitionId),
        String(definitionId),
      ).toBeDefined();
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
    }
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("keeps generic V1.9.18 upgrade install, rez, access and trash side-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1918-generic-upgrade-install-rez-access",
    );
    state.corp.credits = 10;
    state.runner.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const upgradeId = moveCorpCardToHq(state, 566);
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
        action.type === "rez_card" &&
        sourceDefinition(state, action) === 566,
    );

    const remote = state.corp.servers.find((server) =>
      server.root.includes(upgradeId),
    );
    expect(remote?.id).toBe("r1");
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === remote?.id)
        ?.root.find((card) => card.instanceId === upgradeId)?.definitionId,
    ).toBe(566);

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects(
        "v1918-generic-upgrade-access-trash",
      ),
    );
    accessState.runner.credits = 10;
    const accessedUpgradeId = putCorpRootInRemote(
      accessState,
      566,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: 566,
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
    ).toBe(566);
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
    const crybabyId = putCorpRootInRemote(state, 566);
    state.cardInstances[crybabyId] = {
      ...state.cardInstances[crybabyId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(cardCounterAmount(state, state.runner.identity, "crying")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: 566,
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
      584,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "access_card",
    );
    traceState = applyChoice(traceState, "corp", "bid_0");
    expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      sourceDefinitionId: 584,
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
    expect(
      cardCounterAmount(traceState, traceState.runner.identity, "crying"),
    ).toBe(0);
    expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      abilityId: "remove_crying_counter",
      removedCounterAmount: 1,
      remainingCounters: 0,
    });
  });

  it("resolves V1.9.18 upgrade access ambush damage without public hidden-info leaks", () => {
    const cases = [
      {
        definitionId: 568,
        damageType: "meat",
        damageAmount: 3,
        startingTags: 1,
      },
      {
        definitionId: 569,
        damageType: "net",
        damageAmount: 1,
        startingTags: 0,
      },
    ] as const;

    for (const {
      definitionId,
      damageType,
      damageAmount,
      startingTags,
    } of cases) {
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
          action.payload?.serverId === "r1",
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
      568,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.tags).toBe(0);
    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushDefinitionId: 568,
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
      584,
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.trace).toMatchObject({
      status: "corp_bid",
      traceLimit: 10,
      sourceDefinitionId: 584,
      returnPhase: "run",
      returnTimingPoint: "access.resolve_card",
      returnActiveSide: "runner",
    });
    expect(state.pendingChoice?.side).toBe("corp");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      traceStarted: true,
      sourceDefinitionId: 584,
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1918_upgrade_access_trace",
      ambushDefinitionId: 584,
      oncePerRunConsumed: true,
      traceLimit: 10,
    });

    state = applyChoice(state, "corp", "bid_1");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(state.phase).toBe("run");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(state.activeSide).toBe("runner");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trash_accessed_card" ||
          action.type === "decline_trash",
      ),
    ).toBe(true);
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
    const redHerringsId = putCorpRootInRemote(state, 578);
    const agendaId = putCorpRootInRemote(state, 588);
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
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "runner", (action) => action.type === "decline_trash");
    state = apply(state, "runner", (action) => action.type === "access_card");

    const stealAction = getLegalActions(state, "runner").find(
      (action) => action.type === "steal_agenda",
    );
    const declineStealAction = getLegalActions(state, "runner").find(
      (action) => action.type === "decline_trash",
    );
    expect(stealAction?.costs).toEqual([{ credits: 5 }]);
    expect(stealAction?.payload).toMatchObject({
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostSourceDefinitionIds: String(578),
      stealCostSourceTitles: "Red Herrings",
    });
    expect(declineStealAction).toMatchObject({
      label: "Simple Agenda nicht stehlen",
      costs: [],
      payload: {
        cardId: agendaId,
        stealCost: 5,
        stealAdditionalCost: 5,
        stealCostSourceDefinitionIds: String(578),
      },
    });

    const declined = apply(
      structuredClone(state),
      "runner",
      (action) => action.actionId === declineStealAction?.actionId,
    );
    expect(declined.runner.credits).toBe(7);
    expect(declined.runner.scoreArea).not.toContain(agendaId);
    expect(
      declined.corp.servers.find((server) => server.id === "r1")?.root,
    ).toContain(agendaId);
    expect(declined.run).toBeUndefined();
    expect(validateGameState(declined).ok).toBe(true);
    const declinedReplay = replayEvents(
      initial,
      declined.eventLog.slice(replayStart),
    );
    expect(declinedReplay.ok).toBe(true);
    expect(hashState(declinedReplay.state)).toBe(hashState(declined));

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
    expect(
      applyAction(stale, {
        matchId: stale.matchId,
        side: "runner",
        actionId: declineStealAction!.actionId,
        clientKnownStateVersion: stale.stateVersion,
        idempotencyKey: "v1918-red-herrings-decline-stale",
      }).ok,
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.credits).toBe(2);
    expect(state.runner.scoreArea).toContain(agendaId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "steal_agenda",
      stealCost: 5,
      stealAdditionalCost: 5,
      stealCostSourceDefinitionIds: String(578),
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
    const redHerringsId = putCorpRootInRemote(state, 578);
    putCorpRootInRemote(state, 588);
    state.cardInstances[redHerringsId] = {
      ...state.cardInstances[redHerringsId]!,
      faceup: true,
      rezzed: true,
    };
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
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
    const unrezzedId = putCorpRootInRemote(unrezzed, 578);
    putCorpRootInRemote(unrezzed, 588);
    unrezzed.cardInstances[unrezzedId] = {
      ...unrezzed.cardInstances[unrezzedId]!,
      faceup: false,
      rezzed: false,
    };
    unrezzed = apply(
      unrezzed,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    unrezzed = passRootRezWindowBeforeAccessIfOpen(unrezzed);
    unrezzed = apply(
      unrezzed,
      "runner",
      (action) => action.type === "access_card",
    );
    unrezzed = apply(
      unrezzed,
      "runner",
      (action) => action.type === "decline_trash",
    );
    unrezzed = apply(
      unrezzed,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      mustAction(unrezzed, "runner", (action) => action.type === "steal_agenda")
        .costs,
    ).toEqual([]);

    let otherFort = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("p311-red-herrings-other-fort"),
    );
    const otherId = putCorpRootInRemote(otherFort, 578);
    otherFort.cardInstances[otherId] = {
      ...otherFort.cardInstances[otherId]!,
      faceup: true,
      rezzed: true,
    };
    const agendaId = moveCorpCardToHq(otherFort, 588);
    keepOnlyCorpHqCard(otherFort, agendaId);
    otherFort = apply(
      otherFort,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    otherFort = apply(
      otherFort,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      mustAction(
        otherFort,
        "runner",
        (action) => action.type === "steal_agenda",
      ).costs,
    ).toEqual([]);
  });

  it("keeps V1.9.18 city-grid region replacement server-bound and visible", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1918-city-grid-region-install",
    );
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstGridId = moveCorpCardToHq(
      state,
      567,
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

    const secondGridId = moveCorpCardToHq(state, 577);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const replacementAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "r1" &&
        action.payload?.placement === "root",
    );
    expect(replacementAction.payload?.regionReplacementWarning).toBe(true);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "r1" &&
        action.payload?.placement === "root",
    );

    const remote = state.corp.servers.find(
      (server) => server.id === "r1",
    );
    expect(remote?.root).toContain(secondGridId);
    expect(remote?.root).not.toContain(firstGridId);
    expect(state.corp.archives).toContain(firstGridId);
    expect(
      getPlayerView(state, "runner")
        .servers.find((server) => server.id === "archives")
        ?.root.find((card) => card.instanceId === firstGridId)?.definitionId,
    ).toBe(567);
    const replacementEvent = state.eventLog.at(-1);
    expect(replacementEvent?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_card",
          reason: "region_limit",
          sourceDefinitionId: 577,
          cardDefinitionId: 567,
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
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1918-hidden-region-replacement",
    );
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const firstGridId = moveCorpCardToHq(
      state,
      567,
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

    const secondGridId = moveCorpCardToHq(state, 577);
    const replacementAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === secondGridId &&
        action.payload?.serverId === "r1" &&
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
    expect(serializedDefinitionReferences(eventText)).not.toContain(567);
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "trash_card",
          reason: "region_limit",
          sourceDefinitionId: 577,
          redactedKind: "installed_card",
        }),
      ]),
    );
    expect(validateGameState(state).ok).toBe(true);
  });

  it("applies the generic region install baseline for P3.12 city grids", () => {
    const p312Ids = new Set([
      572,
      574,
      586,
      606,
    ]);
    let state = createGameAfterSetup({
      seed: "p312-region-baseline",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p312_region_baseline_corp",
        name: "P3.12 Region Baseline Corp",
        cards: [
          { id: 572, quantity: 1 },
          { id: 574, quantity: 1 },
          { id: 586, quantity: 1 },
          { id: 606, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (entry) => !p312Ids.has(entry.id),
          ),
        ],
      },
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const jerusalemId = moveCorpCardToHq(
      state,
      572,
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
    state = apply(
      state,
      "corp",
      (action) => action.actionId === installJerusalem.actionId,
    );
    expect(state.corp.credits).toBe(0);
    expect(state.cardInstances[jerusalemId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "r1" },
    });

    const nonRegionId = moveCorpCardToHq(state, 606);
    expect(
      mustAction(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === nonRegionId &&
          action.payload?.serverId === "r1",
      ).costs,
    ).toEqual([{ clicks: 1 }]);

    state.corp.credits = 7;
    const washingtonId = moveCorpCardToHq(
      state,
      586,
    );
    const replaceWithWashington = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === washingtonId &&
        action.payload?.serverId === "r1",
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
      zone: { side: "corp", zone: "serverRoot", serverId: "r1" },
    });

    state.corp.credits = 1;
    const newGalvestonId = moveCorpCardToHq(
      state,
      574,
    );
    const installOtherFortRegion = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === newGalvestonId &&
        action.payload?.serverId === "new_remote",
    );
    expect(
      installOtherFortRegion.payload?.regionReplacementWarning,
    ).toBeUndefined();
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

  it("does not offer a legacy counter action for Dr. Dreff", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "v1918-counter-tag-hidden-actions",
    );
    state.corp.credits = 10;
    state.runner.tags = 1;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const drDreffId = putCorpRootInRemote(state, 570);
    const parisId = putCorpRootInRemote(state, 577);
    const galvestonId = putCorpRootInRemote(
      state,
      574,
    );
    putCorpCardOnTopOfRd(state, 596);
    for (const upgradeId of [drDreffId, parisId, galvestonId]) {
      state.cardInstances[upgradeId] = {
        ...state.cardInstances[upgradeId]!,
        faceup: true,
        rezzed: true,
      };
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.v1918UpgradeAbility === "add_power_counter" &&
          action.payload?.cardId === drDreffId,
      ),
    ).toBe(false);

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
  });

  it("applies Crystal Palace Station Grid break_subroutine_cost only on its fort", () => {
    const approachIce = (
      seed: string,
      targetServerId: "r1" | "rd",
      rezzedCrystal: boolean,
      withTesseract = false,
    ): { state: GameState; crystalId: CardInstanceId } => {
      let state = createGameAfterSetup({
        seed,
        runnerDeck: {
          ...ONR_V1_6_2_RUNNER_DECK,
          cards: [
            ...ONR_V1_6_2_RUNNER_DECK.cards,
            { id: 591, quantity: 1 },
          ],
        },
        corpDeck: {
          ...ONR_V1_6_2_CORP_DECK,
          cards: [
            ...ONR_V1_6_2_CORP_DECK.cards,
            {
              id: 567,
              quantity: 1,
            },
            ...(withTesseract
              ? [
                  {
                    id: 582,
                    quantity: 1,
                  },
                ]
              : []),
          ],
        },
        agendaPointsToWin: 7,
      });
      state = apply(
        state,
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 30;
      state.runner.credits = 20;
      const crystalId = putCorpRootInRemote(
        state,
        567,
      );
      state.cardInstances[crystalId] = {
        ...state.cardInstances[crystalId]!,
        faceup: rezzedCrystal,
        rezzed: rezzedCrystal,
      };
      if (withTesseract) {
        const tesseractId = putCorpRootInRemote(
          state,
          582,
        );
        state.cardInstances[tesseractId] = {
          ...state.cardInstances[tesseractId]!,
          faceup: true,
          rezzed: true,
        };
      }
      putCorpIceOnServer(state, targetServerId, 442);
      state = toRunnerTurnFromCorpMain(state);
      state.runner.credits = 20;
      const decoderId = moveRunnerCardToGrip(state, 591);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" && action.source === decoderId,
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
          sourceDefinition(state, action) === 591,
      );
      return { state, crystalId };
    };

    const { state: sameFort, crystalId } = approachIce(
      "p316-crystal-break-cost",
      "r1",
      true,
    );
    const breakActions = getLegalActions(sameFort, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(sameFort, action) === 591,
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
        "567",
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
      expect(staleResult.state.runner.credits).toBe(
        sameFort.runner.credits - 1,
      );

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
          sourceDefinition(otherFort, action) === 591,
      ).costs,
    ).toEqual([{ credits: 1 }]);

    const { state: unrezzed } = approachIce(
      "p316-crystal-unrezzed",
      "r1",
      false,
    );
    expect(
      mustAction(
        unrezzed,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(unrezzed, action) === 591,
      ).costs,
    ).toEqual([{ credits: 1 }]);

    let tesseractState = approachIce(
      "p316-crystal-tesseract",
      "r1",
      true,
      true,
    ).state;
    for (const subroutineIndex of [0, 1, 2]) {
      tesseractState = apply(
        tesseractState,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(tesseractState, action) === 591 &&
          action.payload?.subroutineIndex === subroutineIndex,
      );
    }
    expect(
      mustAction(
        tesseractState,
        "runner",
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(tesseractState, action) === 591,
      ).costs,
    ).toEqual([{ credits: 2 }]);
  });

  it("uses the generic region install baseline for Crystal Palace Station Grid", () => {
    const p316Ids = new Set([
      567,
      572,
    ]);
    let state = createGameAfterSetup({
      seed: "p316-crystal-region-baseline",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p316_crystal_region_corp",
        name: "P3.16 Crystal Region Corp",
        cards: [
          { id: 567, quantity: 1 },
          { id: 572, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
            (entry) => !p316Ids.has(entry.id),
          ),
        ],
      },
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const crystalId = moveCorpCardToHq(
      state,
      567,
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
      572,
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
      zone: { side: "corp", zone: "serverRoot", serverId: "r1" },
    });

    state.corp.credits = 5;
    const installCrystal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === crystalId &&
        action.payload?.serverId === "r1",
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
      zone: { side: "corp", zone: "serverRoot", serverId: "r1" },
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
          identity: 587,
          cards: [
            { id: 259, quantity: 1 },
            { id: 223, quantity: 1 },
            { id: 595, quantity: 10 },
          ],
        },
        corpDeck: {
          id: "p316_crystal_pile_driver_corp",
          name: "P3.16 Crystal Pile Driver Corp",
          side: "corp",
          identity: 3,
          cards: [
            { id: 567, quantity: 1 },
            { id: 490, quantity: 1 },
            { id: 588, quantity: 6 },
            { id: 596, quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const crystalId = putCorpRootInRemote(
      state,
      567,
    );
    state.cardInstances[crystalId] = {
      ...state.cardInstances[crystalId]!,
      faceup: true,
      rezzed: true,
    };
    installRunnerProgramForTest(state, 259);
    const cloakId = installRunnerProgramForTest(state, 223);
    setCardCounterForTest(state, cloakId, "bit", 3);
    const iceId = putCorpIceOnServer(
      state,
      "r1",
      490,
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
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
        "567",
    });
  });

  it("applies Washington D.C. City Grid as a same-fort agenda_difficulty modifier", () => {
    const p312Ids = new Set([
      586,
      588,
    ]);
    let state = createGameAfterSetup({
      seed: "p312-washington-difficulty",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        id: "p312_washington_corp",
        name: "P3.12 Washington Corp",
        cards: [
          { id: 586, quantity: 1 },
          { id: 588, quantity: 1 },
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
      586,
    );
    const agendaId = putCorpRootInRemote(state, 588);
    const printedDifficulty =
      CARD_DEFINITIONS_BY_ID[588]?.advancementRequirement ?? 0;
    state.cardInstances[agendaId] = {
      ...state.cardInstances[agendaId]!,
      advancementCounters: printedDifficulty - 1,
    };
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" && action.payload?.cardId === agendaId,
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
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
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
          modifier.sourceDefinitionId === 586,
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
      id: "r2",
      kind: "remote",
      label: "Remote 2",
      ice: [],
      root: [agendaId],
    });
    const remoteOne = otherFort.corp.servers.find(
      (server) => server.id === "r1",
    );
    if (!remoteOne) throw new Error("r1 missing");
    remoteOne.root = remoteOne.root.filter((id) => id !== agendaId);
    otherFort.cardInstances[agendaId] = {
      ...otherFort.cardInstances[agendaId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "r2" },
    };
    expect(
      getLegalActions(otherFort, "corp").some(
        (action) =>
          action.type === "score_agenda" && action.payload?.cardId === agendaId,
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
      577,
    );
    traceState.cardInstances[parisId] = {
      ...traceState.cardInstances[parisId]!,
      faceup: true,
      rezzed: true,
      counters: { bit: 3 },
    };
    const turbeauId = putCorpRootInRemote(
      traceState,
      584,
    );
    traceState.cardInstances[turbeauId] = {
      ...traceState.cardInstances[turbeauId]!,
      faceup: true,
      rezzed: true,
    };
    const traceServer = traceState.corp.servers.find(
      (server) => server.id === "r1",
    );
    if (traceServer) traceServer.root = [turbeauId, parisId];
    const traceInitial = structuredClone(traceState);
    const traceReplayStart = traceState.eventLog.length;

    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(traceState.trace).toMatchObject({
      status: "corp_bid",
      traceLimit: 10,
      corpBidMax: 8,
      sourceDefinitionId: 584,
      fortTraceBitPoolSourceCardInstanceId: parisId,
      fortTraceBitPoolServerId: "r1",
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
      fortTraceBitPoolServerId: "r1",
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

    let runState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("v1918-stealth-block"),
    );
    runState.runner.credits = 20;
    const surveillanceId = putCorpRootInRemote(
      runState,
      585,
    );
    runState.cardInstances[surveillanceId] = {
      ...runState.cardInstances[surveillanceId]!,
      faceup: true,
      rezzed: true,
    };
    const breakerId = addInstalledRunnerProgramForTest(
      runState,
      226,
      "stealth_block_codecracker",
    );
    const stealthId = addInstalledRunnerProgramForTest(
      runState,
      247,
      "stealth_block_invisibility",
    );
    addRezzedCorpIceForTest(
      runState,
      473,
      "r1",
      "stealth_block_quandary",
    );
    runState.cardInstances[stealthId] = {
      ...runState.cardInstances[stealthId]!,
      counters: { bit: 1 },
    };
    runState.runner.credits = 0;

    const runAction = getLegalActions(runState, "runner").find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
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
