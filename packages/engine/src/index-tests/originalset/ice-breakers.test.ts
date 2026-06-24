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

describe("Originalset Spotcheck 2026-05-15 Tagged/Wall/Breaker hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps Codecracker zero-cost Filter breaks encounter-bound and hidden until rez", () => {
    const runnerDeck: DeckDefinition = {
      ...ONR_V1_RUNNER_DECK,
      id: "spotcheck_codecracker_runner",
      name: "Spotcheck Codecracker Runner",
      cards: [
        { id: "onr_v1_014_codecracker", quantity: 1 },
        { id: "onr_v1_021_dwarf", quantity: 1 },
        ...ONR_V1_RUNNER_DECK.cards.filter(
          (card) =>
            card.id !== "onr_v1_014_codecracker" &&
            card.id !== "onr_v1_021_dwarf",
        ),
      ],
    };
    const corpDeck: DeckDefinition = {
      ...ONR_V1_CORP_DECK,
      id: "spotcheck_filter_corp",
      name: "Spotcheck Filter Corp",
      cards: [
        { id: "onr_v1_244_filter", quantity: 1 },
        { id: "onr_v1_237_data-wall", quantity: 1 },
        ...ONR_V1_CORP_DECK.cards.filter(
          (card) =>
            card.id !== "onr_v1_244_filter" &&
            card.id !== "onr_v1_237_data-wall",
        ),
      ],
    };
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-codecracker-filter",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 10;
    state.corp.credits = 10;
    installRunnerProgramForTest(state, "onr_v1_014_codecracker");
    putCorpIceOnServer(state, "rd", "onr_v1_244_filter");
    putCorpIceOnServer(state, "hq", "onr_v1_237_data-wall");
    expect(JSON.stringify(getPlayerView(state, "runner").servers)).not.toContain(
      "Filter",
    );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const corpCreditsBeforeRez = state.corp.credits;
    const rez = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) === "onr_v1_244_filter",
    );
    expect(rez.costs[0]?.credits ?? 0).toBe(0);
    state = apply(state, "corp", (action) => action.actionId === rez.actionId);
    expect(state.corp.credits).toBe(corpCreditsBeforeRez);
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain("Filter");
    const creditsBeforeBreak = state.runner.credits;
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        sourceDefinition(state, action) === "onr_v1_014_codecracker" &&
        action.payload?.subroutineIndex === 0,
    );
    expect(breakAction.costs[0]?.credits ?? 0).toBe(0);
    state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
    expect(state.runner.credits).toBe(creditsBeforeBreak);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_014_codecracker",
      subroutineIndex: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    if (
      getLegalActions(state, "runner").some(
        (action) => action.type === "continue_run",
      )
    )
      state = apply(state, "runner", (action) => action.type === "continue_run");
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let wallState = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-codecracker-wall-negative",
        runnerDeck,
        corpDeck,
        agendaPointsToWin: 7,
      }),
    );
    wallState.runner.credits = 10;
    wallState.corp.credits = 10;
    installRunnerProgramForTest(wallState, "onr_v1_014_codecracker");
    putCorpIceOnServer(wallState, "rd", "onr_v1_237_data-wall");
    wallState = encounterIce(wallState, "rd", "onr_v1_237_data-wall");
    expect(
      getLegalActions(wallState, "runner").some(
        (action) =>
          action.type === "break_subroutine" &&
          sourceDefinition(wallState, action) === "onr_v1_014_codecracker",
      ),
    ).toBe(false);
  });

  it("revalidates tagged operations and keeps meat-damage payloads redacted", () => {
    const corpDeck: DeckDefinition = {
      ...ONR_V1_1_2K_CORP_DECK,
      id: "spotcheck_tagged_operations_corp",
      name: "Spotcheck Tagged Operations Corp",
      cards: [
        { id: "onr_v1_293_netwatch-credit-voucher", quantity: 1 },
        { id: "onr_v1_302_scorched-earth", quantity: 1 },
        ...ONR_V1_1_2K_CORP_DECK.cards.filter(
          (card) =>
            card.id !== "onr_v1_293_netwatch-credit-voucher" &&
            card.id !== "onr_v1_302_scorched-earth",
        ),
      ],
    };
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-tagged-operations",
        runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
        corpDeck,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.runner.tags = 0;
    const voucherId = moveCorpCardToHq(
      state,
      "onr_v1_293_netwatch-credit-voucher",
    );
    moveCorpCardToHq(state, "onr_v1_302_scorched-earth");
    expect(
      getLegalActions(state, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          String(action.payload?.cardId) === voucherId,
      ),
    ).toBe(false);

    state.runner.tags = 1;
    const voucherAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        String(action.payload?.cardId) === voucherId,
    );
    const tagDrift = structuredClone(state);
    tagDrift.runner.tags = 0;
    const tagDriftResult = applyAction(tagDrift, {
      matchId: tagDrift.matchId,
      side: "corp",
      actionId: voucherAction.actionId,
      clientKnownStateVersion: tagDrift.stateVersion,
      idempotencyKey: "spotcheck-voucher-tag-drift",
    });
    expect(tagDriftResult.ok).toBe(false);
    const creditsBeforeVoucher = state.corp.credits;
    const tagsBeforeVoucher = state.runner.tags;
    state = apply(state, "corp", (action) => action.actionId === voucherAction.actionId);
    expect(state.runner.tags).toBe(tagsBeforeVoucher + 1);
    expect(state.corp.credits).toBe(creditsBeforeVoucher + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_293_netwatch-credit-voucher",
    });

    state.runner.tags = 1;
    drawRunnerCardsForTest(state, 4);
    const scorched = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_302_scorched-earth",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(state, "corp", (action) => action.actionId === scorched.actionId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_302_scorched-earth",
      damageResolved: true,
      damageType: "meat",
      damageAmount: 4,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps Data Wall pair values, Rock Is Strong rez cost and Wall of Ice damage ordering stable", () => {
    for (const [definitionId, rezCost, strength] of [
      ["onr_v1_237_data-wall", 1, 0],
      ["onr_v1_238_data-wall-2-0", 2, 1],
      ["onr_v1_265_rock-is-strong", 6, 5],
    ] as const) {
      const corpDeck: DeckDefinition = {
        ...ONR_V1_1_2K_CORP_DECK,
        id: `spotcheck_${definitionId}_corp`,
        name: `Spotcheck ${definitionId} Corp`,
        cards: [
          { id: definitionId, quantity: 1 },
          ...ONR_V1_1_2K_CORP_DECK.cards.filter(
            (card) => card.id !== definitionId,
          ),
        ],
      };
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-${definitionId}`,
          runnerDeck: ONR_V1_1_2K_RUNNER_DECK,
          corpDeck,
          agendaPointsToWin: 7,
        }),
      );
      state.corp.credits = rezCost - 1;
      putCorpIceOnServer(state, "rd", definitionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "start_run" && action.payload?.serverId === "rd",
      );
      expect(
        getLegalActions(state, "corp").some(
          (action) =>
            action.type === "rez_ice" &&
            sourceDefinition(state, action) === definitionId,
        ),
      ).toBe(false);
      state.corp.credits = rezCost;
      const rez = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" && sourceDefinition(state, action) === definitionId,
      );
      expect(rez.costs[0]?.credits ?? 0).toBe(rezCost);
      state = apply(state, "corp", (action) => action.actionId === rez.actionId);
      expect(state.corp.credits).toBe(0);
      expect(
        getPlayerView(state, "runner")
          .servers.find((server) => server.id === "rd")
          ?.ice.find((ice) => ice.definitionId === definitionId)?.strength,
      ).toBe(strength);
    }

    let wallState = toRunnerTurn(onrV1Game("spotcheck-wall-of-ice-order"));
    wallState.corp.credits = 20;
    const gripBefore = wallState.runner.grip.length;
    putCorpIceOnServer(wallState, "rd", "onr_v1_278_wall-of-ice");
    const initial = structuredClone(wallState);
    const replayStart = wallState.eventLog.length;
    wallState = encounterIce(wallState, "rd", "onr_v1_278_wall-of-ice");
    wallState = apply(wallState, "runner", (action) => action.type === "continue_run");
    expect(wallState.run).toBeUndefined();
    expect(wallState.runner.grip.length).toBe(gripBefore - 4);
    expect(wallState.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageResolved: true,
      damageType: "net",
      damageAmount: 4,
      cardsTrashed: 4,
      encounterWillEndRun: true,
    });
    expect(JSON.stringify(wallState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, wallState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(wallState));
  });
});

describe("Originalset Spotcheck 2026-05-16 Breaker/Ice Subtype Mix hardening", () => {
  it("installs and uses the selected breaker mix only in matching run encounters", () => {
    const specs = [
      ["onr_v1_052_raffles", "simple_code_gate_ice"],
      ["onr_v1_054_raptor", "simple_sentry_ice"],
      ["onr_v1_060_shaka", "simple_sentry_ice"],
      ["onr_v1_066_snowball", "simple_sentry_ice"],
      ["onr_v1_070_tinweasel", "simple_code_gate_ice"],
      ["onr_v1_072_wild-card", "simple_sentry_ice"],
      ["onr_v1_073_wizards-book", "simple_code_gate_ice"],
      ["onr_v1_074_worm", "onr_v1_237_data-wall"],
    ] as const;

    for (const [breakerDefinitionId, iceDefinitionId] of specs) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-breaker-mix-${breakerDefinitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.runner,
            id: `spotcheck_breaker_mix_runner_${breakerDefinitionId}`,
            name: `Spotcheck Breaker Mix ${breakerDefinitionId}`,
            cards: [
              { id: breakerDefinitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.runner.cards.filter(
                (card) => card.id !== breakerDefinitionId,
              ),
            ],
          },
          corpDeck: {
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
            id: `spotcheck_breaker_mix_corp_${breakerDefinitionId}`,
            name: `Spotcheck Breaker Mix Corp ${breakerDefinitionId}`,
            cards: [
              { id: iceDefinitionId, quantity: 1 },
              ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
                (card) => card.id !== iceDefinitionId,
              ),
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 30;
      state.runner.memoryLimit = 12;
      state.corp.credits = 30;
      const breakerId = moveRunnerCardToGrip(state, breakerDefinitionId);
      const install = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "install_card" &&
          String(action.payload?.cardId) === breakerId,
      );
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "corp",
          actionId: install.actionId,
          clientKnownStateVersion: state.stateVersion,
        }).ok,
      ).toBe(false);
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side: "runner",
          actionId: install.actionId,
          clientKnownStateVersion: state.stateVersion - 1,
        }).ok,
      ).toBe(false);
      state = apply(state, "runner", (action) => action.actionId === install.actionId);
      const installedId = state.runner.rig.programs.find(
        (cardId) => state.cardInstances[cardId]?.definitionId === breakerDefinitionId,
      );
      expect(installedId).toBeDefined();
      if (!installedId) throw new Error(`Missing installed ${breakerDefinitionId}`);
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const breakAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "break_subroutine" &&
            String(action.payload?.breakerId) === installedId &&
            action.payload?.subroutineIndex === 0,
        );
        if (breakAction) {
          state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
          break;
        }
        const pumpAction = getLegalActions(state, "runner").find(
          (action) =>
            action.type === "pump_breaker" &&
            String(action.payload?.breakerId) === installedId,
        );
        expect(pumpAction, breakerDefinitionId).toBeDefined();
        if (!pumpAction) break;
        state = apply(
          state,
          "runner",
          (action) => action.actionId === pumpAction.actionId,
        );
      }
      expect(state.run?.brokenSubroutineIndexes).toContain(0);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "break_subroutine",
        cardDefinitionId: breakerDefinitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        /"privatePayload"|"cardInstances"|"grip"|"stack"/,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("keeps SeeYa and Smarteye hidden-zone reveals side-safe and source-bound", () => {
    let seeya = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-seeya"));
    seeya.runner.credits = 10;
    installRunnerProgramForTest(seeya, "onr_v1_058_seeya");
    const upgradeId = putCorpRootInRemote(seeya, "simple_upgrade");
    const expose = mustAction(
      seeya,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(seeya, action) === "onr_v1_058_seeya",
    );
    expect(expose.label).toBe("SeeYa: installierte Korp-Karte exposen");
    expect(expose.payload).not.toHaveProperty("targetDefinitionId");
    expect(expose.payload).not.toHaveProperty("cardImplementationExposeTargetId");
    expect(JSON.stringify(expose.payload)).not.toMatch(/simple_upgrade/);
    const movedTarget = structuredClone(seeya);
    removeEverywhere(movedTarget, upgradeId);
    movedTarget.corp.archives.push(upgradeId);
    movedTarget.cardInstances[upgradeId] = {
      ...movedTarget.cardInstances[upgradeId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: true,
    };
    expect(
      applyAction(movedTarget, {
        matchId: movedTarget.matchId,
        side: "runner",
        actionId: expose.actionId,
        clientKnownStateVersion: movedTarget.stateVersion,
      }).ok,
    ).toBe(false);
    seeya = apply(seeya, "runner", (action) => action.actionId === expose.actionId);
    expect(seeya.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("p3_36.expose_installed_card:"),
      prompt: "Installierte Korp-Karte exposen",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(seeya.pendingChoice?.options).toContainEqual({
      id: expect.stringMatching(/^card_hidden_/),
      label: "Remote 1 Root 1",
      value: upgradeId,
    });
    const upgradeOptionId = seeya.pendingChoice?.options.find(
      (option) => option.value === upgradeId,
    )?.id;
    expect(upgradeOptionId).toMatch(/^card_hidden_/);
    const runnerExposeChoice = getPlayerView(seeya, "runner").pendingChoice;
    expect(runnerExposeChoice?.options).toContainEqual({
      id: upgradeOptionId,
      label: "Remote 1 Root 1",
    });
    expect(JSON.stringify(runnerExposeChoice)).not.toMatch(
      /"card":|"definitionId"|"value"|Simple Upgrade|simple_upgrade/,
    );
    expect(seeya.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "expose_installed_card_choice",
      sourceDefinitionId: "onr_v1_058_seeya",
    });
    expect(JSON.stringify(seeya.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"targetDefinitionId"|"cardImplementationExposeTargetId"|simple_upgrade/,
    );
    seeya = applyChoice(seeya, "runner", upgradeOptionId ?? "");
    expect(seeya.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("p3_36.expose_installed_card_review:"),
      prompt: "Karte ansehen",
      kind: "select_option",
      options: [{ id: "done", label: "Ansehen beenden", value: "done" }],
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
    });
    expect(seeya.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "expose_installed_card_review",
      cardDefinitionId: "simple_upgrade",
    });
    expect(JSON.stringify(seeya.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"hq"|"rd"|"exposedCardInstanceId"/,
    );
    expect(getPlayerView(seeya, "corp").pendingChoice).toBeUndefined();
    expect(
      getPlayerView(seeya, "runner")
        .servers.flatMap((server) => server.root)
        .some((card) => card.known && card.definitionId === "simple_upgrade"),
    ).toBe(true);
    seeya = applyChoice(seeya, "runner", "done");
    expect(seeya.pendingChoice).toBeUndefined();
    expect(seeya.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "expose_installed_card_finish",
      sourceDefinitionId: "onr_v1_058_seeya",
    });
    expect(
      JSON.stringify(
        getPlayerView(seeya, "runner").servers.flatMap((server) => server.root),
      ),
    ).not.toMatch(/simple_upgrade|Simple Upgrade/);

    let smarteye = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-smarteye-source-bound",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.runAccess.runner,
          cards: [
            { id: "onr_v1_065_smarteye", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.runAccess.runner.cards.filter(
              (card) => card.id !== "onr_v1_065_smarteye",
            ),
          ],
        },
        corpDeck: {
          ...MECHANIC_SMOKE_DECKS.globalModifiers.corp,
          cards: [
            { id: "simple_barrier_ice", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.globalModifiers.corp.cards.filter(
              (card) => card.id !== "simple_barrier_ice",
            ),
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    smarteye.runner.credits = 10;
    installRunnerProgramForTest(smarteye, "onr_v1_065_smarteye");
    putCorpIceOnServer(smarteye, "rd", "simple_barrier_ice");
    smarteye = apply(
      smarteye,
      "runner",
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const trigger = mustAction(
      smarteye,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        sourceDefinition(smarteye, action) === "onr_v1_065_smarteye",
    );
    smarteye = apply(smarteye, "runner", (action) => action.actionId === trigger.actionId);
    expect(smarteye.eventLog.at(-1)?.publicPayload).toMatchObject({
      publicRevealDefinitionId: "simple_barrier_ice",
    });
    expect(JSON.stringify(smarteye.eventLog.at(-1)?.publicPayload)).not.toMatch(
      /"privatePayload"|"cardInstances"|"rd"/,
    );
  });
});

describe("Originalset Spotcheck 2026-05-16 Corp ICE/Operation Economy hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps Sentinels Prime, Sleeper and Wall of Static rez/encounter paths replay-safe", () => {
    for (const definitionId of [
      "onr_v1_267_sentinels-prime",
      "onr_v1_270_sleeper",
      "onr_v1_279_wall-of-static",
    ] as const) {
      const runnerDeck: DeckDefinition = {
        ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner,
        id: `spotcheck_${definitionId}_runner`,
        name: `Spotcheck ${definitionId} Runner`,
        cards: [
          { id: "simple_decoder", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner.cards.filter(
            (card) => card.id !== "simple_decoder",
          ),
        ],
      };
      const corpDeck: DeckDefinition = {
        ...MECHANIC_SMOKE_DECKS.traceTags.corp,
        id: `spotcheck_${definitionId}_corp`,
        name: `Spotcheck ${definitionId} Corp`,
        cards: [
          { id: definitionId, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
            (card) => card.id !== definitionId,
          ),
        ],
      };
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-${definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck,
          corpDeck,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.corp.credits = 30;
      const programId =
        definitionId === "onr_v1_267_sentinels-prime"
          ? installRunnerProgramForTest(state, "simple_decoder")
          : undefined;
      putCorpIceOnServer(state, "rd", definitionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rez = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: rez.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok).toBe(false);
      if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: rez.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-stale`,
      });
      expect(stale.ok).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

      state = apply(state, "corp", (action) => action.actionId === rez.actionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );
      state = apply(state, "runner", (action) => action.type === "continue_run");
      expect(state.run).toBeUndefined();
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "continue_run",
        result: "ended",
      });
      if (programId) {
        expect(state.runner.heap).toContain(programId);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          trashedCardDefinitionId: "simple_decoder",
          trashedCardType: "program",
          trashedCount: 1,
        });
        expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toContainEqual(
          expect.objectContaining({
            kind: "resolve_subroutine",
            subroutineType: "trash_installed_program",
            cardDefinitionId: "simple_decoder",
            cardTitle: "Simple Decoder",
            cardsTrashed: 1,
          }),
        );
      }
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.errors, definitionId).toEqual([]);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("publishes safe results for Accounts Receivable, Annual Reviews and Day Shift", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-operation-economy-results",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: ONR_V1_0_6K_RUNNER_DECK,
        corpDeck: ONR_V1_0_6K_CORP_DECK,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_281_accounts-receivable");
    moveCorpCardToHq(state, "onr_v1_282_annual-reviews");
    moveCorpCardToHq(state, "onr_v1_288_day-shift");

    const accounts = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_281_accounts-receivable",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: accounts.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-accounts-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: accounts.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-accounts-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBeforeAccounts = state.corp.credits;
    state = apply(state, "corp", (action) => action.actionId === accounts.actionId);
    expect(state.corp.credits).toBe(creditsBeforeAccounts + 4);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_281_accounts-receivable",
      gainedCredits: 9,
      corpCreditsAfter: state.corp.credits,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 9,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_281_accounts-receivable",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );

    const hqBeforeAnnual = state.corp.hq.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_282_annual-reviews",
    );
    expect(state.corp.hq.length).toBe(hqBeforeAnnual + 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_282_annual-reviews",
      drawnCards: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 3,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_282_annual-reviews",
          sourceTitle: "Annual Reviews",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );

    const hqBeforeDayShift = state.corp.hq.length;
    const creditsBeforeDayShift = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_288_day-shift",
    );
    expect(state.corp.hq.length).toBe(hqBeforeDayShift + 1);
    expect(state.corp.credits).toBe(creditsBeforeDayShift + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_288_day-shift",
      drawnCards: 2,
      gainedCredits: 1,
      corpCreditsAfter: state.corp.credits,
      resolvedEffects: [
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 2,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_288_day-shift",
          sourceTitle: "Day Shift",
        }),
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 1,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_288_day-shift",
          sourceTitle: "Day Shift",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps trace and targeted Corp operations gated, redacted and replayable", () => {
    let traceState = toRunnerTurn(v172CardReleaseGame("spotcheck-operation-traces"));
    traceState.runner.credits = 30;
    traceState.corp.credits = 30;
    moveCorpCardToHq(traceState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(traceState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(traceState, "rd", "onr_v1_232_crystal-wall");
    for (let attempt = 0; attempt < 2; attempt += 1) {
      traceState = apply(
        traceState,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      if (attempt === 0) {
        traceState = apply(
          traceState,
          "corp",
          (action) =>
            action.type === "rez_ice" &&
            sourceDefinition(traceState, action) === "onr_v1_232_crystal-wall",
        );
      }
      traceState = apply(traceState, "runner", (action) => action.type === "continue_run");
    }
    traceState = apply(traceState, "runner", (action) => action.type === "end_turn");
    traceState = apply(traceState, "corp", (action) => action.type === "mandatory_draw");

    const traceInitial = structuredClone(traceState);
    const traceReplayStart = traceState.eventLog.length;
    for (const definitionId of [
      "onr_v1_283_audit-of-call-records",
      "onr_v1_284_chance-observation",
    ] as const) {
      traceState = apply(
        traceState,
        "corp",
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(traceState, action) === definitionId,
      );
      expect(traceState.trace).toMatchObject({
        baseTraceStrength: 5,
        sourceDefinitionId: definitionId,
      });
      expect(traceState.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_operation",
        cardDefinitionId: definitionId,
        traceStarted: true,
        baseTraceStrength: 5,
      });
      expect(JSON.stringify(traceState.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      traceState = applyChoice(traceState, "corp", "bid_0");
      traceState = applyChoice(traceState, "runner", "bid_0");
    }
    const traceReplay = replayEvents(
      traceInitial,
      traceState.eventLog.slice(traceReplayStart),
    );
    expect(traceReplay.ok).toBe(true);
    expect(hashState(traceReplay.state)).toBe(hashState(traceState));

    let detectiveState = toRunnerTurn(v172CardReleaseGame("spotcheck-detective-redaction"));
    detectiveState.runner.credits = 30;
    detectiveState.corp.credits = 30;
    for (const definitionId of [
      "onr_v1_158_danshis-second-id",
      "onr_v1_179_silicon-saloon-franchise",
      "onr_v1_163_floating-runner-bbs",
    ] as const) {
      moveRunnerCardToGrip(detectiveState, definitionId);
      detectiveState = apply(
        detectiveState,
        "runner",
        (action) =>
          action.type === "install_card" &&
          sourceDefinition(detectiveState, action) === definitionId,
      );
    }
    detectiveState.runner.tags = 1;
    detectiveState = apply(detectiveState, "runner", (action) => action.type === "end_turn");
    detectiveState = apply(detectiveState, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(detectiveState, "onr_v1_286_corporate-detective-agency");
    const detectiveInitial = structuredClone(detectiveState);
    const detectiveReplayStart = detectiveState.eventLog.length;
    detectiveState = apply(
      detectiveState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(detectiveState, action) ===
          "onr_v1_286_corporate-detective-agency",
    );
    expect(detectiveState.runner.rig.resources).toHaveLength(1);
    expect(detectiveState.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_286_corporate-detective-agency",
      trashedResourceCount: 2,
    });
    expect(
      String(detectiveState.eventLog.at(-1)?.publicPayload.trashedResourceDefinitionIds),
    ).toContain("onr_v1_158_danshis-second-id");
    expect(JSON.stringify(detectiveState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const detectiveReplay = replayEvents(
      detectiveInitial,
      detectiveState.eventLog.slice(detectiveReplayStart),
    );
    expect(detectiveReplay.ok).toBe(true);
    expect(hashState(detectiveReplay.state)).toBe(hashState(detectiveState));

    let counterState = apply(
      MECHANIC_SMOKE_GAMES.agendaScoring("spotcheck-falsified-counter"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    counterState.corp.credits = 20;
    const agendaId = putCorpRootInRemote(counterState, "simple_agenda");
    const targetAgendaId = putCorpRootInRemote(
      counterState,
      "onr_v1_202_genetics-visionary-acquisition",
    );
    counterState.cardInstances[agendaId] = {
      ...counterState.cardInstances[agendaId]!,
      advancementCounters: 2,
    };
    moveCorpCardToHq(counterState, "onr_v1_291_falsified-transactions-expert");
    const counterInitial = structuredClone(counterState);
    const counterReplayStart = counterState.eventLog.length;
    counterState = apply(
      counterState,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(counterState, action) ===
          "onr_v1_291_falsified-transactions-expert",
    );
    const moveOption = counterState.pendingChoice?.options.find(
      (option) => String(option.value) === `${agendaId}|${targetAgendaId}|2`,
    );
    expect(moveOption).toBeDefined();
    counterState = applyChoices(counterState, "corp", [moveOption?.id ?? ""]);
    expect(counterState.cardInstances[agendaId]?.advancementCounters).toBe(0);
    expect(counterState.cardInstances[targetAgendaId]?.advancementCounters).toBe(2);
    expect(counterState.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_291_falsified-transactions-expert",
      v1919OperationAbility: "move_advancement_counters",
      advancementCountersMoved: 2,
      advancementCounterSourceDefinitionId: "simple_agenda",
      advancementCounterTargetDefinitionId:
        "onr_v1_202_genetics-visionary-acquisition",
    });
    expect(JSON.stringify(counterState.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const counterReplay = replayEvents(
      counterInitial,
      counterState.eventLog.slice(counterReplayStart),
    );
    expect(counterReplay.ok).toBe(true);
    expect(hashState(counterReplay.state)).toBe(hashState(counterState));
  });
});

describe("Originalset Spotcheck 2026-05-16 Corp ICE Trace/Barriers hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps trace, trash, damage and barrier ICE source-bound and replay-safe", () => {
    const cases = [
      { definitionId: "onr_v1_221_asp", kind: "trace" },
      { definitionId: "onr_v1_223_banpei", kind: "trash_program" },
      { definitionId: "onr_v1_231_cortical-scrub", kind: "core_damage" },
      { definitionId: "onr_v1_232_crystal-wall", kind: "etr" },
      { definitionId: "onr_v1_245_fire-wall", kind: "etr" },
      { definitionId: "onr_v1_249_hunter", kind: "trace" },
      { definitionId: "onr_v1_252_keeper", kind: "etr" },
      { definitionId: "onr_v1_256_mazer", kind: "etr" },
      { definitionId: "onr_v1_261_quandary", kind: "etr" },
      { definitionId: "onr_v1_266_scramble", kind: "etr" },
    ] as const;

    for (const { definitionId, kind } of cases) {
      const runnerDeck: DeckDefinition = {
        ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner,
        id: `spotcheck_${definitionId}_runner`,
        name: `Spotcheck ${definitionId} Runner`,
        cards: [
          { id: "simple_decoder", quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.programSubtypeHosting.runner.cards.filter(
            (card) => card.id !== "simple_decoder",
          ),
        ],
      };
      const corpDeck: DeckDefinition = {
        ...MECHANIC_SMOKE_DECKS.traceTags.corp,
        id: `spotcheck_${definitionId}_corp`,
        name: `Spotcheck ${definitionId} Corp`,
        cards: [
          { id: definitionId, quantity: 1 },
          ...MECHANIC_SMOKE_DECKS.traceTags.corp.cards.filter(
            (card) => card.id !== definitionId,
          ),
        ],
      };
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-${definitionId}-trace-barrier`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck,
          corpDeck,
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 20;
      state.corp.credits = 30;
      const programId =
        kind === "trash_program"
          ? installRunnerProgramForTest(state, "simple_decoder")
          : undefined;
      putCorpIceOnServer(state, "rd", definitionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      const rez = mustAction(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: rez.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `spotcheck-${definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, definitionId).toBe(false);
      if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: rez.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `spotcheck-${definitionId}-stale`,
      });
      expect(stale.ok, definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

      state = apply(state, "corp", (action) => action.actionId === rez.actionId);
      expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
        DEMO_CARDS_BY_ID[definitionId]?.title,
      );
      state = apply(state, "runner", (action) => action.type === "continue_run");

      if (kind === "trace") {
        expect(state.trace).toMatchObject({
          sourceDefinitionId: definitionId,
          baseTraceStrength: 5,
        });
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          actionType: "continue_run",
          traceStarted: true,
          sourceDefinitionId: definitionId,
          baseTraceStrength: 5,
        });
        state = applyChoice(state, "corp", "bid_5");
        state = applyChoice(state, "runner", "bid_0");
        if (definitionId === "onr_v1_221_asp") {
          expect(state.runner.tags, definitionId).toBe(0);
          expect(state.run, definitionId).toBeUndefined();
          expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
            runnerRunEnded: true,
            runnerRunLockCreditCost: 1,
          });
        } else {
          expect(state.runner.tags, definitionId).toBe(1);
        }
      } else {
        expect(state.run, definitionId).toBeUndefined();
      }

      if (kind === "trash_program") {
        expect(programId && state.runner.heap.includes(programId)).toBe(true);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          trashedCardDefinitionId: "simple_decoder",
          trashedCardType: "program",
          trashedCount: 1,
        });
      }
      if (kind === "core_damage") {
        expect(state.runner.coreDamage).toBe(1);
        expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
          damageResolved: true,
          damageType: "core",
          damageAmount: 1,
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

describe("Originalset Spotcheck 2026-05-16 Runner Breaker/Prevention Resolvers", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("uses Pile Driver as a source-bound multi-wall breaker with exact Stealth loss", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-pile-driver-multi-break",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_pile_driver_runner",
          name: "Spotcheck Pile Driver Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_047_pile-driver", quantity: 1 },
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_pile_driver_corp",
          name: "Spotcheck Pile Driver Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
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
    const pileDriverId = installRunnerProgramForTest(
      state,
      "onr_v1_047_pile-driver",
    );
    const cloakId = installRunnerProgramForTest(state, "onr_v1_011_cloak");
    setCardCounterForTest(state, cloakId, "bit", 3);
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_278_wall-of-ice");
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
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === pileDriverId &&
        action.payload?.subroutineIndexes === "0,1,2,3",
    );
    expect(breakAction.costs).toEqual([{ credits: 3 }]);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-pile-driver-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-pile-driver-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, pileDriverId);
    const beforeHash = hashState(removedSource);
    const removedResult = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-pile-driver-removed-source",
    });
    expect(removedResult.ok).toBe(false);
    expect(hashState(removedSource)).toBe(beforeHash);

    state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
    expect(state.run?.brokenSubroutineIndexes).toEqual([0, 1, 2, 3]);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_v1_047_pile-driver",
      breakSubroutineCount: 4,
      multiBreakSubroutines: true,
      postBreakStealthLoss: 3,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("applies Wrecking Ball as a Proteus wall breaker with public Stealth loss", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "spotcheck-proteus-wrecking-ball-break",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_proteus_wrecking_ball_runner",
          name: "Spotcheck Proteus Wrecking Ball Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_proteus_100_wrecking-ball", quantity: 1 },
            { id: "onr_v1_011_cloak", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_proteus_wrecking_ball_corp",
          name: "Spotcheck Proteus Wrecking Ball Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
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
    const wreckingBallId = installRunnerProgramForTest(
      state,
      "onr_proteus_100_wrecking-ball",
    );
    state.cardInstances[wreckingBallId]!.strengthModifier = 20;
    const cloakId = installRunnerProgramForTest(state, "onr_v1_011_cloak");
    setCardCounterForTest(state, cloakId, "bit", 1);
    const iceId = putCorpIceOnServer(state, "rd", "onr_v1_278_wall-of-ice");

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
    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        String(action.payload?.breakerId) === wreckingBallId &&
        action.payload?.subroutineIndex === 0,
    );
    expect(breakAction.costs).toEqual([{ credits: 0 }]);

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-wrecking-ball-stale",
    });
    expect(stale.ok).toBe(false);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: breakAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-wrecking-ball-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);

    state = apply(state, "runner", (action) => action.actionId === breakAction.actionId);
    expect(state.run?.brokenSubroutineIndexes).toEqual([0]);
    expect(cardCounterAmount(state, cloakId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "break_subroutine",
      cardDefinitionId: "onr_proteus_100_wrecking-ball",
      postBreakStealthLoss: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
  });

  it("plays Proteus PRO005 runner economy/draw events through LegalActions", () => {
    const cases = [
      {
        definitionId: "onr_proteus_103_cruising-for-netwatch",
        gainedCredits: 1,
        drawnCount: 2,
        expectedGripDelta: 1,
      },
      {
        definitionId: "onr_proteus_124_stakeout",
        gainedCredits: 2,
        drawnCount: 1,
        expectedGripDelta: 0,
      },
    ] as const;

    for (const testCase of cases) {
      let state = toRunnerTurn(
        createGameAfterSetup({
          seed: `spotcheck-${testCase.definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: {
            id: `spotcheck_${testCase.definitionId}_runner`,
            name: `Spotcheck ${testCase.definitionId} Runner`,
            side: "runner",
            identity: "runner_identity_001",
            cards: [
              { id: testCase.definitionId, quantity: 1 },
              { id: "simple_economy_event", quantity: 10 },
            ],
          },
          corpDeck: {
            id: `spotcheck_${testCase.definitionId}_corp`,
            name: `Spotcheck ${testCase.definitionId} Corp`,
            side: "corp",
            identity: "corp_identity_001",
            cards: [
              { id: "simple_agenda", quantity: 6 },
              { id: "simple_economy_operation", quantity: 6 },
            ],
          },
          agendaPointsToWin: 7,
        }),
      );
      state.runner.credits = 5;
      state.runner.clicks = 4;

      const eventId = moveRunnerCardToGrip(state, testCase.definitionId);
      const legal = mustAction(
        state,
        "runner",
        (action) =>
          action.type === "play_event" &&
          action.payload?.cardId === eventId,
      );
      expect(legal.costs).toEqual([{ clicks: 1, credits: 0 }]);

      const stale = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: `${testCase.definitionId}-stale`,
      });
      expect(stale.ok, testCase.definitionId).toBe(false);
      if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

      const wrongSide = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: legal.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `${testCase.definitionId}-wrong-side`,
      });
      expect(wrongSide.ok, testCase.definitionId).toBe(false);
      if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

      const wrongActionId = applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: `${legal.actionId}-missing`,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `${testCase.definitionId}-wrong-action-id`,
      });
      expect(wrongActionId.ok, testCase.definitionId).toBe(false);

      const noClicks = structuredClone(state);
      noClicks.runner.clicks = 0;
      expect(
        applyAction(noClicks, {
          matchId: noClicks.matchId,
          side: "runner",
          actionId: legal.actionId,
          clientKnownStateVersion: noClicks.stateVersion,
          idempotencyKey: `${testCase.definitionId}-no-clicks`,
        }).ok,
        testCase.definitionId,
      ).toBe(false);

      const removedSource = structuredClone(state);
      removeEverywhere(removedSource, eventId);
      const removedHash = hashState(removedSource);
      expect(
        applyAction(removedSource, {
          matchId: removedSource.matchId,
          side: "runner",
          actionId: legal.actionId,
          clientKnownStateVersion: removedSource.stateVersion,
          idempotencyKey: `${testCase.definitionId}-removed-source`,
        }).ok,
        testCase.definitionId,
      ).toBe(false);
      expect(hashState(removedSource), testCase.definitionId).toBe(removedHash);

      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const creditsBefore = state.runner.credits;
      const gripBefore = state.runner.grip.length;
      const stackBefore = state.runner.stack.length;

      state = apply(state, "runner", (action) => action.actionId === legal.actionId);

      expect(state.runner.credits, testCase.definitionId).toBe(
        creditsBefore + testCase.gainedCredits,
      );
      expect(state.runner.grip.length, testCase.definitionId).toBe(
        gripBefore + testCase.expectedGripDelta,
      );
      expect(state.runner.stack.length, testCase.definitionId).toBe(
        stackBefore - testCase.drawnCount,
      );
      expect(state.runner.heap, testCase.definitionId).toContain(eventId);
      expect(state.cardInstances[eventId]?.zone).toMatchObject({
        side: "runner",
        zone: "heap",
      });
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "play_event",
        cardDefinitionId: testCase.definitionId,
        gainedCredits: testCase.gainedCredits,
        runnerCreditsAfter: state.runner.credits,
        drawnCount: testCase.drawnCount,
        runnerGripAfter: state.runner.grip.length,
        resolvedEffects: [
          expect.objectContaining({
            kind: "gain_credits",
            side: "runner",
            amount: testCase.gainedCredits,
            reason: "card_resolver",
            sourceDefinitionId: testCase.definitionId,
          }),
          expect.objectContaining({
            kind: "draw_cards",
            side: "runner",
            amount: testCase.drawnCount,
            reason: "card_resolver",
            sourceDefinitionId: testCase.definitionId,
          }),
        ],
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, testCase.definitionId).toBe(true);
      expect(hashState(replay.state), testCase.definitionId).toBe(hashState(state));
    }
  });

  it("routes Full Body Conversion through a Corp bypass-payment prevention window", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-full-body-conversion",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_full_body_runner",
          name: "Spotcheck Full Body Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_127_full-body-conversion", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_full_body_corp",
          name: "Spotcheck Full Body Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_301_punitive-counterstrike", quantity: 2 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.runner.tags = 1;
    state.runner.credits = 10;
    state.corp.credits = 2;
    installRunnerHardwareForTest(state, "onr_v1_127_full-body-conversion");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "v120.event_modification.prevent",
      prompt: "Damage Prevention",
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "damage_prevention_bypass_pay_0",
      "damage_prevention_bypass_pay_1",
      "damage_prevention_bypass_pay_2",
    ]);
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "0 Credits zahlen: 0 Meat Damage durchlassen",
      "1 Credits zahlen: 1 Meat Damage durchlassen",
      "2 Credits zahlen: 2 Meat Damage durchlassen",
    ]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(state, "corp", (action) => action.type === "resolve_choice").actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["damage_prevention_bypass_pay_1"],
      },
      idempotencyKey: "spotcheck-full-body-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    state = applyChoice(state, "corp", "damage_prevention_bypass_pay_1");
    expect(state.corp.credits).toBe(1);
    expect(state.runner.grip.length).toBe(gripBefore - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      eventModificationOutcome: "partially_prevented",
      sourceDefinitionId: "onr_v1_127_full-body-conversion",
      originalAmount: 2,
      preventedAmount: 1,
      finalAmount: 1,
      damagePreventionBypassPaid: 1,
      damagePreventionBypassCostPerDamage: 1,
      damageType: "meat",
      damageAmount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let preventAll = apply(
      createGameAfterSetup({
        seed: "spotcheck-full-body-conversion-prevent-all",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_full_body_runner_all",
          name: "Spotcheck Full Body Runner All",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_127_full-body-conversion", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_full_body_corp_all",
          name: "Spotcheck Full Body Corp All",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    preventAll.runner.tags = 1;
    preventAll.corp.credits = 0;
    installRunnerHardwareForTest(preventAll, "onr_v1_127_full-body-conversion");
    moveCorpCardToHq(preventAll, "onr_v1_301_punitive-counterstrike");
    const preventAllGrip = preventAll.runner.grip.length;
    preventAll = apply(
      preventAll,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(preventAll, action) ===
          "onr_v1_301_punitive-counterstrike",
    );
    expect(preventAll.pendingChoice?.options.map((option) => option.id)).toEqual([
      "damage_prevention_bypass_pay_0",
    ]);
    expect(preventAll.pendingChoice?.options.map((option) => option.label)).toEqual([
      "0 Credits zahlen: 0 Meat Damage durchlassen",
    ]);
    preventAll = applyChoice(
      preventAll,
      "corp",
      "damage_prevention_bypass_pay_0",
    );
    expect(preventAll.runner.grip.length).toBe(preventAllGrip);
    expect(preventAll.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationOutcome: "prevented",
      preventedAmount: 2,
      finalAmount: 0,
      damageAmount: 0,
    });
  });

  it("requires the Corp to pay each Full Body Conversion to let meat damage through", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-full-body-conversion-stacked",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_full_body_runner_stacked",
          name: "Spotcheck Full Body Runner Stacked",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_127_full-body-conversion", quantity: 2 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_full_body_corp_stacked",
          name: "Spotcheck Full Body Corp Stacked",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.runner.tags = 1;
    state.corp.credits = 3;
    const firstFullBodyConversionId = installRunnerHardwareForTest(
      state,
      "onr_v1_127_full-body-conversion",
    );
    const secondFullBodyConversionId = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        id !== firstFullBodyConversionId &&
        card.definitionId === "onr_v1_127_full-body-conversion",
    )?.[0] as CardInstanceId | undefined;
    expect(secondFullBodyConversionId).toBeDefined();
    removeEverywhere(state, String(secondFullBodyConversionId));
    state.runner.rig.hardware.push(String(secondFullBodyConversionId));
    state.cardInstances[String(secondFullBodyConversionId)] = {
      ...state.cardInstances[String(secondFullBodyConversionId)]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "v120.event_modification.prevent",
      prompt: "Damage Prevention",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      candidateCount: 2,
    });
    expect(state.pendingChoice?.options.map((option) => option.id)).toEqual([
      "damage_prevention_bypass_pay_0",
      "damage_prevention_bypass_pay_1",
    ]);
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "0 Credits zahlen: 0 Meat Damage durchlassen",
      "2 Credits zahlen: 1 Meat Damage durchlassen",
    ]);

    state = applyChoice(state, "corp", "damage_prevention_bypass_pay_1");

    expect(state.corp.credits).toBe(1);
    expect(state.runner.grip.length).toBe(gripBefore - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "partially_prevented",
      sourceDefinitionId: "onr_v1_127_full-body-conversion",
      originalAmount: 2,
      preventedAmount: 1,
      finalAmount: 1,
      damagePreventionBypassPaid: 2,
      damagePreventionBypassCostPerDamage: 2,
      damageType: "meat",
      damageAmount: 1,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("continues to later meat-prevention sources after an earlier source is passed", () => {
    let state = apply(
      createGameAfterSetup({
        seed: "spotcheck-stacked-meat-prevention-chain",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_stacked_meat_prevention_runner",
          name: "Spotcheck Stacked Meat Prevention Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_125_dermatech-bodyplating", quantity: 1 },
            { id: "onr_v1_127_full-body-conversion", quantity: 2 },
            { id: "onr_v1_143_techtronica-utility-suit", quantity: 1 },
            { id: "onr_v1_160_diplomatic-immunity", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: {
          id: "spotcheck_stacked_meat_prevention_corp",
          name: "Spotcheck Stacked Meat Prevention Corp",
          side: "corp",
          identity: "corp_identity_001",
          cards: [
            { id: "onr_v1_301_punitive-counterstrike", quantity: 1 },
            { id: "simple_agenda", quantity: 6 },
            { id: "simple_economy_operation", quantity: 6 },
          ],
        },
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.runner.tags = 1;
    state.corp.credits = 3;
    installRunnerHardwareForTest(state, "onr_v1_125_dermatech-bodyplating");
    const firstFullBodyConversionId = installRunnerHardwareForTest(
      state,
      "onr_v1_127_full-body-conversion",
    );
    const secondFullBodyConversionId = Object.entries(state.cardInstances).find(
      ([id, card]) =>
        id !== firstFullBodyConversionId &&
        card.definitionId === "onr_v1_127_full-body-conversion",
    )?.[0] as CardInstanceId | undefined;
    expect(secondFullBodyConversionId).toBeDefined();
    removeEverywhere(state, String(secondFullBodyConversionId));
    state.runner.rig.hardware.push(String(secondFullBodyConversionId));
    state.cardInstances[String(secondFullBodyConversionId)] = {
      ...state.cardInstances[String(secondFullBodyConversionId)]!,
      zone: { side: "runner", zone: "rig" },
      faceup: true,
      rezzed: true,
    };
    installRunnerHardwareForTest(state, "onr_v1_143_techtronica-utility-suit");
    installRunnerResourceForTest(state, "onr_v1_160_diplomatic-immunity");
    moveCorpCardToHq(state, "onr_v1_301_punitive-counterstrike");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_301_punitive-counterstrike",
    );

    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "v120.event_modification.prevent",
    });
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "Nicht verhindern",
      "Dermatech Bodyplating: 1 Schaden verhindern",
    ]);

    state = applyChoice(state, "runner", "pass");

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: "v120.event_modification.prevent",
    });
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "0 Credits zahlen: 0 Meat Damage durchlassen",
      "2 Credits zahlen: 1 Meat Damage durchlassen",
    ]);

    state = applyChoice(state, "corp", "damage_prevention_bypass_pay_1");

    expect(state.corp.credits).toBe(1);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: "v120.event_modification.prevent",
    });
    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "Nicht verhindern",
      "Techtronica Utility Suit: 1 Schaden verhindern",
    ]);

    state = applyChoice(state, "runner", "pass");

    expect(state.pendingChoice?.options.map((option) => option.label)).toEqual([
      "Nicht verhindern",
      "Diplomatic Immunity: 1 Schaden verhindern",
    ]);

    const diplomaticOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(diplomaticOption).toBeDefined();
    state = applyChoice(state, "runner", String(diplomaticOption));

    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      sourceDefinitionId: "onr_v1_160_diplomatic-immunity",
      originalAmount: 1,
      preventedAmount: 1,
      finalAmount: 0,
      damageAmount: 0,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("gates Lifesaver Nanosurgeons draw on damage during the last three Runner actions", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "p343-lifesaver-recent-damage",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          id: "spotcheck_lifesaver_runner",
          name: "Spotcheck Lifesaver Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "onr_v1_130_lifesaver-nanosurgeons", quantity: 1 },
            { id: "simple_economy_event", quantity: 10 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.globalModifiers.corp,
        agendaPointsToWin: 7,
      }),
    );
    const lifesaverId = installRunnerHardwareForTest(
      state,
      "onr_v1_130_lifesaver-nanosurgeons",
    );
    state.runner.clicks = 4;
    const gripBefore = state.runner.grip.length;

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === lifesaverId,
      ),
    ).toBe(false);

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
        runAttemptsThisTurn: 0,
        runAttemptsLastTurn: 0,
        damagePreventionUsage: {},
      }),
      runnerActionsTakenThisTurn: 2,
      lastDamageRunnerActionOrdinal: 1,
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === lifesaverId,
    );

    expect(state.runner.grip.length).toBe(gripBefore + 2);
    expect(state.runner.clicks).toBe(3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      sourceDefinitionId: "onr_v1_130_lifesaver-nanosurgeons",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {
        stoleAgendaThisTurn: false,
        stoleAgendaLastTurn: false,
        runAttemptsThisTurn: 0,
        runAttemptsLastTurn: 0,
        damagePreventionUsage: {},
      }),
      runnerActionsTakenThisTurn: 5,
      lastDamageRunnerActionOrdinal: 1,
    };
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardId === lifesaverId,
      ),
    ).toBe(false);
  });
});
