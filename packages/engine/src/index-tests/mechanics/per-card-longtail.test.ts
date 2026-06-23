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
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("V1.9.22 Per-card Longtail WIP", () => {
  it("adds the first V1.9.22 runner hardware runtime definitions without catalog release promotion", () => {
    const runnerHardwareIds = [
      "onr_v1_119_arasaka-portable-prototype",
      "onr_v1_122_artemis-2020",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_124_corolla-speed-chip",
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_136_pandoras-deck",
      "onr_v1_137_parraline-5750",
      "onr_v1_138_pk-6089a",
      "onr_v1_147_zz22-speed-chip",
    ] as const;
    expect(MECHANIC_SMOKE_CARD_IDS.longtailEffects).toHaveLength(47);
    for (const definitionId of runnerHardwareIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("runner");
      expect(definition?.type, definitionId).toBe("hardware");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "per_card_longtail",
      );
    }
    expect(DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]?.implementationStatus).toBe(
      "playable_mvp",
    );
    expect(DEMO_CARDS_BY_ID["onr_v1_123_bodyweight-data-creche"]).toMatchObject(
      {
        installCost: 3,
      },
    );
    expect(DEMO_CARDS_BY_ID["onr_v1_124_corolla-speed-chip"]).toMatchObject({
      installCost: 1,
    });
  });

  it("installs all V1.9.22 runner hardware through LegalActions with replay, visibility and revalidation", () => {
    const runnerHardwareIds = [
      "onr_v1_119_arasaka-portable-prototype",
      "onr_v1_122_artemis-2020",
      "onr_v1_123_bodyweight-data-creche",
      "onr_v1_124_corolla-speed-chip",
      "onr_v1_131_microtech-backup-drive",
      "onr_v1_136_pandoras-deck",
      "onr_v1_137_parraline-5750",
      "onr_v1_138_pk-6089a",
      "onr_v1_147_zz22-speed-chip",
    ] as const;

    for (const definitionId of runnerHardwareIds) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-hardware-install`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `onr_v1_runner_v1922_${definitionId}_hardware_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      moveRunnerCardToGrip(state, definitionId);
      if (definitionId === "onr_v1_119_arasaka-portable-prototype")
        scoreRunnerAgendaForTest(state, "simple_agenda");

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(
        state.runner.rig.hardware.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        definitionId,
      ).toContain(definitionId);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, definitionId).toEqual([]);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("uses ZZ22 Speed Chip recurring credits only for Killer use during runs", () => {
    let killerState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zz22-killer-recurring",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zz22_killer",
          name: "O:NR V1.9.22 ZZ22 Killer Runner",
          cards: [
            { id: "onr_v1_147_zz22-speed-chip", quantity: 1 },
            { id: "simple_killer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zz22_killer",
          name: "O:NR V1.9.22 ZZ22 Killer Corp",
          cards: [
            { id: "simple_sentry_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    killerState.runner.credits = 6;
    killerState.runner.clicks = 4;
    killerState.runner.memoryLimit = 4;
    killerState.corp.credits = 10;
    const zz22Id = moveRunnerCardToGrip(
      killerState,
      "onr_v1_147_zz22-speed-chip",
    );
    moveRunnerCardToGrip(killerState, "simple_killer");
    const sentryId = putCorpIceOnServer(killerState, "rd", "simple_sentry_ice");

    const installZz22 = mustAction(
      killerState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(killerState, action) === "onr_v1_147_zz22-speed-chip",
    );
    expect(installZz22.costs[0]?.credits).toBe(5);
    killerState = apply(
      killerState,
      "runner",
      (action) => action.actionId === installZz22.actionId,
    );
    expect(killerState.cardInstances[zz22Id]?.counters?.bit).toBe(2);
    installRunnerProgramForTest(killerState, "simple_killer");
    killerState.runner.credits = 1;

    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    killerState = apply(
      killerState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === sentryId,
    );
    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(killerState, action) === "simple_killer",
    );
    expect(killerState.runner.credits).toBe(1);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit).toBe(1);
    killerState = apply(
      killerState,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(killerState, action) === "simple_killer",
    );
    expect(killerState.runner.credits).toBe(1);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit ?? 0).toBe(0);
    const killerBreak = mustAction(
      killerState,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(killerState, action) === "simple_killer",
    );
    killerState = apply(
      killerState,
      "runner",
      (action) => action.actionId === killerBreak.actionId,
    );
    expect(killerState.runner.credits).toBe(0);
    expect(killerState.cardInstances[zz22Id]?.counters?.bit ?? 0).toBe(0);

    let decoderState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zz22-non-killer-recurring",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zz22_decoder",
          name: "O:NR V1.9.22 ZZ22 Decoder Runner",
          cards: [
            { id: "onr_v1_147_zz22-speed-chip", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zz22_decoder",
          name: "O:NR V1.9.22 ZZ22 Decoder Corp",
          cards: [
            { id: "simple_code_gate_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    decoderState.runner.credits = 6;
    decoderState.runner.clicks = 4;
    decoderState.runner.memoryLimit = 4;
    decoderState.corp.credits = 10;
    moveRunnerCardToGrip(decoderState, "onr_v1_147_zz22-speed-chip");
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
        sourceDefinition(decoderState, action) === "onr_v1_147_zz22-speed-chip",
    );
    installRunnerProgramForTest(decoderState, "simple_decoder");
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
          action.type === "break_subroutine" &&
          sourceDefinition(decoderState, action) === "simple_decoder",
      ),
    ).toBe(false);
  });

  it("adds V1.9.22 runner event runtime definitions without broad play_event support", () => {
    const runnerEventIds = [
      "onr_v1_077_anonymous-tip",
      "onr_v1_080_core-command-jettison-ice",
      "onr_v1_086_forged-activation-orders",
      "onr_v1_093_if-you-want-it-done-right",
      "onr_v1_100_misc-for-sale",
      "onr_v1_102_open-ended-mileage-program",
      "onr_v1_103_organ-donor",
      "onr_v1_109_security-code-worm-chip",
      "onr_v1_113_synchronized-attack-on-hq",
      "onr_v1_117_valu-pak-software-bundle",
    ] as const;
    for (const definitionId of runnerEventIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.side, definitionId).toBe("runner");
      expect(definition?.type, definitionId).toBe("event");
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
      expect(definition?.mechanics.join(" "), definitionId).toContain(
        "per_card_longtail",
      );
    }
  });

  it("plays If You Want It Done Right as a private stack top-five choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-if-you-want-it-done-right",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_if_you_want_it_done_right",
          name: "O:NR V1.9.22 If You Want It Done Right",
          cards: [
            { id: "onr_v1_093_if-you-want-it-done-right", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_093_if-you-want-it-done-right");
    const topFive = state.runner.stack.slice(0, 5);
    expect(topFive).toHaveLength(5);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_093_if-you-want-it-done-right",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-if-you-want-it-done-right-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-if-you-want-it-done-right-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_093_if-you-want-it-done-right",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.runner_stack_top5_choose_one_arrange_rest",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_093_if-you-want-it-done-right",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const runnerChoiceView = getPlayerView(state, "runner");
    const corpChoiceView = getPlayerView(state, "corp");
    const runnerChoiceCards =
      runnerChoiceView.pendingChoice?.options.map((option) => option.card) ??
      [];
    expect(runnerChoiceView.pendingChoice?.choiceId).toBe(
      state.pendingChoice!.choiceId,
    );
    expect(runnerChoiceCards).toHaveLength(5);
    expect(
      runnerChoiceCards.every(
        (card) => card?.known === true && Boolean(card.rulesText),
      ),
    ).toBe(true);
    expect(corpChoiceView.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpChoiceView)).not.toContain(topFive[0]);

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing If You Want It Done Right choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const chosenCardId = String(
      pendingChoice.options.find((option) => option.id === selectedOptionIds[0])
        ?.value,
    );
    const expectedStackTop = selectedOptionIds
      .slice(1)
      .map((optionId) =>
        String(
          pendingChoice.options.find((option) => option.id === optionId)?.value,
        ),
      );
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(chosenCardId);
    expect(state.runner.stack.slice(0, expectedStackTop.length)).toEqual(
      expectedStackTop,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
      selectedCount: 1,
      arrangedCount: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Organ Donor as a private grip-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-organ-donor",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_organ_donor",
          name: "O:NR V1.9.22 Organ Donor",
          cards: [
            { id: "onr_v1_103_organ-donor", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_103_organ-donor");
    const trashCandidates = state.runner.stack.slice(0, 2);
    expect(trashCandidates).toHaveLength(2);
    for (const cardId of trashCandidates) {
      removeEverywhere(state, cardId);
      state.runner.grip.unshift(cardId);
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "runner", zone: "grip" },
        faceup: true,
        rezzed: true,
      };
    }

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_103_organ-donor",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-organ-donor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-organ-donor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_103_organ-donor",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_47.runner_grip_trash_for_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_103_organ-donor",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
      sourceDefinitionId: "onr_v1_103_organ-donor",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Organ Donor choice");
    const selectedOptionIds = trashCandidates.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of trashCandidates) {
      expect(state.runner.heap).toContain(cardId);
      expect(state.runner.grip).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + trashCandidates.length * 2,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_grip_trash_for_credits",
      trashedCount: 2,
      gainedCredits: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays misc.for-sale as a private installed-trash economy choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-misc-for-sale",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_misc_for_sale",
          name: "O:NR V1.9.22 misc.for-sale",
          cards: [
            { id: "onr_v1_100_misc-for-sale", quantity: 1 },
            { id: "simple_setup_hardware", quantity: 1 },
            { id: "onr_v1_122_artemis-2020", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 100;
    state.runner.clicks = 10;
    moveRunnerCardToGrip(state, "simple_setup_hardware");
    moveRunnerCardToGrip(state, "onr_v1_122_artemis-2020");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_setup_hardware",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_122_artemis-2020",
    );
    const installedTargets = state.runner.rig.hardware.slice(0, 2);
    expect(installedTargets).toHaveLength(2);
    moveRunnerCardToGrip(state, "onr_v1_100_misc-for-sale");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_100_misc-for-sale",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-misc-for-sale-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-misc-for-sale-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeEvent = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_100_misc-for-sale",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_47.runner_installed_trash_for_credits",
    );
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_100_misc-for-sale",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
      sourceDefinitionId: "onr_v1_100_misc-for-sale",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing misc.for-sale choice");
    const selectedOptionIds = installedTargets.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of installedTargets) {
      expect(state.runner.heap).toContain(cardId);
      expect([
        ...state.runner.rig.programs,
        ...state.runner.rig.hardware,
        ...state.runner.rig.resources,
      ]).not.toContain(cardId);
    }
    expect(state.runner.credits).toBe(
      creditsBeforeEvent + installedTargets.length * 3,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_47_runner_installed_trash_for_credits",
      trashedCount: 2,
      gainedCredits: 6,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"grip"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Open-Ended Mileage Program as tag removal with optional return", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-open-ended-mileage-program",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_card_implementation_paid_source_return_to_grip_program",
          name: "O:NR V1.9.22 Open-Ended Mileage Program",
          cards: [
            { id: "onr_v1_102_open-ended-mileage-program", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.runner.tags = 1;
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_102_open-ended-mileage-program",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_102_open-ended-mileage-program",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-open-ended-mileage-program-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-open-ended-mileage-program-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_102_open-ended-mileage-program",
    );
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.paid_source_return_to_grip",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.runner.heap).toContain(eventCardId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_102_open-ended-mileage-program",
      v1922RunnerEventAbility: "remove_tag_optional_return",
      removedTags: 1,
      runnerTagsAfter: 0,
    });

    state = applyChoice(state, "runner", "pay_1_return_to_grip");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.runner.grip).toContain(eventCardId);
    expect(state.runner.heap).not.toContain(eventCardId);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "remove_tag_optional_return",
      returnedToGrip: true,
      paidCredits: 1,
      runnerCreditsAfter: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"stack"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Anonymous Tip as a public black-ice derez choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-anonymous-tip",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip",
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_anonymous_tip",
          name: "O:NR V1.9.22 Anonymous Tip Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 5;
    state.runner.clicks = 4;
    const blackIceId = "v1922_anonymous_tip_black_ice" as CardInstanceId;
    const rdServer = state.corp.servers.find((server) => server.id === "rd");
    expect(rdServer).toBeDefined();
    if (!rdServer) throw new Error("Missing R&D server");
    rdServer.ice.push(blackIceId);
    state.cardInstances[blackIceId] = {
      instanceId: blackIceId,
      definitionId: "onr_v1_231_cortical-scrub",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    const anonymousTipId = "v1922_anonymous_tip" as CardInstanceId;
    state.runner.grip.unshift(anonymousTipId);
    state.cardInstances[anonymousTipId] = {
      instanceId: anonymousTipId,
      definitionId: "onr_v1_077_anonymous-tip",
      owner: "runner",
      controller: "runner",
      zone: { side: "runner", zone: "grip" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_077_anonymous-tip",
    );
    expect(legal.costs[0]?.credits).toBe(3);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-anonymous-tip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-anonymous-tip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_077_anonymous-tip",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.anonymous_tip_derez_black_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.runner.credits).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_077_anonymous-tip",
      v1922RunnerEventAbility: "derez_black_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Anonymous Tip choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === blackIceId,
    );
    expect(selectedOption).toBeDefined();
    state = applyChoice(state, "runner", selectedOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[blackIceId]?.rezzed).toBe(false);
    expect(state.cardInstances[blackIceId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "derez_black_ice",
      derezzedCount: 1,
      targetCardDefinitionId: "onr_v1_231_cortical-scrub",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Forged Activation Orders as a public ICE target and Corp rez-or-trash choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders",
          name: "O:NR V1.9.22 Forged Activation Orders Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "onr_v1_263_reinforced-wall", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    state.corp.credits = 5;
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    const rezzedReinforcedWallId = putCorpIceOnServer(
      state,
      "hq",
      "onr_v1_263_reinforced-wall",
    );
    state.cardInstances[rezzedReinforcedWallId] = {
      ...state.cardInstances[rezzedReinforcedWallId]!,
      rezzed: true,
      faceup: true,
    };
    moveRunnerCardToGrip(state, "onr_v1_086_forged-activation-orders");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-forged-activation-orders-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-forged-activation-orders-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    expect(state.runner.credits).toBe(1);
    expect(state.pendingChoice?.source).toContain(
      "v1922.forged_activation_orders_target",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(
      JSON.stringify(getPlayerView(state, "runner").pendingChoice),
    ).not.toContain("simple_barrier_ice");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_086_forged-activation-orders",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"rd"|"simple_barrier_ice"/,
    );

    const targetChoice = state.pendingChoice;
    expect(targetChoice).toBeDefined();
    if (!targetChoice)
      throw new Error("Missing Forged Activation Orders target choice");
    expect(targetChoice.options.map((option) => option.value)).not.toContain(
      rezzedReinforcedWallId,
    );
    const targetOption = targetChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice?.source).toContain(
      "v1922.forged_activation_orders_corp",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(state.pendingChoice?.prompt).toBe(
      "Forged Activation Orders: ICE 1 in R&D rezzen oder trashen",
    );
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "ICE 1 in R&D rezzen",
      "ICE 1 in R&D trashen",
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
      targetIcePositionLabel: "ICE 1 in R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"simple_barrier_ice"/,
    );

    const corpCreditsBefore = state.corp.credits;
    state = applyChoice(state, "corp", "rez_ice");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.cardInstances[targetIceId]?.rezzed).toBe(true);
    expect(state.cardInstances[targetIceId]?.faceup).toBe(true);
    expect(state.corp.credits).toBeLessThan(corpCreditsBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "rez_ice",
      targetCardDefinitionId: "simple_barrier_ice",
      targetServerLabel: "R&D",
      targetIcePositionLabel: "ICE 1 in R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let noUnrezzedTargetState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders-no-unrezzed-target",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders_no_unrezzed",
          name: "O:NR V1.9.22 Forged Activation Orders No Unrezzed",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders_no_unrezzed",
          name: "O:NR V1.9.22 Forged Activation Orders No Unrezzed Corp",
          cards: [
            { id: "onr_v1_263_reinforced-wall", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    noUnrezzedTargetState.runner.credits = 2;
    const onlyRezzedTargetId = putCorpIceOnServer(
      noUnrezzedTargetState,
      "hq",
      "onr_v1_263_reinforced-wall",
    );
    noUnrezzedTargetState.cardInstances[onlyRezzedTargetId] = {
      ...noUnrezzedTargetState.cardInstances[onlyRezzedTargetId]!,
      rezzed: true,
      faceup: true,
    };
    moveRunnerCardToGrip(
      noUnrezzedTargetState,
      "onr_v1_086_forged-activation-orders",
    );
    expect(
      getLegalActions(noUnrezzedTargetState, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(noUnrezzedTargetState, action) ===
            "onr_v1_086_forged-activation-orders",
      ),
    ).toBe(false);

    let trashState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-forged-activation-orders-trash",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash",
          cards: [
            { id: "onr_v1_086_forged-activation-orders", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_forged_activation_orders_trash",
          name: "O:NR V1.9.22 Forged Activation Orders Trash Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    trashState.runner.credits = 2;
    trashState.corp.credits = 0;
    const trashTargetId = putCorpIceOnServer(
      trashState,
      "hq",
      "simple_barrier_ice",
    );
    moveRunnerCardToGrip(trashState, "onr_v1_086_forged-activation-orders");
    trashState = apply(
      trashState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(trashState, action) ===
          "onr_v1_086_forged-activation-orders",
    );
    const trashTargetChoice = trashState.pendingChoice;
    if (!trashTargetChoice)
      throw new Error("Missing Forged Activation Orders trash target choice");
    const trashTargetOption = trashTargetChoice.options.find(
      (option) => option.value === trashTargetId,
    );
    trashState = applyChoice(trashState, "runner", trashTargetOption?.id ?? "");
    expect(trashState.pendingChoice?.prompt).toBe(
      "Forged Activation Orders: ICE 1 in HQ rezzen oder trashen",
    );
    expect(
      trashState.pendingChoice?.options.map((option) => option.label),
    ).toEqual(["ICE 1 in HQ trashen"]);
    expect(
      trashState.pendingChoice?.options.map((option) => option.id),
    ).toEqual(["trash_ice"]);
    trashState = applyChoice(trashState, "corp", "trash_ice");
    expect(trashState.corp.archives).toContain(trashTargetId);
    expect(trashState.cardInstances[trashTargetId]?.faceup).toBe(false);
    expect(trashState.cardInstances[trashTargetId]?.rezzed).toBe(false);
    expect(trashState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_option",
      v1922RunnerEventAbility: "force_rez_or_trash_ice",
      corpDecision: "trash_ice",
      trashedCount: 1,
      targetIcePositionLabel: "ICE 1 in HQ",
      targetVisibility: "hidden_installed_ice_position",
    });
    expect(trashState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "targetCardDefinitionId",
    );
    expect(JSON.stringify(trashState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /simple_barrier_ice/,
    );
    expect(JSON.stringify(getPlayerView(trashState, "runner"))).not.toMatch(
      /simple_barrier_ice|Simple Barrier ICE/,
    );
  });

  it("plays Core Command Jettison Ice after a successful HQ run to pay rez cost and trash rezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-core-command-jettison-ice",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_core_command_jettison_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice",
          cards: [
            { id: "onr_v1_080_core-command-jettison-ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_core_command_jettison_ice",
          name: "O:NR V1.9.22 Core Command Jettison Ice Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    state.cardInstances[targetIceId] = {
      ...state.cardInstances[targetIceId]!,
      faceup: true,
      rezzed: true,
    };
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_080_core-command-jettison-ice",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_080_core-command-jettison-ice",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    expect(state.run?.phase).toBe("access");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_080_core-command-jettison-ice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-core-command-jettison-ice-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-core-command-jettison-ice-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_080_core-command-jettison-ice",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.core_command_jettison_ice",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Core Command choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.runner.credits).toBeLessThan(creditsBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility:
        "successful_hq_run_pay_rez_cost_trash_rezzed_ice",
      trashedCount: 1,
      targetCardDefinitionId: "simple_barrier_ice",
      targetServerLabel: "R&D",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Security Code WORM Chip after a successful HQ run to trash unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-security-code-worm-chip",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_security_code_worm_chip",
          name: "O:NR V1.9.22 Security Code WORM Chip",
          cards: [
            { id: "onr_v1_109_security-code-worm-chip", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_security_code_worm_chip",
          name: "O:NR V1.9.22 Security Code WORM Chip Corp",
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqCard);
    const targetIceId = putCorpIceOnServer(state, "rd", "simple_barrier_ice");
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_109_security-code-worm-chip",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_109_security-code-worm-chip",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_109_security-code-worm-chip",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-security-code-worm-chip-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-security-code-worm-chip-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_109_security-code-worm-chip",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.security_code_worm_chip",
    );
    expect(state.pendingChoice?.visibility).toBe("public");
    expect(
      JSON.stringify(getPlayerView(state, "runner").pendingChoice),
    ).not.toContain("simple_barrier_ice");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_109_security-code-worm-chip",
      v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
    });

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Security Code WORM Chip choice");
    const targetOption = pendingChoice.options.find(
      (option) => option.value === targetIceId,
    );
    expect(targetOption).toBeDefined();
    state = applyChoice(state, "runner", targetOption?.id ?? "");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.archives).toContain(targetIceId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "successful_hq_run_trash_unrezzed_ice",
      targetVisibility: "installed_ice_position",
      targetServerLabel: "R&D",
      trashedCount: 1,
      targetCardDefinitionId: "simple_barrier_ice",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not offer Security Code WORM Chip after a successful HQ run without unrezzed ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-security-code-worm-chip-no-target",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_security_code_worm_chip_no_target",
          name: "O:NR V1.9.22 Security Code WORM Chip No Target",
          cards: [
            { id: "onr_v1_109_security-code-worm-chip", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: ONR_V1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    const hqCard = moveCorpCardToHq(
      state,
      "onr_v1_293_netwatch-credit-voucher",
    );
    keepOnlyCorpHqCard(state, hqCard);
    moveRunnerCardToGrip(state, "onr_v1_109_security-code-worm-chip");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_109_security-code-worm-chip",
      ),
    ).toBe(false);
  });

  it("plays Synchronized Attack on HQ after a successful HQ run as a private Corp retain choice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-synchronized-attack-on-hq",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_synchronized_attack_on_hq",
          name: "O:NR V1.9.22 Synchronized Attack on HQ",
          cards: [
            { id: "onr_v1_113_synchronized-attack-on-hq", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    state.runner.clicks = 4;
    state.corp.credits = 4;
    const hqCards = [
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
      moveCorpCardCopyToHq(state, "simple_economy_operation"),
    ];
    keepOnlyCorpHqCards(state, hqCards);
    const eventCardId = moveRunnerCardToGrip(
      state,
      "onr_v1_113_synchronized-attack-on-hq",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "play_event" &&
          sourceDefinition(state, action) ===
            "onr_v1_113_synchronized-attack-on-hq",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.runnerTurnFlags?.successfulHqRunThisTurn).toBe(true);
    expect(state.runner.grip).toContain(eventCardId);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_113_synchronized-attack-on-hq",
    );
    expect(legal.costs[0]?.credits).toBe(4);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-synchronized-attack-on-hq-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-synchronized-attack-on-hq-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_113_synchronized-attack-on-hq",
    );
    expect(state.pendingChoice?.source).toContain(
      "v1922.synchronized_attack_on_hq",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_113_synchronized-attack-on-hq",
      v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice)
      throw new Error("Missing Synchronized Attack on HQ choice");
    const retainedIds = hqCards.slice(0, 2);
    const selectedOptionIds = retainedIds.map((cardId) => {
      const option = pendingChoice.options.find(
        (candidate) => candidate.value === cardId,
      );
      expect(option).toBeDefined();
      return option?.id ?? "";
    });
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    for (const cardId of retainedIds) expect(state.corp.hq).toContain(cardId);
    expect(state.corp.archives).toContain(hqCards[2]);
    expect(state.corp.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      choiceKind: "select_cards",
      v1922RunnerEventAbility: "successful_hq_run_corp_pay_to_retain_hq",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_synchronized_attack_on_hq_retain",
      retainedCount: 2,
      discardedCount: 1,
      paidCredits: 4,
      corpCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"cardInstances"|"privatePayload"|"simple_economy_operation"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Valu-Pak Software Bundle as a consecutive program-install action bundle", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-valu-pak-software-bundle",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_valu_pak_software_bundle",
          name: "O:NR V1.9.22 Valu-Pak Software Bundle",
          cards: [
            { id: "onr_v1_117_valu-pak-software-bundle", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 2;
    state.runner.clicks = 4;
    moveRunnerCardToGrip(state, "onr_v1_117_valu-pak-software-bundle");
    const programId = moveRunnerCardToGrip(state, "simple_decoder");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_117_valu-pak-software-bundle",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-valu-pak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-valu-pak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) ===
          "onr_v1_117_valu-pak-software-bundle",
    );
    expect(state.runner.clicks).toBe(8);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      5,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      1,
    );
    expect(
      state.runnerTurnFlags?.restrictedActionGrants?.valu_pak_program_install,
    ).toMatchObject({
      side: "runner",
      sourceDefinitionId: "onr_v1_117_valu-pak-software-bundle",
      actionType: "install_card",
      remainingActions: 5,
      costProfile: "temporary_credit_bundle",
      temporaryCredits: {
        amount: 1,
        usableFor: "runner_program_install",
      },
      cleanupTiming: "side_turn_end",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      cardDefinitionId: "onr_v1_117_valu-pak-software-bundle",
      v1922RunnerEventAbility: "program_install_action_bundle",
      gainedActions: 5,
      temporaryProgramInstallCredits: 1,
      valuPakProgramInstallActionsRemaining: 5,
      runnerClicksAfter: 8,
    });

    const bundleActions = getLegalActions(state, "runner");
    expect(
      bundleActions.some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === "simple_decoder",
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "start_run" ||
          action.type === "play_event",
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_decoder",
    );
    expect(state.runner.rig.programs).toContain(programId);
    expect(state.runner.credits).toBe(0);
    expect(state.runnerTurnFlags?.valuPakProgramInstallActionsRemaining).toBe(
      4,
    );
    expect(state.runnerTurnFlags?.valuPakTemporaryProgramInstallCredits).toBe(
      0,
    );
    expect(
      state.runnerTurnFlags?.restrictedActionGrants?.valu_pak_program_install,
    ).toMatchObject({
      remainingActions: 4,
      temporaryCredits: { amount: 0 },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "simple_decoder",
      v1922RunnerEventAbility: "program_install_action_bundle",
      valuPakInstallActionSpent: true,
      valuPakProgramInstallActionsRemaining: 4,
      valuPakTemporaryProgramInstallCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Japanese Water Torture, breaks Wall subroutines and carries future action debt without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-japanese-water-torture-wall-debt",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_japanese_water_torture",
          name: "O:NR V1.9.22 Japanese Water Torture",
          cards: [
            { id: "onr_v1_037_japanese-water-torture", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_japanese_water_torture_wall",
          name: "O:NR V1.9.22 Japanese Water Torture Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    state.corp.maxHandSize = 99;
    moveRunnerCardToGrip(state, "onr_v1_037_japanese-water-torture");
    const iceId = putCorpIceOnServer(
      state,
      "archives",
      "onr_v1_232_crystal-wall",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_037_japanese-water-torture",
    );
    expect(state.runner.credits).toBe(13);
    expect(state.runner.memoryUsed).toBe(1);
    const tortureId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_037_japanese-water-torture",
    );
    expect(tortureId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      ),
    ).toBe(false);

    for (let pump = 0; pump < 3; pump += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      );
    }
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "pump_breaker",
      cardDefinitionId: "onr_v1_037_japanese-water-torture",
      v1922RunnerProgramAbility: "japanese_water_torture_future_action_debt",
      futureActionDebtAdded: 1,
      futureActionDebtPending: 3,
      breakerStrengthAfter: 5,
    });

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) ===
          "onr_v1_037_japanese-water-torture" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-japanese-water-torture-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-japanese-water-torture-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_037_japanese-water-torture",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    for (let step = 0; step < 4 && state.run; step += 1) {
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "continue_run" ||
          action.type === "access_card" ||
          action.type === "steal_agenda" ||
          action.type === "decline_trash",
      );
    }
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(0);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(1);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.timingPoint).toBe("runner_action.main");
    expect(state.runner.clicks).toBe(3);
    expect(state.runnerTurnFlags?.forgoNextActionsPending).toBe(0);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("does not offer Japanese Water Torture pump actions against non-Wall ICE", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-japanese-water-torture-quandary-no-pump",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_japanese_water_torture_quandary",
          name: "O:NR V1.9.22 Japanese Water Torture Quandary",
          cards: [
            { id: "onr_v1_037_japanese-water-torture", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_japanese_water_torture_quandary",
          name: "O:NR V1.9.22 Japanese Water Torture Quandary Corp",
          cards: [
            { id: "onr_v1_261_quandary", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_037_japanese-water-torture");
    const iceId = putCorpIceOnServer(state, "hq", "onr_v1_261_quandary");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_037_japanese-water-torture",
    );
    const tortureId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_037_japanese-water-torture",
    );
    expect(tortureId).toBeDefined();

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const runnerActions = getLegalActions(state, "runner");
    expect(
      runnerActions.some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      ),
    ).toBe(false);
    expect(
      runnerActions.some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) ===
            "onr_v1_037_japanese-water-torture",
      ),
    ).toBe(false);
  });

  it("installs Hammer and applies ordered Stealth loss after breaking Wall subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-hammer-wall-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_hammer",
          name: "O:NR V1.9.22 Hammer",
          cards: [
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_hammer_wall",
          name: "O:NR V1.9.22 Hammer Wall Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_011_cloak");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_011_cloak",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(cloakId).toBeDefined();
    expect(hammerId).toBeDefined();
    if (!cloakId || !hammerId)
      throw new Error("Missing installed Hammer or Cloak");
    expect(state.runner.memoryUsed).toBe(2);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(3);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-hammer-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-hammer-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("opens a private Hammer Stealth-loss distribution choice for multiple sources", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-hammer-stealth-choice",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_hammer_choice",
          name: "O:NR V1.9.22 Hammer Choice",
          cards: [
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "onr_v1_031_hammer", quantity: 1 },
            { id: "onr_v1_035_invisibility", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_hammer_choice",
          name: "O:NR V1.9.22 Hammer Choice Corp",
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 5;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_011_cloak");
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    moveRunnerCardToGrip(state, "onr_v1_035_invisibility");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_011_cloak",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_035_invisibility",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const cloakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const invisibilityId = state.runner.rig.programs.find(
      (id) =>
        state.cardInstances[id]?.definitionId === "onr_v1_035_invisibility",
    );
    expect(cloakId).toBeDefined();
    expect(invisibilityId).toBeDefined();
    if (!cloakId || !invisibilityId)
      throw new Error("Missing installed Stealth sources");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 0,
    );

    expect(state.pendingChoice?.source).toContain("v1922.hammer_stealth_loss");
    expect(state.pendingChoice?.side).toBe("runner");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.minSelections).toBe(2);
    expect(state.pendingChoice?.maxSelections).toBe(2);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
      postBreakStealthLossPending: 2,
    });

    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    const cloakOption = runnerChoice?.options.find(
      (option) => option.value === cloakId,
    );
    const invisibilityOption = runnerChoice?.options.find(
      (option) => option.value === invisibilityId,
    );
    expect(cloakOption).toBeDefined();
    expect(invisibilityOption).toBeDefined();
    if (!cloakOption || !invisibilityOption)
      throw new Error("Missing Hammer Stealth options");

    state = applyChoices(state, "runner", [
      cloakOption.id,
      invisibilityOption.id,
    ]);
    expect(state.pendingChoice).toBeUndefined();
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(2);
    expect(cardCounterAmount(state, invisibilityId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1922_hammer_stealth_loss_distribution",
      selectedCount: 2,
      postBreakStealthLoss: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Flak and breaks AP ICE subroutines without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-flak-ap-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_flak",
          name: "O:NR V1.9.22 Flak",
          cards: [
            { id: "onr_v1_027_flak", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_flak_ap",
          name: "O:NR V1.9.22 Flak AP ICE Corp",
          cards: [
            { id: "onr_v1_280_zombie", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_027_flak");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_280_zombie");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );
    expect(state.runner.credits).toBe(16);
    expect(state.runner.memoryUsed).toBe(1);
    const flakId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_027_flak",
    );
    expect(flakId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_027_flak",
      ),
    ).toBe(false);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "onr_v1_027_flak",
    );

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_027_flak" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(1);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-flak-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-flak-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_027_flak",
      title: "Flak",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(1);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Reflector and only breaks tagged stun or knockout subroutines", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-reflector-tagged-breaker",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_reflector",
          name: "O:NR V1.9.22 Reflector",
          cards: [
            { id: "onr_v1_055_reflector", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_reflector",
          name: "O:NR V1.9.22 Reflector Tagged ICE Corp",
          cards: [
            { id: "onr_v1_271_tko-2-0", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_055_reflector");
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_271_tko-2-0");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_055_reflector",
    );
    expect(state.runner.credits).toBe(8);
    expect(state.runner.memoryUsed).toBe(1);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );

    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_055_reflector",
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0]);
    expect(breakActions[0]?.costs[0]?.credits).toBe(0);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-reflector-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakActions[0]!.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-reflector-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakActions[0]?.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(state, action) === "onr_v1_055_reflector",
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_055_reflector",
      title: "Reflector",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs V1.9.22 install-only runner programs while keeping their abilities gated", () => {
    const installOnlyPrograms = [
      {
        definitionId: "onr_v1_026_false-echo",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_044_netspace-inverter",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_048_poltergeist",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_051_rabbit",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_057_scatter-shot",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_067_speed-trap",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_068_startup-immolator",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
      {
        definitionId: "onr_v1_075_zetatech-software-installer",
        expectedCreditsAfter: 10,
        expectedMemoryUsed: 1,
      },
    ] as const;

    for (const {
      definitionId,
      expectedCreditsAfter,
      expectedMemoryUsed,
    } of installOnlyPrograms) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `v1922-${definitionId}-install-only`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `onr_v1_runner_v1922_${definitionId}_install`,
            name: `O:NR V1.9.22 ${definitionId} Install`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 10;
      state.runner.memoryLimit = 4;
      moveRunnerCardToGrip(state, definitionId);

      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `v1922-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok)
        expect(wrongSide.error.code, definitionId).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `v1922-${definitionId}-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok)
        expect(stale.error.code, definitionId).toBe("ERR_STALE_STATE");

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );

      expect(state.runner.credits, definitionId).toBe(expectedCreditsAfter);
      expect(state.runner.memoryUsed, definitionId).toBe(expectedMemoryUsed);
      expect(
        state.runner.rig.programs.map(
          (id) => state.cardInstances[id]?.definitionId,
        ),
        definitionId,
      ).toContain(definitionId);
      expect(
        getLegalActions(state, "runner").some(
          (action) => sourceDefinition(state, action) === definitionId,
        ),
        definitionId,
      ).toBe(false);
      expect(
        getPlayerView(state, "runner").own.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        getPlayerView(state, "corp").opponent.rig?.some(
          (card) => card.definitionId === definitionId,
        ),
        definitionId,
      ).toBe(true);
      expect(
        JSON.stringify(state.eventLog.at(-1)?.publicPayload),
        definitionId,
      ).not.toMatch(/"privatePayload"|"cardInstances"|"hq"|"rd"/);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, definitionId).toEqual([]);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("uses Zetatech Software Installer recurring credits for program installs and refreshes", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-software-installer-recurring-program-install",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_software_installer_recurring",
          name: "O:NR V1.9.22 Zetatech Software Installer Recurring",
          cards: [
            { id: "onr_v1_075_zetatech-software-installer", quantity: 1 },
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 4;
    const installerId = moveRunnerCardToGrip(
      state,
      "onr_v1_075_zetatech-software-installer",
    );
    const hammerId = moveRunnerCardToGrip(state, "onr_v1_031_hammer");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_075_zetatech-software-installer",
    );

    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zetatech-installs-hammer-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zetatech-installs-hammer-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );

    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(0);
    expect(state.runner.rig.programs).toContain(hammerId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "onr_v1_031_hammer",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (state.pendingChoice?.source === "discard_phase")
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );

    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);
    expect(validateGameState(state).ok).toBe(true);
  });

  it("overlays a program on Zetatech Software Installer without extra MU", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zetatech-overlay-install",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_zetatech_overlay",
          name: "O:NR V1.9.22 Zetatech Overlay",
          cards: [
            { id: "onr_v1_075_zetatech-software-installer", quantity: 1 },
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 0;
    state.runner.memoryLimit = 1;
    const installerId = moveRunnerCardToGrip(
      state,
      "onr_v1_075_zetatech-software-installer",
    );
    const hammerId = moveRunnerCardToGrip(state, "onr_v1_031_hammer");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_075_zetatech-software-installer",
    );
    expect(state.runner.memoryUsed).toBe(1);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(2);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        action.source === hammerId &&
        action.payload?.v1922ZetatechOverlayInstall === true,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zetatech-overlay-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zetatech-overlay-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.runner.rig.programs).toContain(hammerId);
    expect(state.cardInstances[hammerId]?.hostedOn).toBe(installerId);
    expect(state.runner.memoryUsed).toBe(1);
    expect(cardCounterAmount(state, installerId, "bit")).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "onr_v1_031_hammer",
      v1922RunnerProgramAbility: "zetatech_overlay_install",
      zetatechOverlayInstall: true,
      hostDefinitionId: "onr_v1_075_zetatech-software-installer",
      zetatechRecurringCreditsSpent: 2,
      runnerCreditsAfter: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("resolves False Echo and Netspace Inverter after a successful run without hidden payload leaks", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-false-echo-netspace-inverter",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_false_echo_netspace_runner",
          name: "Spotcheck False Echo Netspace Runner",
          cards: [
            { id: "onr_v1_026_false-echo", quantity: 1 },
            { id: "onr_v1_044_netspace-inverter", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_false_echo_netspace_corp",
          name: "Spotcheck False Echo Netspace Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            { id: "simple_code_gate_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "onr_v1_026_false-echo");
    installRunnerProgramForTest(state, "onr_v1_044_netspace-inverter");
    putCorpRootInRemote(state, "simple_economy_asset");
    const innerIce = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    const outerIce = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_code_gate_ice",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run?.successful).toBe(true);
    const accessState = structuredClone(state);
    const falseEcho = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1922RunnerProgramAbility === "false_echo_force_rez",
    );
    expect(falseEcho.costs[0]?.credits).toBe(2);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: falseEcho.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-false-echo-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === falseEcho.actionId,
    );
    expect(state.runner.credits).toBe(8);
    expect(state.cardInstances[innerIce]?.rezzed).toBe(true);
    expect(state.cardInstances[outerIce]?.rezzed).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      v1922RunnerProgramAbility: "false_echo_force_rez",
      checkedIceCount: 2,
      rezzedIceCount: 2,
      rezCostPaid: 5,
      falseEchoCreditCost: 2,
      runnerCreditsAfter: 8,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(accessState, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let reverseState = structuredClone(accessState);
    const reverse = mustAction(
      reverseState,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1922RunnerProgramAbility ===
          "netspace_inverter_reverse_ice",
    );
    reverseState = apply(
      reverseState,
      "runner",
      (action) => action.actionId === reverse.actionId,
    );
    expect(
      reverseState.corp.servers.find((server) => server.id === "remote_1")?.ice,
    ).toEqual([outerIce, innerIce]);
    expect(reverseState.eventLog.at(-1)?.publicPayload).toMatchObject({
      v1922RunnerProgramAbility: "netspace_inverter_reverse_ice",
      iceCount: 2,
      serverIceOrderReversed: true,
    });
    expect(
      JSON.stringify(reverseState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(/"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/);
  });

  it("enforces generic hardware deck replacement and Arasaka agenda-point install cost", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-arasaka-pandora-deck-unique",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_arasaka_pandora_runner",
          name: "Spotcheck Arasaka Pandora Runner",
          cards: [
            { id: "onr_v1_119_arasaka-portable-prototype", quantity: 1 },
            { id: "onr_v1_136_pandoras-deck", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    state.runner.credits = 20;
    const pandoraId = moveRunnerCardToGrip(state, "onr_v1_136_pandoras-deck");
    const arasakaId = moveRunnerCardToGrip(
      state,
      "onr_v1_119_arasaka-portable-prototype",
    );

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_119_arasaka-portable-prototype",
      ),
    ).toBe(false);
    scoreRunnerAgendaForTest(state, "simple_agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) === "onr_v1_136_pandoras-deck",
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(6);
    expect(cardCounterAmount(state, pandoraId, "bit")).toBe(3);
    state = apply(
      state,
      "runner",
      (action) =>
        sourceDefinition(state, action) ===
        "onr_v1_119_arasaka-portable-prototype",
    );
    expect(state.runner.heap).toContain(pandoraId);
    expect(state.runner.rig.hardware).toContain(arasakaId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(7);
    expect(cardCounterAmount(state, arasakaId, "bit")).toBe(3);
    expect(state.runner.scoreArea.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_119_arasaka-portable-prototype",
      deckUniqueReplacement: true,
      agendaPointCostPaid: 1,
      hostedCreditsAdded: 3,
      counterType: "bit",
    });

    let followUpState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-eagle-techtronica-deck-unique",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_eagle_techtronica_runner",
          name: "Spotcheck Eagle Techtronica Runner",
          cards: [
            { id: "onr_v1_140_raven-microcyb-eagle", quantity: 1 },
            { id: "onr_v1_143_techtronica-utility-suit", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      }),
    );
    followUpState.runner.credits = 30;
    const eagleId = moveRunnerCardToGrip(
      followUpState,
      "onr_v1_140_raven-microcyb-eagle",
    );
    const techtronicaId = moveRunnerCardToGrip(
      followUpState,
      "onr_v1_143_techtronica-utility-suit",
    );
    followUpState = apply(
      followUpState,
      "runner",
      (action) =>
        sourceDefinition(followUpState, action) ===
        "onr_v1_140_raven-microcyb-eagle",
    );
    expect(followUpState.runner.rig.hardware).toContain(eagleId);
    followUpState = apply(
      followUpState,
      "runner",
      (action) =>
        sourceDefinition(followUpState, action) ===
        "onr_v1_143_techtronica-utility-suit",
    );
    expect(followUpState.runner.heap).toContain(eagleId);
    expect(followUpState.runner.rig.hardware).not.toContain(eagleId);
    expect(followUpState.runner.rig.hardware).toContain(techtronicaId);
    expect(followUpState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_143_techtronica-utility-suit",
      deckUniqueReplacement: true,
    });
  });

  it("loads P3.40/P3.41 hardware decks through CardImplementation bits and memory modifiers", () => {
    for (const [definitionId, expectedMu, expectedBits] of [
      ["onr_v1_119_arasaka-portable-prototype", 3, 3],
      ["onr_v1_122_artemis-2020", 2, 2],
      ["onr_v1_136_pandoras-deck", 2, 3],
      ["onr_v1_137_parraline-5750", 1, 1],
      ["onr_v1_138_pk-6089a", 1, 3],
      ["onr_v1_140_raven-microcyb-eagle", 1, 1],
      ["onr_v1_141_raven-microcyb-owl", 1, 3],
      ["onr_v1_143_techtronica-utility-suit", 1, 5],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-deck-ci`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `p340_${definitionId}_runner`,
            name: `P3.40 ${definitionId} Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
            ],
          },
          corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      const cardId = moveRunnerCardToGrip(state, definitionId);
      if (definitionId === "onr_v1_119_arasaka-portable-prototype")
        scoreRunnerAgendaForTest(state, "simple_agenda");
      const memoryBefore = getPlayerView(state, "runner").own.memoryLimit ?? 0;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
        memoryBefore + expectedMu,
      );
      expect(cardCounterAmount(state, cardId, "bit")).toBe(expectedBits);
      expect(cardCounterAmount(state, cardId, "recurring_credit")).toBe(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
        hostedCreditsAdded: expectedBits,
        counterType: "bit",
      });
      if (definitionId === "onr_v1_119_arasaka-portable-prototype")
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          agendaPointCostPaid: 1,
        });
    }
  });

  it("uses P3.40 deck bits for allowed icebreaker and link-payment contexts only", () => {
    for (const [definitionId, expectedAfterPump] of [
      ["onr_v1_119_arasaka-portable-prototype", 2],
      ["onr_v1_122_artemis-2020", 1],
      ["onr_v1_137_parraline-5750", 0],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-icebreaker-pay`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `p340_${definitionId}_icebreaker_runner`,
            name: `P3.40 ${definitionId} Icebreaker Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              { id: "simple_decoder", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                (card) => card.id !== "simple_decoder",
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `p340_${definitionId}_icebreaker_corp`,
            name: `P3.40 ${definitionId} Icebreaker Corp`,
            cards: [
              { id: "simple_code_gate_ice", quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      state.runner.memoryLimit = 4;
      const deckId = moveRunnerCardToGrip(state, definitionId);
      moveRunnerCardToGrip(state, "simple_decoder");
      if (definitionId === "onr_v1_119_arasaka-portable-prototype")
        scoreRunnerAgendaForTest(state, "simple_agenda");
      const iceId = putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      installRunnerProgramForTest(state, "simple_decoder");
      state.runner.credits = 0;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      state = apply(
        state,
        "corp",
        (action) => action.type === "rez_ice" && action.source === iceId,
      );
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(state, action) === "simple_decoder",
      );
      expect(state.runner.credits).toBe(0);
      expect(cardCounterAmount(state, deckId, "bit")).toBe(expectedAfterPump);
    }

    for (const definitionId of [
      "onr_v1_136_pandoras-deck",
      "onr_v1_138_pk-6089a",
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `p340-${definitionId}-link-pay`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.runner,
            id: `p340_${definitionId}_link_runner`,
            name: `P3.40 ${definitionId} Link Runner`,
            cards: [
              { id: definitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards.filter(
                (card) => card.id !== definitionId,
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.traceTags.corp,
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
      state.runner.credits = 20;
      state.corp.credits = 20;
      const deckId = moveRunnerCardToGrip(state, definitionId);
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId,
      );
      state.runner.credits = 0;
      putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
      state = encounterIce(state, "rd", "onr_v1_246_fragmentation-storm");
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = applyChoice(state, "corp", "bid_0");
      state = applyChoice(state, "runner", "bid_3");
      expect(cardCounterAmount(state, deckId, "bit")).toBe(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        traceLinkCreditsSpent: 3,
        runnerCreditsSpent: 0,
      });
    }

    let owlState = toRunnerTurn(
      createGameAfterSetup({
        seed: "p340-owl-noisy-negative",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "p340_owl_noisy_runner",
          name: "P3.40 Owl Noisy Runner",
          cards: [
            { id: "onr_v1_141_raven-microcyb-owl", quantity: 1 },
            { id: "onr_v1_036_jackhammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "p340_owl_noisy_corp",
          name: "P3.40 Owl Noisy Corp",
          cards: [
            { id: "onr_v1_232_crystal-wall", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "onr_v1_232_crystal-wall",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    owlState.runner.credits = 30;
    owlState.runner.memoryLimit = 4;
    moveRunnerCardToGrip(owlState, "onr_v1_141_raven-microcyb-owl");
    moveRunnerCardToGrip(owlState, "onr_v1_036_jackhammer");
    const wallId = putCorpIceOnServer(
      owlState,
      "rd",
      "onr_v1_232_crystal-wall",
    );
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(owlState, action) === "onr_v1_141_raven-microcyb-owl",
    );
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(owlState, action) === "onr_v1_036_jackhammer",
    );
    owlState.runner.credits = 0;
    owlState = apply(
      owlState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    owlState = apply(
      owlState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    expect(
      getLegalActions(owlState, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(owlState, action) === "onr_v1_036_jackhammer",
      ),
    ).toBe(false);
  });

  it("gates Roving Submarine runs by previous Corp activity and keeps region install public", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-roving-submarine-run-gate",
        baseline: CURRENT_RULES_BASELINE,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_roving_submarine_corp",
          name: "Spotcheck Roving Submarine Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "onr_v1_368_roving-submarine", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    moveCorpCardToHq(state, "onr_v1_368_roving-submarine");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_368_roving-submarine" &&
        action.payload?.serverId === "new_remote",
    );
    const rovingId = state.corp.servers
      .flatMap((server) => server.root)
      .find(
        (id) =>
          state.cardInstances[id]?.definitionId ===
          "onr_v1_368_roving-submarine",
      );
    expect(rovingId).toBeDefined();
    if (!rovingId) throw new Error("Missing Roving Submarine");
    const rovingServerId = state.corp.servers.find((server) =>
      server.root.includes(rovingId),
    )?.id;
    expect(rovingServerId).toBeDefined();
    expect(state.cardInstances[rovingId]?.rezzed).toBe(true);
    expect(cardCounterAmount(state, rovingId, "mark")).toBe(1);

    state = toRunnerTurnFromCorpMain(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(cardCounterAmount(state, rovingId, "mark")).toBe(0);
    state = toRunnerTurnFromCorpMain(state);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" &&
          action.payload?.serverId === rovingServerId,
      ),
    ).toBe(false);
  });

  it("resolves Speed Trap as a root-rez interrupt and can end the run successful without access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-speed-trap-rez-interrupt",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_speed_trap_runner",
          name: "Spotcheck Speed Trap Runner",
          cards: [
            { id: "onr_v1_067_speed-trap", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_speed_trap_corp",
          name: "Spotcheck Speed Trap Corp",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "onr_v1_067_speed-trap");
    const upgradeId = putCorpRootInRemote(state, "simple_upgrade");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.rootRez === true &&
        action.payload?.cardId === upgradeId,
    );
    expect(state.pendingChoice?.source).toContain("v1922.speed_trap");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_ice",
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt_choice",
      speedTrapChoiceOpened: true,
      rezzedCardDefinitionId: "simple_upgrade",
    });

    state = applyChoice(state, "runner", "jack_out");
    expect(state.run).toBeUndefined();
    expect(state.phase).toBe("runner_action_phase");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      v1922RunnerProgramAbility: "speed_trap_rez_interrupt",
      speedTrapUsed: true,
      successfulRunWithoutAccess: true,
      rezzedCardDefinitionId: "simple_upgrade",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("lets Speed Trap pass a root rez and then continue to normal access", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-speed-trap-pass",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_speed_trap_pass_runner",
          name: "Spotcheck Speed Trap Pass Runner",
          cards: [
            { id: "onr_v1_067_speed-trap", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_speed_trap_pass_corp",
          name: "Spotcheck Speed Trap Pass Corp",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "onr_v1_067_speed-trap");
    const upgradeId = putCorpRootInRemote(state, "simple_upgrade");
    putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(state, "corp", (action) => action.type === "decline_rez");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.rootRez === true &&
        action.payload?.cardId === upgradeId,
    );
    state = applyChoice(state, "runner", "pass");
    expect(state.run).toBeDefined();
    expect(state.timingPoint).toBe("run.jack_out_window");
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.timingPoint).toBe("access.resolve_card");
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(true);
    expect(state.eventLog.at(-2)?.publicPayload).toMatchObject({
      speedTrapUsed: false,
      successfulRunWithoutAccess: false,
    });
  });

  it("trashes fully-broken passed ice with Startup Immolator and revalidates the post-pass window", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-startup-immolator-trash-ice",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_startup_immolator_runner",
          name: "Spotcheck Startup Immolator Runner",
          cards: [
            { id: "onr_v1_068_startup-immolator", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_startup_immolator_corp",
          name: "Spotcheck Startup Immolator Corp",
          cards: [
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 20;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "simple_fracter");
    const startupImmolatorId = installRunnerProgramForTest(
      state,
      "onr_v1_068_startup-immolator",
    );
    putCorpRootInRemote(state, "simple_economy_asset");
    const iceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    state = passCorpApproachRezWindowIfOpen(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "pump_breaker" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "decline_rez" &&
        action.payload?.runRootRezPass === true,
    );
    const startupAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.runnerUtilityAbility ===
          "trash_fully_broken_passed_ice",
    );
    expect(startupAction.payload?.targetIceId).toBe(iceId);
    expect(startupAction.costs[0]?.credits).toBe(3);

    state = apply(
      state,
      "runner",
      (action) => action.actionId === startupAction.actionId,
    );
    expect(state.corp.archives).toContain(iceId);
    expect(
      state.corp.servers.find((server) => server.id === "remote_1")?.ice,
    ).not.toContain(iceId);
    expect(state.runner.heap).toContain(startupImmolatorId);
    expect(state.runner.rig.programs).not.toContain(startupImmolatorId);
    expect(state.runner.credits).toBe(15);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.runnerUtilityAbility ===
            "trash_fully_broken_passed_ice",
      ),
    ).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      runnerUtilityAbility: "trash_fully_broken_passed_ice",
      abilityKind: "trash_fully_broken_passed_ice",
      rezCostPaid: 3,
      trashedCardDefinitionId: "simple_barrier_ice",
      trashedCount: 1,
      sourceAbilityExhausted: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("backs up hosted programs on Microtech Backup Drive and returns the top hosted card", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-microtech-backup-drive",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "spotcheck_microtech_backup_runner",
          name: "Spotcheck Microtech Backup Runner",
          cards: [
            { id: "onr_v1_069_succubus", quantity: 1 },
            { id: "onr_v1_036_jackhammer", quantity: 1 },
            { id: "onr_v1_131_microtech-backup-drive", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "spotcheck_microtech_backup_corp",
          name: "Spotcheck Microtech Backup Corp",
          cards: [
            { id: "onr_v1_233_d-arc-knight", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
      }),
    );
    state.runner.credits = 30;
    state.runner.clicks = 10;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_131_microtech-backup-drive");
    moveRunnerCardToGrip(state, "onr_v1_069_succubus");
    moveRunnerCardToGrip(state, "onr_v1_036_jackhammer");
    moveRunnerCardToGrip(state, "simple_fracter");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_131_microtech-backup-drive",
    );
    const microtechId = state.runner.rig.hardware.find(
      (id) =>
        state.cardInstances[id]?.definitionId ===
        "onr_v1_131_microtech-backup-drive",
    );
    expect(microtechId).toBeDefined();
    if (!microtechId) throw new Error("Missing Microtech Backup Drive");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_069_succubus",
    );
    const succubusId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_069_succubus",
    );
    expect(succubusId).toBeDefined();
    if (!succubusId) throw new Error("Missing Succubus");
    const hostedIds: CardInstanceId[] = [];
    for (const definitionId of ["onr_v1_036_jackhammer", "simple_fracter"]) {
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(state, action) === definitionId &&
          action.payload?.hostOnCardId === succubusId,
      );
      hostedIds.push(String(install.payload?.cardId ?? "") as CardInstanceId);
      state = apply(
        state,
        "runner",
        (action) => action.actionId === install.actionId,
      );
    }
    expect(hostedIds).toHaveLength(2);
    const memoryBeforeTrash = state.runner.memoryUsed;
    putCorpIceOnServer(state, "rd", "onr_v1_233_d-arc-knight");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_233_d-arc-knight",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.runner.heap).toContain(succubusId);
    for (const hostedId of hostedIds) {
      expect(state.runner.rig.programs).toContain(hostedId);
      expect(state.cardInstances[hostedId]?.hostedOn).toBe(microtechId);
      expect(state.runner.heap).not.toContain(hostedId);
    }
    expect(state.runner.memoryUsed).toBeLessThan(memoryBeforeTrash);

    const returnAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1922RunnerHardwareAbility ===
          "return_top_hosted_program",
    );
    const returnedId = String(returnAction.payload?.targetProgramId ?? "");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === returnAction.actionId,
    );
    expect(state.runner.grip).toContain(returnedId);
    expect(state.cardInstances[returnedId]?.hostedOn).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(returnedId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      v1922RunnerHardwareAbility: "return_top_hosted_program",
      returnedToGrip: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Newsgroup Filter and uses its side-safe credit action", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-newsgroup-filter-credit-action",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_newsgroup_filter",
          name: "O:NR V1.9.22 Newsgroup Filter",
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
    moveRunnerCardToGrip(state, "onr_v1_045_newsgroup-filter");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_045_newsgroup-filter",
    );
    expect(state.runner.credits).toBe(5);
    expect(state.runner.clicks).toBe(3);
    expect(state.runner.memoryUsed).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_045_newsgroup-filter",
      ),
    ).toBe(true);

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === action.source,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "gain_credit" &&
          action.payload?.cardImplementationAbility === "activated",
      ),
    ).toBe(false);
    expect(legal.payload).toMatchObject({
      cardId: legal.source,
      cardImplementationAbility: "activated",
      cardImplementationAbilityIndex: 0,
      cardImplementationAbilityTiming: "runner_main",
    });
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-newsgroup-filter-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-newsgroup-filter-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === legal.source,
    );

    expect(state.runner.credits).toBe(7);
    expect(state.runner.clicks).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      amount: 2,
      cardDefinitionId: "onr_v1_045_newsgroup-filter",
      cardImplementationAbility: "activated",
      sourceDefinitionId: "onr_v1_045_newsgroup-filter",
      gainedCredits: 2,
      runnerCreditsAfter: 7,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "runner",
          amount: 2,
          sourceDefinitionId: "onr_v1_045_newsgroup-filter",
          sourceTitle: "Newsgroup Filter",
          reason: "card_resolver",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"grip"|"hq"|"rd"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Shield and uses side-safe per-turn net damage prevention", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-shield-prevention",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.damagePrevention.runner,
          id: "onr_v1_runner_v1922_shield_prevention",
          name: "O:NR V1.9.22 Shield Prevention",
          cards: [
            { id: "onr_v1_061_shield", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.damagePrevention.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.damagePrevention.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_061_shield");

    const installLegal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_061_shield",
    );
    const wrongSideInstall = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: installLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-shield-install-wrong-side",
    });
    expect(wrongSideInstall.ok).toBe(false);
    if (!wrongSideInstall.ok)
      expect(wrongSideInstall.error.code).toBe("ERR_WRONG_SIDE");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_061_shield",
    );
    expect(
      state.runner.rig.programs.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toContain("onr_v1_061_shield");
    expect(
      getPlayerView(state, "corp").opponent.rig?.some(
        (card) => card.definitionId === "onr_v1_061_shield",
      ),
    ).toBe(true);

    putCorpIceOnServer(state, "rd", "onr_v1_258_neural-blade");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_258_neural-blade",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const preventionOptionId = getPlayerView(
      state,
      "runner",
    ).pendingChoice?.options.find((option) => option.id !== "pass")?.id;
    expect(preventionOptionId).toBeDefined();
    state = applyChoice(state, "runner", String(preventionOptionId));
    expect(state.runner.heap.length).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      preventedAmount: 1,
      damageAmount: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|"grip"/,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Corporate Retreat until Corp installs or rezzes another card", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_scored_agenda_credit_until_install_or_rez",
      name: "O:NR V1.9.22 Corporate Retreat",
      cards: [
        { id: "onr_v1_195_corporate-retreat", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-retreat",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_195_corporate-retreat");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_195_corporate-retreat" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_195_corporate-retreat",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_195_corporate-retreat",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "scored_agenda_credit_until_install_or_rez",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-retreat-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-retreat-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.agendaAbility === "scored_agenda_credit_until_install_or_rez",
    );
    expect(state.corp.credits).toBe(creditsBeforeAbility + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "gain_credit",
      cardDefinitionId: "onr_v1_195_corporate-retreat",
      agendaAbility: "scored_agenda_credit_until_install_or_rez",
      gainedCredits: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    moveCorpCardToHq(state, "simple_barrier_ice");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.agendaAbility === "scored_agenda_credit_until_install_or_rez",
      ),
    ).toBe(false);

    let rezState = createGameAfterSetup({
      seed: "v1922-corporate-retreat-rez-lock",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    rezState = apply(
      rezState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rezState.corp.credits = 40;
    rezState.corp.clicks = 40;
    rezState.corp.maxHandSize = 100;
    moveCorpCardToHq(rezState, "onr_v1_195_corporate-retreat");
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      rezState = apply(
        rezState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat",
      );
    }
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(rezState, action) === "onr_v1_195_corporate-retreat",
    );
    const rezRetreatId = rezState.corp.scoreArea.find(
      (cardId) =>
        rezState.cardInstances[cardId]?.definitionId ===
        "onr_v1_195_corporate-retreat",
    );
    expect(rezRetreatId).toBeDefined();
    putCorpIceOnServer(rezState, "rd", "simple_barrier_ice");
    rezState = apply(rezState, "corp", (action) => action.type === "end_turn");
    rezState = apply(
      rezState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    rezState = apply(
      rezState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(rezState, action) === "simple_barrier_ice",
    );
    if (rezRetreatId)
      expect(
        rezState.cardInstances[rezRetreatId]?.counters?.mark,
      ).toBeUndefined();
  });

  it("scores Data Fort Reclamation as a private HQ install sequence", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_data_fort_reclamation",
      name: "O:NR V1.9.22 Data Fort Reclamation",
      cards: [
        { id: "onr_v1_197_data-fort-reclamation", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "onr_v1_308_acme-savings-and-loan", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-data-fort-reclamation",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_197_data-fort-reclamation");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");
    const assetId = moveCorpCardToHq(state, "onr_v1_308_acme-savings-and-loan");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_197_data-fort-reclamation" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 4; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) ===
            "onr_v1_197_data-fort-reclamation",
      );
    }
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_197_data-fort-reclamation",
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 4,
    });
    const legal = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-choice-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-choice-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoices(state, "corp", [`card_${iceId}`, `card_${assetId}`]);

    const remote = state.corp.servers.find(
      (server) =>
        server.kind === "remote" &&
        server.ice.includes(iceId) &&
        server.root.includes(assetId),
    );
    expect(remote).toBeDefined();
    expect(state.cardInstances[iceId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverIce",
      serverId: remote?.id,
    });
    expect(state.cardInstances[assetId]?.zone).toMatchObject({
      side: "corp",
      zone: "serverRoot",
      serverId: remote?.id,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1922_data_fort_reclamation_install_sequence",
      selectedCount: 2,
      installedCount: 2,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 0,
      temporaryCreditsRemaining: 10,
      dataFortReclamationRezChoiceOpened: true,
      dataFortReclamationRezCandidateCount: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"|ACME/,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      visibility: "hidden_info_barrier",
      minSelections: 0,
      maxSelections: 2,
    });
    const rezChoice = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongRezSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezChoice.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${iceId}`],
      },
      idempotencyKey: "v1922-data-fort-rez-choice-wrong-side",
    });
    expect(wrongRezSide.ok).toBe(false);
    if (!wrongRezSide.ok)
      expect(wrongRezSide.error.code).toBe("ERR_WRONG_SIDE");

    state = applyChoices(state, "corp", [`card_${iceId}`]);
    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.cardInstances[assetId]?.rezzed).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneAction: "v1922_data_fort_reclamation_rez_sequence",
      selectedCount: 1,
      rezzedCount: 1,
      rezzedIceCount: 1,
      rezzedRootCount: 0,
      temporaryCreditsProvided: 10,
      temporaryCreditsSpent: 3,
      temporaryCreditsRemaining: 7,
      corpCreditsSpent: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"|ACME/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("scores Corporate War through a deterministic on-score credit threshold resolver", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_corporate_war",
      name: "O:NR V1.9.22 Corporate War",
      cards: [
        { id: "onr_v1_196_corporate-war", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_196_corporate-war");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_196_corporate-war",
      );
    }

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-corporate-war-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-corporate-war-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeScore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_196_corporate-war",
    );
    expect(state.corp.credits).toBe(creditsBeforeScore + 12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_196_corporate-war",
      scoreCreditSwingThresholdMet: true,
      onScoreGainCredits: 12,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 12,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_196_corporate-war",
          sourceTitle: "Corporate War",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let missState = createGameAfterSetup({
      seed: "v1922-corporate-war-threshold-miss",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    missState = apply(
      missState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    missState.corp.credits = 5;
    missState.corp.clicks = 20;
    moveCorpCardToHq(missState, "onr_v1_196_corporate-war");
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
    );
    for (let index = 0; index < 3; index += 1) {
      missState = apply(
        missState,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
      );
    }
    expect(missState.corp.credits).toBeLessThan(12);
    const missCreditsBeforeScore = missState.corp.credits;
    missState = apply(
      missState,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(missState, action) === "onr_v1_196_corporate-war",
    );
    expect(missState.corp.credits).toBe(0);
    expect(missState.eventLog.at(-1)?.publicPayload).toMatchObject({
      scoreCreditSwingThresholdMet: false,
      onScoreLostAllCredits: true,
      resolvedEffects: [
        expect.objectContaining({
          kind: "lose_credits",
          side: "corp",
          amount: missCreditsBeforeScore,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_196_corporate-war",
          sourceTitle: "Corporate War",
        }),
      ],
    });
  });

  it("scores Corporate Boon with Boon counters and spends one per turn for an action", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "v1922-corporate-boon-card-implementation",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "v1922_corporate_boon_corp",
          name: "O:NR V1.9.22 Corporate Boon",
        },
        agendaPointsToWin: 99,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    const agendaId = putCorpRootInRemote(state, "onr_v1_192_corporate-boon");
    state.cardInstances[agendaId]!.advancementCounters = 6;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
    );

    expect(state.cardInstances[agendaId]?.counters?.boon).toBe(4);
    const clicksBefore = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === agendaId &&
        action.payload?.cardImplementationSourceCounterType === "boon",
    );
    expect(state.cardInstances[agendaId]?.counters?.boon).toBe(3);
    expect(state.corp.clicks).toBe(clicksBefore + 1);
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === agendaId,
      ),
    ).toBe(false);
  });

  it("scores Security Purge as a side-safe R&D top-three install and trash resolver", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_security_purge",
      name: "O:NR V1.9.22 Security Purge",
      cards: [
        { id: "onr_v1_216_security-purge", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 1 },
        { id: "simple_code_gate_ice", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-security-purge",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    state.corp.clicks = 20;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_216_security-purge");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_216_security-purge" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_216_security-purge",
      );
    }
    const trashedOperationId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    const installedCodeGateId = putCorpCardOnTopOfRd(
      state,
      "simple_code_gate_ice",
    );
    const installedBarrierId = putCorpCardOnTopOfRd(
      state,
      "simple_barrier_ice",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_216_security-purge",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-security-purge-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-security-purge-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_216_security-purge",
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_option",
      minSelections: 2,
      maxSelections: 2,
      visibility: "hidden_info_barrier",
    });
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "corp").pendingChoice?.options.length).toBe(
      10,
    );
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedBarrierId),
      ),
    ).toBe(false);
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedCodeGateId),
      ),
    ).toBe(false);
    expect(state.corp.archives).not.toContain(trashedOperationId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "score_agenda",
      cardDefinitionId: "onr_v1_216_security-purge",
      agendaAbility: "v1922_security_purge",
      hiddenZoneAction: "v1922_security_purge_rd_top3_target_choice",
      revealedCount: 3,
      revealedIceCount: 2,
      pendingTrashCount: 1,
      installedIceCount: 0,
      trashedCount: 0,
      securityPurgeInstallContract: "corp_server_choice_per_ice",
      securityPurgeTargetChoiceOpened: true,
      publicRevealDefinitionIds:
        "simple_barrier_ice,simple_code_gate_ice,simple_economy_operation",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const resolveLegal = mustAction(
      state,
      "corp",
      (action) => action.type === "resolve_choice",
    );
    const wrongSideResolve = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-resolve-wrong-side",
    });
    expect(wrongSideResolve.ok).toBe(false);
    if (!wrongSideResolve.ok)
      expect(wrongSideResolve.error.code).toBe("ERR_WRONG_SIDE");

    const staleResolve = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolveLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: { choiceId: state.pendingChoice?.choiceId },
      idempotencyKey: "v1922-security-purge-resolve-stale",
    });
    expect(staleResolve.ok).toBe(false);
    if (!staleResolve.ok)
      expect(staleResolve.error.code).toBe("ERR_STALE_STATE");

    const rdOption = state.pendingChoice?.options.find(
      (option) => option.value === `${installedBarrierId}|rd`,
    );
    const newRemoteOption = state.pendingChoice?.options.find(
      (option) => option.value === `${installedCodeGateId}|new_remote`,
    );
    expect(rdOption).toBeDefined();
    expect(newRemoteOption).toBeDefined();
    state = applyChoices(state, "corp", [rdOption!.id, newRemoteOption!.id]);

    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedBarrierId),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.some((server) =>
        server.ice.includes(installedCodeGateId),
      ),
    ).toBe(true);
    expect(
      state.corp.servers.find((server) => server.id === "rd")?.ice,
    ).toContain(installedBarrierId);
    const createdRemote = state.corp.servers.find(
      (server) =>
        server.kind === "remote" && server.ice.includes(installedCodeGateId),
    );
    expect(createdRemote).toBeDefined();
    expect(state.cardInstances[installedBarrierId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
    });
    expect(state.cardInstances[installedCodeGateId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: {
        side: "corp",
        zone: "serverIce",
        serverId: createdRemote?.id,
      },
    });
    expect(state.corp.archives).toContain(trashedOperationId);
    expect(state.cardInstances[trashedOperationId]).toMatchObject({
      faceup: true,
      zone: { side: "corp", zone: "archives" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      agendaAbility: "v1922_security_purge",
      hiddenZoneAction: "v1922_security_purge_install_targets",
      revealedCount: 3,
      revealedIceCount: 2,
      installedIceCount: 2,
      trashedCount: 1,
      securityPurgeInstallContract: "corp_server_choice_per_ice",
      securityPurgeTargetChoiceResolved: true,
      publicRevealDefinitionIds:
        "simple_barrier_ice,simple_code_gate_ice,simple_economy_operation",
      installedIceDefinitionIds: "simple_barrier_ice,simple_code_gate_ice",
      installedIceServerLabels: `R&D,${createdRemote?.label}`,
      trashedDefinitionIds: "simple_economy_operation",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Political Overthrow as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_political_overthrow",
      name: "O:NR V1.9.22 Political Overthrow",
      cards: [
        { id: "onr_v1_210_political-overthrow", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-political-overthrow",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_210_political-overthrow");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 9; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
    );
    expect(legal.costs).toEqual([{ clicks: 1 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-political-overthrow-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-political-overthrow-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_210_political-overthrow",
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_210_political-overthrow",
      cardImplementationAbility: "activated",
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_210_political-overthrow",
          sourceTitle: "Political Overthrow",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Marine Arcology as a side-safe scored-agenda action for Gain 3", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_marine_arcology",
      name: "O:NR V1.9.22 Marine Arcology",
      cards: [
        { id: "onr_v1_206_marine-arcology", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-marine-arcology",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 40;
    state.corp.maxHandSize = 100;

    moveCorpCardToHq(state, "onr_v1_206_marine-arcology");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology" &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    for (let index = 0; index < 3; index += 1) {
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "advance_card" &&
          sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
      );
    }
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
      ),
    ).toBe(false);
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
    );
    expect(legal.costs).toEqual([{ clicks: 2 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-marine-arcology-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-marine-arcology-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const lowClicks = structuredClone(state);
    lowClicks.corp.clicks = 1;
    const lowClickResult = applyAction(lowClicks, {
      matchId: lowClicks.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: lowClicks.stateVersion,
      idempotencyKey: "v1922-marine-arcology-low-clicks",
    });
    expect(lowClickResult.ok).toBe(false);
    expect(lowClicks.corp.credits).toBe(state.corp.credits);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAbility = state.corp.credits;
    const clicksBeforeAbility = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_206_marine-arcology",
    );

    expect(state.corp.credits).toBe(creditsBeforeAbility + 3);
    expect(state.corp.clicks).toBe(clicksBeforeAbility - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
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
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Off-Site Backups as a private Archives-to-HQ choice", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_off_site_backups",
      name: "O:NR V1.9.22 Off-Site Backups",
      cards: [
        { id: "onr_v1_296_off-site-backups", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-off-site-backups",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_296_off-site-backups");
    const faceupArchiveId = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownArchiveId = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_296_off-site-backups",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-off-site-backups-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-off-site-backups-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_296_off-site-backups",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_296_off-site-backups",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Off-Site Backups choice");
    const selectedOption = pendingChoice.options.find(
      (option) => option.value === facedownArchiveId,
    );
    expect(selectedOption).toBeDefined();
    if (!selectedOption) throw new Error("Missing facedown archive option");
    state = applyChoices(state, "corp", [selectedOption.id]);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.hq[0]).toBe(facedownArchiveId);
    expect(state.corp.archives).toContain(faceupArchiveId);
    expect(state.corp.archives).not.toContain(facedownArchiveId);
    expect(state.corp.archives).toHaveLength(2);
    expect(state.cardInstances[facedownArchiveId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_archives_to_hq",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"|simple_economy/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Planning Consultants as a private R&D top-five reorder choice", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_planning_consultants",
      name: "O:NR V1.9.22 Planning Consultants",
      cards: [
        { id: "onr_v1_298_planning-consultants", quantity: 1 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-planning-consultants",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_298_planning-consultants");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    putCorpCardOnTopOfRd(state, "simple_agenda");
    putCorpCardOnTopOfRd(state, "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(state, "onr_v1_205_main-office-relocation");
    putCorpCardOnTopOfRd(state, "onr_v1_324_fortress-architects");

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_298_planning-consultants",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-planning-consultants-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-planning-consultants-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_298_planning-consultants",
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(state.pendingChoice?.options).toHaveLength(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_298_planning-consultants",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const pendingChoice = state.pendingChoice;
    expect(pendingChoice).toBeDefined();
    if (!pendingChoice) throw new Error("Missing Planning Consultants choice");
    const selectedOptionIds = pendingChoice.options
      .slice()
      .reverse()
      .map((option) => option.id);
    const expectedTop = selectedOptionIds.map((optionId) =>
      String(
        pendingChoice.options.find((option) => option.id === optionId)?.value,
      ),
    );
    state = applyChoices(state, "corp", selectedOptionIds);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.rd.slice(0, expectedTop.length)).toEqual(expectedTop);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 5,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("plays Edgerunner, Inc., Temps as a consecutive Corp install-only action bundle", () => {
    const corpDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
      id: "onr_v1_corp_v1922_edgerunner_temps",
      name: "O:NR V1.9.22 Edgerunner Temps",
      cards: [
        { id: "onr_v1_289_edgerunner-inc-temps", quantity: 1 },
        { id: "simple_barrier_ice", quantity: 2 },
        ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
      ],
    };
    let state = createGameAfterSetup({
      seed: "v1922-edgerunner-temps",
      runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
      corpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 10;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_289_edgerunner-inc-temps");
    const iceId = moveCorpCardToHq(state, "simple_barrier_ice");

    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_289_edgerunner-inc-temps",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-edgerunner-temps-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-edgerunner-temps-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_289_edgerunner-inc-temps",
    );
    expect(state.corp.clicks).toBe(12);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(3);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toMatchObject({
      side: "corp",
      sourceDefinitionId: "onr_v1_289_edgerunner-inc-temps",
      actionType: "install_card",
      remainingActions: 3,
      costProfile: "extra_click",
      cleanupTiming: "side_turn_end",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_289_edgerunner-inc-temps",
      v1922CorpOperationAbility: "install_action_bundle",
      gainedActions: 3,
      edgerunnerTempsInstallActionsRemaining: 3,
      corpClicksAfter: 12,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );

    const bundleActions = getLegalActions(state, "corp");
    expect(
      bundleActions.some(
        (action) => action.type === "install_card" && action.source === iceId,
      ),
    ).toBe(true);
    expect(
      bundleActions.every(
        (action) =>
          action.type === "install_card" || action.type === "end_turn",
      ),
    ).toBe(true);
    expect(
      bundleActions.some(
        (action) =>
          action.type === "gain_credit" ||
          action.type === "draw_card" ||
          action.type === "play_operation" ||
          action.type === "advance_card",
      ),
    ).toBe(false);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === iceId &&
        action.payload?.placement === "ice",
    );
    expect(
      state.corp.servers.some((server) => server.ice.includes(iceId)),
    ).toBe(true);
    expect(state.corpTurnFlags?.edgerunnerTempsInstallActionsRemaining).toBe(2);
    expect(
      state.corpTurnFlags?.restrictedActionGrants?.edgerunner_temps_install,
    ).toMatchObject({ remainingActions: 2 });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      v1922CorpOperationAbility: "install_action_bundle",
      edgerunnerTempsInstallActionSpent: true,
      edgerunnerTempsInstallActionsRemaining: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"hq"|"rd"|"cardInstances"|"privatePayload"/,
    );
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Zombie as core-damage ICE with replay-stable public run resolution", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-zombie",
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_zombie",
          name: "O:NR V1.9.22 Zombie Corp",
          cards: [
            { id: "onr_v1_280_zombie", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 20;
    state.runner.credits = 5;
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_280_zombie");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezLegal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_280_zombie",
    );
    expect(rezLegal.costs[0]?.credits).toBe(9);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-zombie-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: rezLegal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-zombie-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === iceId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.runner.coreDamage).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      result: "ended",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Tutor and adds a breakable end-the-run subroutine to later ice", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-tutor-future-etr",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_tutor_hammer",
          name: "O:NR V1.9.22 Tutor Hammer Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_tutor",
          name: "O:NR V1.9.22 Tutor Corp",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const wallId = putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.futureEncounterEndTheRunSourceIceId).toBe(tutorId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      v1922CorpIceAbility: "tutor_future_end_the_run_subroutine",
      sourceDefinitionId: "onr_v1_274_tutor",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunAction(state);

    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    state = enterEncounterFromMovementWindow(state);
    const breakActions = getLegalActions(state, "runner").filter(
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    expect(
      breakActions.map((action) => action.payload?.subroutineIndex),
    ).toEqual([0, 1]);
    const tutorEtr = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 1,
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-tutor-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: tutorEtr.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-tutor-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === tutorEtr.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Virizz and applies a rest-of-run break-cost modifier without release promotion", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-virizz-break-cost-modifier",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_virizz_hammer",
          name: "O:NR V1.9.22 Virizz Hammer Runner",
          cards: [
            { id: "onr_v1_031_hammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_virizz",
          name: "O:NR V1.9.22 Virizz Corp",
          cards: [
            { id: "onr_v1_277_virizz", quantity: 1 },
            { id: "onr_v1_279_wall-of-static", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_031_hammer");
    const innerWallId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_279_wall-of-static",
    );
    const virizzId = putCorpIceOnServer(state, "rd", "onr_v1_277_virizz");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer",
    );
    const hammerId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "onr_v1_031_hammer",
    );
    expect(hammerId).toBeDefined();
    if (!hammerId) throw new Error("Missing installed Hammer");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === virizzId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run?.breakSubroutineAdditionalCost).toBe(1);
    const virizzModifierState = structuredClone(state);
    const virizzModifierHash = hashState(state);
    const virizzModifiers = collectActiveModifiers(state);
    expect(state).toEqual(virizzModifierState);
    expect(hashState(state)).toBe(virizzModifierHash);
    expect(
      virizzModifiers.filter(
        (modifier) => modifier.kind === "break_subroutine_cost",
      ),
    ).toEqual([
      expect.objectContaining({
        sourceDefinitionId: "onr_v1_277_virizz",
        kind: "break_subroutine_cost",
        side: "runner",
        amount: 1,
        duration: "run",
        target: { kind: "run" },
        visibility: "public",
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      v1922CorpIceAbility: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      sourceDefinitionId: "onr_v1_277_virizz",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunAction(state);

    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === innerWallId,
    );
    state = enterEncounterFromMovementWindow(state);
    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_031_hammer" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(legal.costs[0]?.credits).toBe(2);
    expect(legal.payload).toMatchObject({
      breakSubroutineBaseCost: 1,
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
      v1922CorpIceAbility: "virizz_break_cost_modifier",
    });
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-virizz-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-virizz-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );
    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.runner.credits).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_031_hammer",
      v1922CorpIceAbility: "virizz_break_cost_modifier",
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    state = continueRunThroughMovement(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(
      collectActiveModifiers(state).some(
        (modifier) => modifier.kind === "break_subroutine_cost",
      ),
    ).toBe(false);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Haunting Inquisition and locks normal runs for the next six Runner actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-haunting-inquisition-run-lock",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_haunting",
          name: "O:NR V1.9.22 Haunting Runner",
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_haunting",
          name: "O:NR V1.9.22 Haunting Corp",
          cards: [
            { id: "onr_v1_247_haunting-inquisition", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.corp.credits = 20;
    const hauntingId = putCorpIceOnServer(
      state,
      "rd",
      "onr_v1_247_haunting-inquisition",
    );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === hauntingId,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-haunting-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-haunting-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(6);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      v1922CorpIceAbility: "haunting_inquisition_run_lock",
      runLockActionsAdded: 6,
      runLockActionsPending: 6,
      sourceDefinitionId: "onr_v1_247_haunting-inquisition",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);

    for (let index = 0; index < 3; index += 1) {
      state = apply(state, "runner", (action) => action.type === "gain_credit");
    }
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(3);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(3);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);

    for (let index = 0; index < 3; index += 1) {
      state = apply(state, "runner", (action) => action.type === "gain_credit");
    }
    expect(state.runnerTurnFlags?.runLockActionsPending).toBe(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      ),
    ).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("rezzes Viral 15 and gates pass-ice program trash behind a paid jack-out window", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-viral-15-program-trash",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: MECHANIC_SMOKE_DECKS.globalModifiers.runner,
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_viral_15",
          name: "O:NR V1.9.22 Viral 15 Corp",
          cards: [
            { id: "onr_v1_276_viral-15", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    moveRunnerCardToGrip(state, "simple_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "simple_fracter",
    );
    const programId = state.runner.rig.programs.find(
      (id) => state.cardInstances[id]?.definitionId === "simple_fracter",
    );
    expect(programId).toBeDefined();
    if (!programId) throw new Error("Missing installed program");
    const viralId = putCorpIceOnServer(state, "rd", "onr_v1_276_viral-15");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === viralId,
    );
    const continueAction = mustAction(
      state,
      "runner",
      (action) => action.type === "continue_run",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "v1922-viral-15-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: continueAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "v1922-viral-15-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === continueAction.actionId,
    );
    expect(state.run?.passRezzedIceProgramTrashSourceIceId).toBe(viralId);
    expect(state.run?.passRezzedIceProgramTrashPendingPassedIceId).toBe(
      viralId,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      jackOutAdditionalCost: 1,
      sourceDefinitionId: "onr_v1_276_viral-15",
      passIceTrashProgramPrompt: true,
    });

    const jackOut = mustAction(
      state,
      "runner",
      (action) => action.type === "jack_out",
    );
    expect(jackOut.costs[0]?.credits).toBe(1);
    const jackOutBranch = apply(
      state,
      "runner",
      (action) => action.actionId === jackOut.actionId,
    );
    expect(jackOutBranch.run).toBeUndefined();
    expect(jackOutBranch.runner.rig.programs).toContain(programId);
    expect(jackOutBranch.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "jack_out",
      jackOutAdditionalCost: 1,
      runnerCreditsAfter: state.runner.credits - 1,
    });

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.pendingChoice?.source).toContain(
      "p3_56.pass_ice_program_trash",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").pendingChoice?.options).toHaveLength(
      1,
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      hiddenZoneBarrier: true,
      passIceTrashProgramPrompt: true,
      passIceTrashProgramCandidateCount: 1,
    });

    state = applyChoice(state, "runner", `card_${programId}`);
    expect(state.runner.heap).toContain(programId);
    expect(state.runner.rig.programs).not.toContain(programId);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hiddenZoneBarrier: true,
      passIceTrashProgramPrompt: false,
      programTrashCount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("preserves Krash and Cyfermaster when Runner pays Viral 15 jack-out on R&D after Tutor", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1922-viral-15-rd-tutor-jack-out",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "onr_v1_runner_v1922_viral_15_krash_cyfermaster",
          name: "O:NR V1.9.22 Viral 15 Krash Cyfermaster Runner",
          cards: [
            { id: "onr_v1_039_krash", quantity: 1 },
            { id: "onr_v1_016_cyfermaster", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards,
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "onr_v1_corp_v1922_viral_15_tutor_rd",
          name: "O:NR V1.9.22 Viral 15 Tutor R&D Corp",
          cards: [
            { id: "onr_v1_274_tutor", quantity: 1 },
            { id: "onr_v1_276_viral-15", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 7;
    state.runner.clicks = 4;
    state.runner.memoryLimit = 4;
    state.corp.credits = 20;
    const krashId = installRunnerProgramForTest(state, "onr_v1_039_krash");
    const cyfermasterId = installRunnerProgramForTest(
      state,
      "onr_v1_016_cyfermaster",
    );
    const viralId = putCorpIceOnServer(state, "rd", "onr_v1_276_viral-15");
    const tutorId = putCorpIceOnServer(state, "rd", "onr_v1_274_tutor");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === tutorId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_016_cyfermaster",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = continueRunAction(state);
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === viralId,
    );
    state = enterEncounterFromMovementWindow(state);
    state = apply(state, "runner", (action) => action.type === "continue_run");

    const jackOut = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "jack_out" &&
        action.payload?.v1922CorpIceAbility === "viral_15_jack_out_tax",
    );
    expect(jackOut.costs[0]?.credits).toBe(1);
    expect(state.runner.credits).toBe(5);
    expect(state.runner.rig.programs).toEqual(
      expect.arrayContaining([krashId, cyfermasterId]),
    );

    state = apply(
      state,
      "runner",
      (action) => action.actionId === jackOut.actionId,
    );
    expect(state.run).toBeUndefined();
    expect(state.runner.credits).toBe(4);
    expect(state.runner.rig.programs).toEqual(
      expect.arrayContaining([krashId, cyfermasterId]),
    );
    expect(state.runner.heap).not.toContain(krashId);
    expect(state.runner.heap).not.toContain(cyfermasterId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "jack_out",
      v1922CorpIceAbility: "viral_15_jack_out_tax",
      jackOutAdditionalCost: 1,
      runnerCreditsAfter: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"cardInstances"|"privatePayload"/,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps V1.9.22 Corp longtail runtime WIPs out of release promotion until gates close", () => {
    const corpLongtailIds = ["onr_v1_276_viral-15"] as const;

    for (const definitionId of corpLongtailIds) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
    }
    for (const definitionId of [
      "onr_v1_195_corporate-retreat",
      "onr_v1_196_corporate-war",
      "onr_v1_197_data-fort-reclamation",
      "onr_v1_206_marine-arcology",
      "onr_v1_210_political-overthrow",
      "onr_v1_216_security-purge",
      "onr_v1_247_haunting-inquisition",
      "onr_v1_280_zombie",
      "onr_v1_274_tutor",
      "onr_v1_277_virizz",
      "onr_v1_289_edgerunner-inc-temps",
      "onr_v1_296_off-site-backups",
      "onr_v1_298_planning-consultants",
    ] as const) {
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.implementationStatus,
        definitionId,
      ).toBe("playable_mvp");
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.rulesText,
        definitionId,
      ).not.toContain("WIP");
      expect(
        DEMO_CARDS_BY_ID[definitionId]?.mechanics.join(" "),
        definitionId,
      ).toContain("per_card_longtail");
    }
  });
});
