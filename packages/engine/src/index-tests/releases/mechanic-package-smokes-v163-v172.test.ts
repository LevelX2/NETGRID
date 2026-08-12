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

describe("V1.6.3 Mechanikpaket C", () => {
  it("adds a controlled V1.6.3 core card set without opening deferred mechanics", () => {
    expect(ONR_V1_6_3_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_6_3_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /hosting|daemon|stealth|unique_card|recurring_credit/,
      );
    }
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_233_d-arc-knight"]).toMatchObject({
      rezCost: 6,
      strength: 2,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_267_sentinels-prime"]).toMatchObject({
      rezCost: 8,
      strength: 4,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_273_triggerman"]).toMatchObject({
      rezCost: 7,
      strength: 3,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_350_antiquated-interface-routines"],
    ).toMatchObject({ rezCost: 2, trashCost: 1 });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_371_tokyo-chiba-infighting"],
    ).toMatchObject({ rezCost: 0, trashCost: 6 });
  });

  it("validates V1.6.3 smoke decks and keeps previous card releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_6_3_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_6_3_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v163CardReleaseGame("v163-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_341_skalderviken-sa-beta-test-site"],
    ).toBeDefined();
  });

  it("resolves trash-program ICE subroutines deterministically and replay-safe", () => {
    const cases = [
      "onr_v1_233_d-arc-knight",
      "onr_v1_267_sentinels-prime",
      "onr_v1_273_triggerman",
    ] as const;

    for (const iceDefinitionId of cases) {
      let state = toRunnerTurn(
        v163CardReleaseGame(`v163-trash-${iceDefinitionId}`),
      );
      installRunnerProgramForTest(state, "onr_v1_014_codecracker");
      const installedProgramId = state.runner.rig.programs.find(
        (id) =>
          state.cardInstances[id]?.definitionId === "onr_v1_014_codecracker",
      );
      expect(installedProgramId).toBeDefined();
      putCorpIceOnServer(state, "rd", iceDefinitionId);
      putCorpCardOnTopOfRd(state, "simple_economy_operation");
      state.corp.credits = 40;
      state.runner.credits = 10;
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
          sourceDefinition(state, action) === iceDefinitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );
      state = applyChoice(state, "corp", `card_${installedProgramId}`);
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.run).toBeUndefined();
      if (installedProgramId) {
        expect(state.runner.rig.programs).not.toContain(installedProgramId);
        expect(state.runner.heap).toContain(installedProgramId);
      }
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    }
  });

  it("offers HQ and R&D root install targets for Antiquated Interface Routines", () => {
    const centralRootCorpDeck: DeckDefinition = {
      ...ONR_V1_6_3_CORP_DECK,
      id: "onr_v1_corp_v163_central_root_install",
      cards: [
        ...ONR_V1_6_3_CORP_DECK.cards,
        { id: "simple_agenda", quantity: 1 },
        { id: "simple_economy_asset", quantity: 1 },
      ],
    };
    let state = createGameAfterSetup({
      seed: "v163-antiquated-central-root-install",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: ONR_V1_6_3_RUNNER_DECK,
      corpDeck: centralRootCorpDeck,
      agendaPointsToWin: 7,
    });
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 40;
    state.corp.clicks = 3;
    state.corp.maxHandSize = 100;
    const upgradeId = moveCorpCardToHq(
      state,
      "onr_v1_350_antiquated-interface-routines",
    );
    const agendaId = moveCorpCardToHq(state, "simple_agenda");
    const assetId = moveCorpCardToHq(state, "simple_economy_asset");
    const upgradeTargets = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === upgradeId &&
          action.payload?.placement === "root",
      )
      .map((action) => action.payload?.serverId)
      .sort();
    const agendaTargets = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === agendaId &&
        (action.payload?.serverId === "hq" ||
          action.payload?.serverId === "rd"),
    );
    const assetTargets = getLegalActions(state, "corp").filter(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === assetId &&
        (action.payload?.serverId === "hq" ||
          action.payload?.serverId === "rd"),
    );

    expect(upgradeTargets).toEqual(
      expect.arrayContaining(["new_remote", "hq", "rd"]),
    );
    expect(upgradeTargets).not.toContain("archives");
    expect(agendaTargets).toEqual([]);
    expect(assetTargets).toEqual([]);

    const hqInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.serverId === "hq" &&
        action.payload?.placement === "root",
    );
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "runner",
        actionId: hqInstall.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: "v163-antiquated-central-wrong-side",
      }).ok,
    ).toBe(false);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: hqInstall.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
        idempotencyKey: "v163-antiquated-central-stale",
      }).ok,
    ).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) => action.actionId === hqInstall.actionId,
    );
    expect(
      state.corp.servers.find((server) => server.id === "hq")?.root,
    ).toContain(upgradeId);
    expect(
      getPlayerView(state, "corp").servers.find((server) => server.id === "hq")
        ?.root[0]?.definitionId,
    ).toBe("onr_v1_350_antiquated-interface-routines");
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Antiquated Interface Routines",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        action.payload?.cardId === upgradeId &&
        action.payload?.rootRez === true,
    );
    expect(state.cardInstances[upgradeId]?.rezzed).toBe(true);
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Antiquated Interface Routines",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let rdState = v163CardReleaseGame("v163-antiquated-rd-root-install");
    rdState = apply(
      rdState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rdState.corp.credits = 40;
    rdState.corp.clicks = 3;
    const rdUpgradeId = moveCorpCardToHq(
      rdState,
      "onr_v1_350_antiquated-interface-routines",
    );
    rdState = apply(
      rdState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === rdUpgradeId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "root",
    );
    expect(
      rdState.corp.servers.find((server) => server.id === "rd")?.root,
    ).toContain(rdUpgradeId);
  });

  it("applies Antiquated Interface strength and Tokyo-Chiba unsuccessful-run credit on its fort", () => {
    let strengthState = v163CardReleaseGame("v163-antiquated-strength");
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    strengthState.corp.credits = 40;
    strengthState.corp.maxHandSize = 100;
    putCorpRootInRemote(
      strengthState,
      "onr_v1_350_antiquated-interface-routines",
    );
    putCorpIceOnServer(strengthState, "remote_1", "onr_v1_232_crystal-wall");
    putCorpIceOnServer(strengthState, "rd", "onr_v1_233_d-arc-knight");
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        sourceDefinition(strengthState, action) ===
          "onr_v1_350_antiquated-interface-routines",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) => action.type === "end_turn",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_232_crystal-wall",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(4);
    strengthState = apply(
      strengthState,
      "runner",
      (action) => action.type === "continue_run",
    );
    strengthState = apply(
      strengthState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    strengthState = apply(
      strengthState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(strengthState, action) === "onr_v1_233_d-arc-knight",
    );
    expect(
      getPlayerView(strengthState, "runner").run?.encounteredIce?.strength,
    ).toBe(2);

    let tokyoState = v163CardReleaseGame("v163-tokyo-bonus");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    tokyoState.corp.credits = 40;
    tokyoState.corp.maxHandSize = 100;
    tokyoState.corp.clicks = 10;
    moveCorpCardToHq(tokyoState, "onr_v1_371_tokyo-chiba-infighting");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting",
    );
    const firstRegionId = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.find(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      );
    expect(firstRegionId).toBeDefined();
    if (firstRegionId) {
      expect(tokyoState.cardInstances[firstRegionId]?.rezzed).toBe(true);
      expect(tokyoState.cardInstances[firstRegionId]?.faceup).toBe(true);
    }
    const secondRegionId =
      Object.entries(tokyoState.cardInstances).find(
        ([id, card]) =>
          card.definitionId === "onr_v1_371_tokyo-chiba-infighting" &&
          id !== firstRegionId,
      )?.[0] ?? "";
    expect(secondRegionId).not.toBe("");
    if (secondRegionId) {
      removeEverywhere(tokyoState, secondRegionId);
      tokyoState.corp.hq.unshift(secondRegionId);
      tokyoState.cardInstances[secondRegionId] = {
        ...tokyoState.cardInstances[secondRegionId]!,
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      };
    }
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(tokyoState, action) ===
          "onr_v1_371_tokyo-chiba-infighting" &&
        action.payload?.serverId === "remote_1",
    );
    if (firstRegionId) {
      expect(tokyoState.corp.archives).toContain(firstRegionId);
    }
    const regionCountInRemote = tokyoState.corp.servers
      .find((server) => server.id === "remote_1")
      ?.root.filter(
        (id) =>
          tokyoState.cardInstances[id]?.definitionId ===
          "onr_v1_371_tokyo-chiba-infighting",
      ).length;
    expect(regionCountInRemote).toBe(1);
    putCorpIceOnServer(tokyoState, "remote_1", "onr_v1_233_d-arc-knight");
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) => action.type === "end_turn",
    );
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    tokyoState = apply(
      tokyoState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(tokyoState, action) === "onr_v1_233_d-arc-knight",
    );
    const creditsBeforeContinue = tokyoState.corp.credits;
    tokyoState = apply(
      tokyoState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(tokyoState.run).toBeUndefined();
    expect(tokyoState.corp.credits).toBe(creditsBeforeContinue + 2);
    expect(tokyoState.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "gain_credits",
          visibility: "public",
          side: "corp",
          amount: 2,
          reason: "unsuccessful_run",
          sourceDefinitionId: "onr_v1_371_tokyo-chiba-infighting",
          sourceTitle: "Tokyo-Chiba Infighting",
          serverId: "remote_1",
          serverLabel: "Remote 1",
        }),
      ]),
    );
  });
});

describe("V1.7.0 Mechanikpaket D", () => {
  it("adds a controlled V1.7.0 core card set with subtype, hosting, recurring and unique gates", () => {
    expect(ONR_V1_7_0_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_0_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" ")).not.toMatch(
        /search|arrange|shuffle|trace_windowing|run_lock|counter_system|deterministischer_wuerfel/,
      );
    }
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_011_cloak"]).toMatchObject({
      installCost: 7,
      memoryCost: 1,
      recurringCredits: 3,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_036_jackhammer"]).toMatchObject({
      installCost: 1,
      memoryCost: 1,
      strength: 0,
    });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_069_succubus"]).toMatchObject({
      installCost: 3,
      memoryCost: 1,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_163_floating-runner-bbs"],
    ).toMatchObject({
      installCost: 6,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_180_smiths-pawnshop"]?.subtypes,
    ).toContain("unique");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_021_dwarf"]?.subtypes).toContain(
      "worm",
    );
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_074_worm"]?.subtypes).toContain(
      "worm",
    );
  });

  it("validates V1.7.0 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_0_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_0_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v170CardReleaseGame("v170-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_371_tokyo-chiba-infighting"],
    ).toBeDefined();
  });

  it("hosts programs on Succubus without MU cost and trashes hosted programs when the daemon is trashed", () => {
    let state = toRunnerTurn(v170CardReleaseGame("v170-succubus-hosting"));
    state.runner.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_069_succubus");
    moveRunnerCardToGrip(state, "onr_v1_036_jackhammer");
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
    if (!succubusId) throw new Error("Missing installed Succubus");
    const hostedInstall = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_036_jackhammer" &&
        action.payload?.hostOnCardId === succubusId,
    );
    const hostedJackhammerId = String(hostedInstall.payload?.cardId ?? "");
    expect(hostedJackhammerId).not.toBe("");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === hostedInstall.actionId,
    );
    expect(state.cardInstances[hostedJackhammerId]?.hostedOn).toBe(succubusId);
    expect(state.runner.memoryUsed).toBe(1);

    putCorpIceOnServer(state, "rd", "onr_v1_233_d-arc-knight");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    state.corp.credits = 40;
    state.runner.credits = 20;
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
    state = applyChoice(state, "corp", `card_${succubusId}`);
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.run).toBeUndefined();
    if (succubusId) {
      expect(state.runner.rig.programs).not.toContain(succubusId);
      expect(state.runner.heap).toContain(succubusId);
    }
    if (hostedJackhammerId) {
      expect(state.runner.rig.programs).not.toContain(hostedJackhammerId);
      expect(state.runner.heap).toContain(hostedJackhammerId);
    }
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses stealth recurring credits for non-noisy breakers and blocks them for noisy breakers", () => {
    let noisyState = toRunnerTurn(
      v170CardReleaseGame("v170-noisy-stealth-block"),
    );
    noisyState.runner.credits = 30;
    moveRunnerCardToGrip(noisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(noisyState, "onr_v1_036_jackhammer");
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_011_cloak",
    );
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(noisyState, action) === "onr_v1_036_jackhammer",
    );
    const jackhammerId = noisyState.runner.rig.programs.find(
      (id) =>
        noisyState.cardInstances[id]?.definitionId === "onr_v1_036_jackhammer",
    );
    noisyState.runner.credits = 0;
    putCorpIceOnServer(noisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(noisyState, "simple_economy_operation");
    noisyState.corp.credits = 40;
    noisyState = apply(
      noisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    noisyState = apply(
      noisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(noisyState, action) === "onr_v1_232_crystal-wall",
    );
    const noisyPump = getLegalActions(noisyState, "runner").find(
      (action) =>
        action.type === "pump_breaker" &&
        action.payload?.breakerId === jackhammerId,
    );
    expect(noisyPump).toBeUndefined();

    let nonNoisyState = toRunnerTurn(
      v170CardReleaseGame("v170-nonnoisy-stealth-allowed"),
    );
    nonNoisyState.runner.credits = 30;
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_011_cloak");
    moveRunnerCardToGrip(nonNoisyState, "onr_v1_021_dwarf");
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_011_cloak",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_021_dwarf",
    );
    const cloakId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_011_cloak",
    );
    const dwarfId = nonNoisyState.runner.rig.programs.find(
      (id) =>
        nonNoisyState.cardInstances[id]?.definitionId === "onr_v1_021_dwarf",
    );
    nonNoisyState.runner.credits = 0;
    putCorpIceOnServer(nonNoisyState, "rd", "onr_v1_232_crystal-wall");
    putCorpCardOnTopOfRd(nonNoisyState, "simple_economy_operation");
    nonNoisyState.corp.credits = 40;
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    nonNoisyState = apply(
      nonNoisyState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(nonNoisyState, action) === "onr_v1_232_crystal-wall",
    );
    const nonNoisyPump = mustAction(
      nonNoisyState,
      "runner",
      (action) =>
        action.type === "pump_breaker" && action.payload?.breakerId === dwarfId,
    );
    nonNoisyState = apply(
      nonNoisyState,
      "runner",
      (action) => action.actionId === nonNoisyPump.actionId,
    );
    if (cloakId) {
      expect(nonNoisyState.cardInstances[cloakId]?.counters?.bit).toBe(2);
      expect(
        getPlayerView(nonNoisyState, "runner").own.rig?.find(
          (card) => card.instanceId === cloakId,
        )?.counters?.bit,
      ).toBe(2);
    }
  });

  it("enforces unique deck/install rules and resolves Smith's Pawnshop start-of-turn choice with Floating Runner BBS income", () => {
    const invalidUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_invalid",
      name: "O:NR V1.7.0 Unique Invalid",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 5 },
      ],
    };
    const invalidValidation = validateDeckDefinition(invalidUniqueDeck, {
      expectedSide: "runner",
    });
    expect(invalidValidation.ok).toBe(false);
    expect(invalidValidation.errors.join(" ")).toMatch(/unique card/i);

    const runtimeUniqueDeck: DeckDefinition = {
      id: "onr_v1_runner_v170_unique_runtime",
      name: "O:NR V1.7.0 Unique Runtime",
      side: "runner",
      identity: "runner_identity_001",
      cards: [
        { id: "onr_v1_180_smiths-pawnshop", quantity: 2 },
        { id: "simple_economy_event", quantity: 6 },
      ],
    };
    let uniqueState = createGameAfterSetup({
      seed: "v170-unique-runtime",
      baseline: CURRENT_RULES_BASELINE,
      runnerDeck: runtimeUniqueDeck,
      corpDeck: ONR_V1_7_0_CORP_DECK,
      agendaPointsToWin: 7,
    });
    uniqueState = toRunnerTurn(uniqueState);
    uniqueState.runner.credits = 10;
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(uniqueState, "onr_v1_180_smiths-pawnshop");
    uniqueState = apply(
      uniqueState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    const duplicateInstall = getLegalActions(uniqueState, "runner").find(
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(uniqueState, action) === "onr_v1_180_smiths-pawnshop",
    );
    expect(duplicateInstall).toBeUndefined();

    let smithState = toRunnerTurn(v170CardReleaseGame("v170-smith-floating"));
    smithState.runner.credits = 20;
    moveRunnerCardToGrip(smithState, "onr_v1_163_floating-runner-bbs");
    moveRunnerCardToGrip(smithState, "onr_v1_180_smiths-pawnshop");
    moveRunnerCardToGrip(smithState, "onr_v1_028_force-shield");
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) ===
          "onr_v1_163_floating-runner-bbs",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_180_smiths-pawnshop",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(smithState, action) === "onr_v1_028_force-shield",
    );
    smithState = apply(
      smithState,
      "runner",
      (action) => action.type === "end_turn",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    smithState = apply(
      smithState,
      "corp",
      (action) => action.type === "end_turn",
    );
    if (
      smithState.pendingChoice?.source === "discard_phase" &&
      smithState.pendingChoice.side === "corp"
    ) {
      smithState = applyChoice(
        smithState,
        "corp",
        String(smithState.pendingChoice.options[0]?.id),
      );
    }
    expect(
      smithState.pendingChoice?.source.startsWith(
        "runner.installed_resource_trash_for_credits",
      ),
    ).toBe(true);
    expect(smithState.pendingChoice?.prompt).toContain("2 Credits");
    const forceShieldOption =
      smithState.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" &&
          smithState.cardInstances[option.value]?.definitionId ===
            "onr_v1_028_force-shield",
      )?.id ?? "pass";
    smithState = applyChoice(smithState, "runner", forceShieldOption);
    expect(
      smithState.runner.heap.some(
        (id) =>
          smithState.cardInstances[id]?.definitionId ===
          "onr_v1_028_force-shield",
      ),
    ).toBe(true);
    expect(smithState.runner.credits).toBe(15);
    expect(smithState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      sourceDefinitionId: "onr_v1_180_smiths-pawnshop",
      installedResourceTrashForCreditsTriggered: true,
      trashedCardDefinitionId: "onr_v1_028_force-shield",
      trashedCardTitle: "Force Shield",
      creditsGained: 2,
      gainedCredits: 2,
    });
  });
});

describe("V1.7.1 Mechanikpaket E", () => {
  it("adds a controlled V1.7.1 core card set for search, access replacement and HQ multiaccess", () => {
    expect(ONR_V1_7_1_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_1_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_114_temple-microcode-outlet"],
    ).toMatchObject({ cost: 1 });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_106_private-ldl-access"],
    ).toMatchObject({
      cost: 0,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_118_weather-to-finance-pipe"],
    ).toMatchObject({ cost: 0 });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_084_edited-shipping-manifests"],
    ).toMatchObject({ cost: 1 });
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_129_hq-interface"]).toMatchObject({
      installCost: 4,
    });
  });

  it("validates V1.7.1 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_1_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_1_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v171CardReleaseGame("v171-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_180_smiths-pawnshop"]).toBeDefined();
  });

  it("resolves Temple Microcode Outlet as hidden-zone stack search and deterministic shuffle", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-temple-search"));
    state.runner.credits = 20;
    const templeId = moveRunnerCardToGrip(
      state,
      "onr_v1_114_temple-microcode-outlet",
    );
    const selectedProgram = putRunnerCardOnTopOfStack(
      state,
      "onr_v1_036_jackhammer",
    );
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === templeId &&
        sourceDefinition(state, action) ===
          "onr_v1_114_temple-microcode-outlet",
    );
    expect(
      state.pendingChoice?.source.startsWith("p3_37.search_stack_to_grip"),
    ).toBe(true);

    const selectedOption =
      state.pendingChoice?.options.find(
        (option) =>
          typeof option.value === "string" && option.value === selectedProgram,
      )?.id ?? "";
    expect(selectedOption).not.toBe("");
    state = applyChoice(state, "runner", selectedOption);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
      publicRevealDefinitionId: "onr_v1_036_jackhammer",
    });
  });

  it("runs Private LDL Access on HQ and accesses R&D instead", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-private-ldl-access"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_106_private-ldl-access");
    putCorpCardOnTopOfRd(state, "onr_v1_203_hostile-takeover");
    const hqOperationId = moveCorpCardToHq(state, "simple_economy_operation");
    keepOnlyCorpHqCard(state, hqOperationId);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "onr_v1_106_private-ldl-access" &&
        action.payload?.serverId === "hq",
    );
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_203_hostile-takeover",
      title: "Hostile Takeover",
      serverLabel: "R&D",
    });
    state = apply(state, "runner", (action) => action.type === "steal_agenda");
    expect(state.run).toBeUndefined();
    expect(state.corp.hq).toContain(hqOperationId);
  });

  it("runs P3.32 CardImplementation multiaccess events on their printed central servers", () => {
    let rdState = toRunnerTurn(v123CardReleaseGame("p3-32-custodial"));
    rdState.runner.credits = 20;
    moveRunnerCardToGrip(rdState, "onr_v1_081_custodial-position");
    putCorpCardOnTopOfRd(rdState, "onr_v1_203_hostile-takeover");
    putCorpCardOnTopOfRd(rdState, "onr_v1_297_overtime-incentives");
    putCorpCardOnTopOfRd(rdState, "onr_v1_306_trojan-horse");

    rdState = apply(
      rdState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rdState, action) === "onr_v1_081_custodial-position" &&
        action.payload?.serverId === "rd",
    );

    expect(rdState.run?.breach?.serverId).toBe("rd");
    expect(rdState.run?.breach?.queue).toHaveLength(3);
    expect(rdState.eventLog.at(-1)?.publicPayload).toMatchObject({
      baseAccessCount: 3,
      effectiveAccessCount: 3,
    });

    let hqState = toRunnerTurn(v123CardReleaseGame("p3-32-wiretaps"));
    hqState.runner.credits = 20;
    moveRunnerCardToGrip(hqState, "onr_v1_085_executive-wiretaps");
    const hqIds = [
      moveCorpCardToHq(hqState, "onr_v1_203_hostile-takeover"),
      moveCorpCardToHq(hqState, "onr_v1_297_overtime-incentives"),
      moveCorpCardToHq(hqState, "onr_v1_306_trojan-horse"),
    ];
    keepOnlyCorpHqCards(hqState, hqIds);

    hqState = apply(
      hqState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(hqState, action) === "onr_v1_085_executive-wiretaps" &&
        action.payload?.serverId === "hq",
    );

    expect(hqState.run?.breach?.serverId).toBe("hq");
    expect(
      hqState.run?.breach?.queue.filter((entry) => entry.zone === "hq"),
    ).toHaveLength(3);
    expect(hqState.eventLog.at(-1)?.publicPayload).toMatchObject({
      baseAccessCount: 3,
      effectiveAccessCount: 3,
    });
  });

  it("applies successful-run replacement effects for Weather-to-Finance Pipe and Edited Shipping Manifests", () => {
    let weatherState = toRunnerTurn(v171CardReleaseGame("v171-weather-pipe"));
    weatherState.runner.credits = 20;
    weatherState.corp.credits = 10;
    moveRunnerCardToGrip(weatherState, "onr_v1_118_weather-to-finance-pipe");
    const weatherHqIds = weatherState.corp.hq.slice();
    weatherState = apply(
      weatherState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(weatherState, action) ===
          "onr_v1_118_weather-to-finance-pipe" &&
        action.payload?.serverId === "hq",
    );
    expect(weatherState.run).toBeUndefined();
    expect(weatherState.corp.credits).toBe(6);
    expect(weatherState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_event",
      accessReplacement: "corp_lose_credits",
      creditLoss: 4,
      corpCreditsAfter: 6,
      runSuccessful: true,
      accessSkipped: true,
      serverId: "hq",
      sourceDefinitionId: "onr_v1_118_weather-to-finance-pipe",
      sourceTitle: "Weather-to-Finance Pipe",
    });
    for (const hiddenHqId of weatherHqIds)
      expect(
        JSON.stringify(weatherState.eventLog.at(-1)?.publicPayload),
      ).not.toContain(hiddenHqId);
    for (const side of ["runner", "corp"] as const) {
      const publicResult = getPlayerView(weatherState, side).publicEvents.at(
        -1,
      );
      expect(publicResult?.publicPayload).toMatchObject({
        accessReplacement: "corp_lose_credits",
        runSuccessful: true,
        accessSkipped: true,
        serverId: "hq",
        creditLoss: 4,
      });
      for (const hiddenHqId of weatherHqIds)
        expect(JSON.stringify(publicResult)).not.toContain(hiddenHqId);
    }

    let weatherIceState = toRunnerTurn(
      v171CardReleaseGame("v171-weather-pipe-with-ice"),
    );
    weatherIceState.runner.credits = 20;
    weatherIceState.corp.credits = 10;
    moveRunnerCardToGrip(weatherIceState, "onr_v1_118_weather-to-finance-pipe");
    const weatherIceHqIds = weatherIceState.corp.hq.slice();
    putCorpIceOnServer(weatherIceState, "hq", "onr_v1_232_crystal-wall");
    weatherIceState = apply(
      weatherIceState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(weatherIceState, action) ===
          "onr_v1_118_weather-to-finance-pipe",
    );
    expect(weatherIceState.timingPoint).toBe("run.approach_ice");
    weatherIceState = apply(
      weatherIceState,
      "corp",
      (action) => action.type === "decline_rez",
    );
    weatherIceState = apply(
      weatherIceState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(weatherIceState.run).toBeUndefined();
    expect(weatherIceState.corp.credits).toBe(6);
    expect(weatherIceState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "continue_run",
      accessReplacement: "corp_lose_credits",
      creditLoss: 4,
      corpCreditsAfter: 6,
      runSuccessful: true,
      accessSkipped: true,
      serverId: "hq",
      sourceDefinitionId: "onr_v1_118_weather-to-finance-pipe",
      sourceTitle: "Weather-to-Finance Pipe",
    });
    expect(
      getLegalActions(weatherIceState, "runner").some(
        (action) => action.type === "access_card",
      ),
    ).toBe(false);
    for (const side of ["runner", "corp"] as const) {
      const publicResult = getPlayerView(weatherIceState, side).publicEvents.at(
        -1,
      );
      expect(publicResult?.publicPayload.actionType).toBe("continue_run");
      for (const hiddenHqId of weatherIceHqIds)
        expect(JSON.stringify(publicResult)).not.toContain(hiddenHqId);
    }

    let weatherLowCreditsState = toRunnerTurn(
      v171CardReleaseGame("v171-weather-pipe-low-corp-credits"),
    );
    weatherLowCreditsState.runner.credits = 20;
    weatherLowCreditsState.corp.credits = 2;
    moveRunnerCardToGrip(
      weatherLowCreditsState,
      "onr_v1_118_weather-to-finance-pipe",
    );
    weatherLowCreditsState = apply(
      weatherLowCreditsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(weatherLowCreditsState, action) ===
          "onr_v1_118_weather-to-finance-pipe",
    );
    expect(weatherLowCreditsState.corp.credits).toBe(0);
    expect(weatherLowCreditsState.eventLog.at(-1)?.publicPayload).toMatchObject(
      {
        accessReplacement: "corp_lose_credits",
        creditLoss: 2,
        corpCreditsAfter: 0,
        runSuccessful: true,
        accessSkipped: true,
      },
    );

    let failedWeatherState = toRunnerTurn(
      v171CardReleaseGame("v171-weather-pipe-failed-run"),
    );
    failedWeatherState.runner.credits = 20;
    failedWeatherState.corp.credits = 10;
    moveRunnerCardToGrip(
      failedWeatherState,
      "onr_v1_118_weather-to-finance-pipe",
    );
    const failedWeatherIceId = putCorpIceOnServer(
      failedWeatherState,
      "hq",
      "onr_v1_232_crystal-wall",
    );
    const failedWeatherEventStart = failedWeatherState.eventLog.length;
    failedWeatherState = apply(
      failedWeatherState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(failedWeatherState, action) ===
          "onr_v1_118_weather-to-finance-pipe",
    );
    failedWeatherState = apply(
      failedWeatherState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        action.payload?.cardId === failedWeatherIceId,
    );
    failedWeatherState = apply(
      failedWeatherState,
      "runner",
      (action) => action.type === "continue_run",
    );
    expect(failedWeatherState.run).toBeUndefined();
    expect(failedWeatherState.corp.credits).toBe(
      10 - (CARD_DEFINITIONS_BY_ID["onr_v1_232_crystal-wall"]?.rezCost ?? 0),
    );
    expect(
      failedWeatherState.eventLog
        .slice(failedWeatherEventStart)
        .some(
          (event) =>
            event.publicPayload.accessReplacement === "corp_lose_credits",
        ),
    ).toBe(false);

    let manifestsState = toRunnerTurn(
      createGameAfterSetup({
        seed: "v171-edited-shipping",
        runnerDeck: {
          ...ONR_V1_7_1_RUNNER_DECK,
          id: "v171_edited_shipping_fall_guy_runner",
          cards: [
            { id: "onr_v1_161_fall-guy", quantity: 1 },
            ...ONR_V1_7_1_RUNNER_DECK.cards,
          ],
        },
        corpDeck: ONR_V1_7_1_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    manifestsState.runner.credits = 20;
    manifestsState.corp.credits = 8;
    const manifestsFallGuyId = installRunnerResourceForTest(
      manifestsState,
      "onr_v1_161_fall-guy",
    );
    moveRunnerCardToGrip(
      manifestsState,
      "onr_v1_084_edited-shipping-manifests",
    );
    const runnerCreditsBefore = manifestsState.runner.credits;
    const corpHqBefore = manifestsState.corp.hq.length;
    const corpRdBefore = manifestsState.corp.rd.length;
    const manifestsInitial = structuredClone(manifestsState);
    const manifestsReplayStart = manifestsState.eventLog.length;
    manifestsState = apply(
      manifestsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(manifestsState, action) ===
          "onr_v1_084_edited-shipping-manifests" &&
        action.payload?.serverId === "hq",
    );
    expect(manifestsState.run).toBeDefined();
    expect(manifestsState.corp.credits).toBe(7);
    expect(manifestsState.runner.tags).toBe(0);
    expect(manifestsState.runner.credits).toBe(runnerCreditsBefore - 1);
    expect(manifestsState.pendingAddTagContinuation).toMatchObject({
      kind: "successful_run_access_replacement",
    });
    expect(manifestsState.pendingChoice?.source).toContain(
      "event_modification",
    );

    const manifestsPassState = applyChoice(
      structuredClone(manifestsState),
      "runner",
      "pass",
    );
    expect(manifestsPassState.run).toBeUndefined();
    expect(manifestsPassState.runner.tags).toBe(1);
    expect(manifestsPassState.runner.credits).toBe(
      runnerCreditsBefore - 1 + 10,
    );
    expect(manifestsPassState.runner.rig.resources).toContain(
      manifestsFallGuyId,
    );

    const manifestsFallGuyOption = manifestsState.pendingChoice?.options.find(
      (option) => option.id.includes(String(manifestsFallGuyId)),
    )?.id;
    manifestsState = applyChoice(
      manifestsState,
      "runner",
      String(manifestsFallGuyOption),
    );
    expect(manifestsState.run).toBeUndefined();
    expect(manifestsState.runner.tags).toBe(0);
    expect(manifestsState.runner.credits).toBe(runnerCreditsBefore - 1 + 10);
    expect(manifestsState.runner.heap).toContain(manifestsFallGuyId);
    expect(manifestsState.corp.hq.length).toBe(corpHqBefore);
    expect(manifestsState.corp.rd.length).toBe(corpRdBefore);
    expect(manifestsState.eventLog.at(-1)?.publicPayload).toMatchObject({
      creditLoss: 1,
      tagsAdded: 0,
      gainedCredits: 10,
    });
    for (const branch of [manifestsPassState, manifestsState]) {
      const replay = replayEvents(
        manifestsInitial,
        branch.eventLog.slice(manifestsReplayStart),
      );
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }

    let noCreditsState = toRunnerTurn(
      v171CardReleaseGame("v171-edited-shipping-no-corp-credits"),
    );
    noCreditsState.runner.credits = 20;
    noCreditsState.corp.credits = 0;
    moveRunnerCardToGrip(
      noCreditsState,
      "onr_v1_084_edited-shipping-manifests",
    );
    const hqCardId = moveCorpCardToHq(
      noCreditsState,
      "simple_economy_operation",
    );
    keepOnlyCorpHqCard(noCreditsState, hqCardId);
    noCreditsState = apply(
      noCreditsState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(noCreditsState, action) ===
          "onr_v1_084_edited-shipping-manifests" &&
        action.payload?.serverId === "hq",
    );
    expect(noCreditsState.run?.breach?.serverId).toBe("hq");
    expect(noCreditsState.runner.tags).toBe(0);
    expect(noCreditsState.runner.credits).toBe(19);
    expect(noCreditsState.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "accessReplacement",
    );
  });

  it("uses P3.32 free-trash run events only for accessed cards from the printed central", () => {
    let kilroyState = toRunnerTurn(v192CardReleaseGame("p3-32-kilroy"));
    kilroyState.runner.credits = 20;
    moveRunnerCardToGrip(kilroyState, "onr_v1_096_kilroy-was-here");
    putCorpCardOnTopOfRd(kilroyState, "simple_economy_operation");
    kilroyState = apply(
      kilroyState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(kilroyState, action) ===
          "onr_v1_096_kilroy-was-here" &&
        action.payload?.serverId === "rd",
    );
    kilroyState = apply(
      kilroyState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      getLegalActions(kilroyState, "runner").find(
        (action) => action.type === "trash_accessed_card",
      )?.payload,
    ).toMatchObject({
      freeAccessTrash: true,
      accessTrashCostOverride: 0,
    });

    let rompState = toRunnerTurn(v192CardReleaseGame("p3-32-romp"));
    rompState.runner.credits = 20;
    moveRunnerCardToGrip(rompState, "onr_v1_107_romp-through-hq");
    const hqCardId = moveCorpCardToHq(rompState, "simple_economy_operation");
    keepOnlyCorpHqCard(rompState, hqCardId);
    rompState = apply(
      rompState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(rompState, action) === "onr_v1_107_romp-through-hq" &&
        action.payload?.serverId === "hq",
    );
    rompState = apply(
      rompState,
      "runner",
      (action) => action.type === "access_card",
    );
    expect(
      getLegalActions(rompState, "runner").find(
        (action) => action.type === "trash_accessed_card",
      )?.payload,
    ).toMatchObject({
      freeAccessTrash: true,
      accessTrashCostOverride: 0,
    });
  });

  it("grants one additional HQ access per installed HQ Interface", () => {
    let state = toRunnerTurn(v171CardReleaseGame("v171-hq-interface"));
    state.runner.credits = 20;
    moveRunnerCardToGrip(state, "onr_v1_129_hq-interface");
    const firstHqCard = moveCorpCardToHq(state, "simple_economy_operation");
    const secondHqCard = moveCorpCardToHq(state, "onr_v1_295_night-shift");
    keepOnlyCorpHqCards(state, [firstHqCard, secondHqCard]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_129_hq-interface",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );

    expect(state.run?.breach?.serverId).toBe("hq");
    expect(state.run?.breach?.queue).toHaveLength(2);
    expect(state.run?.accessCount).toBe(1);
  });
});

describe("V1.7.2 Mechanikpaket F", () => {
  it("adds a controlled V1.7.2 core card set for trace, tag-resource interaction and runner resource actions", () => {
    expect(ONR_V1_7_2_FINAL_CARD_IDS).toHaveLength(5);
    for (const definitionId of ONR_V1_7_2_FINAL_CARD_IDS) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
    }
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_283_audit-of-call-records"],
    ).toMatchObject({
      cost: 0,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_284_chance-observation"],
    ).toMatchObject({
      cost: 2,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_286_corporate-detective-agency"],
    ).toMatchObject({ cost: 1 });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_158_danshis-second-id"],
    ).toMatchObject({
      installCost: 0,
    });
    expect(
      CARD_DEFINITIONS_BY_ID["onr_v1_179_silicon-saloon-franchise"],
    ).toMatchObject({ installCost: 8 });
  });

  it("validates V1.7.2 smoke decks and keeps previous releases available", () => {
    const runnerValidation = validateDeckDefinition(ONR_V1_7_2_RUNNER_DECK, {
      expectedSide: "runner",
    });
    const corpValidation = validateDeckDefinition(ONR_V1_7_2_CORP_DECK, {
      expectedSide: "corp",
      minimumAgendaPoints: 7,
    });
    const state = v172CardReleaseGame("v172-validation");
    expect(runnerValidation.ok).toBe(true);
    expect(runnerValidation.errors).toEqual([]);
    expect(corpValidation.ok).toBe(true);
    expect(corpValidation.errors).toEqual([]);
    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(CARD_DEFINITIONS_BY_ID["onr_v1_129_hq-interface"]).toBeDefined();
  });

  it("gates Chance Observation and Audit of Call Records by runner run attempts of the previous turn", () => {
    let oneAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-one-attempt-gate"),
    );
    oneAttemptState.runner.credits = 30;
    oneAttemptState.corp.credits = 30;
    moveCorpCardToHq(oneAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(oneAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(oneAttemptState, "rd", "onr_v1_232_crystal-wall");

    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(oneAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    oneAttemptState = apply(
      oneAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const oneAttemptOps = getLegalActions(oneAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(oneAttemptState, action));
    expect(oneAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(oneAttemptOps).not.toContain("onr_v1_283_audit-of-call-records");

    let twoAttemptState = toRunnerTurn(
      v172CardReleaseGame("v172-two-attempt-gate"),
    );
    twoAttemptState.runner.credits = 30;
    twoAttemptState.corp.credits = 30;
    moveCorpCardToHq(twoAttemptState, "onr_v1_283_audit-of-call-records");
    moveCorpCardToHq(twoAttemptState, "onr_v1_284_chance-observation");
    putCorpIceOnServer(twoAttemptState, "rd", "onr_v1_232_crystal-wall");

    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(twoAttemptState, action) === "onr_v1_232_crystal-wall",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "continue_run",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );

    const twoAttemptOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(twoAttemptOps).toContain("onr_v1_284_chance-observation");
    expect(twoAttemptOps).toContain("onr_v1_283_audit-of-call-records");

    twoAttemptState.corp.maxHandSize = 100;
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "runner",
      (action) => action.type === "end_turn",
    );
    twoAttemptState = apply(
      twoAttemptState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const resetOps = getLegalActions(twoAttemptState, "corp")
      .filter((action) => action.type === "play_operation")
      .map((action) => sourceDefinition(twoAttemptState, action));
    expect(resetOps).not.toContain("onr_v1_284_chance-observation");
    expect(resetOps).not.toContain("onr_v1_283_audit-of-call-records");
  });

  it("resolves operation traces outside runs and returns deterministically to corp action context", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-operation-trace"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveCorpCardToHq(state, "onr_v1_283_audit-of-call-records");
    putCorpIceOnServer(state, "rd", "onr_v1_232_crystal-wall");

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
        sourceDefinition(state, action) === "onr_v1_232_crystal-wall",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");

    const beforeTags = state.runner.tags;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_283_audit-of-call-records",
    );

    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.source.startsWith("trace:op_trace")).toBe(true);
    expect(state.trace?.returnPhase).toBe("corp_action_phase");
    expect(state.trace?.returnTimingPoint).toBe("corp_action.main");
    expect(state.trace?.returnActiveSide).toBe("corp");
    state = applyChoice(state, "corp", "bid_2");
    state = applyChoice(state, "runner", "bid_0");

    expect(state.runner.tags).toBe(beforeTags + 1);
    expect(state.phase).toBe("corp_action_phase");
    expect(state.timingPoint).toBe("corp_action.main");
    expect(state.activeSide).toBe("corp");
    expect(state.trace).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("trashes up to two runner resources with Corporate Detective Agency when the runner is tagged", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-detective-agency"));
    state.runner.credits = 30;
    state.corp.credits = 30;
    moveRunnerCardToGrip(state, "onr_v1_158_danshis-second-id");
    moveRunnerCardToGrip(state, "onr_v1_179_silicon-saloon-franchise");
    moveRunnerCardToGrip(state, "onr_v1_163_floating-runner-bbs");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_158_danshis-second-id",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_163_floating-runner-bbs",
    );
    state.runner.tags = 1;
    const resourcesBefore = state.runner.rig.resources.slice();

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "onr_v1_286_corporate-detective-agency");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) ===
          "onr_v1_286_corporate-detective-agency",
    );

    expect(state.runner.rig.resources).toHaveLength(1);
    expect(
      state.runner.heap.filter((cardId) => resourcesBefore.includes(cardId)),
    ).toHaveLength(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      cardDefinitionId: "onr_v1_286_corporate-detective-agency",
    });
  });

  it("executes Danshi's Second ID and Silicon Saloon Franchise as runner resource actions", () => {
    let state = toRunnerTurn(v172CardReleaseGame("v172-resource-actions"));
    state.runner.credits = 30;
    state.runner.tags = 5;
    state.runner.clicks = 10;
    const danshiId = moveRunnerCardToGrip(
      state,
      "onr_v1_158_danshis-second-id",
    );
    const siliconId = moveRunnerCardToGrip(
      state,
      "onr_v1_179_silicon-saloon-franchise",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === danshiId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === siliconId,
    );

    const tagsBefore = state.runner.tags;
    const creditsBeforeDanshi = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === danshiId &&
        sourceDefinition(state, action) === "onr_v1_158_danshis-second-id",
    );
    expect(state.runner.tags).toBe(tagsBefore - 3);
    expect(state.runner.credits).toBe(creditsBeforeDanshi);
    expect(state.runner.heap).toContain(danshiId);

    const creditsBeforeSilicon = state.runner.credits;
    const gripBeforeSilicon = state.runner.grip.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        String(action.payload?.cardId) === siliconId,
    );
    expect(state.runner.credits).toBe(creditsBeforeSilicon + 1);
    expect(state.runner.grip.length).toBe(gripBeforeSilicon + 1);
  });
});
