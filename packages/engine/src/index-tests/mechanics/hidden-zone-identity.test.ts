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

describe("MVP 0.98a Identity and modifiers", () => {
  it("creates deterministic V0.98 games with setup and static identity modifiers", () => {
    const first = v098IdentityGame("v098-identity-setup");
    const second = v098IdentityGame("v098-identity-setup");
    const legacy = createGameAfterSetup({ seed: "v098-legacy-identity" });

    expect(first.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(first.deckMetadata?.runner.cardPoolSnapshotId).toBe(
      "card-snapshot-0.98",
    );
    expect(first.deckMetadata?.corp.formatProfileId).toBe("local-demo-v0.98");
    expect(first.runner.credits).toBe(6);
    expect(first.corp.credits).toBe(6);
    expect(first.runner.memoryLimit).toBe(5);
    expect(first.identityAbilityUsage?.corp?.setupAbilities).toEqual([
      "v098_corp_identity_setup_credit",
    ]);
    expect(first.identityAbilityUsage?.runner?.setupAbilities).toEqual([
      "v098_runner_identity_setup_credit",
    ]);
    expect(hashState(first)).toBe(hashState(second));
    expect(first.randomDrawRecords).toEqual(second.randomDrawRecords);
    expect(validateGameState(first).ok).toBe(true);

    expect(legacy.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(legacy.runner.credits).toBe(5);
    expect(legacy.corp.credits).toBe(5);
    expect(legacy.runner.memoryLimit).toBe(4);
    expect(legacy.identityAbilityUsage).toBeUndefined();
  });

  it("uses V0.98 runner base link during Trace bidding", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-link-trace"));
    putCorpIceOnServer(state, "rd", "v096_trace_probe_ice");
    state.corp.credits = 8;
    state.runner.credits = 5;

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
        sourceDefinition(state, action) === "v096_trace_probe_ice",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_0");

    expect(state.trace?.runnerLink).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      runnerLink: 1,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
  });

  it("applies static memory before installs and validates replay-safe state hashes", () => {
    const state = v098IdentityGame("v098-memory-static");
    const initialHash = hashState(state);

    installRunnerProgramCopyForTest(state, "simple_fracter");
    installRunnerProgramCopyForTest(state, "simple_fracter");
    installRunnerProgramCopyForTest(state, "simple_decoder");
    installRunnerProgramCopyForTest(state, "simple_killer");
    installRunnerProgramCopyForTest(state, "simple_killer");

    expect(state.runner.memoryLimit).toBe(5);
    expect(state.runner.memoryUsed).toBe(5);
    expect(validateGameState(state).ok).toBe(true);
    expect(hashState(v098IdentityGame("v098-memory-static"))).toBe(initialHash);
  });

  it("does not expose V0.99+ mechanics while enabling identity modifiers", () => {
    const state = toRunnerTurn(v098IdentityGame("v098-no-future-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).toContain(
      "identity_ability",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "purge",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "prevention",
    );
    expect(DEMO_CARDS_BY_ID.v098_runner_identity?.mechanics).not.toContain(
      "replacement",
    );
  });

  it("searches the Runner stack through a private Choice and deterministic shuffle", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-search-stack"));
    moveRunnerCardToGrip(state, "v098_stack_search_event");
    const selectedProgram = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_search_event",
    );

    expect(state.pendingChoice?.kind).toBe("select_cards");
    expect(state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.some(
        (option) => option.label === "Simple Decoder",
      ),
    ).toBe(true);
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Decoder",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: "corp.resolve_choice.game_rule",
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [`card_${selectedProgram}`],
      },
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const invalidChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: mustAction(
        state,
        "runner",
        (action) => action.type === "resolve_choice",
      ).actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["card_not_in_choice"],
      },
    });
    expect(invalidChoice.ok).toBe(false);
    if (!invalidChoice.ok)
      expect(invalidChoice.error.code).toBe("ERR_INVALID_CHOICE");

    state = applyChoice(state, "runner", `card_${selectedProgram}`);

    expect(state.runner.grip).toContain(selectedProgram);
    expect(state.runner.stack).not.toContain(selectedProgram);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Decoder",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("arranges top stack cards privately without exposing order to the Corp", () => {
    let state = toRunnerTurn(v098IdentityGame("v098-arrange-stack"));
    moveRunnerCardToGrip(state, "v098_stack_arrange_event");
    const first = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const second = putRunnerCardOnTopOfStack(state, "simple_run_event");
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(state, action) === "v098_stack_arrange_event",
    );

    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.label,
      ),
    ).toEqual(["Simple Run Event", "Simple Economy Event"]);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Run Event",
    );

    state = applyChoices(state, "runner", [`card_${first}`, `card_${second}`]);

    expect(state.runner.stack.slice(0, 2)).toEqual([first, second]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Run Event",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });

  it("reveals and exposes only deliberate public card information", () => {
    let revealState = toRunnerTurn(v098IdentityGame("v098-reveal-top"));
    moveRunnerCardToGrip(revealState, "v098_reveal_top_event");
    putRunnerCardOnTopOfStack(revealState, "simple_decoder");

    revealState = apply(
      revealState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(revealState, action) === "v098_reveal_top_event",
    );

    expect(revealState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(revealState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "reveal",
      cardDefinitionId: "simple_decoder",
      title: "Simple Decoder",
    });

    let exposeState = toRunnerTurn(v098IdentityGame("v098-expose"));
    moveRunnerCardToGrip(exposeState, "v098_expose_event");
    const exposed = putCorpRootInRemote(exposeState, "simple_economy_asset");

    exposeState = apply(
      exposeState,
      "runner",
      (action) =>
        action.type === "play_event" &&
        sourceDefinition(exposeState, action) === "v098_expose_event" &&
        action.payload?.serverId === "remote_1",
    );

    expect(exposeState.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(exposeState.eventLog.at(-1)?.publicPayload).toMatchObject({
      revealKind: "expose",
      cardDefinitionId: "simple_economy_asset",
      title: "Simple Economy Asset",
    });
    expect(exposeState.cardInstances[exposed]?.rezzed).toBe(false);
    expect(
      getPlayerView(exposeState, "runner").servers.find(
        (server) => server.id === "remote_1",
      )?.root[0]?.known,
    ).toBe(false);
  });

  it("swaps Corp hidden zones without unrecorded randomness or public title leaks", () => {
    let state = v098IdentityGame("v098-swap-hq-rd");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v098_hq_rd_swap_operation");
    const hqCard = moveCorpCardToHq(state, "simple_economy_asset");
    const rdCard = putCorpCardOnTopOfRd(state, "simple_agenda");
    const randomBefore = state.randomDrawRecords.length;
    const initial = structuredClone(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v098_hq_rd_swap_operation",
    );

    expect(state.corp.hq).toContain(rdCard);
    expect(state.corp.rd[0]).toBe(hqCard);
    expect(state.randomDrawRecords.length).toBe(randomBefore);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("hidden_info_barrier");
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Agenda",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "Simple Agenda",
    );
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length)).ok,
    ).toBe(true);
  });
});

describe("V1.9.11 Hidden-Zone Search/Reveal/Reorder WIP", () => {
  it("adds first scoped V1.9.11 hidden-zone event definitions without pulling in later release cards", () => {
    const implementedWipIds = [
      "onr_v1_042_mouse",
      "onr_v1_058_seeya",
      "onr_v1_059_self-modifying-code",
      "onr_v1_087_forgotten-backup-chip",
      "onr_v1_088_fortress-respecification",
      "onr_v1_089_gideons-pawnshop",
      "onr_v1_092_ice-and-datas-guide-to-the-net",
      "onr_v1_099_mantis-fixer-at-large",
      "onr_v1_110_sneak-preview",
      "onr_v1_151_aujourdoui",
      "onr_v1_169_n-e-t-o",
      "onr_v1_175_ronin-around",
      "onr_v1_177_the-short-circuit",
      "onr_v1_194_corporate-downsizing",
      "onr_v1_250_ice-pick-willie",
      "onr_v1_272_too-many-doors",
    ];
    for (const definitionId of implementedWipIds) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      if (definitionId === "onr_v1_250_ice-pick-willie") {
        expect(definition?.mechanics).toContain("trash_installed_program");
      } else {
        expect(definition?.mechanics).toContain("hidden_zone_tool");
      }
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("resolves Forgotten Backup Chip trash search through a private PendingChoice and replay-safe StateHash", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-search"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_087_forgotten-backup-chip",
    );
    const targetProgramId = moveRunnerCardToGrip(state, "simple_decoder");
    removeEverywhere(state, targetProgramId);
    state.runner.heap.push(targetProgramId);
    state.cardInstances[targetProgramId] = {
      ...state.cardInstances[targetProgramId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.pendingChoice?.source).toContain("p3_37.search_trash_to_grip");
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.cardSearchPresentation).toMatchObject({
      sourceZone: "heap",
      selectableFilter: "program",
      destination: "grip",
      showNonMatchingCards: true,
    });
    expect(
      runnerChoice?.options.some((option) => option.label === "Simple Decoder"),
    ).toBe(true);
    expect(
      runnerChoice?.options.find((option) => option.value === targetProgramId)
        ?.card,
    ).toMatchObject({ title: "Simple Decoder" });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();

    const optionId = runnerChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetProgramId);
    expect(state.runner.heap).not.toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_search_trash_to_grip",
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("shows the full Runner trash during program search while only programs are selectable", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-search"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_087_forgotten-backup-chip",
    );
    const displayOnlyEventId = moveRunnerCardToGrip(
      state,
      "simple_economy_event",
    );
    removeEverywhere(state, displayOnlyEventId);
    state.runner.heap.push(displayOnlyEventId);
    state.cardInstances[displayOnlyEventId] = {
      ...state.cardInstances[displayOnlyEventId]!,
      zone: { side: "runner", zone: "heap" },
    };
    const targetProgramId = moveRunnerCardToGrip(state, "simple_decoder");
    removeEverywhere(state, targetProgramId);
    state.runner.heap.push(targetProgramId);
    state.cardInstances[targetProgramId] = {
      ...state.cardInstances[targetProgramId]!,
      zone: { side: "runner", zone: "heap" },
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );

    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.cardSearchPresentation).toMatchObject({
      sourceZone: "heap",
      selectableFilter: "program",
      destination: "grip",
      showNonMatchingCards: true,
    });
    const programOption = runnerChoice?.options.find(
      (option) => option.value === targetProgramId,
    );
    const eventOption = runnerChoice?.options.find(
      (option) => option.value === displayOnlyEventId,
    );
    expect(eventOption?.card).toMatchObject({
      title: "Simple Economy Event",
    });

    expect(programOption).toMatchObject({
      label: "Simple Decoder",
    });
    expect(programOption?.selectable).toBeUndefined();
    expect(eventOption).toMatchObject({
      label: "Simple Economy Event",
      selectable: false,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(() => applyChoice(state, "runner", String(eventOption?.id))).toThrow(
      "Eine gewaehlte Option ist fuer diesen Effekt nicht auswaehlbar.",
    );
  });

  it("lets Mantis choose any Runner stack card instead of only programs", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-search"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_099_mantis-fixer-at-large",
    );
    const targetEventId = putRunnerCardOnTopOfStack(
      state,
      "simple_economy_event",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );

    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.source).toContain("p3_37.search_stack_to_grip");
    const eventOption = runnerChoice?.options.find(
      (option) => option.value === targetEventId,
    );
    expect(runnerChoice?.cardSearchPresentation).toMatchObject({
      sourceZone: "stack",
      selectableFilter: "any_card",
      destination: "grip",
      showNonMatchingCards: true,
    });
    expect(eventOption).toMatchObject({
      label: "Simple Economy Event",
    });
    expect(eventOption?.selectable).toBeUndefined();

    state = applyChoice(state, "runner", String(eventOption?.id));
    expect(state.runner.grip).toContain(targetEventId);
    expect(state.runner.stack).not.toContain(targetEventId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_stack_to_grip",
    });
  });

  it("lets Gideon's Pawnshop take any Runner trash card into the grip", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-gideon"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(state, "onr_v1_089_gideons-pawnshop");
    const targetEventId = moveRunnerCardToGrip(state, "simple_economy_event");
    removeEverywhere(state, targetEventId);
    state.runner.heap.push(targetEventId);
    state.cardInstances[targetEventId] = {
      ...state.cardInstances[targetEventId]!,
      zone: { side: "runner", zone: "heap" },
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.pendingChoice?.source).toContain("p3_37.search_trash_to_grip");
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetEventId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetEventId);
    expect(state.runner.heap).not.toContain(targetEventId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_search_trash_to_grip",
      cardDefinitionId: "simple_economy_event",
    });
  });

  it("uses Aujourd'Oui to take paid shown programs from the stack top", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-aujourdhui"));
    state.runner.credits = 20;
    installRunnerResourceForTest(state, "onr_v1_151_aujourdoui");
    const eventId = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const decoderId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const fracterId = putRunnerCardOnTopOfStack(state, "simple_fracter");
    const creditsBefore = state.runner.credits;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_151_aujourdoui",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.look_top_stack_take_matching",
    );
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(
      runnerChoice?.options.find((option) => option.value === eventId)?.selectable,
    ).toBe(false);
    const selectedOptionIds = [decoderId, fracterId].map(
      (cardId) =>
        runnerChoice?.options.find((option) => option.value === cardId)?.id ?? "",
    );
    expect(selectedOptionIds.every(Boolean)).toBe(true);
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.runner.grip).toEqual(
      expect.arrayContaining([decoderId, fracterId]),
    );
    expect(state.runner.credits).toBe(creditsBefore - 2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      publicRevealDefinitionIds: "simple_decoder,simple_fracter",
    });
  });

  it("uses N.E.T.O. to take paid shown prep/resource cards from the stack top", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "v1911-neto",
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.hiddenZone.runner,
          id: "v1911_neto_resource_runner",
          cards: [
            ...MECHANIC_SMOKE_DECKS.hiddenZone.runner.cards,
            { id: "onr_v1_178_short-term-contract", quantity: 1 },
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.hiddenZone.corp,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 20;
    installRunnerResourceForTest(state, "onr_v1_169_n-e-t-o");
    const programId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const resourceId = putRunnerCardOnTopOfStack(state, "onr_v1_178_short-term-contract");
    const prepId = putRunnerCardOnTopOfStack(state, "simple_economy_event");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_169_n-e-t-o",
    );
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(
      runnerChoice?.options.find((option) => option.value === programId)?.selectable,
    ).toBe(false);
    const selectedOptionIds = [prepId, resourceId].map(
      (cardId) =>
        runnerChoice?.options.find((option) => option.value === cardId)?.id ?? "",
    );
    expect(selectedOptionIds.every(Boolean)).toBe(true);
    state = applyChoices(state, "runner", selectedOptionIds);
    expect(state.runner.grip).toEqual(
      expect.arrayContaining([prepId, resourceId]),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
    });
  });

  it("uses Sneak Preview to choose Stack first, install a program at no cost, shuffle and return it at end of turn", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-reveal"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(state, "onr_v1_110_sneak-preview");
    const displayOnlyEventId = putRunnerCardOnTopOfStack(
      state,
      "simple_economy_event",
    );
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_38.stack_or_trash_program_install_source",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    state = applyChoice(state, "runner", "source_stack");
    expect(state.pendingChoice?.source).toContain(
      "p3_38.stack_or_trash_program_install",
    );
    expect(getPlayerView(state, "runner").pendingChoice?.stackSearchResolution).toMatchObject({
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
    });
    expect(getPlayerView(state, "runner").pendingChoice?.cardSearchPresentation).toMatchObject({
      sourceZone: "stack",
      selectableFilter: "program",
      destination: "install_program",
      showNonMatchingCards: true,
      temporaryReturnAtEndOfTurn: true,
    });
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.find(
        (option) => option.value === displayOnlyEventId,
      ),
    ).toMatchObject({
      label: "Simple Economy Event",
      selectable: false,
      card: { title: "Simple Economy Event" },
    });
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.rig.programs).toContain(targetProgramId);
    expect(state.runner.grip).not.toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_38_stack_or_trash_program_install",
      sourceDefinitionId: "onr_v1_110_sneak-preview",
      installedProgramDefinitionId: "simple_decoder",
      temporaryInstall: true,
    });
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.runner.rig.programs).not.toContain(targetProgramId);
    expect(state.runner.grip).toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "sneak_preview_end_turn_return",
      returnedCount: 1,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Sneak Preview to choose Heap first, install for free without shuffling, and does not return if the program left play", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-reveal"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(state, "onr_v1_110_sneak-preview");
    const targetProgramId = moveRunnerCardToGrip(state, "simple_decoder");
    removeEverywhere(state, targetProgramId);
    state.runner.heap.push(targetProgramId);
    state.cardInstances[targetProgramId] = {
      ...state.cardInstances[targetProgramId]!,
      zone: { side: "runner", zone: "heap" },
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    state = applyChoice(state, "runner", "source_heap");
    expect(state.pendingChoice?.source).toContain(
      "p3_38.stack_or_trash_program_install",
    );
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.rig.programs).toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_38_stack_or_trash_program_install",
      searchShuffleAfter: false,
      temporaryInstall: true,
    });
    removeEverywhere(state, targetProgramId);
    state.runner.heap.push(targetProgramId);
    state.cardInstances[targetProgramId] = {
      ...state.cardInstances[targetProgramId]!,
      zone: { side: "runner", zone: "heap" },
    };
    state = apply(state, "runner", (action) => action.type === "end_turn");
    expect(state.runner.grip).not.toContain(targetProgramId);
    expect(state.runner.heap).toContain(targetProgramId);
  });

  it("reorders the last successful fort with Fortress Respecification without exposing concealed ICE", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-fortress-reorder"));
    state.runner.credits = 20;
    const eventId = moveRunnerCardToGrip(
      state,
      "onr_v1_088_fortress-respecification",
    );
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    const firstIceId = putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
    const secondIceId = putCorpIceOnServer(state, "remote_1", "simple_code_gate_ice");
    state.cardInstances[firstIceId] = {
      ...state.cardInstances[firstIceId]!,
      faceup: false,
      rezzed: false,
    };
    state.cardInstances[secondIceId] = {
      ...state.cardInstances[secondIceId]!,
      faceup: false,
      rezzed: false,
    };
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags!,
      successfulRunThisTurn: true,
      lastSuccessfulRunServerId: "remote_1",
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "play_event" &&
        String(action.payload?.cardId) === eventId,
    );
    expect(state.pendingChoice?.source).toContain("p3_58.fortress_respecification");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(getPlayerView(state, "runner").pendingChoice?.options.map((option) => option.label)).toEqual([
      "ICE Position 1",
      "ICE Position 2",
    ]);

    state = applyChoices(state, "runner", [`card_${secondIceId}`, `card_${firstIceId}`]);
    expect(state.corp.servers.find((server) => server.id === "remote_1")?.ice).toEqual([
      secondIceId,
      firstIceId,
    ]);
    expect(state.cardInstances[firstIceId]?.faceup).toBe(false);
    expect(state.cardInstances[secondIceId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_58_fortress_respecification_reorder",
      amounts: expect.objectContaining({ reorderedIceCount: 2 }),
      targets: expect.objectContaining({ hiddenOrderChoice: true }),
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_code_gate_ice",
    );
  });

  it("uses installed V1.9.11 Runner helpers through LegalActions without exposing private choices to the Corp", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-installed-helpers"));
    state.runner.credits = 20;
    installRunnerResourceForTest(state, "onr_v1_169_n-e-t-o");
    installRunnerResourceForTest(state, "onr_v1_175_ronin-around");
    const targetEventId = putRunnerCardOnTopOfStack(state, "simple_economy_event");
    const searchAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_169_n-e-t-o",
    );
    expect(searchAction.payload).toMatchObject({
      cardImplementationAbility: "activated",
    });

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_169_n-e-t-o",
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.look_top_stack_take_matching",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetEventId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.grip).toContain(targetEventId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      publicRevealDefinitionIds: "simple_economy_event",
    });

    putRunnerCardOnTopOfStack(state, "simple_decoder");
    putRunnerCardOnTopOfStack(state, "simple_fracter");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === "onr_v1_175_ronin-around" &&
        action.payload?.cardImplementationAbilityIndex === 0,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_37.look_top_stack_take_matching",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("uses Aujourd'Oui as a paid top-five program choice and removes the separate top-card reveal action", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-aujourdoui-top5"));
    state.runner.credits = 2;
    const aujourdOuiId = installRunnerResourceForTest(
      state,
      "onr_v1_151_aujourdoui",
    );

    const usedIds = new Set<CardInstanceId>();
    const putCopyOnTop = (definitionId: string): CardInstanceId => {
      const entry = Object.entries(state.cardInstances).find(
        ([id, card]) => card.definitionId === definitionId && !usedIds.has(id),
      );
      if (!entry) throw new Error(`Missing test card ${definitionId}`);
      const id = entry[0] as CardInstanceId;
      usedIds.add(id);
      removeEverywhere(state, id);
      state.runner.stack.unshift(id);
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        zone: { side: "runner", zone: "stack" },
        faceup: true,
        rezzed: true,
      };
      return id;
    };

    const outOfRangeProgramId = putCopyOnTop("simple_decoder");
    const displayOnlyEvent3Id = putCopyOnTop("simple_economy_event");
    putCopyOnTop("simple_economy_event");
    const selectedFracterId = putCopyOnTop("simple_fracter");
    const displayOnlyEventId = putCopyOnTop("simple_economy_event");
    const selectedDecoderId = putCopyOnTop("simple_decoder");

    const aujourdOuiActions = getLegalActions(state, "runner").filter(
      (action) => action.source === aujourdOuiId,
    );
    expect(aujourdOuiActions).toHaveLength(1);
    expect(new Set(aujourdOuiActions.map((action) => action.actionId)).size).toBe(
      aujourdOuiActions.length,
    );
    expect(aujourdOuiActions[0]?.type).toBe("activated_card_ability");
    expect(aujourdOuiActions[0]?.payload).toMatchObject({
      cardImplementationAbility: "activated",
    });
    expect(aujourdOuiActions[0]?.label).toContain("Top 5");
    expect(
      aujourdOuiActions.some(
        (action) => action.payload?.v1911HiddenZoneAbility === "reveal_stack_top",
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.source === aujourdOuiId &&
        action.type === "activated_card_ability",
    );
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.source).toContain("p3_37.look_top_stack_take_matching");
    expect(runnerChoice?.options).toHaveLength(5);
    expect(
      runnerChoice?.options.some((option) => option.value === outOfRangeProgramId),
    ).toBe(false);
    expect(
      runnerChoice?.options.find((option) => option.value === displayOnlyEventId)
        ?.selectable,
    ).toBe(false);
    expect(runnerChoice?.minSelections).toBe(0);
    expect(runnerChoice?.maxSelections).toBe(2);
    expect(runnerChoice?.stackSearchResolution).toMatchObject({
      reveal: "public",
      destination: "grip",
      shuffleAfter: true,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();

    const decoderOptionId = runnerChoice?.options.find(
      (option) => option.value === selectedDecoderId,
    )?.id;
    const fracterOptionId = runnerChoice?.options.find(
      (option) => option.value === selectedFracterId,
    )?.id;
    expect(decoderOptionId).toBeDefined();
    expect(fracterOptionId).toBeDefined();

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoices(state, "runner", [
      String(decoderOptionId),
      String(fracterOptionId),
    ]);

    expect(state.runner.credits).toBe(0);
    expect(state.runner.grip).toEqual(
      expect.arrayContaining([selectedDecoderId, selectedFracterId]),
    );
    expect(state.runner.stack).not.toContain(selectedDecoderId);
    expect(state.runner.stack).not.toContain(selectedFracterId);
    expect(state.runner.stack).toContain(outOfRangeProgramId);
    expect(state.runner.stack).toContain(displayOnlyEvent3Id);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "p3_37_look_top_stack_take_matching",
      sourceDefinitionId: "onr_v1_151_aujourdoui",
      publicRevealKind: "reveal",
      publicRevealDefinitionIds: "simple_decoder,simple_fracter",
      shuffled: true,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("limits Self-Modifying Code to ICE encounters and removes the option after the run", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("v1911-smc-encounter-window"),
    );
    state.runner.credits = 20;
    installRunnerProgramForTest(state, "onr_v1_059_self-modifying-code");
    putRunnerCardOnTopOfStack(state, "simple_decoder");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");

    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.v1911HiddenZoneAbility ===
          "self_modifying_code_install_program",
      ),
    ).toBe(false);

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
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.type === "activated_card_ability" &&
          sourceDefinition(state, action) ===
            "onr_v1_059_self-modifying-code",
      ),
    ).toBe(true);

    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(state.run).toBeUndefined();
    expect(state.timingPoint).toBe("runner_action.main");
    expect(
      getLegalActions(state, "runner").some(
        (action) =>
          action.payload?.v1911HiddenZoneAbility ===
          "self_modifying_code_install_program",
      ),
    ).toBe(false);
  });

  it("resolves Self-Modifying Code as a public reveal, source trash, paid install and deterministic shuffle", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.hiddenZone("v1911-smc-install"),
    );
    state.runner.credits = 20;
    const smcId = installRunnerProgramForTest(
      state,
      "onr_v1_059_self-modifying-code",
    );
    const targetProgramId = putRunnerCardOnTopOfStack(state, "simple_decoder");
    putCorpIceOnServer(state, "rd", "simple_barrier_ice");
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
        sourceDefinition(state, action) === "simple_barrier_ice",
    );
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) ===
          "onr_v1_059_self-modifying-code",
    );
    expect(state.runner.heap).toContain(smcId);
    expect(state.pendingChoice?.source).toContain(
      "p3_38.search_stack_install",
    );
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(
      getPlayerView(state, "runner").pendingChoice?.stackSearchResolution,
    ).toMatchObject({
      reveal: "public",
      destination: "install_program",
      shuffleAfter: true,
    });

    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === targetProgramId,
    )?.id;
    expect(optionId).toBeDefined();
    state = applyChoice(state, "runner", String(optionId));
    expect(state.runner.rig.programs).toContain(targetProgramId);
    expect(state.runner.stack).not.toContain(targetProgramId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      sourceDefinitionId: "onr_v1_059_self-modifying-code",
      hiddenZoneAction: "p3_38_search_stack_install",
      publicRevealDefinitionId: "simple_decoder",
      installedProgramDefinitionId: "simple_decoder",
      searchDestination: "runner_rig",
      installed: true,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses scored Corporate Downsizing to reveal HQ agendas and shuffle them into R&D", () => {
    let state = apply(
      MECHANIC_SMOKE_GAMES.hiddenZone("v1911-corporate-downsizing"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.clicks = 3;
    const agendaId = moveCorpCardToHq(state, "onr_v1_194_corporate-downsizing");
    const shownAgendaId = moveCorpCardToHq(state, "simple_agenda");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" && action.payload?.cardId === agendaId,
    );
    state.cardInstances[agendaId]!.advancementCounters = 3;
    const creditsBefore = state.corp.credits;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "score_agenda" && action.payload?.cardId === agendaId,
    );
    expect(state.pendingChoice?.source).toContain("p3_50.corporate_downsizing");
    state = applyChoices(state, "corp", [`card_${shownAgendaId}`]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "corporate_downsizing_hq_agendas",
      publicRevealKind: "reveal",
      shownCount: 1,
      shuffledIntoRndCount: 1,
      combinedAgendaPoints: 2,
      gainedCredits: 4,
    });
    expect(state.corp.credits).toBe(creditsBefore + 4);
    expect(state.corp.hq).not.toContain(shownAgendaId);
    expect(state.corp.rd).toContain(shownAgendaId);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(`${shownAgendaId}`);
  });

  it("resolves Ice Pick Willie as program trash plus end-the-run without R&D reveal", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-ice-pick-willie"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_250_ice-pick-willie");
    const rdTopId = putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const trashedProgramId = installRunnerProgramForTest(
      state,
      "simple_decoder",
    );

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
        sourceDefinition(state, action) === "onr_v1_250_ice-pick-willie",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(state.run).toBeUndefined();
    expect(state.runner.heap).toContain(trashedProgramId);
    expect(state.cardInstances[rdTopId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      trashedCardDefinitionId: "simple_decoder",
      trashedCardType: "program",
      trashedCount: 1,
      encounterWillEndRun: true,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "simple_economy_operation",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "simple_economy_operation_",
    );
  });

  it("keeps Ice Pick Willie end-the-run stable when no runner program is installed", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("spotcheck-ice-pick-willie-no-program"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    for (const programId of state.runner.rig.programs.slice())
      removeEverywhere(state, programId);
    state.runner.memoryUsed = 0;
    putCorpIceOnServer(state, "rd", "onr_v1_250_ice-pick-willie");
    const rdTopId = putCorpCardOnTopOfRd(state, "simple_economy_operation");
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
        sourceDefinition(state, action) === "onr_v1_250_ice-pick-willie",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );

    expect(state.run).toBeUndefined();
    expect(state.cardInstances[rdTopId]?.faceup).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      sourceDefinitionId: "onr_v1_250_ice-pick-willie",
      encounterWillEndRun: true,
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "trashedCardDefinitionId",
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("opens Too Many Doors secret spend privately and resolves replay-safe", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.hiddenZone("v1911-too-many-doors"));
    state.runner.credits = 20;
    state.corp.credits = 20;
    putCorpIceOnServer(state, "rd", "onr_v1_272_too-many-doors");
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
        sourceDefinition(state, action) === "onr_v1_272_too-many-doors",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "continue_run" &&
        action.payload?.encounterContinue === true,
    );
    expect(state.pendingChoice?.source).toContain(
      "p3_56.too_many_doors_secret_spend",
    );
    expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(3);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.pendingChoice?.side).toBe("runner");
    expect(getPlayerView(state, "runner").pendingChoice?.options).toHaveLength(3);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "secretSpendCorp",
    );

    const corpCreditsBeforeReveal = state.corp.credits;
    const runnerCreditsBeforeReveal = state.runner.credits;
    state = applyChoice(state, "runner", "bid_1");
    expect(state.run).toBeDefined();
    expect(state.corp.credits).toBe(corpCreditsBeforeReveal - 1);
    expect(state.runner.credits).toBe(runnerCreditsBeforeReveal - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      secretSpendRevealed: true,
      secretSpendCorp: 1,
      secretSpendRunner: 1,
      tooManyDoorsEndRun: false,
      corpCreditsAfter: corpCreditsBeforeReveal - 1,
      runnerCreditsAfter: runnerCreditsBeforeReveal - 1,
    });

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});
