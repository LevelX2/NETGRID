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
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("Originalset Spotcheck 2026-05-15 Modifier/Agenda risk hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps V1.9.20 shell cards legal-action gated without hidden-info leaks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-modifier-shell-guards",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rd_interface_corp",
          name: "Spotcheck R&D Interface Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_agenda", quantity: 1 },
            { id: "simple_economy_operation", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "simple_economy_asset",
                  "simple_agenda",
                  "simple_economy_operation",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const gremlinsId = moveRunnerCardToGrip(state, "onr_v1_029_gremlins");
    const mantisId = moveRunnerCardToGrip(state, "onr_v1_171_preying-mantis");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === gremlinsId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === mantisId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.payload?.cardId === gremlinsId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerUtilityAbility ===
            "optional_extra_action_with_delayed_damage" &&
          action.payload?.cardId === mantisId,
      ),
    ).toBe(true);
    expect(JSON.stringify(state.eventLog.map((event) => event.publicPayload))).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 10;
    const boonId = scoreCorpAgendaForTest(state, "onr_v1_192_corporate-boon");
    const branchId = scoreCorpAgendaForTest(
      state,
      "onr_v1_218_subsidiary-branch",
    );
    const euromarketId = putCorpRootInRemote(
      state,
      "onr_v1_322_euromarket-consortium",
    );
    state.cardInstances[euromarketId] = {
      ...state.cardInstances[euromarketId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.cardId === boonId || action.payload?.cardId === branchId,
      ),
    ).toBe(false);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.cardId === euromarketId,
      ),
    ).toBe(true);
    const euromarketAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === euromarketId,
    );
    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, euromarketId);
    removedSource.corp.archives.push(euromarketId);
    removedSource.cardInstances[euromarketId] = {
      ...removedSource.cardInstances[euromarketId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: false,
    };
    const staleSourceResult = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "corp",
      actionId: euromarketAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-euromarket-removed-source",
    });
    expect(staleSourceResult.ok).toBe(false);

    const euromarketInitial = structuredClone(state);
    const euromarketReplayStart = state.eventLog.length;
    const corpHqBeforeEuromarket = state.corp.hq.length;
    const corpRdBeforeEuromarket = state.corp.rd.length;
    const corpCreditsBeforeEuromarket = state.corp.credits;
    const corpClicksBeforeEuromarket = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === euromarketAction.actionId,
    );
    expect(state.corp.hq.length).toBe(corpHqBeforeEuromarket + 2);
    expect(state.corp.rd.length).toBe(corpRdBeforeEuromarket - 2);
    expect(state.corp.credits).toBe(corpCreditsBeforeEuromarket - 1);
    expect(state.corp.clicks).toBe(corpClicksBeforeEuromarket - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_322_euromarket-consortium",
      drawnCards: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_v1_322_euromarket-consortium",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const euromarketReplay = replayEvents(
      euromarketInitial,
      state.eventLog.slice(euromarketReplayStart),
    );
    expect(euromarketReplay.ok).toBe(true);
    expect(hashState(euromarketReplay.state)).toBe(hashState(state));

    removeEverywhere(state, euromarketId);
    state.corp.archives.push(euromarketId);
    state.cardInstances[euromarketId] = {
      ...state.cardInstances[euromarketId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: false,
    };
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.cardId === euromarketId,
      ),
    ).toBe(false);
  });

  it("recomputes MRAM Chip hand size from active rig state and rejects stale install actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-mram-zone-revalidation",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rd_interface_corp",
          name: "Spotcheck R&D Interface Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_agenda", quantity: 1 },
            { id: "simple_economy_operation", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "simple_economy_asset",
                  "simple_agenda",
                  "simple_economy_operation",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const mramId = moveRunnerCardToGrip(state, "onr_v1_134_mram-chip");
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" && String(action.payload?.cardId) === mramId,
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-mram-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const maxHandSizeBefore = getPlayerView(state, "runner").own.maxHandSize;
    state = apply(state, "runner", (action) => action.actionId === legal.actionId);
    expect(getPlayerView(state, "runner").own.maxHandSize).toBe(
      maxHandSizeBefore + 2,
    );
    const mramModifierState = structuredClone(state);
    const mramModifierHash = hashState(state);
    const mramModifiers = collectActiveModifiers(state);
    expect(state).toEqual(mramModifierState);
    expect(hashState(state)).toBe(mramModifierHash);
    expect(mramModifiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceCardInstanceId: mramId,
          sourceDefinitionId: "onr_v1_134_mram-chip",
          kind: "max_hand_size",
          side: "runner",
          amount: 2,
          duration: "while_installed",
          target: { kind: "side", id: "runner" },
          visibility: "public",
        }),
      ]),
    );
    expect(getPlayerView(state, "corp").opponent.maxHandSize).toBe(
      maxHandSizeBefore + 2,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    removeEverywhere(state, mramId);
    state.runner.heap.push(mramId);
    state.cardInstances[mramId] = {
      ...state.cardInstances[mramId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: false,
    };
    expect(getPlayerView(state, "runner").own.maxHandSize).toBe(maxHandSizeBefore);
    expect(
      collectActiveModifiers(state).some(
        (modifier) =>
          modifier.kind === "max_hand_size" &&
          modifier.sourceCardInstanceId === mramId,
      ),
    ).toBe(false);
    expect(getPlayerView(state, "corp").opponent.maxHandSize).toBe(
      maxHandSizeBefore,
    );
    expect(JSON.stringify(getPlayerView(state, "corp").opponent)).not.toMatch(
      /"grip"|"stack"/,
    );
  });

  it("revalidates scored agenda sources, counters and tag drift for agenda actions", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "spotcheck_agenda_risk_corp",
      name: "Spotcheck Agenda Risk Corp",
      cards: [
        { id: "onr_v1_193_corporate-coup", quantity: 1 },
        { id: "onr_v1_208_on-call-solo-team", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-agenda-risk-revalidation",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 40;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    const coupId = scoreCorpAgendaForTest(state, "onr_v1_193_corporate-coup");
    setCardCounterForTest(state, coupId, "bit", 3);
    const coupAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === coupId,
    );
    const noHostedCredits = structuredClone(state);
    setCardCounterForTest(noHostedCredits, coupId, "bit", 0);
    const noHostedCreditsResult = applyAction(noHostedCredits, {
      matchId: noHostedCredits.matchId,
      side: "corp",
      actionId: coupAction.actionId,
      clientKnownStateVersion: noHostedCredits.stateVersion,
      idempotencyKey: "spotcheck-coup-no-hosted-credits",
    });
    expect(noHostedCreditsResult.ok).toBe(false);
    const stolenCoup = structuredClone(state);
    removeEverywhere(stolenCoup, coupId);
    stolenCoup.runner.scoreArea.push(coupId);
    stolenCoup.cardInstances[coupId] = {
      ...stolenCoup.cardInstances[coupId]!,
      zone: { side: "runner", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    const stolenResult = applyAction(stolenCoup, {
      matchId: stolenCoup.matchId,
      side: "corp",
      actionId: coupAction.actionId,
      clientKnownStateVersion: stolenCoup.stateVersion,
      idempotencyKey: "spotcheck-coup-runner-scorearea",
    });
    expect(stolenResult.ok).toBe(false);
    const creditsBefore = state.corp.credits;
    state = apply(state, "corp", (action) => action.actionId === coupAction.actionId);
    expect(state.corp.credits).toBe(creditsBefore + 3);
    expect(cardCounterAmount(state, coupId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardImplementationAbility: "activated",
      hostedCreditsTaken: 3,
      hostedCreditsAfter: 0,
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 3,
          remainingCounters: 0,
          sourceDefinitionId: "onr_v1_193_corporate-coup",
        }),
      ],
    });

    const onCallId = scoreCorpAgendaForTest(
      state,
      "onr_v1_208_on-call-solo-team",
    );
    state.runner.tags = 1;
    const onCallAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === onCallId,
    );
    const tagDrift = structuredClone(state);
    tagDrift.runner.tags = 0;
    const tagDriftResult = applyAction(tagDrift, {
      matchId: tagDrift.matchId,
      side: "corp",
      actionId: onCallAction.actionId,
      clientKnownStateVersion: tagDrift.stateVersion,
      idempotencyKey: "spotcheck-on-call-tag-drift",
    });
    expect(tagDriftResult.ok).toBe(false);
    const damageInitial = structuredClone(state);
    const damageReplayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;
    state = apply(state, "corp", (action) => action.actionId === onCallAction.actionId);
    expect(state.runner.grip.length).toBeLessThan(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_208_on-call-solo-team",
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
      resolvedEffects: [
        expect.objectContaining({
          kind: "damage",
          sourceDefinitionId: "onr_v1_208_on-call-solo-team",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const damageReplay = replayEvents(
      damageInitial,
      state.eventLog.slice(damageReplayStart),
    );
    expect(damageReplay.ok).toBe(true);
    expect(hashState(damageReplay.state)).toBe(hashState(state));
  });

  it("binds Executive Extraction to Corp score area and limits Canis Major run bonus lifetime", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "spotcheck_executive_canis_corp",
      name: "Spotcheck Executive Canis Corp",
      cards: [
        { id: "onr_v1_201_executive-extraction", quantity: 1 },
        { id: "onr_v1_215_security-net-optimization", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-executive-canis-lifetime",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 40;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    const executiveId = scoreCorpAgendaForTest(
      state,
      "onr_v1_201_executive-extraction",
    );
    const firstGrayOpsId = moveCorpCardToHq(
      state,
      "onr_v1_215_security-net-optimization",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === firstGrayOpsId,
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === firstGrayOpsId,
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          String(action.payload?.cardId) === firstGrayOpsId,
      ),
    ).toBe(true);
    removeEverywhere(state, executiveId);
    state.corp.scoreArea = state.corp.scoreArea.filter(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId !==
        "onr_v1_201_executive-extraction",
    );
    state.runner.scoreArea.push(executiveId);
    state.cardInstances[executiveId] = {
      ...state.cardInstances[executiveId]!,
      zone: { side: "runner", zone: "scoreArea" },
      faceup: true,
      rezzed: true,
    };
    const secondGrayOpsId = moveCorpCardToHq(
      state,
      "onr_v1_215_security-net-optimization",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === secondGrayOpsId,
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          String(action.payload?.cardId) === secondGrayOpsId,
      );
    }
    expect(state.corp.scoreArea).not.toContain(executiveId);
    expect(state.runner.scoreArea).toContain(executiveId);
    expect(
      state.corp.scoreArea.some(
        (cardId) =>
          state.cardInstances[cardId]?.definitionId ===
          "onr_v1_201_executive-extraction",
      ),
    ).toBe(false);

    const canisCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "spotcheck_canis_major_corp",
      name: "Spotcheck Canis Major Corp",
      cards: [
        { id: "simple_code_gate_ice", quantity: 1 },
        { id: "onr_v1_225_canis-major", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let canisState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-canis-major-lifetime",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: canisCorpDeck,
        agendaPointsToWin: 7,
      }),
    );
    canisState.runner.credits = 20;
    putCorpIceOnServer(canisState, "rd", "simple_code_gate_ice");
    putCorpIceOnServer(canisState, "rd", "onr_v1_225_canis-major");
    const initial = structuredClone(canisState);
    const replayStart = canisState.eventLog.length;
    canisState = apply(
      canisState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "onr_v1_225_canis-major",
    );
    canisState = continueRunAction(canisState);
    expect(canisState.run?.futureEncounterIceStrengthBonus).toBe(2);
    expect(canisState.timingPoint).toBe("run.jack_out_window");
    canisState = continueRunAction(canisState);
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === "simple_code_gate_ice",
    );
    canisState = enterEncounterFromMovementWindow(canisState);
    expect(
      getPlayerView(canisState, "runner")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((ice) => ice.definitionId === "simple_code_gate_ice")?.strength,
    ).toBe((DEMO_CARDS_BY_ID.simple_code_gate_ice?.strength ?? 0) + 2);
    canisState = continueRunThroughMovement(canisState);
    expect(canisState.run).toBeUndefined();
    const replay = replayEvents(initial, canisState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(canisState));
  });
});

describe("Originalset Spotcheck 2026-05-15 Agenda/Run/Recurring Nachtest", () => {
  it("keeps V1.9.19 agenda and operation targets deterministic and leak-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-agenda-run-recurring-v1919");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;
    const firstAgendaId = putCorpRootInRemote(
      state,
      "onr_v1_189_artificial-security-directors",
    );
    const secondAgendaId = putCorpRootInRemote(
      state,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    state.cardInstances[firstAgendaId] = {
      ...state.cardInstances[firstAgendaId]!,
      advancementCounters: 3,
    };
    state.cardInstances[secondAgendaId] = {
      ...state.cardInstances[secondAgendaId]!,
      advancementCounters: 1,
    };
    const scoredAgendaId = scoreCorpAgendaForTest(state, "simple_agenda");
    moveCorpCardToHq(state, "onr_v1_300_project-consultants");
    moveCorpCardToHq(state, "onr_v1_303_silver-lining-recovery-protocol");
    moveCorpCardToHq(state, "onr_v1_305_team-restructuring");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
      }),
      stoleAgendaThisTurn: false,
      stoleAgendaLastTurn: true,
      stolenAgendaAdvancementCountersLastTurn: 1,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    const projectAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_300_project-consultants",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: projectAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-project-consultants-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: projectAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-project-consultants-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(state, "corp", (action) => action.actionId === projectAction.actionId);
    const projectOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${secondAgendaId}:4`,
    );
    expect(projectOption).toBeDefined();
    state = applyChoices(state, "corp", [projectOption?.id ?? ""]);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_300_project-consultants",
      targetCardId: secondAgendaId,
      targetCardDefinitionId: "onr_v1_202_genetics-visionary-acquisition",
      addedAdvancementCounters: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_303_silver-lining-recovery-protocol",
    );
    expect(state.corp.credits).toBe(creditsBefore + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      gainedCredits: 3,
      corpCreditsAfter: creditsBefore + 3,
    });

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_305_team-restructuring",
    );
    const teamOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${firstAgendaId}:1|${secondAgendaId}:1`,
    );
    expect(teamOption).toBeDefined();
    state = applyChoices(state, "corp", [teamOption?.id ?? ""]);
    expect(state.cardInstances[firstAgendaId]?.advancementCounters).toBe(4);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_305_team-restructuring",
      addedAdvancementCounters: 2,
      targetCount: 2,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Shredder Uplink Protocol as an Archives-to-HQ run ability and keeps Submarine Uplink as a single base-link source", () => {
    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-shredder-uplink-access-source"),
    );
    accessState.runner.credits = 20;
    accessState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(accessState, "onr_v1_062_shredder-uplink-protocol");
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(accessState, action) ===
          "onr_v1_062_shredder-uplink-protocol",
    );
    putCorpCardOnTopOfRd(accessState, "simple_agenda");
    putCorpCardOnTopOfRd(accessState, "simple_economy_operation");
    const accessInitial = structuredClone(accessState);
    const accessReplayStart = accessState.eventLog.length;
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(accessState.run?.breach?.queue).toHaveLength(1);
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      installedAccessBonus: 0,
      effectiveAccessCount: 1,
    });
    expect(accessState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "installedAccessBonusSourceDefinitionIds",
    );
    expect(JSON.stringify(getPlayerView(accessState, "runner"))).not.toContain(
      "Simple Agenda",
    );
    accessState = apply(
      accessState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
    });
    expect(JSON.stringify(accessState.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_agenda",
    );
    expect(replayEvents(accessInitial, accessState.eventLog.slice(accessReplayStart)).ok).toBe(true);

    let shredderState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-shredder-uplink-activated-run"),
    );
    shredderState.runner.credits = 20;
    shredderState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(shredderState, "onr_v1_062_shredder-uplink-protocol");
    shredderState = apply(
      shredderState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(shredderState, action) ===
          "onr_v1_062_shredder-uplink-protocol",
    );
    const hqCardId = moveCorpCardToHq(shredderState, "simple_economy_operation");
    keepOnlyCorpHqCard(shredderState, hqCardId);
    const shredderInitial = structuredClone(shredderState);
    const shredderReplayStart = shredderState.eventLog.length;
    shredderState = apply(
      shredderState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(shredderState, action) ===
          "onr_v1_062_shredder-uplink-protocol",
    );
    expect(shredderState.run?.attackedServerId).toBe("archives");
    expect(shredderState.run?.breach?.serverId).toBe("hq");
    shredderState = apply(
      shredderState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(shredderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      serverLabel: "HQ",
    });
    expect(
      replayEvents(
        shredderInitial,
        shredderState.eventLog.slice(shredderReplayStart),
      ).ok,
    ).toBe(true);

    let traceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting(
        "spotcheck-submarine-uplink-base-link",
      ),
    );
    traceState.runner.credits = 12;
    traceState.corp.credits = 8;
    moveRunnerCardToGrip(traceState, "onr_v1_182_submarine-uplink");
    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(traceState, action) === "onr_v1_182_submarine-uplink",
    );
    putCorpIceOnServer(traceState, "rd", "onr_v1_246_fragmentation-storm");
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    traceState = apply(
      traceState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(traceState, action) ===
          "onr_v1_246_fragmentation-storm",
    );
    traceState = apply(traceState, "runner", (action) => action.type === "continue_run");
    traceState = applyChoice(traceState, "corp", "bid_1");
    expect(traceState.trace).toMatchObject({
      status: "base_link",
      traceStrength: 5,
      runnerLink: 0,
    });
    traceState = applyChoice(
      traceState,
      "runner",
      traceChoiceOptionIdForDefinition(
        traceState,
        "onr_v1_182_submarine-uplink",
        "trace_base_link_",
      ),
    );
    expect(traceState.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 4,
    });

    let maxLinkState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.programSubtypeHosting(
        "spotcheck-submarine-uplink-max-link",
      ),
    );
    maxLinkState.runner.credits = 20;
    maxLinkState.corp.credits = 8;
    moveRunnerCardToGrip(maxLinkState, "onr_v1_182_submarine-uplink");
    moveRunnerCardToGrip(maxLinkState, "onr_v1_148_access-through-alpha");
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(maxLinkState, action) === "onr_v1_182_submarine-uplink",
    );
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(maxLinkState, action) === "onr_v1_148_access-through-alpha",
    );
    putCorpIceOnServer(maxLinkState, "rd", "onr_v1_246_fragmentation-storm");
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    maxLinkState = apply(
      maxLinkState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(maxLinkState, action) ===
          "onr_v1_246_fragmentation-storm",
    );
    maxLinkState = apply(maxLinkState, "runner", (action) => action.type === "continue_run");
    maxLinkState = applyChoice(maxLinkState, "corp", "bid_1");
    expect(maxLinkState.trace).toMatchObject({
      status: "base_link",
      runnerLink: 0,
    });
    maxLinkState = applyChoice(
      maxLinkState,
      "runner",
      traceChoiceOptionIdForDefinition(
        maxLinkState,
        "onr_v1_148_access-through-alpha",
        "trace_base_link_",
      ),
    );
    expect(maxLinkState.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 9,
    });
  });

  it("migrates P3.33 access-interface cards through CardImplementation without hidden-info leaks", () => {
    const p333State = (seed: string, runnerCards: CardDefinitionId[]) =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.runAccess.runner,
            id: `${seed}_runner`,
            name: `${seed} Runner`,
            cards: [
              ...runnerCards.map((id) => ({ id, quantity: 1 })),
              ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
                (card) => !runnerCards.includes(card.id),
              ),
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.runAccess.corp,
          agendaPointsToWin: 7,
        }),
      );
    let priorityState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("p3-33-priority-wreck"),
    );
    priorityState.runner.credits = 8;
    priorityState.corp.credits = 6;
    moveRunnerCardToGrip(priorityState, "onr_v1_105_priority-wreck");
    const hqCardId = moveCorpCardToHq(priorityState, "simple_economy_operation");
    keepOnlyCorpHqCard(priorityState, hqCardId);
    priorityState = apply(
      priorityState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(priorityState, action) === "onr_v1_105_priority-wreck" &&
        action.payload?.serverId === "hq",
    );
    expect(priorityState.pendingChoice?.source).toContain("p3_33.priority_wreck");
    expect(priorityState.run?.breach).toBeUndefined();
    priorityState = applyChoice(priorityState, "runner", "pay_3");
    expect(priorityState.runner.credits).toBe(5);
    expect(priorityState.corp.credits).toBe(3);
    expect(priorityState.corp.hq).toContain(hqCardId);
    expect(priorityState.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "runner_spend_corp_lose_credits",
      runnerPaidAmount: 3,
      corpLostCredits: 3,
      sourceDefinitionId: "onr_v1_105_priority-wreck",
    });

    let protocolState = p333State("p3-33-rd-protocol-files", [
      "onr_v1_050_r-and-d-protocol-files",
    ]);
    protocolState.runner.credits = 20;
    protocolState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(protocolState, "onr_v1_050_r-and-d-protocol-files");
    protocolState = apply(
      protocolState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(protocolState, action) ===
          "onr_v1_050_r-and-d-protocol-files",
    );
    putCorpCardOnTopOfRd(protocolState, "simple_economy_operation");
    putCorpCardOnTopOfRd(protocolState, "simple_agenda");
    protocolState = apply(
      protocolState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(protocolState, action) ===
          "onr_v1_050_r-and-d-protocol-files",
    );
    expect(protocolState.pendingChoice?.source).toContain("p3_33.private_look");
    expect(
      getPlayerView(protocolState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === "simple_agenda",
      ),
    ).toBe(true);
    expect(getPlayerView(protocolState, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(protocolState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_agenda|Simple Agenda|"cardInstances"|"privatePayload"/,
    );
    protocolState = applyChoice(protocolState, "runner", "done");
    expect(protocolState.run).toBeUndefined();

    let interfaceState = p333State("p3-33-hq-interface", [
      "onr_v1_129_hq-interface",
    ]);
    interfaceState.runner.credits = 20;
    interfaceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(interfaceState, "onr_v1_129_hq-interface");
    interfaceState = apply(
      interfaceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(interfaceState, action) === "onr_v1_129_hq-interface",
    );
    keepOnlyCorpHqCards(interfaceState, [
      moveCorpCardToHq(interfaceState, "simple_economy_operation"),
      moveCorpCardToHq(interfaceState, "simple_agenda"),
    ]);
    const hqRun = apply(
      structuredClone(interfaceState),
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(hqRun.run?.breach?.queue.filter((entry) => entry.zone === "hq")).toHaveLength(2);
    expect(hqRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      installedAccessBonus: 1,
      effectiveAccessCount: 2,
        installedAccessBonusSourceDefinitionIds: "onr_v1_129_hq-interface",
      });

    let rdInterfaceState = p333State("p3-33-rd-interface", [
      "onr_v1_139_r-and-d-interface",
    ]);
    rdInterfaceState.runner.credits = 20;
    rdInterfaceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(rdInterfaceState, "onr_v1_139_r-and-d-interface");
    rdInterfaceState = apply(
      rdInterfaceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(rdInterfaceState, action) ===
          "onr_v1_139_r-and-d-interface",
    );
    putCorpCardOnTopOfRd(rdInterfaceState, "simple_economy_asset");
    putCorpCardOnTopOfRd(rdInterfaceState, "simple_agenda");
    const rdRun = apply(
      structuredClone(rdInterfaceState),
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(rdRun.run?.breach?.queue).toHaveLength(2);
    expect(rdRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      installedAccessBonus: 1,
      effectiveAccessCount: 2,
      installedAccessBonusSourceDefinitionIds: "onr_v1_139_r-and-d-interface",
    });
  });

  it("handles P3.33 private look, R&D cut, and Archives replacement access hooks", () => {
    const p333State = (seed: string, runnerCards: CardDefinitionId[]) =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.runAccess.runner,
            id: `${seed}_runner`,
            name: `${seed} Runner`,
            cards: [
              ...runnerCards.map((id) => ({ id, quantity: 1 })),
              ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
                (card) => !runnerCards.includes(card.id),
              ),
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.runAccess.corp,
          agendaPointsToWin: 7,
        }),
      );
    let expertState = p333State("p3-33-expert-schedule-analyzer", [
      "onr_v1_024_expert-schedule-analyzer",
    ]);
    expertState.runner.credits = 20;
    expertState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(expertState, "onr_v1_024_expert-schedule-analyzer");
    expertState = apply(
      expertState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(expertState, action) ===
          "onr_v1_024_expert-schedule-analyzer",
    );
    keepOnlyCorpHqCards(expertState, [
      moveCorpCardToHq(expertState, "simple_economy_operation"),
      moveCorpCardToHq(expertState, "simple_economy_asset"),
    ]);
    expertState = apply(
      expertState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expertState = apply(expertState, "runner", (action) => action.type === "access_card");
    expect(expertState.pendingChoice?.source).toContain("p3_33.private_look:post_access");
    expect(
      getPlayerView(expertState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === "simple_economy_asset",
      ),
    ).toBe(true);
    expect(getPlayerView(expertState, "corp").pendingChoice).toBeUndefined();
    expertState = applyChoice(expertState, "runner", "done");
    expect(expertState.run).toBeUndefined();

    let technicianState = p333State("p3-33-technician-lover", [
      "onr_v1_183_technician-lover",
    ]);
    technicianState.runner.credits = 20;
    moveRunnerCardToGrip(technicianState, "onr_v1_183_technician-lover");
    technicianState = apply(
      technicianState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(technicianState, action) === "onr_v1_183_technician-lover",
    );
    putCorpCardOnTopOfRd(technicianState, "simple_agenda");
    technicianState = apply(
      technicianState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(technicianState, action) === "onr_v1_183_technician-lover",
    );
    expect(technicianState.pendingChoice?.source).toContain("p3_33.private_look:ability");
    expect(
      getPlayerView(technicianState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === "simple_agenda",
      ),
    ).toBe(true);
    const technicianRemoved = structuredClone(technicianState);
    const technicianId = technicianRemoved.runner.rig.resources.find(
      (id) => technicianRemoved.cardInstances[id]?.definitionId === "onr_v1_183_technician-lover",
    );
    if (!technicianId) throw new Error("Missing Technician Lover");
    removeEverywhere(technicianRemoved, technicianId);
    expect(
      applyAction(technicianRemoved, {
        matchId: technicianRemoved.matchId,
        side: "runner",
        actionId: mustAction(
          technicianRemoved,
          "runner",
          (action) => action.type === "resolve_choice",
        ).actionId,
        clientKnownStateVersion: technicianRemoved.stateVersion,
        selectedChoices: {
          choiceId: technicianRemoved.pendingChoice?.choiceId,
          selectedOptionIds: ["done"],
        },
        idempotencyKey: "technician-removed-source",
      }).ok,
    ).toBe(false);
    technicianState = applyChoice(technicianState, "runner", "done");
    expect(technicianState.pendingChoice).toBeUndefined();

    let microtechState = p333State("p3-33-microtech-ai-interface", [
      "onr_v1_041_microtech-ai-interface",
    ]);
    microtechState.runner.credits = 20;
    microtechState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(microtechState, "onr_v1_041_microtech-ai-interface");
    microtechState = apply(
      microtechState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(microtechState, action) ===
          "onr_v1_041_microtech-ai-interface",
    );
    putCorpCardOnTopOfRd(microtechState, "simple_economy_operation");
    putCorpCardOnTopOfRd(microtechState, "simple_agenda");
    microtechState = apply(
      microtechState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(microtechState.pendingChoice?.source).toContain("p3_33.microtech_ai_interface");
    microtechState = applyChoice(microtechState, "runner", "cut_1");
    expect(microtechState.run?.breach?.queue[0]?.cardInstanceId).toBe(microtechState.corp.rd[0]);
    microtechState = apply(microtechState, "runner", (action) => action.type === "access_card");
    expect(microtechState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "simple_economy_operation",
    });

    let recordState = p333State("p3-33-record-reconstructor", [
      "onr_v1_142_record-reconstructor",
    ]);
    recordState.runner.credits = 20;
    moveRunnerCardToGrip(recordState, "onr_v1_142_record-reconstructor");
    recordState = apply(
      recordState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(recordState, action) === "onr_v1_142_record-reconstructor",
    );
    const firstArchive = moveCorpCardToHq(recordState, "simple_economy_operation");
    removeEverywhere(recordState, firstArchive);
    recordState.corp.archives.push(firstArchive);
    recordState.cardInstances[firstArchive] = {
      ...recordState.cardInstances[firstArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const secondArchive = moveCorpCardToHq(recordState, "simple_agenda");
    removeEverywhere(recordState, secondArchive);
    recordState.corp.archives.push(secondArchive);
    recordState.cardInstances[secondArchive] = {
      ...recordState.cardInstances[secondArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const initial = structuredClone(recordState);
    const replayStart = recordState.eventLog.length;
    recordState = apply(
      recordState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(recordState, action) === "onr_v1_142_record-reconstructor",
    );
    expect(recordState.run).toBeUndefined();
    expect(recordState.corp.rd.slice(0, 2).sort()).toEqual(
      [firstArchive, secondArchive].sort(),
    );
    expect(recordState.corp.archives).not.toContain(firstArchive);
    expect(recordState.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "archives_faceup_to_rd",
      movedCount: 2,
      sourceDefinitionId: "onr_v1_142_record-reconstructor",
    });
    const replay = replayEvents(initial, recordState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(recordState));
  });

  it("resolves Record Reconstructor after a protected Archives run reaches access", () => {
    const p333State = (seed: string, runnerCards: CardDefinitionId[]) =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.runAccess.runner,
            id: `${seed}_runner`,
            name: `${seed} Runner`,
            cards: [
              ...runnerCards.map((id) => ({ id, quantity: 1 })),
              ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
                (card) => !runnerCards.includes(card.id),
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.runAccess.corp,
            id: `${seed}_corp`,
            name: `${seed} Corp`,
            cards: [
              { id: "simple_barrier_ice", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards,
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
    let state = p333State("p3-33-record-reconstructor-protected-archives", [
      "onr_v1_142_record-reconstructor",
    ]);
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_142_record-reconstructor");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_142_record-reconstructor",
    );
    putCorpIceOnServer(state, "archives", "simple_barrier_ice");
    const firstArchive = moveCorpCardToHq(state, "simple_economy_operation");
    removeEverywhere(state, firstArchive);
    state.corp.archives.push(firstArchive);
    state.cardInstances[firstArchive] = {
      ...state.cardInstances[firstArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const secondArchive = moveCorpCardToHq(state, "simple_agenda");
    removeEverywhere(state, secondArchive);
    state.corp.archives.push(secondArchive);
    state.cardInstances[secondArchive] = {
      ...state.cardInstances[secondArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const rdCountBefore = state.corp.rd.length;
    const archivesCountBefore = state.corp.archives.length;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_142_record-reconstructor",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    expect(state.corp.rd).toHaveLength(rdCountBefore + 2);
    expect(state.corp.rd.slice(0, 2).sort()).toEqual(
      [firstArchive, secondArchive].sort(),
    );
    expect(state.corp.archives).not.toContain(firstArchive);
    expect(state.corp.archives).not.toContain(secondArchive);
    expect(getPlayerView(state, "runner").opponent.deckCount).toBe(
      rdCountBefore + 2,
    );
    expect(getPlayerView(state, "runner").opponent.discardCount).toBe(
      archivesCountBefore - 2,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      accessReplacement: "archives_faceup_to_rd",
      movedCount: 2,
      sourceDefinitionId: "onr_v1_142_record-reconstructor",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Mystery Box once per run with public top-five reveal, free program install and deterministic shuffle", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.runAccess("spotcheck-mystery-box-install"));
    state.runner.credits = 20;
    state.runner.memoryLimit = 8;
    const mysteryId = installRunnerProgramForTest(state, "onr_v1_043_mystery-box");
    const bottomReveal = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const secondProgram = putRunnerCardOnTopOfStack(
      state,
      "onr_v1_024_expert-schedule-analyzer",
    );
    const selectedProgram = putRunnerCardOnTopOfStack(state, "simple_decoder");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const mysteryAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_043_mystery-box",
    );
    expect(mysteryAction.payload).toMatchObject({
      cardImplementationAbility: "activated",
      cardImplementationAbilityTiming: "during_run",
    });
    state = apply(state, "runner", (action) => action.actionId === mysteryAction.actionId);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.source).toContain("p3_38.mystery_box_corp_review");
    expect(
      state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(expect.arrayContaining([selectedProgram, secondProgram, "done"]));
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).toContain(
      "simple_decoder",
    );
    state = applyChoice(state, "corp", "done");
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.source).toContain(
      "p3_38.look_top_stack_show_to_corp_then_install_matching",
    );
    expect(
      state.pendingChoice?.options.map((option) => option.value),
    ).toEqual(expect.arrayContaining([selectedProgram, secondProgram]));
    state = applyChoice(state, "runner", `card_${selectedProgram}`);
    expect(state.runner.rig.programs).toContain(selectedProgram);
    expect(state.runner.heap).toContain(mysteryId);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.runner.stack).toContain(bottomReveal);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction:
        "p3_38_look_top_stack_show_to_corp_then_install_matching",
      installedProgramDefinitionId: "simple_decoder",
      selfTrashed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          sourceDefinition(state, action) === "onr_v1_043_mystery-box",
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noProgram = toRunnerTurn(MECHANIC_SMOKE_GAMES.runAccess("spotcheck-mystery-box-no-program"));
    noProgram.runner.credits = 20;
    noProgram.runner.memoryLimit = 8;
    installRunnerProgramForTest(noProgram, "onr_v1_043_mystery-box");
    const eventIds = Object.entries(noProgram.cardInstances)
      .filter(([, card]) => card.definitionId === "simple_economy_event")
      .slice(0, 5)
      .map(([id]) => id);
    expect(eventIds).toHaveLength(5);
    for (const cardId of eventIds) {
      removeEverywhere(noProgram, cardId);
      noProgram.runner.stack.unshift(cardId);
      noProgram.cardInstances[cardId] = {
        ...noProgram.cardInstances[cardId]!,
        zone: { side: "runner", zone: "stack" },
      };
    }
    putCorpCardOnTopOfRd(noProgram, "simple_agenda");
    noProgram = apply(
      noProgram,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noProgram = apply(
      noProgram,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(noProgram, action) === "onr_v1_043_mystery-box",
    );
    expect(noProgram.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("p3_38.mystery_box_corp_review"),
    });
    noProgram = applyChoice(noProgram, "corp", "done");
    expect(noProgram.pendingChoice).toBeUndefined();
    expect(noProgram.eventLog.at(-1)?.publicPayload).toMatchObject({
      programFound: false,
      selfTrashed: false,
      installedProgramCount: 0,
    });
  });

  it("loads Corolla Speed Chip with one restricted Killer recurring credit and refreshes it", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-corolla-speed-chip",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_corolla_runner",
          name: "Spotcheck Corolla Runner",
          cards: [
            { id: "onr_v1_124_corolla-speed-chip", quantity: 1 },
            { id: "simple_killer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_corolla_corp",
          name: "Spotcheck Corolla Corp",
          cards: [
            { id: "simple_sentry_ice", quantity: 1 },
            { id: "simple_code_gate_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 10;
    const corollaId = moveRunnerCardToGrip(
      state,
      "onr_v1_124_corolla-speed-chip",
    );
    installRunnerProgramForTest(state, "simple_killer");
    const sentryId = putCorpIceOnServer(state, "rd", "simple_sentry_ice");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_124_corolla-speed-chip",
    );
    expect(state.runner.credits).toBe(1);
    expect(cardCounterAmount(state, corollaId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hostedCreditsAdded: 1,
      counterType: "bit",
    });
    let refreshState = structuredClone(state);
    setCardCounterForTest(refreshState, corollaId, "bit", 0);
    refreshState.runner.maxHandSize = 100;
    refreshState = apply(refreshState, "runner", (action) => action.type === "end_turn");
    refreshState = apply(refreshState, "corp", (action) => action.type === "mandatory_draw");
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(refreshState, "corp", (action) => action.type === "end_turn");
    expect(cardCounterAmount(refreshState, corollaId, "bit")).toBe(1);
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === sentryId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    expect(state.runner.credits).toBe(1);
    expect(cardCounterAmount(state, corollaId, "bit")).toBe(0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "simple_killer",
    );
    expect(state.runner.credits).toBe(0);
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(true);

    let decoderState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-corolla-non-killer-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_corolla_decoder_runner",
          name: "Spotcheck Corolla Decoder Runner",
          cards: [
            { id: "onr_v1_124_corolla-speed-chip", quantity: 1 },
            { id: "simple_decoder", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "simple_decoder",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_corolla_decoder_corp",
          name: "Spotcheck Corolla Decoder Corp",
          cards: [
            { id: "simple_code_gate_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    decoderState.runner.credits = 4;
    decoderState.runner.memoryLimit = 4;
    decoderState.corp.credits = 10;
    moveRunnerCardToGrip(decoderState, "onr_v1_124_corolla-speed-chip");
    moveRunnerCardToGrip(decoderState, "simple_decoder");
    const codeGateId = putCorpIceOnServer(
      decoderState,
      "rd",
      "simple_code_gate_ice",
    );
    decoderState = apply(
      decoderState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(decoderState, action) ===
          "onr_v1_124_corolla-speed-chip",
    );
    installRunnerProgramForTest(decoderState, "simple_decoder");
    decoderState.runner.credits = 0;
    decoderState = apply(
      decoderState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    decoderState = apply(
      decoderState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === codeGateId,
    );
    expect(
      getLegalActions(decoderState, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(decoderState, action) === "simple_decoder",
      ),
    ).toBe(false);
  });

  it("keeps Newsgroup Filter main-window scoped and rejects removed-source replay drift", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-newsgroup-filter-hardening",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_newsgroup_filter_runner",
          name: "Spotcheck Newsgroup Filter Runner",
          cards: [
            { id: "onr_v1_045_newsgroup-filter", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    const filterId = moveRunnerCardToGrip(state, "onr_v1_045_newsgroup-filter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_045_newsgroup-filter",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === filterId,
    );
    expect(legal.payload).toMatchObject({
      cardId: filterId,
      cardImplementationAbility: "activated",
      cardImplementationAbilityIndex: 0,
      cardImplementationAbilityTiming: "runner_main",
    });
    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, filterId);
    removedSource.runner.heap.push(filterId);
    removedSource.cardInstances[filterId] = {
      ...removedSource.cardInstances[filterId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
    const removed = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-newsgroup-removed-source",
    });
    expect(removed.ok).toBe(false);

    putCorpCardOnTopOfRd(state, "simple_agenda");
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.cardImplementationAbility === "activated" &&
          action.payload?.cardId === filterId,
      ),
    ).toBe(false);
  });
});

describe("Originalset Spotcheck 2026-05-16 Prevention/Interface/Agenda Actions hardening", () => {
  it("uses R&D Interface as cumulative R&D multiaccess without exposing unreached cards or damage prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-rd-interface-multiaccess",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_rd_interface_runner",
          name: "Spotcheck R&D Interface Runner",
          cards: [
            { id: "onr_v1_139_r-and-d-interface", quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rd_interface_corp",
          name: "Spotcheck R&D Interface Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_agenda", quantity: 1 },
            { id: "simple_economy_operation", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  "simple_economy_asset",
                  "simple_agenda",
                  "simple_economy_operation",
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const firstInterface = moveRunnerCardToGrip(state, "onr_v1_139_r-and-d-interface");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === firstInterface,
    );
    const secondInterface = moveRunnerCardCopyToGrip(
      state,
      "onr_v1_139_r-and-d-interface",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === secondInterface,
    );
    expect(
      DEMO_CARDS_BY_ID["onr_v1_139_r-and-d-interface"]?.mechanics,
    ).toEqual(expect.arrayContaining(["access", "breach", "multiaccess"]));
    expect(
      DEMO_CARDS_BY_ID["onr_v1_139_r-and-d-interface"]?.mechanics,
    ).not.toContain("damage_prevention");

    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice = [];
    putCorpCardOnTopOfRd(state, "simple_economy_asset");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    if (state.run && !state.run.breach) {
      state = apply(state, "runner", (action) => action.type === "continue_run");
    }

    expect(state.run?.breach?.queue).toHaveLength(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
      installedAccessBonusSourceDefinitionIds: "onr_v1_139_r-and-d-interface,onr_v1_139_r-and-d-interface",
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Economy Asset",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "simple_economy_operation",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_agenda",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Nasuko Cycle source-bound across damage windows and removal drift", () => {
    let state = createGameAfterSetup({
      seed: "spotcheck-prevention-sources",
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: "spotcheck_prevention_sources_runner",
        name: "Spotcheck Prevention Sources Runner",
        cards: [
          { id: "onr_v1_135_nasuko-cycle", quantity: 1 },
          { id: "onr_v1_161_fall-guy", quantity: 1 },
          { id: "onr_v1_170_nomad-allies", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          { id: "onr_v1_301_punitive-counterstrike", quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    state.runner.credits = 10;
    state.corp.credits = 10;
    state.corp.clicks = 3;
    const nasukoId = installRunnerHardwareForTest(state, "onr_v1_135_nasuko-cycle");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );
    expect(state.eventModificationWindow?.candidates[0]?.sourceRef.definitionId).toBe(
      "onr_v1_135_nasuko-cycle",
    );
    state = applyChoice(
      state,
      "runner",
      String(state.eventModificationWindow?.candidates[0]?.candidateId),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      preventedAmount: 1,
      sourceDefinitionId: "onr_v1_135_nasuko-cycle",
    });
    expect(state.runner.rig.hardware).toContain(nasukoId);
    let removedSource = structuredClone(initial);
    moveCorpCardToHq(removedSource, "onr_v1_301_punitive-counterstrike");
    removedSource = apply(
      removedSource,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(removedSource, action) ===
          "onr_v1_301_punitive-counterstrike",
    );
    const legal = mustAction(
      removedSource,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const candidateId = String(
      removedSource.eventModificationWindow?.candidates[0]?.candidateId,
    );
    removeEverywhere(removedSource, nasukoId);
    removedSource.runner.heap.push(nasukoId);
    removedSource.cardInstances[nasukoId] = {
      ...removedSource.cardInstances[nasukoId]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
    const result = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      selectedChoices: {
        choiceId: removedSource.pendingChoice?.choiceId,
        selectedOptionIds: [candidateId],
      },
    });
    expect(result.ok).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("spends Hell's Run only for Runner trace-link bids and refreshes it next Runner turn", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-hells-run-trace-link",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.traceTags.runner,
          id: "spotcheck_hells_run_runner",
          name: "Spotcheck Hell's Run Runner",
          cards: [
            { id: "onr_v1_164_hells-run", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
              (card) => card.id !== "onr_v1_164_hells-run",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.traceTags.corp,
          id: "spotcheck_hells_run_corp",
          name: "Spotcheck Hell's Run Corp",
          cards: [
            { id: "onr_v1_246_fragmentation-storm", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
              (card) => card.id !== "onr_v1_246_fragmentation-storm",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.runner.memoryLimit = 8;
    state.corp.credits = 20;
    const hellsRunId = moveRunnerCardToGrip(state, "onr_v1_164_hells-run");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === hellsRunId,
    );
    state.runner.credits = 0;
    expect(cardCounterAmount(state, hellsRunId, "bit")).toBe(1);
    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", "onr_v1_246_fragmentation-storm");
    state = continueRunThroughMovementWindow(state);
    state = applyChoice(state, "corp", "bid_0");
    expect(state.pendingChoice?.options.some((option) => option.id === "bid_1")).toBe(
      true,
    );
    state = applyChoice(state, "runner", "bid_1");
    expect(cardCounterAmount(state, hellsRunId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hellsRunTraceCreditsSpent: 1,
      runnerCreditsSpent: 0,
      traceLinkCreditSourceDefinitionIds: "onr_v1_164_hells-run",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let refreshState = structuredClone(initial);
    setCardCounterForTest(refreshState, hellsRunId, "bit", 0);
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(refreshState, "runner", (action) => action.type === "end_turn");
    refreshState = apply(refreshState, "corp", (action) => action.type === "mandatory_draw");
    refreshState = apply(refreshState, "corp", (action) => action.type === "end_turn");
    expect(cardCounterAmount(refreshState, hellsRunId, "bit")).toBe(1);

    let runCostState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-hells-run-not-run-cost",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_hells_run_cost_runner",
          name: "Spotcheck Hell's Run Cost Runner",
          cards: [
            { id: "onr_v1_164_hells-run", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "onr_v1_164_hells-run",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_hells_run_cost_corp",
          name: "Spotcheck Hell's Run Cost Corp",
          cards: [
            { id: "onr_v1_332_newsgroup-taunting", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_332_newsgroup-taunting",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    runCostState.runner.credits = 0;
    const runCostHell = installRunnerResourceForTest(
      runCostState,
      "onr_v1_164_hells-run",
    );
    setCardCounterForTest(runCostState, runCostHell, "bit", 1);
    putCorpRootInRemote(runCostState, "onr_v1_332_newsgroup-taunting");
    const taxAssetId = runCostState.corp.servers
      .flatMap((server) => server.root)
      .find(
        (cardId) =>
          runCostState.cardInstances[cardId]?.definitionId ===
          "onr_v1_332_newsgroup-taunting",
      );
    if (!taxAssetId) throw new Error("Newsgroup Taunting missing.");
    runCostState.cardInstances[taxAssetId] = {
      ...runCostState.cardInstances[taxAssetId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(runCostState, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);
  });

  it("uses Ronin Around for top-five hardware retrieval and expose", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-ronin-around",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.hiddenZone.runner,
          cards: [
            ...MECHANIC_SMOKE_DECKS.hiddenZone.runner.cards,
            { id: "simple_setup_hardware", quantity: 1 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.hiddenZone.corp,
      }),
    );
    state.runner.credits = 10;
    const roninId = installRunnerResourceForTest(state, "onr_v1_175_ronin-around");
    const lowerCardId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const hardwareId = putRunnerCardOnTopOfStack(state, "simple_setup_hardware");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === roninId &&
        action.payload?.cardImplementationAbilityIndex === 0,
    );
    expect(state.pendingChoice?.source).toContain("p3_37.look_top_stack_take_matching");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: hardwareId }),
        expect.objectContaining({ value: lowerCardId, selectable: false }),
      ]),
    );
    state = applyChoice(state, "runner", `card_${hardwareId}`);
    expect(state.runner.grip).toContain(hardwareId);
    expect(state.runner.stack).toContain(lowerCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      publicRevealDefinitionIds: "simple_setup_hardware",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let exposeState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ronin-around-expose"),
    );
    exposeState.runner.credits = 10;
    const exposeRoninId = installRunnerResourceForTest(
      exposeState,
      "onr_v1_175_ronin-around",
    );
    const targetIceId = putCorpIceOnServer(exposeState, "rd", "simple_barrier_ice");
    exposeState = apply(
      exposeState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === exposeRoninId &&
        action.payload?.cardImplementationAbilityIndex === 1,
    );
    expect(exposeState.pendingChoice).toMatchObject({
      source: expect.stringContaining("p3_36.expose_installed_card:"),
      prompt: "Installierte Korp-Karte exposen",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(exposeState.pendingChoice?.options).toContainEqual({
      id: expect.stringMatching(/^card_hidden_/),
      label: "R&D ICE 1",
      value: targetIceId,
    });
    const targetIceOptionId = exposeState.pendingChoice?.options.find(
      (option) => option.value === targetIceId,
    )?.id;
    expect(targetIceOptionId).toMatch(/^card_hidden_/);
    exposeState = applyChoice(exposeState, "runner", targetIceOptionId ?? "");
    expect(exposeState.pendingChoice?.source).toContain(
      "p3_36.expose_installed_card_review:",
    );
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_175_ronin-around",
      hiddenZoneAction: "expose_installed_card_review",
    });
    exposeState = applyChoice(exposeState, "runner", "done");
    expect(exposeState.pendingChoice).toBeUndefined();
  });

  it("binds Hostile Takeover, Political Overthrow, Nevinyrral and Rustbelt to their live public sources", () => {
    let hostile = apply(
      createGameAfterSetup({
        seed: "spotcheck-hostile-takeover-guard",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_hostile_guard_corp",
          name: "Spotcheck Hostile Guard Corp",
          cards: [
            { id: "onr_v1_203_hostile-takeover", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_331_nevinyrral",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    hostile.corp.credits = 10;
    hostile.corp.clicks = 5;
    hostile.corp.maxHandSize = 100;
    const hostileId = moveCorpCardToHq(hostile, "onr_v1_203_hostile-takeover");
    hostile = apply(
      hostile,
      "corp",
      (action) =>
        action.type === "install_card" && String(action.payload?.cardId) === hostileId,
    );
    expect(
      getLegalActions(hostile, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(hostile, action) === "onr_v1_203_hostile-takeover",
      ),
    ).toBe(false);
    for (let index = 0; index < 3; index += 1) {
      hostile = apply(
        hostile,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(hostile, action) === "onr_v1_203_hostile-takeover",
      );
    }
    const creditsBeforeScore = hostile.corp.credits;
    hostile = apply(
      hostile,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(hostile, action) === "onr_v1_203_hostile-takeover",
    );
    expect(hostile.corp.credits).toBe(creditsBeforeScore + 5);
    expect(hostile.eventLog.at(-1)?.publicPayload).toMatchObject({
      onScoreGainCredits: 5,
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 5,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_203_hostile-takeover",
          sourceTitle: "Hostile Takeover",
        }),
      ],
    });

    let political = apply(
      createGameAfterSetup({
        seed: "spotcheck-political-overthrow-sources",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_political_sources_corp",
          name: "Spotcheck Political Sources Corp",
          cards: [
            { id: "onr_v1_210_political-overthrow", quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_331_nevinyrral",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    political.corp.credits = 0;
    political.corp.clicks = 3;
    const firstPolitical = scoreCorpAgendaForTest(
      political,
      "onr_v1_210_political-overthrow",
    );
    const secondPolitical = scoreCorpAgendaForTest(
      political,
      "onr_v1_210_political-overthrow",
    );
    const politicalActions = getLegalActions(political, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        sourceDefinition(political, action) ===
          "onr_v1_210_political-overthrow",
    );
    expect(politicalActions.map((action) => action.payload?.cardId).sort()).toEqual(
      [firstPolitical, secondPolitical].sort(),
    );
    const removedPolitical = structuredClone(political);
    removeEverywhere(removedPolitical, firstPolitical);
    const firstPoliticalAction = politicalActions.find(
      (action) => action.payload?.cardId === firstPolitical,
    );
    const removedResult = applyAction(removedPolitical, {
      matchId: removedPolitical.matchId,
      side: "corp",
      actionId: String(firstPoliticalAction?.actionId),
      clientKnownStateVersion: removedPolitical.stateVersion,
      idempotencyKey: "spotcheck-political-removed",
    });
    expect(removedResult.ok).toBe(false);

    let nevinyrral = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-nevinyrral-loss",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_nevinyrral_loss_corp",
          name: "Spotcheck Nevinyrral Loss Corp",
          cards: [
            { id: "onr_v1_331_nevinyrral", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_331_nevinyrral",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    nevinyrral.runner.credits = 10;
    const nevinyrralId = putCorpRootInRemote(nevinyrral, "onr_v1_331_nevinyrral");
    nevinyrral.cardInstances[nevinyrralId] = {
      ...nevinyrral.cardInstances[nevinyrralId]!,
      faceup: true,
      rezzed: true,
    };
    nevinyrral = apply(
      nevinyrral,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    nevinyrral = apply(nevinyrral, "runner", (action) => action.type === "access_card");
    nevinyrral = apply(
      nevinyrral,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(nevinyrral.winner).toBe("runner");
    expect(nevinyrral.gameEndReason).toBe("nevinyrral_left_play");
    expect(nevinyrral.eventLog.at(-1)?.publicPayload).toMatchObject({
      gameEndReason: "nevinyrral_left_play",
      sourceDefinitionId: "onr_v1_331_nevinyrral",
    });

    let rustbelt = apply(
      createGameAfterSetup({
        seed: "spotcheck-rustbelt-handlimit",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rustbelt_handlimit_corp",
          name: "Spotcheck Rustbelt Handlimit Corp",
          cards: [
            { id: "onr_v1_338_rustbelt-hq-branch", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_338_rustbelt-hq-branch",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rustbelt.corp.maxHandSize = 5;
    const rustbeltId = putCorpRootInRemote(rustbelt, "onr_v1_338_rustbelt-hq-branch");
    expect(getPlayerView(rustbelt, "corp").own.maxHandSize).toBe(5);
    rustbelt.cardInstances[rustbeltId] = {
      ...rustbelt.cardInstances[rustbeltId]!,
      faceup: true,
      rezzed: true,
    };
    expect(getPlayerView(rustbelt, "corp").own.maxHandSize).toBe(7);
    expect(getPlayerView(rustbelt, "runner").opponent.maxHandSize).toBe(7);
    removeEverywhere(rustbelt, rustbeltId);
    rustbelt.corp.archives.push(rustbeltId);
    rustbelt.cardInstances[rustbeltId] = {
      ...rustbelt.cardInstances[rustbeltId]!,
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "archives" },
    };
    expect(getPlayerView(rustbelt, "corp").own.maxHandSize).toBe(5);
  });
});

describe("Originalset Spotcheck 2026-05-16 Resource/Agenda ScoreArea hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps runner resources source-bound, public-source safe and replayable", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("spotcheck-resource-scorearea-resources"),
    );
    state.runner.credits = 80;
    state.runner.clicks = 30;
    for (const definitionId of [
      "onr_v1_178_short-term-contract",
      "onr_v1_183_technician-lover",
    ] as const) {
      moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
    }

    const shortTermId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_178_short-term-contract",
    );
    expect(shortTermId).toBeDefined();
    if (!shortTermId) throw new Error("Missing Short-Term Contract");
    expect(cardCounterAmount(state, shortTermId, "bit")).toBe(12);
    const shortTermAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === shortTermId,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: shortTermAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-short-term-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: shortTermAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-short-term-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, shortTermId);
    const drift = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: shortTermAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-short-term-removed-source",
    });
    expect(drift.ok).toBe(false);

    const shortTermInitial = structuredClone(state);
    const shortTermReplayStart = state.eventLog.length;
    const creditsBeforeShortTerm = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === shortTermAction.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeShortTerm + 2);
    expect(cardCounterAmount(state, shortTermId, "bit")).toBe(10);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === shortTermId,
      )?.counterDisplays,
    ).toContainEqual({
      id: "stored_credits",
      amount: 10,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "10 gespeicherte Credits",
      counterType: "bit",
      usageHint: "spendable",
      creditPool: { kind: "stored_credit" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_178_short-term-contract",
      gainedCredits: 2,
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 10,
      remainingCounters: 10,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 2,
          remainingCounters: 10,
          sourceDefinitionId: "onr_v1_178_short-term-contract",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const shortTermReplay = replayEvents(
      shortTermInitial,
      state.eventLog.slice(shortTermReplayStart),
    );
    expect(shortTermReplay.ok).toBe(true);
    expect(hashState(shortTermReplay.state)).toBe(hashState(state));

    let silicon = toRunnerTurn(v172CardReleaseGame("spotcheck-silicon-source"));
    silicon.runner.credits = 30;
    silicon.runner.clicks = 10;
    moveRunnerCardToGrip(silicon, "onr_v1_179_silicon-saloon-franchise");
    silicon = apply(
      silicon,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(silicon, action) ===
          "onr_v1_179_silicon-saloon-franchise",
    );
    const siliconId = silicon.runner.rig.resources.find(
      (cardId) =>
        silicon.cardInstances[cardId]?.definitionId ===
        "onr_v1_179_silicon-saloon-franchise",
    );
    expect(siliconId).toBeDefined();
    if (!siliconId) throw new Error("Missing Silicon Saloon Franchise");
    const siliconAction = mustAction(
      silicon,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(silicon, action) ===
          "onr_v1_179_silicon-saloon-franchise",
    );
    const removedSilicon = structuredClone(silicon);
    removeEverywhere(removedSilicon, siliconId);
    const siliconDrift = applyAction(removedSilicon, {
      matchId: removedSilicon.matchId,
      side: "runner",
      actionId: siliconAction.actionId,
      clientKnownStateVersion: removedSilicon.stateVersion,
      idempotencyKey: "spotcheck-silicon-removed-source",
    });
    expect(siliconDrift.ok).toBe(false);
    const siliconInitial = structuredClone(silicon);
    const siliconReplayStart = silicon.eventLog.length;
    const siliconCreditsBefore = silicon.runner.credits;
    const siliconGripBefore = silicon.runner.grip.length;
    silicon = apply(silicon, "runner", (action) => action.actionId === siliconAction.actionId);
    expect(silicon.runner.credits).toBe(siliconCreditsBefore + 1);
    expect(silicon.runner.grip.length).toBe(siliconGripBefore + 1);
    expect(silicon.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_179_silicon-saloon-franchise",
      cardImplementationAbility: "activated",
      gainedCredits: 1,
      drawnCount: 1,
      runnerCreditsAfter: silicon.runner.credits,
      runnerGripAfter: silicon.runner.grip.length,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 1,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
          sourceTitle: "Silicon Saloon Franchise",
        }),
        expect.objectContaining({
          kind: "draw_cards",
          side: "runner",
          amount: 1,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_179_silicon-saloon-franchise",
          sourceTitle: "Silicon Saloon Franchise",
        }),
      ],
    });
    expect(JSON.stringify(silicon.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const siliconReplay = replayEvents(
      siliconInitial,
      silicon.eventLog.slice(siliconReplayStart),
    );
    expect(siliconReplay.ok).toBe(true);
    expect(hashState(siliconReplay.state)).toBe(hashState(silicon));

    let topRunners = toRunnerTurn(v192CardReleaseGame("spotcheck-top-runners"));
    topRunners.runner.credits = 30;
    topRunners.runner.clicks = 10;
    moveRunnerCardToGrip(topRunners, "onr_v1_184_top-runners-conference");
    topRunners = apply(
      topRunners,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(topRunners, action) ===
          "onr_v1_184_top-runners-conference",
    );
    const topRunnersId = topRunners.runner.rig.resources.find(
      (cardId) =>
        topRunners.cardInstances[cardId]?.definitionId ===
        "onr_v1_184_top-runners-conference",
    );
    expect(topRunnersId).toBeDefined();
    if (!topRunnersId) throw new Error("Missing Top Runners' Conference");
    const topRunnersInitial = structuredClone(topRunners);
    const topRunnersReplayStart = topRunners.eventLog.length;
    const creditsBeforeTopRunners = topRunners.runner.credits;
    topRunners = apply(topRunners, "runner", (action) => action.type === "end_turn");
    topRunners = apply(topRunners, "corp", (action) => action.type === "mandatory_draw");
    topRunners = toRunnerTurnFromCorpMain(topRunners);
    expect(topRunners.runner.credits).toBe(creditsBeforeTopRunners + 2);
    topRunners = apply(
      topRunners,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(topRunners.runner.rig.resources).not.toContain(topRunnersId);
    expect(topRunners.runner.heap).toContain(topRunnersId);
    const topRunnersReplay = replayEvents(
      topRunnersInitial,
      topRunners.eventLog.slice(topRunnersReplayStart),
    );
    expect(topRunnersReplay.ok).toBe(true);
    expect(hashState(topRunnersReplay.state)).toBe(hashState(topRunners));
  });

  it("keeps Trauma Team damage prevention choices source-safe", () => {
    const definitionId = "onr_v1_185_trauma-team";
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention(
        `spotcheck-resource-scorearea-${definitionId}`,
      ),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, definitionId);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === definitionId,
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );
    expect(state.pendingChoice?.side).toBe("runner");
    const optionId = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(optionId).toBeDefined();
    if (!optionId) throw new Error(`Missing prevention option for ${definitionId}`);
    state = applyChoice(state, "runner", optionId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      sourceDefinitionId: definitionId,
      originalAmount: 2,
      preventedAmount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not treat Umbrella Policy as Net Damage prevention during a run", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("umbrella-data-darts-net-damage"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_186_umbrella-policy");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_186_umbrella-policy",
    );
    putCorpIceOnServer(state, "rd", "onr_v1_234_data-darts");
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");

    state = apply(
      state,
      "runner",
      (action) => action.type === "continue_run" && action.payload?.encounterContinue === true,
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toHaveLength(3);
    expect(state.run?.phase).toBe("movement");
    expect(getLegalActions(state, "runner").map((action) => action.type)).toContain(
      "continue_run",
    );
  });

  it("shows Trauma Team trauma counters after install and its add-counter action", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("spotcheck-trauma-team-counters"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "onr_v1_185_trauma-team");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_185_trauma-team",
    );
    const traumaTeamId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_185_trauma-team",
    );
    expect(traumaTeamId).toBeDefined();
    if (!traumaTeamId) throw new Error("Missing Trauma Team install");
    expect(cardCounterAmount(state, traumaTeamId, "trauma")).toBe(2);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === traumaTeamId,
      )?.counterDisplays,
    ).toEqual([
      expect.objectContaining({
        id: "trauma",
        amount: 2,
        displayKind: "damage_prevention",
        counterType: "trauma",
        label: "Trauma-Counter",
      }),
    ]);

    const addCounterAction = getLegalActions(state, "runner").find(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === traumaTeamId &&
        action.payload?.cardImplementationAbility === "activated",
    );
    expect(addCounterAction?.label).toBe("Trauma-Counter hinzufügen");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === addCounterAction?.actionId,
    );
    expect(cardCounterAmount(state, traumaTeamId, "trauma")).toBe(3);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === traumaTeamId,
      )?.counterDisplays,
    ).toEqual([
      expect.objectContaining({
        id: "trauma",
        amount: 3,
        displayKind: "damage_prevention",
        counterType: "trauma",
      }),
    ]);
  });

  it("keeps scored agendas scoreArea-bound and replay-safe", () => {
    let employee = apply(
      MECHANIC_SMOKE_GAMES.counterRecurring("spotcheck-employee-empowerment"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    employee.corp.credits = 10;
    employee.corp.maxHandSize = 100;
    const employeeId = scoreCorpAgendaForTest(employee, "onr_v1_199_employee-empowerment");
    const hqBeforeEmployeeStart = employee.corp.hq.length;
    employee = apply(employee, "corp", (action) => action.type === "end_turn");
    employee = apply(employee, "runner", (action) => action.type === "end_turn");
    expect(employee.corp.hq.length).toBe(hqBeforeEmployeeStart);
    expect(employee.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("v1912.employee_empowerment_start_draw"),
      prompt: "Employee Empowerment: zusätzliche Karte ziehen?",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(getPlayerView(employee, "corp").pendingChoice?.options.map((option) => option.id)).toEqual(["draw", "skip"]);
    expect(getPlayerView(employee, "runner").pendingChoice).toBeUndefined();
    expect(getLegalActions(employee, "corp").map((action) => action.type)).toEqual(["resolve_choice"]);
    expect(getLegalActions(employee, "runner")).toEqual([]);

    const choiceAction = mustAction(employee, "corp", (action) => action.type === "resolve_choice");
    const wrongSide = applyAction(employee, {
      matchId: employee.matchId,
      side: "runner",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: employee.stateVersion,
      selectedChoices: {
        choiceId: employee.pendingChoice?.choiceId,
        selectedOptionIds: ["draw"],
      },
    });
    expect(wrongSide.ok).toBe(false);
    const stale = applyAction(employee, {
      matchId: employee.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: employee.stateVersion - 1,
      selectedChoices: {
        choiceId: employee.pendingChoice?.choiceId,
        selectedOptionIds: ["draw"],
      },
    });
    expect(stale.ok).toBe(false);

    const employeeChoiceInitial = structuredClone(employee);
    employee = applyChoice(employee, "corp", "skip");
    expect(employee.pendingChoice).toBeUndefined();
    expect(employee.corp.hq.length).toBe(hqBeforeEmployeeStart);
    expect(employee.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_199_employee-empowerment",
      employeeEmpowermentStartDrawDecision: "skip",
    });
    const employeeSkipReplay = replayEvents(
      employeeChoiceInitial,
      employee.eventLog.slice(employeeChoiceInitial.eventLog.length),
    );
    expect(employeeSkipReplay.ok).toBe(true);
    expect(hashState(employeeSkipReplay.state)).toBe(hashState(employee));
    employee = apply(employee, "corp", (action) => action.type === "mandatory_draw");
    expect(employee.corp.hq.length).toBe(hqBeforeEmployeeStart + 1);

    const employeeAction = mustAction(
      employee,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(employee, action) === "onr_v1_199_employee-empowerment",
    );
    const beforeAgendaAction = employee.corp.hq.length;
    employee = apply(employee, "corp", (action) => action.actionId === employeeAction.actionId);
    expect(employee.corp.hq.length).toBe(beforeAgendaAction + 2);
    expect(employee.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_199_employee-empowerment",
      drawnCards: 2,
    });

    const nextTurnStart = apply(
      apply(employee, "corp", (action) => action.type === "end_turn"),
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(nextTurnStart.pendingChoice?.source).toContain("v1912.employee_empowerment_start_draw");
    const hqBeforeOptionalDraw = nextTurnStart.corp.hq.length;
    const employeeDraw = applyChoice(nextTurnStart, "corp", "draw");
    expect(employeeDraw.corp.hq.length).toBe(hqBeforeOptionalDraw + 1);
    expect(employeeDraw.pendingChoice).toBeUndefined();
    expect(employeeDraw.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_199_employee-empowerment",
      employeeEmpowermentStartDrawDecision: "draw",
      drawnCards: 1,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: "onr_v1_199_employee-empowerment",
        }),
      ],
    });
    const employeeDrawReplay = replayEvents(
      nextTurnStart,
      employeeDraw.eventLog.slice(nextTurnStart.eventLog.length),
    );
    expect(employeeDrawReplay.ok).toBe(true);
    expect(hashState(employeeDrawReplay.state)).toBe(hashState(employeeDraw));
    const removedEmployee = structuredClone(nextTurnStart);
    removeEverywhere(removedEmployee, employeeId);
    const removedResult = applyAction(removedEmployee, {
      matchId: removedEmployee.matchId,
      side: "corp",
      actionId: mustAction(removedEmployee, "corp", (action) => action.type === "resolve_choice").actionId,
      clientKnownStateVersion: removedEmployee.stateVersion,
      selectedChoices: {
        choiceId: removedEmployee.pendingChoice?.choiceId,
        selectedOptionIds: ["draw"],
      },
    });
    expect(removedResult.ok).toBe(false);

    let marine = apply(
      createGameAfterSetup({
        seed: "spotcheck-marine-arcology-scorearea",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_marine_arcology_corp",
          cards: [
            { id: "onr_v1_206_marine-arcology", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    marine.corp.credits = 30;
    marine.corp.clicks = 10;
    const marineId = scoreCorpAgendaForTest(marine, "onr_v1_206_marine-arcology");
    const marineAction = mustAction(
      marine,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(marine, action) === "onr_v1_206_marine-arcology",
    );
    const marineRemoved = structuredClone(marine);
    removeEverywhere(marineRemoved, marineId);
    const marineDrift = applyAction(marineRemoved, {
      matchId: marineRemoved.matchId,
      side: "corp",
      actionId: marineAction.actionId,
      clientKnownStateVersion: marineRemoved.stateVersion,
      idempotencyKey: "spotcheck-marine-removed-source",
    });
    expect(marineDrift.ok).toBe(false);
    const marineInitial = structuredClone(marine);
    const marineReplayStart = marine.eventLog.length;
    const marineCreditsBefore = marine.corp.credits;
    marine = apply(marine, "corp", (action) => action.actionId === marineAction.actionId);
    expect(marine.corp.credits).toBe(marineCreditsBefore + 3);
    expect(marine.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_206_marine-arcology",
      cardImplementationAbility: "activated",
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_206_marine-arcology",
          sourceTitle: "Marine Arcology",
        }),
      ],
    });
    expect(JSON.stringify(marine.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const marineReplay = replayEvents(
      marineInitial,
      marine.eventLog.slice(marineReplayStart),
    );
    expect(marineReplay.ok).toBe(true);
    expect(hashState(marineReplay.state)).toBe(hashState(marine));

    for (const [definitionId, advanceCount, expectedPoints] of [
      ["onr_v1_214_project-babylon", 7, 3],
      ["onr_v1_220_tycho-extension", 4, 4],
    ] as const) {
      let state = apply(
        definitionId === "onr_v1_214_project-babylon"
          ? v180CardReleaseGame(`spotcheck-${definitionId}`)
          : createGameAfterSetup({
              seed: `spotcheck-${definitionId}`,
              runnerDeck: ONR_V1_RUNNER_DECK,
              corpDeck: ONR_V1_CORP_DECK,
              agendaPointsToWin: 7,
            }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 40;
      state.corp.clicks = 20;
      moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      for (let index = 0; index < advanceCount; index += 1) {
        state = apply(
          state,
          "corp",
          (action) =>
            action.type === "advance_card" &&
            sourceDefinition(state, action) === definitionId,
        );
      }
      const scoreAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(state, action) === definitionId,
      );
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: scoreAction.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-stale-score`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(state, "corp", (action) => action.actionId === scoreAction.actionId);
      if (definitionId === "onr_v1_214_project-babylon") {
        const projectBabylonId = state.corp.scoreArea.find(
          (cardId) => state.cardInstances[cardId]?.definitionId === definitionId,
        );
        expect(projectBabylonId).toBeDefined();
        if (projectBabylonId)
          expect(cardCounterAmount(state, projectBabylonId, "agenda")).toBe(2);
      } else {
        expect(agendaPoints(state, "corp")).toBe(expectedPoints);
      }
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
        totalAgendaPoints: expectedPoints,
      });
      if (definitionId === "onr_v1_214_project-babylon") {
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          projectBabylonOveradvance: 4,
          projectBabylonBonusAgendaPoints: 2,
        });
      }
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });
});
