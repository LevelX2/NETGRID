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

describe("Proteus Visible Baseline", () => {
  const TOUGHONIUM = "onr_proteus_041_toughoniumtm-wall";
  const NETWORKED_CENTER = "onr_proteus_065_networked-center";
  const RESEARCH_BUNKER = "onr_proteus_072_research-bunker";
  const WEAPONS_DEPOT = "onr_proteus_077_weapons-depot";
  const STREETWARE_DISTRIBUTOR = "onr_proteus_150_streetware-distributor";
  const CORTICAL_CYBERMODEM = "onr_proteus_134_cortical-cybermodem";
  const DECK_THE = "onr_proteus_138_deck-the";
  const SUNBURST_CRANIAL_INTERFACE =
    "onr_proteus_151_sunburst-cranial-interface";
  const hiddenPayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("rezzes Toughonium Wall through public ICE paths with revalidation and replay coverage", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "proteus-visible-baseline-toughonium",
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: "proteus_visible_baseline_runner",
          name: "Proteus Visible Baseline Runner",
          cards: [...ONR_V1_1_2K_RUNNER_DECK.cards],
        },
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: "proteus_visible_baseline_corp",
          name: "Proteus Visible Baseline Corp",
          cards: [
            { id: TOUGHONIUM, quantity: 1 },
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.corp.credits = 20;
    const iceId = putCorpIceOnServer(state, "rd", TOUGHONIUM);

    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && sourceDefinition(state, action) === TOUGHONIUM,
    );
    expect(rezAction.costs).toEqual([{ credits: 13 }]);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: rezAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-toughonium-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: rezAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "proteus-toughonium-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const lowCredits = structuredClone(state);
    lowCredits.corp.credits = 12;
    const costRejected = applyAction(lowCredits, {
      matchId: lowCredits.matchId,
      side: "corp",
      actionId: rezAction.actionId,
      clientKnownStateVersion: lowCredits.stateVersion,
      idempotencyKey: "proteus-toughonium-cost",
    });
    expect(costRejected.ok).toBe(false);
    if (!costRejected.ok)
      expect(["ERR_UNKNOWN_ACTION", "ERR_ILLEGAL_ACTION"]).toContain(
        costRejected.error.code,
      );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "corp", (action) => action.actionId === rezAction.actionId);

    expect(state.cardInstances[iceId]?.rezzed).toBe(true);
    expect(state.corp.credits).toBe(7);
    expect(state.run?.encounteredIceId).toBe(iceId);
    expect(
      cardImplementationForDefinitionId(TOUGHONIUM)?.printedSubroutines,
    ).toHaveLength(4);
    expect(
      DEMO_CARDS_BY_ID[TOUGHONIUM]?.subroutines?.every(
        (subroutine) => subroutine.type === "end_the_run",
      ),
    ).toBe(true);

    const runnerViewIce = getPlayerView(state, "runner").run?.encounteredIce;
    expect(runnerViewIce).toMatchObject({
      definitionId: TOUGHONIUM,
      title: "Toughonium™ Wall",
      rezzed: true,
      rezCost: 13,
      strength: 7,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Proteus Phase 1a region agenda-difficulty modifiers only in the same fort", () => {
    const regionCases = [
      {
        regionId: NETWORKED_CENTER,
        agendaId: "onr_v1_202_genetics-visionary-acquisition",
        subtype: "gray_ops",
      },
      {
        regionId: RESEARCH_BUNKER,
        agendaId: "onr_v1_189_artificial-security-directors",
        subtype: "research",
      },
      {
        regionId: WEAPONS_DEPOT,
        agendaId: "onr_v1_198_detroit-police-contract",
        subtype: "black_ops",
      },
    ] as const;

    for (const { regionId, agendaId, subtype } of regionCases) {
      let state = createGameAfterSetup({
        seed: `proteus-phase-1a-region-${subtype}`,
        runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
        corpDeck: {
          ...ONR_V1_1_2K_CORP_DECK,
          id: `proteus_phase_1a_region_${subtype}`,
          name: "Proteus Phase 1a Region Corp",
          cards: [
            { id: regionId, quantity: 1 },
            { id: agendaId, quantity: 1 },
            ...ONR_V1_1_2K_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      });
      state = apply(state, "corp", (action) => action.type === "mandatory_draw");
      state.corp.credits = 20;
      state.corp.clicks = 10;
      const regionInstanceId = putCorpRootInRemote(state, regionId);
      const agendaInstanceId = putCorpRootInRemote(state, agendaId);
      const printedDifficulty =
        DEMO_CARDS_BY_ID[agendaId]?.advancementRequirement ?? 0;
      state.cardInstances[agendaInstanceId] = {
        ...state.cardInstances[agendaInstanceId]!,
        advancementCounters: printedDifficulty - 1,
      };
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "score_agenda" &&
            action.payload?.cardId === agendaInstanceId,
        ),
      ).toBe(false);

      state.cardInstances[regionInstanceId] = {
        ...state.cardInstances[regionInstanceId]!,
        faceup: true,
        rezzed: true,
      };
      const scoreAction = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "score_agenda" &&
          action.payload?.cardId === agendaInstanceId,
      );
      expect(
        collectActiveModifiers(state).filter(
          (modifier) =>
            modifier.kind === "agenda_difficulty" &&
            modifier.sourceDefinitionId === regionId,
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
      stale.cardInstances[regionInstanceId] = {
        ...stale.cardInstances[regionInstanceId]!,
        faceup: false,
        rezzed: false,
      };
      expect(
        applyAction(stale, {
          matchId: stale.matchId,
          side: "corp",
          actionId: scoreAction.actionId,
          clientKnownStateVersion: stale.stateVersion,
          idempotencyKey: `proteus-phase-1a-region-stale-${subtype}`,
        }).ok,
      ).toBe(false);

      const otherFort = structuredClone(state);
      otherFort.corp.servers.push({
        id: "remote_2",
        kind: "remote",
        label: "Remote 2",
        ice: [],
        root: [agendaInstanceId],
      });
      const remoteOne = otherFort.corp.servers.find(
        (server) => server.id === "remote_1",
      );
      if (!remoteOne) throw new Error("remote_1 missing");
      remoteOne.root = remoteOne.root.filter((id) => id !== agendaInstanceId);
      otherFort.cardInstances[agendaInstanceId] = {
        ...otherFort.cardInstances[agendaInstanceId]!,
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_2" },
      };
      expect(
        getLegalActions(otherFort, "corp").some(
          (action) =>
            action.type === "score_agenda" &&
            action.payload?.cardId === agendaInstanceId,
        ),
      ).toBe(false);
    }
  });

  it("uses Streetware Distributor hosted credits through LegalActions and replay-safe start-turn lifecycle", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "proteus-phase-1a-streetware",
        runnerDeck: {
          ...ONR_V1_1_2K_RUNNER_DECK,
          id: "proteus_phase_1a_streetware_runner",
          name: "Proteus Phase 1a Streetware Runner",
          cards: [
            { id: STREETWARE_DISTRIBUTOR, quantity: 1 },
            ...ONR_V1_1_2K_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_1_2K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.clicks = 4;
    state.runner.credits = 5;
    const streetwareId = installRunnerResourceForTest(
      state,
      STREETWARE_DISTRIBUTOR,
    );
    const loadAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === streetwareId,
    );
    expect(loadAction.costs).toEqual([{ clicks: 1 }]);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: loadAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-streetware-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: loadAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "proteus-streetware-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(
      state,
      "runner",
      (action) => action.actionId === loadAction.actionId,
    );
    expect(cardCounterAmount(state, streetwareId, "bit")).toBe(3);
    expect(state.runner.credits).toBe(5);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: STREETWARE_DISTRIBUTOR,
      hostedCreditsAdded: 3,
      hostedCreditsAfter: 3,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeStart = state.runner.credits;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = toRunnerTurn(state);

    expect(cardCounterAmount(state, streetwareId, "bit")).toBe(2);
    expect(state.runner.credits).toBe(creditsBeforeStart + 1);
    expect(
      state.eventLog
        .slice(replayStart)
        .flatMap((event) => event.publicPayload.resolvedEffects ?? [])
        .some(
          (effect) =>
            (effect as { sourceDefinitionId?: string }).sourceDefinitionId ===
            STREETWARE_DISTRIBUTOR,
        ),
    ).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("installs Deck, The as a public hardware deck and uses its trace link abilities", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "proteus-phase-7a-deck-the",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner,
          id: "proteus_phase_7a_deck_runner",
          name: "Proteus Phase 7a Deck Runner",
          cards: [
            { id: DECK_THE, quantity: 1 },
            { id: "onr_v1_137_parraline-5750", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner.cards,
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.programSubtypeHosting.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 30;
    state.corp.credits = 8;
    const oldDeckId = moveRunnerCardToGrip(
      state,
      "onr_v1_137_parraline-5750",
    );
    const deckId = moveRunnerCardToGrip(state, DECK_THE);
    const memoryBefore =
      getPlayerView(state, "runner").own.memoryLimit ?? state.runner.memoryLimit;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === oldDeckId,
    );
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 1,
    );

    const installDeck = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === deckId,
    );
    expect(installDeck.costs).toEqual([{ clicks: 1, credits: 11 }]);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: installDeck.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "proteus-deck-the-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: installDeck.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "proteus-deck-the-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const lowCredits = structuredClone(state);
    lowCredits.runner.credits = 10;
    const rejectedCost = applyAction(lowCredits, {
      matchId: lowCredits.matchId,
      side: "runner",
      actionId: installDeck.actionId,
      clientKnownStateVersion: lowCredits.stateVersion,
      idempotencyKey: "proteus-deck-the-cost",
    });
    expect(rejectedCost.ok).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === installDeck.actionId,
    );
    expect(state.runner.heap).toContain(oldDeckId);
    expect(state.runner.rig.hardware).not.toContain(oldDeckId);
    expect(state.runner.rig.hardware).toContain(deckId);
    expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
      memoryBefore + 1,
    );
    expect(cardImplementationForDefinitionId(DECK_THE)).toMatchObject({
      hardwareDeck: true,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: DECK_THE,
      deckUniqueReplacement: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      hiddenPayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    putCorpIceOnServer(state, "rd", "onr_v1_246_fragmentation-storm");
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_246_fragmentation-storm",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const beforeBaseCredits = state.runner.credits;
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(state, DECK_THE, "trace_base_link_"),
    );
    expect(state.runner.credits).toBe(beforeBaseCredits);
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 5,
      baseLinkValue: 5,
    });
    state = applyChoice(state, "runner", "bid_0");
    expect(state.trace).toMatchObject({ status: "post_bid_link" });
    const beforePumpCredits = state.runner.credits;
    state = applyChoice(
      state,
      "runner",
      traceChoiceOptionIdForDefinition(state, DECK_THE, "trace_link_"),
    );
    expect(state.runner.credits).toBe(beforePumpCredits - 1);
    expect(state.trace).toMatchObject({
      status: "post_bid_link",
      runnerLink: 6,
      postBidLinkBonus: 1,
    });
    state = applyChoice(state, "runner", "pass");
    expect(state.trace).toBeUndefined();
    expect(validateGameState(state).ok).toBe(true);
  });

  it("uses Proteus Phase 7b deck bits for icebreaker costs and noisy restrictions", () => {
    for (const [
      definitionId,
      expectedCost,
      expectedMu,
      expectedHandSize,
      expectedBits,
      expectedAfterPump,
    ] of [
      [CORTICAL_CYBERMODEM, 11, 2, 2, 2, 1],
      [SUNBURST_CRANIAL_INTERFACE, 5, 1, 1, 1, 0],
    ] as const) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `proteus-phase-7b-${definitionId}`,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `proteus_phase_7b_${definitionId}_runner`,
            name: "Proteus Phase 7b Deck Runner",
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
            id: `proteus_phase_7b_${definitionId}_corp`,
            name: "Proteus Phase 7b Deck Corp",
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
      const iceId = putCorpIceOnServer(state, "rd", "simple_code_gate_ice");
      const memoryBefore =
        getPlayerView(state, "runner").own.memoryLimit ?? state.runner.memoryLimit;
      const handSizeBefore = getPlayerView(state, "runner").own.maxHandSize;
      const installDeck = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === deckId,
      );
      expect(installDeck.costs).toEqual([
        { clicks: 1, credits: expectedCost },
      ]);

      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: installDeck.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `proteus-phase-7b-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok).toBe(false);
      if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: installDeck.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `proteus-phase-7b-${definitionId}-stale`,
      });
      expect(stale.ok).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

      const lowCredits = structuredClone(state);
      lowCredits.runner.credits = expectedCost - 1;
      const rejectedCost = applyAction(lowCredits, {
        matchId: lowCredits.matchId,
        side: "runner",
        actionId: installDeck.actionId,
        clientKnownStateVersion: lowCredits.stateVersion,
        idempotencyKey: `proteus-phase-7b-${definitionId}-cost`,
      });
      expect(rejectedCost.ok).toBe(false);

      const installInitial = structuredClone(state);
      const installReplayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) => action.actionId === installDeck.actionId,
      );
      expect(getPlayerView(state, "runner").own.memoryLimit).toBe(
        memoryBefore + expectedMu,
      );
      expect(getPlayerView(state, "runner").own.maxHandSize).toBe(
        handSizeBefore + expectedHandSize,
      );
      expect(cardCounterAmount(state, deckId, "bit")).toBe(expectedBits);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "install_card",
        cardDefinitionId: definitionId,
        hostedCreditsAdded: expectedBits,
        counterType: "bit",
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        hiddenPayloadMarkers,
      );
      const installReplay = replayEvents(
        installInitial,
        state.eventLog.slice(installReplayStart),
      );
      expect(installReplay.ok).toBe(true);
      expect(hashState(installReplay.state)).toBe(hashState(state));

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

    let noisyState = toRunnerTurn(
      createGameAfterSetup({
        seed: "proteus-phase-7b-sunburst-noisy-negative",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
          id: "proteus_phase_7b_sunburst_noisy_runner",
          name: "Proteus Phase 7b Sunburst Noisy Runner",
          cards: [
            { id: SUNBURST_CRANIAL_INTERFACE, quantity: 1 },
            { id: "onr_v1_036_jackhammer", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
              (card) => card.id !== "onr_v1_036_jackhammer",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          id: "proteus_phase_7b_sunburst_noisy_corp",
          name: "Proteus Phase 7b Sunburst Noisy Corp",
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
    noisyState.runner.credits = 30;
    noisyState.runner.memoryLimit = 4;
    moveRunnerCardToGrip(noisyState, SUNBURST_CRANIAL_INTERFACE);
    moveRunnerCardToGrip(noisyState, "onr_v1_036_jackhammer");
    const wallId = putCorpIceOnServer(
      noisyState,
      "rd",
      "onr_v1_232_crystal-wall",
    );
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === SUNBURST_CRANIAL_INTERFACE,
    );
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_036_jackhammer",
    );
    noisyState.runner.credits = 0;
    noisyState = apply(
      noisyState,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noisyState = apply(
      noisyState,
      "corp",
      (action) => action.type === "rez_ice" && action.source === wallId,
    );
    expect(
      getLegalActions(noisyState, "runner").some(
        (action) =>
          action.type === "pump_breaker" &&
          sourceDefinition(noisyState, action) === "onr_v1_036_jackhammer",
      ),
    ).toBe(false);
  });
});
