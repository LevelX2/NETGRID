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
  passRootRezWindowBeforeAccessIfOpen,
  traceChoiceOptionIdForDefinition,
  addCorpCardToHqForTest,
  addRezzedCorpRootForTest,
  addRezzedCorpIceForTest,
  addInstalledRunnerProgramForTest,
} from "../../test-fixtures/index-test-helpers";

describe("Originalset Spotcheck 2026-05-16 Corp Asset/Upgrade Rest hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps Rockerboy Promotion rezzed, source-bound and replay-safe", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects(
      "spotcheck-rockerboy-source-binding",
    );
    state.corp.credits = 10;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const rockerboyId = moveCorpCardToHq(
      state,
      "onr_v1_337_rockerboy-promotion",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === rockerboyId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(state, action) ===
          "onr_v1_337_rockerboy-promotion",
    );

    const ability = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbility === "activated" &&
        action.payload?.cardId === rockerboyId,
    );
    expect(ability.costs).toEqual([{ clicks: 1 }]);
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: ability.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-rockerboy-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: ability.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-rockerboy-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const removedSource = structuredClone(state);
    removeEverywhere(removedSource, rockerboyId);
    removedSource.corp.archives.push(rockerboyId);
    removedSource.cardInstances[rockerboyId] = {
      ...removedSource.cardInstances[rockerboyId]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
      rezzed: true,
    };
    const removed = applyAction(removedSource, {
      matchId: removedSource.matchId,
      side: "corp",
      actionId: ability.actionId,
      clientKnownStateVersion: removedSource.stateVersion,
      idempotencyKey: "spotcheck-rockerboy-removed-source",
    });
    expect(removed.ok).toBe(false);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const creditsBefore = state.corp.credits;
    state = apply(state, "corp", (action) => action.actionId === ability.actionId);
    expect(state.corp.credits).toBe(creditsBefore + 3);
    expect(cardCounterAmount(state, rockerboyId, "bit")).toBe(12);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: "onr_v1_337_rockerboy-promotion",
      cardImplementationAbility: "activated",
      hostedCreditsTaken: 3,
      hostedCreditsAfter: 12,
      gainedCredits: 3,
      resolvedEffects: [
        expect.objectContaining({
          kind: "take_hosted_credits",
          amount: 3,
          remainingCounters: 12,
          sourceDefinitionId: "onr_v1_337_rockerboy-promotion",
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

  it("keeps Chester Mix server-scoped while Namatoki Plaza stays access/trash safe", () => {
    let state = v199CardReleaseGame("spotcheck-chester-server-scope");
    state.corp.credits = 20;
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    const chesterId = putCorpRootInRemote(state, "onr_v1_352_chester-mix");
    state.cardInstances[chesterId] = {
      ...state.cardInstances[chesterId]!,
      faceup: true,
      rezzed: true,
    };
    putCorpIceOnServer(state, "remote_1", "onr_v1_279_wall-of-static");
    putCorpIceOnServer(state, "rd", "onr_v1_279_wall-of-static");
    const discountedIceId = moveCorpCardToHq(state, "simple_code_gate_ice");
    const fullCostIceId = moveCorpCardCopyToHq(state, "simple_code_gate_ice");

    const discounted = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === discountedIceId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "ice",
    );
    expect(discounted.payload).toMatchObject({
      iceInstallReduction: 2,
      iceInstallTotalCost: 0,
    });
    const otherServer = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === fullCostIceId &&
        action.payload?.serverId === "rd" &&
        action.payload?.placement === "ice",
    );
    expect(otherServer.payload).toMatchObject({
      iceInstallReduction: 0,
    });

    let accessState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-namatoki-access-trash"),
    );
    accessState.runner.credits = 10;
    const namatokiId = putCorpRootInRemote(
      accessState,
      "onr_v1_361_namatoki-plaza",
    );
    accessState.cardInstances[namatokiId] = {
      ...accessState.cardInstances[namatokiId]!,
      faceup: true,
      rezzed: true,
    };
    const initial = structuredClone(accessState);
    const replayStart = accessState.eventLog.length;
    accessState = apply(
      accessState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    accessState = apply(accessState, "runner", (action) => action.type === "access_card");
    expect(accessState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "onr_v1_361_namatoki-plaza",
    });
    expect(
      JSON.stringify(accessState.eventLog.at(-1)?.publicPayload),
    ).not.toMatch(privatePayloadMarkers);
    const trash = mustAction(
      accessState,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    const staleTrash = applyAction(accessState, {
      matchId: accessState.matchId,
      side: "runner",
      actionId: trash.actionId,
      clientKnownStateVersion: accessState.stateVersion - 1,
      idempotencyKey: "spotcheck-namatoki-stale-trash",
    });
    expect(staleTrash.ok).toBe(false);
    if (!staleTrash.ok) expect(staleTrash.error.code).toBe("ERR_STALE_STATE");
    accessState = apply(
      accessState,
      "runner",
      (action) => action.actionId === trash.actionId,
    );
    expect(accessState.corp.archives).toContain(namatokiId);
    expect(validateGameState(accessState).ok).toBe(true);
    const replay = replayEvents(initial, accessState.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(accessState));
  });

  it("uses Namatoki Plaza install, capacity and leave-play cleanup without region replacement", () => {
    let state = MECHANIC_SMOKE_GAMES.assetNodeEffects("p355-namatoki-capacity");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 20;
    const namatokiId = addCorpCardToHqForTest(
      state,
      "onr_v1_361_namatoki-plaza",
      "namatoki_capacity",
    );
    const namatokiInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === namatokiId &&
        action.payload?.serverId === "new_remote" &&
        action.payload?.placement === "root",
    );
    expect(namatokiInstall.costs).toEqual([{ clicks: 1, credits: 3 }]);
    state = apply(state, "corp", (action) => action.actionId === namatokiInstall.actionId);
    expect(state.cardInstances[namatokiId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toMatchObject({
      regionReplacementWarning: true,
    });

    const agendaId = addCorpCardToHqForTest(
      state,
      "simple_agenda",
      "namatoki_agenda",
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === agendaId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );
    const assetId = addCorpCardToHqForTest(
      state,
      "simple_economy_asset",
      "namatoki_asset",
    );
    const assetInstall = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.source === assetId &&
        action.payload?.serverId === "remote_1" &&
        action.payload?.placement === "root",
    );
    expect(assetInstall.payload?.rootReplacement).toBeUndefined();
    state = apply(state, "corp", (action) => action.actionId === assetInstall.actionId);
    const remote = state.corp.servers.find((server) => server.id === "remote_1");
    if (!remote) throw new Error("remote_1 missing");
    expect(remote.root).toEqual(expect.arrayContaining([namatokiId, agendaId, assetId]));

    remote.root = [namatokiId, agendaId, assetId];
    state = toRunnerTurnFromCorpMain(state);
    state.runner.credits = 10;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.run?.accessedCardId).toBe(namatokiId);
    state = apply(state, "runner", (action) => action.type === "trash_accessed_card");
    expect(state.corp.archives).toContain(namatokiId);
    expect([agendaId, assetId].filter((id) => state.corp.archives.includes(id))).toHaveLength(1);
    expect(
      state.corp.servers
        .find((server) => server.id === "remote_1")
        ?.root.filter((id) => [agendaId, assetId].includes(id)),
    ).toHaveLength(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      resolvedEffects: [
        expect.objectContaining({
          kind: "trash_card",
          reason: "fort_capacity_exceeded",
          sourceDefinitionId: "onr_v1_361_namatoki-plaza",
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

  it("resolves migrated Chimera access without legacy daemon choices", () => {
    let state = toRunnerTurn(v199CardReleaseGame("spotcheck-chimera-source"));
    state.runner.credits = 20;
    const daemonId = installRunnerProgramForTest(state, "onr_v1_001_afreet");
    const chimeraId = putCorpRootInRemote(state, "onr_v1_353_chimera");
    state.cardInstances[chimeraId] = {
      ...state.cardInstances[chimeraId]!,
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
    const access = mustAction(
      state,
      "runner",
      (action) => action.type === "access_card",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: access.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "spotcheck-chimera-wrong-side",
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: access.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-chimera-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    state = apply(state, "runner", (action) => action.actionId === access.actionId);
    expect(state.runner.heap).toContain(daemonId);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "access_card",
      trashedCardDefinitionId: "onr_v1_001_afreet",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("Originalset Spotcheck 2026-05-16 Corp Operation/Asset Node hardening", () => {
  const privatePayloadMarkers =
    /"cardInstances"|"privatePayload"|"grip"|"stack"|"hq"|"rd"/;

  it("keeps Night Shift, Overtime Incentives and Trojan Horse public-result safe", () => {
    let state = apply(
      v123CardReleaseGame("spotcheck-operation-asset-node-ops"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state.corp.credits = 20;
    state.corp.clicks = 10;
    state.corp.maxHandSize = 100;
    moveCorpCardToHq(state, "onr_v1_295_night-shift");
    moveCorpCardToHq(state, "onr_v1_297_overtime-incentives");

    const night = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_295_night-shift",
    );
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: night.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "spotcheck-night-shift-stale",
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const hqBeforeNight = state.corp.hq.length;
    const creditsBeforeNight = state.corp.credits;
    state = apply(state, "corp", (action) => action.actionId === night.actionId);
    expect(state.corp.credits).toBe(creditsBeforeNight + 2);
    expect(state.corp.hq.length).toBe(hqBeforeNight);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_295_night-shift",
      gainedCredits: 2,
      drawnCards: 1,
      corpCreditsAfter: state.corp.credits,
      resolvedEffects: [
        expect.objectContaining({
          kind: "gain_credits",
          side: "corp",
          amount: 2,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_295_night-shift",
        }),
        expect.objectContaining({
          kind: "draw_cards",
          side: "corp",
          amount: 1,
          reason: "card_resolver",
          sourceDefinitionId: "onr_v1_295_night-shift",
        }),
      ],
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );

    const clicksBeforeOvertime = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_297_overtime-incentives",
    );
    expect(state.corp.clicks).toBe(clicksBeforeOvertime + 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_297_overtime-incentives",
      gainedActions: 2,
      corpClicksAfter: state.corp.clicks,
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    let trojan = apply(
      v123CardReleaseGame("spotcheck-trojan-result-payload"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const trojanId = moveCorpCardToHq(trojan, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(trojan, trojanId);
    trojan.corp.credits = 8;
    trojan = apply(trojan, "corp", (action) => action.type === "end_turn");
    moveCorpCardToArchives(trojan, "onr_v1_220_tycho-extension");
    trojan = apply(
      trojan,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    trojan = apply(trojan, "runner", (action) => action.type === "access_card");
    trojan = apply(trojan, "runner", (action) => action.type === "steal_agenda");
    trojan = apply(trojan, "runner", (action) => action.type === "end_turn");
    trojan = apply(trojan, "corp", (action) => action.type === "mandatory_draw");
    const activeTrojanId = moveCorpCardToHq(trojan, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(trojan, activeTrojanId);
    trojan.corp.credits = 8;
    const trojanInitial = structuredClone(trojan);
    const trojanReplayStart = trojan.eventLog.length;
    const tagsBefore = trojan.runner.tags;
    trojan = apply(
      trojan,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(trojan, action) === "onr_v1_306_trojan-horse",
    );
    expect(trojan.runner.tags).toBe(tagsBefore + 1);
    expect(trojan.eventLog.at(-1)?.publicPayload).toMatchObject({
      cardDefinitionId: "onr_v1_306_trojan-horse",
      tagsAdded: 1,
      runnerTagsAfter: trojan.runner.tags,
    });
    expect(JSON.stringify(trojan.eventLog.at(-1)?.publicPayload)).not.toMatch(
      privatePayloadMarkers,
    );
    const trojanReplay = replayEvents(
      trojanInitial,
      trojan.eventLog.slice(trojanReplayStart),
    );
    expect(trojanReplay.ok).toBe(true);
    expect(hashState(trojanReplay.state)).toBe(hashState(trojan));
  });

  it("keeps Blood Cat, Cowboy Sysop and action/economy assets source-bound", () => {
    let trace = apply(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-blood-cat-source"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    trace.corp.credits = 20;
    trace.runner.credits = 10;
    const bloodCatId = moveCorpCardToHq(trace, "onr_v1_310_blood-cat");
    trace = apply(
      trace,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === bloodCatId,
    );
    trace = apply(
      trace,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(trace, action) === "onr_v1_310_blood-cat",
    );
    const traceInitial = structuredClone(trace);
    const traceReplayStart = trace.eventLog.length;
    trace = apply(
      trace,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === bloodCatId,
    );
    expect(trace.trace).toMatchObject({
      sourceDefinitionId: "onr_v1_310_blood-cat",
      baseTraceStrength: 5,
    });
    trace = applyChoice(trace, "corp", "bid_0");
    trace = applyChoice(trace, "runner", "bid_0");
    expect(trace.runner.tags).toBe(1);
    expect(replayEvents(traceInitial, trace.eventLog.slice(traceReplayStart)).ok).toBe(true);

    let cowboy = apply(
      createGameAfterSetup({
        seed: "spotcheck-cowboy-source",
        baseline: CURRENT_RULES_BASELINE,
        runnerDeck: {
          ...MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
          id: "spotcheck_cowboy_runner",
          name: "Spotcheck Cowboy Runner",
          cards: [
            { id: "onr_v1_158_danshis-second-id", quantity: 1 },
            ...MECHANIC_SMOKE_DECKS.assetNodeEffects.runner.cards.filter(
              (card) => card.id !== "onr_v1_158_danshis-second-id",
            ),
          ],
        },
        corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
        agendaPointsToWin: 7,
      }),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    cowboy.corp.credits = 20;
    cowboy.runner.credits = 20;
    const corpTargetId = putCorpRootInRemote(
      cowboy,
      "onr_v1_309_bbs-whispering-campaign",
    );
    const cowboyId = moveCorpCardToHq(cowboy, "onr_v1_316_cowboy-sysop");
    cowboy = apply(
      cowboy,
      "corp",
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === cowboyId,
    );
    cowboy = apply(
      cowboy,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(cowboy, action) === "onr_v1_316_cowboy-sysop",
    );
    const cowboyAction = mustAction(
      cowboy,
      "corp",
      (action) =>
        action.type === "gain_credit" &&
        action.payload?.v1951CorpUtilityAbility ===
          "cowboy_sysop_uninstall_corp_card_to_hq" &&
        action.payload?.targetCardId === corpTargetId,
    );
    const removedTarget = structuredClone(cowboy);
    removeEverywhere(removedTarget, corpTargetId);
    removedTarget.corp.hq.push(corpTargetId);
    removedTarget.cardInstances[corpTargetId] = {
      ...removedTarget.cardInstances[corpTargetId]!,
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    };
    const drift = applyAction(removedTarget, {
      matchId: removedTarget.matchId,
      side: "corp",
      actionId: cowboyAction.actionId,
      clientKnownStateVersion: removedTarget.stateVersion,
      idempotencyKey: "spotcheck-cowboy-removed-target",
    });
    expect(drift.ok).toBe(false);
    cowboy = apply(cowboy, "corp", (action) => action.actionId === cowboyAction.actionId);
    expect(cowboy.corp.hq).toContain(corpTargetId);
    expect(cowboy.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "v1951_cowboy_sysop_uninstall_to_hq",
    });

    for (const definitionId of [
      "onr_v1_344_spinn-public-relations",
      "onr_v1_321_esa-contract",
    ] as const) {
      let state = apply(
        createGameAfterSetup({
          seed: `spotcheck-${definitionId}`,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.runner,
          corpDeck: MECHANIC_SMOKE_DECKS.assetNodeEffects.corp,
          agendaPointsToWin: 7,
        }),
        "corp",
        (action) => action.type === "mandatory_draw",
      );
      state.corp.credits = 20;
      const assetId = moveCorpCardToHq(state, definitionId);
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "install_card" &&
          action.payload?.cardId === assetId,
      );
      state = apply(
        state,
        "corp",
        (action) =>
          action.type === "rez_ice" &&
          sourceDefinition(state, action) === definitionId,
      );
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;
      const ability = mustAction(
        state,
        "corp",
        (action) =>
          action.type ===
            "activated_card_ability" &&
          action.payload?.cardId === assetId,
      );
      state = apply(state, "corp", (action) => action.actionId === ability.actionId);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        cardDefinitionId: definitionId,
      });
      expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toMatch(
        privatePayloadMarkers,
      );
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok, definitionId).toBe(true);
      expect(hashState(replay.state), definitionId).toBe(hashState(state));
    }
  });

  it("keeps Department of Truth Enhancement and Encoder install/rez/trash/modifier safe", () => {
    let department = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.assetNodeEffects("spotcheck-department-access"),
    );
    department.runner.credits = 10;
    const departmentId = putCorpRootInRemote(
      department,
      "onr_v1_318_department-of-truth-enhancement",
    );
    department.cardInstances[departmentId] = {
      ...department.cardInstances[departmentId]!,
      faceup: true,
      rezzed: true,
    };
    const departmentInitial = structuredClone(department);
    const departmentReplayStart = department.eventLog.length;
    department = apply(
      department,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    department = apply(department, "runner", (action) => action.type === "access_card");
    department = apply(
      department,
      "runner",
      (action) => action.type === "trash_accessed_card",
    );
    expect(department.corp.archives).toContain(departmentId);
    expect(replayEvents(departmentInitial, department.eventLog.slice(departmentReplayStart)).ok).toBe(true);

    let encoder = apply(
      v162CardReleaseGame("spotcheck-encoder-rez-cost"),
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    encoder.corp.credits = 20;
    putCorpRootInRemote(encoder, "onr_v1_320_encoder-inc");
    encoder = apply(
      encoder,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(encoder, action) === "onr_v1_320_encoder-inc",
    );
    const codeGateId = putCorpIceOnServer(
      encoder,
      "rd",
      "onr_v1_230_cortical-scanner",
    );
    encoder = apply(encoder, "corp", (action) => action.type === "end_turn");
    encoder = apply(
      encoder,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    const rezCodeGate = mustAction(
      encoder,
      "corp",
      (action) => action.type === "rez_ice" && action.source === codeGateId,
    );
    expect(rezCodeGate.payload).toMatchObject({
      rezCostReductionAmount: 1,
      rezCostPaid: 6,
    });
    expect(String(rezCodeGate.payload?.rezCostReductionSourceDefinitionIds)).toContain(
      "onr_v1_320_encoder-inc",
    );
  });
});
