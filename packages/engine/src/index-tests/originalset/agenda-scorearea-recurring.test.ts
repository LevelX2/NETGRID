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
            { id: 594, quantity: 1 },
            { id: 588, quantity: 1 },
            { id: 596, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  594,
                  588,
                  596,
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 20;
    const gremlinsId = moveRunnerCardToGrip(state, 241);
    const mantisId = moveRunnerCardToGrip(state, 383);

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
    expect(
      JSON.stringify(state.eventLog.map((event) => event.publicPayload)),
    ).not.toMatch(privatePayloadMarkers);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.clicks = 10;
    const boonId = scoreCorpAgendaForTest(state, 404);
    const branchId = scoreCorpAgendaForTest(
      state,
      430,
    );
    const euromarketId = putCorpRootInRemote(
      state,
      534,
    );
    state.cardInstances[euromarketId] = {
      ...state.cardInstances[euromarketId]!,
      faceup: true,
      rezzed: true,
    };
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.payload?.cardId === boonId ||
          action.payload?.cardId === branchId,
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
      cardDefinitionId: 534,
      drawnCards: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 2,
          sourceDefinitionId: 534,
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
            { id: 594, quantity: 1 },
            { id: 588, quantity: 1 },
            { id: 596, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  594,
                  588,
                  596,
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const mramId = moveRunnerCardToGrip(state, 346);
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === mramId,
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
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
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
          sourceDefinitionId: 346,
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
    expect(getPlayerView(state, "runner").own.maxHandSize).toBe(
      maxHandSizeBefore,
    );
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
        { id: 405, quantity: 1 },
        { id: 420, quantity: 1 },
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
    const coupId = scoreCorpAgendaForTest(state, 405);
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
    state = apply(
      state,
      "corp",
      (action) => action.actionId === coupAction.actionId,
    );
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
          sourceDefinitionId: 405,
        }),
      ],
    });

    const onCallId = scoreCorpAgendaForTest(
      state,
      420,
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
    state = apply(
      state,
      "corp",
      (action) => action.actionId === onCallAction.actionId,
    );
    expect(state.runner.grip.length).toBeLessThan(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 420,
      damageResolved: true,
      damageType: "meat",
      damageAmount: 1,
      resolvedEffects: [
        expect.objectContaining({
          kind: "damage",
          sourceDefinitionId: 420,
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
        { id: 413, quantity: 1 },
        { id: 427, quantity: 2 },
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
      413,
    );
    const firstGrayOpsId = moveCorpCardToHq(
      state,
      427,
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
        413,
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
      427,
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
          413,
      ),
    ).toBe(false);

    const canisCorpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "spotcheck_canis_major_corp",
      name: "Spotcheck Canis Major Corp",
      cards: [
        { id: 590, quantity: 1 },
        { id: 437, quantity: 1 },
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
    putCorpIceOnServer(canisState, "rd", 590);
    putCorpIceOnServer(canisState, "rd", 437);
    const initial = structuredClone(canisState);
    const replayStart = canisState.eventLog.length;
    canisState = apply(
      canisState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    canisState = apply(
      canisState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(canisState, action) === 437,
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
        sourceDefinition(canisState, action) === 590,
    );
    canisState = enterEncounterFromMovementWindow(canisState);
    expect(
      getPlayerView(canisState, "runner")
        .servers.find((server) => server.id === "rd")
        ?.ice.find((ice) => ice.definitionId === 590)
        ?.strength,
    ).toBe((CARD_DEFINITIONS_BY_ID[590]?.strength ?? 0) + 2);
    canisState = continueRunThroughMovement(canisState);
    expect(canisState.run).toBeUndefined();
    const replay = replayEvents(
      initial,
      canisState.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(canisState));
  });
});

describe("Originalset Spotcheck 2026-05-15 Agenda/Run/Recurring Nachtest", () => {
  it("allows Team Restructuring to choose zero targets", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("team-restructuring-zero-targets"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    moveCorpCardToHq(state, 517);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 517,
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      minSelections: 1,
      maxSelections: 1,
      options: [expect.objectContaining({ id: "placement_none" })],
    });
    state = applyChoice(state, "corp", "placement_none");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 517,
      addedAdvancementCounters: 0,
      targetCount: 0,
    });
  });

  it("keeps V1.9.19 agenda and operation targets deterministic and leak-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.agendaScoring(
      "spotcheck-agenda-run-recurring-v1919",
    );
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 80;
    state.corp.clicks = 30;
    state.corp.maxHandSize = 100;
    const firstAgendaId = putCorpRootInRemote(
      state,
      401,
    );
    const secondAgendaId = putCorpRootInRemote(
      state,
      414,
    );
    state.cardInstances[firstAgendaId] = {
      ...state.cardInstances[firstAgendaId]!,
      advancementCounters: 3,
    };
    state.cardInstances[secondAgendaId] = {
      ...state.cardInstances[secondAgendaId]!,
      advancementCounters: 1,
    };
    const scoredAgendaId = scoreCorpAgendaForTest(state, 588);
    moveCorpCardToHq(state, 512);
    moveCorpCardToHq(state, 515);
    moveCorpCardToHq(state, 517);
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
        sourceDefinition(state, action) === 512,
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

    state = apply(
      state,
      "corp",
      (action) => action.actionId === projectAction.actionId,
    );
    const projectOption = state.pendingChoice?.options.find(
      (option) => String(option.value) === `${secondAgendaId}:4`,
    );
    expect(projectOption).toBeDefined();
    state = applyChoices(state, "corp", [projectOption?.id ?? ""]);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(5);
    const projectPayload = state.eventLog.at(-1)?.publicPayload;
    expect(projectPayload).toMatchObject({
      sourceDefinitionId: 512,
      addedAdvancementCounters: 4,
      targetCount: 1,
      publicTargetCount: 0,
      hiddenTargetCount: 1,
      targetVisibility: "hidden_installed_card",
    });
    expect(projectPayload).not.toHaveProperty("targetCardId");
    expect(projectPayload).not.toHaveProperty("targetCardDefinitionId");
    expect(JSON.stringify(projectPayload)).not.toMatch(
      /onr_v1_202_genetics-visionary-acquisition|"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    expect(JSON.stringify(projectPayload)).not.toContain(secondAgendaId);

    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          515,
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
        sourceDefinition(state, action) === 517,
    );
    const teamOption = state.pendingChoice?.options.find(
      (option) =>
        String(option.value) === `${firstAgendaId}:1|${secondAgendaId}:1`,
    );
    expect(teamOption).toBeDefined();
    state = applyChoices(state, "corp", [teamOption?.id ?? ""]);
    expect(state.cardInstances[firstAgendaId]?.advancementCounters).toBe(4);
    expect(state.cardInstances[secondAgendaId]?.advancementCounters).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: 517,
      addedAdvancementCounters: 2,
      targetCount: 2,
      publicTargetCount: 0,
      hiddenTargetCount: 2,
      targetVisibility: "hidden_installed_card",
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
    moveRunnerCardToGrip(accessState, 274);
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(accessState, action) ===
          274,
    );
    putCorpCardOnTopOfRd(accessState, 588);
    putCorpCardOnTopOfRd(accessState, 596);
    const accessInitial = structuredClone(accessState);
    const accessReplayStart = accessState.eventLog.length;
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
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
      cardDefinitionId: 596,
    });
    expect(
      serializedDefinitionReferences(JSON.stringify(accessState.eventLog.at(-1)?.publicPayload)),
    ).not.toContain(588);
    expect(
      replayEvents(accessInitial, accessState.eventLog.slice(accessReplayStart))
        .ok,
    ).toBe(true);

    let shredderState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-shredder-uplink-activated-run",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_shredder_uplink_runner",
          name: "Spotcheck Shredder Uplink Runner",
          cards: [
            { id: 274, quantity: 1 },
            { id: 292, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (entry) =>
                entry.id !== 274 &&
                entry.id !== 292,
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_shredder_uplink_corp",
          name: "Spotcheck Shredder Uplink Corp",
          cards: [
            { id: 589, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (entry) => entry.id !== 589,
            ),
          ],
        },
      }),
    );
    shredderState.runner.credits = 20;
    shredderState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(shredderState, 274);
    moveRunnerCardToGrip(shredderState, 292);
    shredderState = apply(
      shredderState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(shredderState, action) ===
          274,
    );
    const hqCardId = moveCorpCardToHq(
      shredderState,
      596,
    );
    keepOnlyCorpHqCard(shredderState, hqCardId);
    const targetIceId = putCorpIceOnServer(
      shredderState,
      "rd",
      589,
    );
    shredderState.cardInstances[targetIceId] = {
      ...shredderState.cardInstances[targetIceId]!,
      faceup: true,
      rezzed: true,
    };
    const shredderInitial = structuredClone(shredderState);
    const shredderReplayStart = shredderState.eventLog.length;
    shredderState = apply(
      shredderState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(shredderState, action) ===
          274,
    );
    expect(shredderState.run?.attackedServerId).toBe("archives");
    expect(shredderState.run?.accessServerOverride).toBe("hq");
    expect(shredderState.run?.successfulRunServerOverride).toBe("hq");
    expect(shredderState.run?.breach?.serverId).toBe("hq");
    expect(shredderState.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    shredderState = apply(
      shredderState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(shredderState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: 596,
      serverLabel: "HQ",
    });
    expect(shredderState.runnerTurnFlags).toMatchObject({
      successfulRunThisTurn: true,
      successfulHqRunThisTurn: true,
      lastSuccessfulRunServerId: "hq",
    });
    expect(shredderState.runnerTurnFlags?.successfulRdRunThisTurn).not.toBe(
      true,
    );
    expect(
      getLegalActions(shredderState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(shredderState, action) ===
            292,
      ),
    ).toBe(true);
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
    moveRunnerCardToGrip(traceState, 394);
    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(traceState, action) === 394,
    );
    putCorpIceOnServer(traceState, "rd", 458);
    traceState = apply(
      traceState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    traceState = apply(
      traceState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(traceState, action) ===
          458,
    );
    traceState = apply(
      traceState,
      "runner",
      (action) => action.type === "continue_run",
    );
    traceState = applyChoice(traceState, "corp", "bid_1");
    expect(traceState.trace).toMatchObject({
      status: "base_link",
      traceValue: 5,
      runnerLink: 0,
    });
    traceState = applyChoice(
      traceState,
      "runner",
      traceChoiceOptionIdForDefinition(
        traceState,
        394,
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
    moveRunnerCardToGrip(maxLinkState, 394);
    moveRunnerCardToGrip(maxLinkState, 360);
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(maxLinkState, action) ===
          394,
    );
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(maxLinkState, action) ===
          360,
    );
    putCorpIceOnServer(maxLinkState, "rd", 458);
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    maxLinkState = apply(
      maxLinkState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(maxLinkState, action) ===
          458,
    );
    maxLinkState = apply(
      maxLinkState,
      "runner",
      (action) => action.type === "continue_run",
    );
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
        360,
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
    moveRunnerCardToGrip(priorityState, 317);
    const hqCardId = moveCorpCardToHq(
      priorityState,
      596,
    );
    keepOnlyCorpHqCard(priorityState, hqCardId);
    priorityState = apply(
      priorityState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(priorityState, action) ===
          317 &&
        action.payload?.serverId === "hq",
    );
    expect(priorityState.pendingChoice?.source).toContain(
      "successful_run.credit_loss_spend",
    );
    expect(priorityState.run?.breach).toBeUndefined();
    priorityState = applyChoice(priorityState, "runner", "pay_3");
    expect(priorityState.runner.credits).toBe(5);
    expect(priorityState.corp.credits).toBe(3);
    expect(priorityState.corp.hq).toContain(hqCardId);
    expect(priorityState.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "runner_spend_corp_lose_credits",
      runnerPaidAmount: 3,
      corpLostCredits: 3,
      sourceDefinitionId: 317,
    });

    let protocolState = p333State("p3-33-rd-protocol-files", [
      262,
    ]);
    protocolState.runner.credits = 20;
    protocolState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(protocolState, 262);
    protocolState = apply(
      protocolState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(protocolState, action) ===
          262,
    );
    putCorpCardOnTopOfRd(protocolState, 596);
    putCorpCardOnTopOfRd(protocolState, 588);
    if (!protocolState.runnerTurnFlags)
      throw new Error("Missing Runner turn flags");
    for (const lock of [
      { runLockActionsPending: 1, runnerRunLockCreditCost: 0 },
      { runLockActionsPending: 0, runnerRunLockCreditCost: 1 },
    ]) {
      protocolState.runnerTurnFlags.runLockActionsPending =
        lock.runLockActionsPending;
      protocolState.runnerTurnFlags.runnerRunLockCreditCost =
        lock.runnerRunLockCreditCost;
      expect(
        getLegalActions(protocolState, "runner").some(
          (action) =>
            action.type === "activated_card_ability" &&
            sourceDefinition(protocolState, action) ===
              262 &&
            action.payload?.cardImplementationEffectKind === "make_run",
        ),
      ).toBe(false);
    }
    protocolState.runnerTurnFlags.runLockActionsPending = 0;
    protocolState.runnerTurnFlags.runnerRunLockCreditCost = 0;
    const protocolRunAction = getLegalActions(protocolState, "runner").find(
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(protocolState, action) ===
          262,
    );
    expect(protocolRunAction?.payload).toMatchObject({
      cardImplementationEffectKind: "make_run",
      runActionKind: "make_run",
      serverId: "rd",
      successfulRunAccessReplacement: "private_look_top_rd",
      successfulRunPrivateLookCount: 5,
    });
    protocolState = apply(
      protocolState,
      "runner",
      (action) => action.actionId === protocolRunAction?.actionId,
    );
    expect(protocolState.pendingChoice?.source).toContain("p3_33.private_look");
    expect(
      getPlayerView(protocolState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === 588,
      ),
    ).toBe(true);
    expect(getPlayerView(protocolState, "corp").pendingChoice).toBeUndefined();
    expect(
      JSON.stringify(protocolState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(
      /simple_agenda|Simple Agenda|"cardInstances"|"privatePayload"/,
    );
    protocolState = applyChoice(protocolState, "runner", "done");
    expect(protocolState.run).toBeUndefined();
    const runnerPrivateLookEvent = getPlayerView(protocolState, "runner")
      .publicEvents.slice()
      .reverse()
      .find(
        (event) =>
          event.publicPayload.hiddenZoneAction === "p3_33_private_look",
      );
    expect(
      (
        runnerPrivateLookEvent?.publicPayload.knownRndDefinitionIds as number[]
      ).slice(0, 2),
    ).toEqual([588, 596]);
    expect(runnerPrivateLookEvent?.publicPayload).toMatchObject({
      knownRndTopDefinitionId: 588,
      privateLookZone: "rd",
      privateLookCount: 5,
    });
    const corpPrivateLookEvent = getPlayerView(protocolState, "corp")
      .publicEvents.slice()
      .reverse()
      .find(
        (event) =>
          event.publicPayload.hiddenZoneAction === "p3_33_private_look",
      );
    expect(JSON.stringify(corpPrivateLookEvent)).not.toMatch(
      /simple_agenda|simple_economy_operation/,
    );

    let interfaceState = p333State("p3-33-hq-interface", [
      341,
    ]);
    interfaceState.runner.credits = 20;
    interfaceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(interfaceState, 341);
    interfaceState = apply(
      interfaceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(interfaceState, action) === 341,
    );
    keepOnlyCorpHqCards(interfaceState, [
      moveCorpCardToHq(interfaceState, 596),
      moveCorpCardToHq(interfaceState, 588),
    ]);
    const hqRun = apply(
      structuredClone(interfaceState),
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(
      hqRun.run?.breach?.queue.filter((entry) => entry.zone === "hq"),
    ).toHaveLength(2);
    expect(hqRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      installedAccessBonus: 1,
      effectiveAccessCount: 2,
      installedAccessBonusSourceDefinitionIds: String(341),
    });

    let rdInterfaceState = p333State("p3-33-rd-interface", [
      351,
    ]);
    rdInterfaceState.runner.credits = 20;
    rdInterfaceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(rdInterfaceState, 351);
    rdInterfaceState = apply(
      rdInterfaceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(rdInterfaceState, action) ===
          351,
    );
    putCorpCardOnTopOfRd(rdInterfaceState, 594);
    putCorpCardOnTopOfRd(rdInterfaceState, 588);
    const rdRun = apply(
      structuredClone(rdInterfaceState),
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(rdRun.run?.breach?.queue).toHaveLength(2);
    expect(rdRun.eventLog.at(-1)?.publicPayload).toMatchObject({
      installedAccessBonus: 1,
      effectiveAccessCount: 2,
      installedAccessBonusSourceDefinitionIds: String(351),
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
      236,
    ]);
    expertState.runner.credits = 20;
    expertState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(expertState, 236);
    expertState = apply(
      expertState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(expertState, action) ===
          236,
    );
    keepOnlyCorpHqCards(expertState, [
      moveCorpCardToHq(expertState, 596),
      moveCorpCardToHq(expertState, 594),
    ]);
    expertState = apply(
      expertState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expertState = apply(
      expertState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(expertState.pendingChoice?.source).toContain(
      "p3_33.private_look:post_access",
    );
    expect(
      getPlayerView(expertState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === 594,
      ),
    ).toBe(true);
    expect(getPlayerView(expertState, "corp").pendingChoice).toBeUndefined();
    expertState = applyChoice(expertState, "runner", "done");
    expect(expertState.run).toBeUndefined();

    let technicianState = p333State("p3-33-technician-lover", [
      395,
    ]);
    technicianState.runner.credits = 20;
    moveRunnerCardToGrip(technicianState, 395);
    technicianState = apply(
      technicianState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(technicianState, action) ===
          395,
    );
    putCorpCardOnTopOfRd(technicianState, 588);
    technicianState = apply(
      technicianState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(technicianState, action) ===
          395,
    );
    expect(technicianState.pendingChoice?.source).toContain(
      "p3_33.private_look:ability",
    );
    expect(
      getPlayerView(technicianState, "runner").pendingChoice?.options.some(
        (option) => option.card?.definitionId === 588,
      ),
    ).toBe(true);
    const technicianRemoved = structuredClone(technicianState);
    const technicianId = technicianRemoved.runner.rig.resources.find(
      (id) =>
        technicianRemoved.cardInstances[id]?.definitionId ===
        395,
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
      253,
    ]);
    microtechState.runner.credits = 20;
    microtechState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(microtechState, 253);
    microtechState = apply(
      microtechState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(microtechState, action) ===
          253,
    );
    putCorpCardOnTopOfRd(microtechState, 596);
    putCorpCardOnTopOfRd(microtechState, 588);
    microtechState = apply(
      microtechState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    expect(microtechState.pendingChoice?.source).toContain(
      "pre_access.top_rd_reorder",
    );
    microtechState = applyChoice(microtechState, "runner", "cut_1");
    expect(microtechState.run?.breach?.queue[0]?.cardInstanceId).toBe(
      microtechState.corp.rd[0],
    );
    microtechState = apply(
      microtechState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(microtechState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 596,
    });

    let recordState = p333State("p3-33-record-reconstructor", [
      354,
    ]);
    recordState.runner.credits = 20;
    moveRunnerCardToGrip(recordState, 354);
    recordState = apply(
      recordState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(recordState, action) ===
          354,
    );
    const firstArchive = moveCorpCardToHq(
      recordState,
      596,
    );
    removeEverywhere(recordState, firstArchive);
    recordState.corp.archives.push(firstArchive);
    recordState.cardInstances[firstArchive] = {
      ...recordState.cardInstances[firstArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const secondArchive = moveCorpCardToHq(recordState, 588);
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
        sourceDefinition(recordState, action) ===
          354,
    );
    expect(recordState.run).toBeUndefined();
    expect(recordState.corp.rd.slice(0, 2).sort()).toEqual(
      [firstArchive, secondArchive].sort(),
    );
    expect(recordState.corp.archives).not.toContain(firstArchive);
    expect(recordState.eventLog.at(-1)?.publicPayload).toMatchObject({
      accessReplacement: "archives_faceup_to_rd",
      movedCount: 2,
      sourceDefinitionId: 354,
    });
    const replay = replayEvents(
      initial,
      recordState.eventLog.slice(replayStart),
    );
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
              { id: 589, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.runAccess.corp.cards,
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
    let state = p333State("p3-33-record-reconstructor-protected-archives", [
      354,
    ]);
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, 354);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 354,
    );
    putCorpIceOnServer(state, "archives", 589);
    const firstArchive = moveCorpCardToHq(state, 596);
    removeEverywhere(state, firstArchive);
    state.corp.archives.push(firstArchive);
    state.cardInstances[firstArchive] = {
      ...state.cardInstances[firstArchive]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
    const secondArchive = moveCorpCardToHq(state, 588);
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
        sourceDefinition(state, action) === 354,
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
      sourceDefinitionId: 354,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Mystery Box once per run with public top-five reveal, free program install and deterministic shuffle", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-mystery-box-install"),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 8;
    const mysteryId = installRunnerProgramForTest(
      state,
      255,
    );
    const bottomReveal = putRunnerCardOnTopOfStack(
      state,
      595,
    );
    const secondProgram = putRunnerCardOnTopOfStack(
      state,
      236,
    );
    const selectedProgram = putRunnerCardOnTopOfStack(state, 591);
    putCorpCardOnTopOfRd(state, 588);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const mysteryAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 255,
    );
    expect(mysteryAction.payload).toMatchObject({
      cardImplementationAbility: "activated",
      cardImplementationAbilityTiming: "during_run",
    });
    state = apply(
      state,
      "runner",
      (action) => action.actionId === mysteryAction.actionId,
    );
    expect(state.run?.successfulRunAbilityUsedSourceIds).toContain(mysteryId);
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "public",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.source).toContain(
      "p3_38.revealed_stack_program_install_corp_review",
    );
    expect(state.pendingChoice?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining([selectedProgram, secondProgram, "done"]),
    );
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).toContain(
      591,
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
    expect(state.pendingChoice?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining([selectedProgram, secondProgram]),
    );
    state = applyChoice(state, "runner", `card_${selectedProgram}`);
    expect(state.runner.rig.programs).toContain(selectedProgram);
    expect(state.runner.heap).toContain(mysteryId);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.runner.stack).toContain(bottomReveal);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction:
        "p3_38_look_top_stack_show_to_corp_then_install_matching",
      installedProgramDefinitionId: 591,
      selfTrashed: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"grip"|"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          sourceDefinition(state, action) === 255,
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noProgram = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.runAccess("spotcheck-mystery-box-no-program"),
    );
    noProgram.runner.credits = 20;
    noProgram.runner.memoryLimit = 8;
    installRunnerProgramForTest(noProgram, 255);
    const eventIds = Object.entries(noProgram.cardInstances)
      .filter(([, card]) => card.definitionId === 595)
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
    putCorpCardOnTopOfRd(noProgram, 588);
    noProgram = apply(
      noProgram,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noProgram = apply(
      noProgram,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(noProgram, action) === 255,
    );
    expect(noProgram.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining(
        "p3_38.revealed_stack_program_install_corp_review",
      ),
    });
    noProgram = applyChoice(noProgram, "corp", "done");
    expect(noProgram.pendingChoice).toBeUndefined();
    expect(noProgram.eventLog.at(-1)?.publicPayload).toMatchObject({
      programFound: false,
      selfTrashed: false,
      installedProgramCount: 0,
    });
  });

  it("pays Self-Modifying Code's trash-source cost before opening its stack-install choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-self-modifying-code-cost",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_smc_runner",
          name: "Spotcheck Self-Modifying Code Runner",
          cards: [
            { id: 271, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 8;
    const sourceId = installRunnerProgramForTest(
      state,
      271,
    );
    const targetId = putRunnerCardOnTopOfStack(state, 591);
    putCorpCardOnTopOfRd(state, 588);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const ability = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === 271,
    );
    expect(ability.payload).toMatchObject({
      cardImplementationTrashSourceCost: true,
    });
    expect(ability.payload?.cardImplementationTrashesSource).toBeUndefined();

    state = apply(
      state,
      "runner",
      (action) => action.actionId === ability.actionId,
    );

    expect(state.runner.heap).toContain(sourceId);
    expect(state.runner.rig.programs).not.toContain(sourceId);
    expect(
      state.pendingChoice?.options.map((option) => option.value),
    ).toContain(targetId);
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
            { id: 336, quantity: 1 },
            { id: 598, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_corolla_corp",
          name: "Spotcheck Corolla Corp",
          cards: [
            { id: 601, quantity: 1 },
            { id: 590, quantity: 1 },
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
      336,
    );
    installRunnerProgramForTest(state, 598);
    const sentryId = putCorpIceOnServer(state, "rd", 601);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 336,
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
    refreshState = apply(
      refreshState,
      "runner",
      (action) => action.type === "end_turn",
    );
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "end_turn",
    );
    expect(cardCounterAmount(refreshState, corollaId, "bit")).toBe(1);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
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
        sourceDefinition(state, action) === 598,
    );
    expect(state.runner.credits).toBe(1);
    expect(cardCounterAmount(state, corollaId, "bit")).toBe(0);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === 598,
    );
    expect(state.runner.credits).toBe(0);
    expect(replayEvents(initial, state.eventLog.slice(replayStart)).ok).toBe(
      true,
    );

    let decoderState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-corolla-non-killer-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_corolla_decoder_runner",
          name: "Spotcheck Corolla Decoder Runner",
          cards: [
            { id: 336, quantity: 1 },
            { id: 591, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== 591,
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_corolla_decoder_corp",
          name: "Spotcheck Corolla Decoder Corp",
          cards: [
            { id: 590, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    decoderState.runner.credits = 4;
    decoderState.runner.memoryLimit = 4;
    decoderState.corp.credits = 10;
    moveRunnerCardToGrip(decoderState, 336);
    moveRunnerCardToGrip(decoderState, 591);
    const codeGateId = putCorpIceOnServer(
      decoderState,
      "rd",
      590,
    );
    decoderState = apply(
      decoderState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(decoderState, action) ===
          336,
    );
    installRunnerProgramForTest(decoderState, 591);
    decoderState.runner.credits = 0;
    decoderState = apply(
      decoderState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
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
          sourceDefinition(decoderState, action) === 591,
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
            { id: 257, quantity: 1 },
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
    const filterId = moveRunnerCardToGrip(state, 257);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 257,
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

    putCorpCardOnTopOfRd(state, 588);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
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
            { id: 351, quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_rd_interface_corp",
          name: "Spotcheck R&D Interface Corp",
          cards: [
            { id: 594, quantity: 1 },
            { id: 588, quantity: 1 },
            { id: 596, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) =>
                ![
                  594,
                  588,
                  596,
                ].includes(card.id),
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    const firstInterface = moveRunnerCardToGrip(
      state,
      351,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === firstInterface,
    );
    const secondInterface = moveRunnerCardCopyToGrip(
      state,
      351,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === secondInterface,
    );
    expect(
      CARD_DEFINITIONS_BY_ID[351]?.mechanics,
    ).toEqual(expect.arrayContaining(["access_count", "modifiers"]));
    expect(
      CARD_DEFINITIONS_BY_ID[351]?.mechanics,
    ).not.toContain("damage_prevention");

    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice = [];
    putCorpCardOnTopOfRd(state, 594);
    putCorpCardOnTopOfRd(state, 588);
    putCorpCardOnTopOfRd(state, 596);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    if (state.run && !state.run.breach) {
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
    }

    expect(state.run?.breach?.queue).toHaveLength(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      baseAccessCount: 1,
      installedAccessBonus: 2,
      effectiveAccessCount: 3,
      installedAccessBonusSourceDefinitionIds:
        "351,351",
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Economy Asset",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: 596,
    });
    expect(serializedDefinitionReferences(JSON.stringify(state.eventLog.at(-1)?.publicPayload))).not.toContain(
      588,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it.each([1, 2] as const)(
    "applies %i R&D Interface bonus after Private LDL redirects HQ access",
    (interfaceCount) => {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-private-ldl-rd-interface-${interfaceCount}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `spotcheck_private_ldl_rd_interface_runner_${interfaceCount}`,
            name: "Spotcheck Private LDL R&D Interface Runner",
            cards: [
              { id: 318, quantity: 1 },
              {
                id: 351,
                quantity: interfaceCount,
              },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                (card) =>
                  card.id !== 318 &&
                  card.id !== 351,
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `spotcheck_private_ldl_rd_interface_corp_${interfaceCount}`,
            name: "Spotcheck Private LDL R&D Interface Corp",
            cards: [
              { id: 594, quantity: 1 },
              { id: 588, quantity: 1 },
              { id: 596, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
                (card) =>
                  card.id !== 594 &&
                  card.id !== 588 &&
                  card.id !== 596,
              ),
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      for (let index = 0; index < interfaceCount; index += 1) {
        const interfaceId =
          index === 0
            ? moveRunnerCardToGrip(state, 351)
            : moveRunnerCardCopyToGrip(state, 351);
        state = apply(
          state,
          "runner",
          (action) =>
            action.type === "install_card" &&
            String(action.payload?.cardId) === interfaceId,
        );
      }
      moveRunnerCardToGrip(state, 318);
      putCorpCardOnTopOfRd(state, 594);
      putCorpCardOnTopOfRd(state, 588);
      putCorpCardOnTopOfRd(state, 596);

      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) === 318,
      );

      expect(state.run).toMatchObject({
        attackedServerId: "hq",
        accessServerOverride: "rd",
        successfulRunServerOverride: "rd",
      });
      expect(
        state.run?.breach?.queue.filter((entry) => entry.zone === "rd"),
      ).toHaveLength(1 + interfaceCount);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        baseAccessCount: 1,
        installedAccessBonus: interfaceCount,
        effectiveAccessCount: 1 + interfaceCount,
      });
    },
  );

  it("keeps Nasuko Cycle source-bound across damage windows and removal drift", () => {
    let state = createGameAfterSetup({
      seed: "spotcheck-prevention-sources",
      runnerDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        id: "spotcheck_prevention_sources_runner",
        name: "Spotcheck Prevention Sources Runner",
        cards: [
          { id: 347, quantity: 1 },
          { id: 373, quantity: 1 },
          { id: 382, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
        ],
      },
      corpDeck: {
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        cards: [
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          { id: 499, quantity: 3 },
        ],
      },
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runner.tags = 1;
    state.runner.credits = 10;
    state.corp.credits = 10;
    state.corp.clicks = 3;
    const nasukoId = installRunnerHardwareForTest(
      state,
      347,
    );
    moveCorpCardToHq(state, 499);
    moveCorpCardToHq(state, 499);
    moveCorpCardToHq(state, 499);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 499,
    );
    const nasukoCandidate = state.eventModificationWindow?.candidates.find(
      (candidate) =>
        candidate.sourceRef.definitionId === 347,
    );
    expect(nasukoCandidate).toBeDefined();
    state = applyChoice(state, "runner", String(nasukoCandidate?.candidateId));
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      sourceDefinitionId: 347,
    });
    expect(state.runner.tags).toBe(1);
    expect(state.runner.rig.hardware).toContain(nasukoId);
    let removedSource = structuredClone(initial);
    moveCorpCardToHq(removedSource, 499);
    removedSource = apply(
      removedSource,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(removedSource, action) ===
          499,
    );
    const legal = mustAction(
      removedSource,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const candidateId = String(
      removedSource.eventModificationWindow?.candidates.find(
        (candidate) =>
          candidate.sourceRef.definitionId === 347,
      )?.candidateId,
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
            { id: 376, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
              (card) => card.id !== 376,
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.traceTags.corp,
          id: "spotcheck_hells_run_corp",
          name: "Spotcheck Hell's Run Corp",
          cards: [
            { id: 458, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
              (card) => card.id !== 458,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.runner.memoryLimit = 8;
    state.corp.credits = 20;
    const hellsRunId = moveRunnerCardToGrip(state, 376);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === hellsRunId,
    );
    state.runner.credits = 0;
    expect(cardCounterAmount(state, hellsRunId, "bit")).toBe(1);
    putCorpIceOnServer(state, "rd", 458);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = encounterIce(state, "rd", 458);
    state = continueRunThroughMovementWindow(state);
    state = applyChoice(state, "corp", "bid_0");
    expect(
      state.pendingChoice?.options.some((option) => option.id === "bid_1"),
    ).toBe(true);
    state = applyChoice(state, "runner", "bid_1");
    expect(cardCounterAmount(state, hellsRunId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      bonusTraceLinkCreditsSpent: 1,
      runnerCreditsSpent: 0,
      traceLinkCreditSourceDefinitionIds: "376",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let refreshState = structuredClone(initial);
    setCardCounterForTest(refreshState, hellsRunId, "bit", 0);
    refreshState.corp.maxHandSize = 100;
    refreshState = apply(
      refreshState,
      "runner",
      (action) => action.type === "end_turn",
    );
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    refreshState = apply(
      refreshState,
      "corp",
      (action) => action.type === "end_turn",
    );
    expect(cardCounterAmount(refreshState, hellsRunId, "bit")).toBe(1);

    let runCostState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-hells-run-not-run-cost",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_hells_run_cost_runner",
          name: "Spotcheck Hell's Run Cost Runner",
          cards: [
            { id: 376, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== 376,
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_hells_run_cost_corp",
          name: "Spotcheck Hell's Run Cost Corp",
          cards: [
            { id: 544, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 544,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    runCostState.runner.credits = 0;
    const runCostHell = installRunnerResourceForTest(
      runCostState,
      376,
    );
    setCardCounterForTest(runCostState, runCostHell, "bit", 1);
    putCorpRootInRemote(runCostState, 544);
    const taxAssetId = runCostState.corp.servers
      .flatMap((server) => server.root)
      .find(
        (cardId) =>
          runCostState.cardInstances[cardId]?.definitionId ===
          544,
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
            { id: 602, quantity: 1 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.hiddenZone.corp,
      }),
    );
    state.runner.credits = 10;
    const roninId = installRunnerResourceForTest(
      state,
      387,
    );
    const lowerCardId = putRunnerCardOnTopOfStack(state, 591);
    const hardwareId = putRunnerCardOnTopOfStack(
      state,
      602,
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === roninId &&
        action.payload?.cardImplementationAbilityKey ===
          "abilities_activated_runner_main_look_top_stack_take_matching",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.look_top_stack_take_matching",
    );
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
      publicRevealDefinitionIds: String(602),
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
      387,
    );
    const targetIceId = putCorpIceOnServer(
      exposeState,
      "rd",
      589,
    );
    exposeState = apply(
      exposeState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === exposeRoninId &&
        action.payload?.cardImplementationAbilityKey ===
          "abilities_activated_runner_main_expose_installed_card",
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
      sourceDefinitionId: 387,
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
            { id: 415, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 543,
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
    const hostileId = moveCorpCardToHq(hostile, 415);
    hostile = apply(
      hostile,
      "corp",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === hostileId,
    );
    expect(
      getLegalActions(hostile, "corp").some(
        (action) =>
          action.type === "score_agenda" &&
          sourceDefinition(hostile, action) === 415,
      ),
    ).toBe(false);
    for (let index = 0; index < 3; index += 1) {
      hostile = apply(
        hostile,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(hostile, action) === 415,
      );
    }
    const creditsBeforeScore = hostile.corp.credits;
    hostile = apply(
      hostile,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(hostile, action) === 415,
    );
    expect(hostile.corp.credits).toBe(creditsBeforeScore + 5);
    expect(hostile.eventLog.at(-1)?.publicPayload).toMatchObject({
      onScoreGainCredits: 5,
      cardDefinitionId: 415,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 5,
          reason: "card_resolver",
          sourceDefinitionId: 415,
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
            { id: 422, quantity: 2 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 543,
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
      422,
    );
    const secondPolitical = scoreCorpAgendaForTest(
      political,
      422,
    );
    const politicalActions = getLegalActions(political, "corp").filter(
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        sourceDefinition(political, action) ===
          422,
    );
    expect(
      politicalActions.map((action) => action.payload?.cardId).sort(),
    ).toEqual([firstPolitical, secondPolitical].sort());
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
            { id: 543, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 543,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    nevinyrral.runner.credits = 10;
    const nevinyrralId = putCorpRootInRemote(
      nevinyrral,
      543,
    );
    nevinyrral.cardInstances[nevinyrralId] = {
      ...nevinyrral.cardInstances[nevinyrralId]!,
      faceup: true,
      rezzed: true,
    };
    nevinyrral = apply(
      nevinyrral,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    nevinyrral = apply(
      nevinyrral,
      "runner",
      (action) => action.type === "access_card",
    );
    nevinyrral = apply(
      nevinyrral,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(nevinyrral.winner).toBe("runner");
    expect(nevinyrral.gameEndReason).toBe("nevinyrral_left_play");
    expect(nevinyrral.eventLog.at(-1)?.publicPayload).toMatchObject({
      gameEndReason: "nevinyrral_left_play",
      sourceDefinitionId: 543,
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
            { id: 550, quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== 550,
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rustbelt.corp.maxHandSize = 5;
    const rustbeltId = putCorpRootInRemote(
      rustbelt,
      550,
    );
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
      390,
      395,
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
        390,
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
      cardDefinitionId: 390,
      gainedCredits: 2,
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 10,
      remainingCounters: 10,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 2,
          remainingCounters: 10,
          sourceDefinitionId: 390,
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
    moveRunnerCardToGrip(silicon, 391);
    silicon = apply(
      silicon,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(silicon, action) ===
          391,
    );
    const siliconId = silicon.runner.rig.resources.find(
      (cardId) =>
        silicon.cardInstances[cardId]?.definitionId ===
        391,
    );
    expect(siliconId).toBeDefined();
    if (!siliconId) throw new Error("Missing Silicon Saloon Franchise");
    const siliconAction = mustAction(
      silicon,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(silicon, action) ===
          391,
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
    silicon = apply(
      silicon,
      "runner",
      (action) => action.actionId === siliconAction.actionId,
    );
    expect(silicon.runner.credits).toBe(siliconCreditsBefore + 1);
    expect(silicon.runner.grip.length).toBe(siliconGripBefore + 1);
    expect(silicon.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 391,
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
          sourceDefinitionId: 391,
          sourceTitle: "Silicon Saloon Franchise",
        }),
        expect.objectContaining({
          kind: "draw_cards",
          side: "runner",
          amount: 1,
          reason: "card_resolver",
          sourceDefinitionId: 391,
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
    moveRunnerCardToGrip(topRunners, 396);
    topRunners = apply(
      topRunners,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(topRunners, action) ===
          396,
    );
    const topRunnersId = topRunners.runner.rig.resources.find(
      (cardId) =>
        topRunners.cardInstances[cardId]?.definitionId ===
        396,
    );
    expect(topRunnersId).toBeDefined();
    if (!topRunnersId) throw new Error("Missing Top Runners' Conference");
    const topRunnersInitial = structuredClone(topRunners);
    const topRunnersReplayStart = topRunners.eventLog.length;
    const creditsBeforeTopRunners = topRunners.runner.credits;
    topRunners = apply(
      topRunners,
      "runner",
      (action) => action.type === "end_turn",
    );
    topRunners = apply(
      topRunners,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
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
    const definitionId = 397;
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
    moveCorpCardToHq(state, 513);
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 513,
    );
    expect(state.pendingChoice?.side).toBe("runner");
    const optionId = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(optionId).toBeDefined();
    if (!optionId)
      throw new Error(`Missing prevention option for ${definitionId}`);
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
    expect(state.pendingChoice?.side).toBe("runner");
    const repeatOptionId = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(repeatOptionId).toBeDefined();
    if (!repeatOptionId)
      throw new Error("Missing repeated Trauma Team prevention option");
    state = applyChoice(state, "runner", repeatOptionId);
    expect(state.pendingChoice).toBeUndefined();
    expect(
      cardCounterAmount(
        state,
        state.runner.rig.resources.find(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId === definitionId,
        )!,
        "trauma",
      ),
    ).toBe(0);
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
    moveRunnerCardToGrip(state, 398);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 398,
    );
    putCorpIceOnServer(state, "rd", 446);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "corp", (action) => action.type === "rez_ice");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.heap).toHaveLength(3);
    expect(state.run?.phase).toBe("movement");
    expect(
      getLegalActions(state, "runner").map((action) => action.type),
    ).toContain("continue_run");
  });

  it("shows Trauma Team trauma counters after install and its add-counter action", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.damagePrevention("spotcheck-trauma-team-counters"),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, 397);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 397,
    );
    const traumaTeamId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === 397,
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
    const employeeId = scoreCorpAgendaForTest(
      employee,
      411,
    );
    const hqBeforeEmployeeStart = employee.corp.hq.length;
    employee = apply(employee, "corp", (action) => action.type === "end_turn");
    employee = apply(
      employee,
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(employee.corp.hq.length).toBe(hqBeforeEmployeeStart);
    expect(employee.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("scored_agenda.start_draw_choice"),
      prompt: "Scored Agenda: zusätzliche Karte ziehen?",
      minSelections: 1,
      maxSelections: 1,
    });
    expect(
      getPlayerView(employee, "corp").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toEqual(["draw", "skip"]);
    expect(getPlayerView(employee, "runner").pendingChoice).toBeUndefined();
    expect(
      getLegalActions(employee, "corp").map((action) => action.type),
    ).toEqual(["resolve_choice"]);
    expect(getLegalActions(employee, "runner")).toEqual([]);

    const choiceAction = mustAction(
      employee,
      "corp",
      (action) => action.type === "resolve_choice",
    );
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
      sourceDefinitionId: 411,
      scoredAgendaStartDrawDecision: "skip",
    });
    const employeeSkipReplay = replayEvents(
      employeeChoiceInitial,
      employee.eventLog.slice(employeeChoiceInitial.eventLog.length),
    );
    expect(employeeSkipReplay.ok).toBe(true);
    expect(hashState(employeeSkipReplay.state)).toBe(hashState(employee));
    employee = apply(
      employee,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(employee.corp.hq.length).toBe(hqBeforeEmployeeStart + 1);

    const employeeAction = mustAction(
      employee,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(employee, action) ===
          411,
    );
    const beforeAgendaAction = employee.corp.hq.length;
    employee = apply(
      employee,
      "corp",
      (action) => action.actionId === employeeAction.actionId,
    );
    expect(employee.corp.hq.length).toBe(beforeAgendaAction + 2);
    expect(employee.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 411,
      drawnCards: 2,
    });

    const nextTurnStart = apply(
      apply(employee, "corp", (action) => action.type === "end_turn"),
      "runner",
      (action) => action.type === "end_turn",
    );
    expect(nextTurnStart.pendingChoice?.source).toContain(
      "scored_agenda.start_draw_choice",
    );
    const hqBeforeOptionalDraw = nextTurnStart.corp.hq.length;
    const employeeDraw = applyChoice(nextTurnStart, "corp", "draw");
    expect(employeeDraw.corp.hq.length).toBe(hqBeforeOptionalDraw);
    expect(employeeDraw.pendingChoice).toBeUndefined();
    expect(employeeDraw.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: 411,
      scoredAgendaStartDrawDecision: "draw",
      selectedAdditionalDrawCount: 1,
    });
    const employeeMandatoryDraw = apply(
      employeeDraw,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(employeeMandatoryDraw.corp.hq.length).toBe(hqBeforeOptionalDraw + 2);
    expect(employeeMandatoryDraw.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "mandatory_draw",
      corpMandatoryCardCount: 1,
      corpMandatoryOptionalAgendaCardCount: 1,
      corpMandatoryTotalBaseDrawCount: 2,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          amount: 1,
          reason: "start_of_turn",
          sourceDefinitionId: 411,
        }),
      ],
    });
    const employeeDrawReplay = replayEvents(
      nextTurnStart,
      employeeMandatoryDraw.eventLog.slice(nextTurnStart.eventLog.length),
    );
    expect(employeeDrawReplay.ok).toBe(true);
    expect(hashState(employeeDrawReplay.state)).toBe(
      hashState(employeeMandatoryDraw),
    );
    const removedEmployee = structuredClone(nextTurnStart);
    removeEverywhere(removedEmployee, employeeId);
    const removedResult = applyAction(removedEmployee, {
      matchId: removedEmployee.matchId,
      side: "corp",
      actionId: mustAction(
        removedEmployee,
        "corp",
        (action) => action.type === "resolve_choice",
      ).actionId,
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
            { id: 418, quantity: 1 },
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
    const marineId = scoreCorpAgendaForTest(
      marine,
      418,
    );
    const marineAction = mustAction(
      marine,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(marine, action) === 418,
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
    marine = apply(
      marine,
      "corp",
      (action) => action.actionId === marineAction.actionId,
    );
    expect(marine.corp.credits).toBe(marineCreditsBefore + 3);
    expect(marine.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: 418,
      cardImplementationAbility: "activated",
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: 418,
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
      [426, 7, 3],
      [432, 4, 4],
    ] as const) {
      let state = apply(
        definitionId === 426
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
      expect(stale.ok, String(definitionId)).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "corp",
        (action) => action.actionId === scoreAction.actionId,
      );
      if (definitionId === 426) {
        const projectBabylonId = state.corp.scoreArea.find(
          (cardId) =>
            state.cardInstances[cardId]?.definitionId === definitionId,
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
      if (definitionId === 426) {
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          overadvanceBonusAgendaPointOveradvance: 4,
          overadvanceBonusAgendaPoints: 2,
        });
      }
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, String(definitionId)).toBe(true);
      expect(hashState(replay.state), String(definitionId)).toBe(hashState(state));
    }
  });

  it("lets the Corp order simultaneous scored start-of-turn sources", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.counterRecurring("corp-start-source-order"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.maxHandSize = 100;
    const employeeId = scoreCorpAgendaForTest(
      state,
      411,
    );
    const detroitId = scoreCorpAgendaForTest(
      state,
      410,
    );
    setCardCounterForTest(state, detroitId, "bit", 2);
    const creditsBefore = state.corp.credits;

    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining("corp_start.order:"),
      minSelections: 1,
      maxSelections: 1,
    });
    expect(state.pendingChoice?.options.map((option) => option.value)).toEqual(
      expect.arrayContaining([employeeId, detroitId]),
    );
    const employeeOrderOption = state.pendingChoice?.options.find(
      (option) => option.value === employeeId,
    )?.id;
    if (!employeeOrderOption)
      throw new Error("Missing Employee Empowerment order option");
    state = applyChoice(state, "corp", employeeOrderOption);
    expect(state.pendingChoice?.source).toContain(
      "scored_agenda.start_draw_choice",
    );
    state = applyChoice(state, "corp", "skip");

    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.credits).toBe(creditsBefore + 2);
    expect(cardCounterAmount(state, detroitId, "bit")).toBe(0);
  });
});
