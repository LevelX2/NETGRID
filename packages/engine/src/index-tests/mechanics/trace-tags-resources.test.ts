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

describe("MVP 0.95 Resources and tag interaction", () => {
  it("installs a local Resource through LegalActions and shows it publicly", () => {
    let state = toRunnerTurn(v095ResourceGame("v095-install-resource"));
    state.runner.credits = 6;
    moveRunnerCardToGrip(state, "v095_safehouse_resource");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "v095_safehouse_resource",
    );

    expect(state.baseline.engineSchemaVersion).toBe("0.99.0");
    expect(state.runner.credits).toBe(4);
    expect(
      state.runner.rig.resources.map(
        (id) => state.cardInstances[id]?.definitionId,
      ),
    ).toEqual(["v095_safehouse_resource"]);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "install_card",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource",
      zoneLabel: "Resource",
    });

    const runnerView = getPlayerView(state, "runner");
    const corpView = getPlayerView(state, "corp");
    expect(
      runnerView.own.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(
      corpView.opponent.rig?.some(
        (card) => card.definitionId === "v095_safehouse_resource",
      ),
    ).toBe(true);
    expect(JSON.stringify(corpView)).not.toContain("Simple Fracter");
  });

  it("lets the Corp trash an installed Resource only while the Runner is tagged", () => {
    let state = installedResourceCorpTurn("v095-trash-resource");
    const resourceId = state.runner.rig.resources[0]!;
    const beforeHash = hashState(state);

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === resourceId,
    );

    expect(hashState(state)).not.toBe(beforeHash);
    expect(state.corp.clicks).toBe(2);
    expect(state.corp.credits).toBe(3);
    expect(state.runner.rig.resources).toHaveLength(0);
    expect(state.runner.heap).toContain(resourceId);
    expect(state.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(false);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trash_resource",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource",
      zoneLabel: "Resource",
    });
  });

  it("rejects Resource trash without tags, stale state or installed Resource target", () => {
    const tagged = installedResourceCorpTurn("v095-trash-revalidate");
    const trashAction = mustAction(
      tagged,
      "corp",
      (action) => action.type === "trash_resource",
    );
    const untagged = structuredClone(tagged);
    untagged.runner.tags = 0;

    expect(
      getLegalActions(untagged, "corp").some(
        (action) => action.type === "trash_resource",
      ),
    ).toBe(false);
    expect(
      applyAction(untagged, {
        matchId: untagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: untagged.stateVersion,
      }).ok,
    ).toBe(false);
    expect(
      applyAction(tagged, {
        matchId: tagged.matchId,
        side: "corp",
        actionId: trashAction.actionId,
        clientKnownStateVersion: tagged.stateVersion - 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });

    const missingTarget = structuredClone(tagged);
    removeEverywhere(missingTarget, String(trashAction.payload?.resourceId));
    expect(
      getLegalActions(missingTarget, "corp").some(
        (action) => action.type === "trash_resource",
      ),
    ).toBe(false);
  });

  it("replays Resource install and trash with deterministic StateHash and no new randomness", () => {
    const initial = installedResourceCorpTurn("v095-replay-resource");
    const randomBefore = initial.randomDrawRecords.length;
    let state = apply(
      initial,
      "corp",
      (action) => action.type === "trash_resource",
    );

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(state.randomDrawRecords.length).toBe(randomBefore);
  });

  it("does not expose V0.96+ mechanics while enabling Resources", () => {
    const state = toRunnerTurn(v095ResourceGame("v095-no-scope"));
    const actionTypes = getLegalActions(state, "runner").map(
      (action) => action.type,
    );

    expect(actionTypes).not.toContain("resolve_choice");
    expect(actionTypes).not.toContain("trigger_ability");
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "trace",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "hosting",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "virus",
    );
    expect(DEMO_CARDS_BY_ID.v095_safehouse_resource?.mechanics).not.toContain(
      "prevention",
    );
  });
});

describe("V1.9.14 Trace/Tag/Resource Longtail", () => {
  it("adds all V1.9.14 WIP runtime definitions without pulling in V1.9.15 cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.traceTags).toHaveLength(25);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.traceTags) {
      const definition = DEMO_CARDS_BY_ID[definitionId];
      expect(definition?.implementationStatus, definitionId).toBe(
        "playable_mvp",
      );
      expect(definition?.mechanics.join(" "), definitionId).toMatch(
        /trace|link|tag|resource|damage|hidden_zone|counter|icebreaker|stealth/,
      );
      expect(definition?.rulesText, definitionId).not.toContain("WIP");
    }
    expect(
      DEMO_CARDS_BY_ID["onr_v1_276_viral-15"]
        ?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("starts an unpromoted V1.9.14 Corp ICE trace through the existing side-safe bid window", () => {
    let state = toRunnerTurn(v096TraceGame("v1914-asp-trace-wip"));
    const aspInstanceId = "v1914_asp_instance" as CardInstanceId;
    const rd = state.corp.servers.find((server) => server.id === "rd");
    expect(rd).toBeDefined();
    if (!rd) throw new Error("Missing R&D server");
    rd.ice.push(aspInstanceId);
    state.cardInstances[aspInstanceId] = {
      instanceId: aspInstanceId,
      definitionId: "onr_v1_221_asp",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverIce", serverId: "rd" },
      faceup: false,
      rezzed: false,
      advancementCounters: 0,
      strengthModifier: 0,
    };
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
        sourceDefinition(state, action) === "onr_v1_221_asp",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(DEMO_CARDS_BY_ID["onr_v1_221_asp"]?.mechanics).toEqual(
      expect.arrayContaining(["trace", "link", "bid_amount", "end_the_run", "run_lock"]),
    );
    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      baseTraceStrength: 5,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceStrength: 6,
      runnerLink: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(0);
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.fangRunLockCreditCost).toBe(1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.trace).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceSuccessful: true,
      runnerRunEnded: true,
      runnerRunLockCreditCost: 1,
    });
  });

  it("runs each V1.9.14 Trace ICE through the side-safe bid window", () => {
    const traceIce = [
      ["onr_v1_221_asp", 5],
      ["onr_v1_228_cinderella", 6],
      ["onr_v1_240_fang", 4],
      ["onr_v1_241_fang-2-0", 5],
      ["onr_v1_248_homewrecker", 5],
      ["onr_v1_260_pocket-virtual-reality", 6],
      ["onr_v1_264_rex", 3],
    ] as const;

    for (const [definitionId, baseTraceStrength] of traceIce) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.traceTags(`v1914-trace-${definitionId}`),
      );
      putCorpIceOnServer(state, "rd", definitionId);
      state.corp.credits = 9;
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
          sourceDefinition(state, action) === definitionId,
      );
      state = apply(
        state,
        "runner",
        (action) => action.type === "continue_run",
      );

      expect(state.pendingChoice?.side, definitionId).toBe("corp");
      expect(state.pendingChoice?.kind, definitionId).toBe("bid_amount");
      expect(
        getPlayerView(state, "runner").pendingChoice,
        definitionId,
      ).toBeUndefined();
      expect(state.trace, definitionId).toMatchObject({
        status: "corp_bid",
        baseTraceStrength,
      });
    }
  });

  it("uses Hacker Tracker counters in traces and applies Fang 2.0's pay-to-run lock", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.traceTags("v1914-fang-htc-lock"));
    const hackerTrackerId = putCorpRootInRemote(
      state,
      "onr_v1_325_hacker-tracker-central",
    );
    state.cardInstances[hackerTrackerId] = {
      ...state.cardInstances[hackerTrackerId]!,
      faceup: true,
      rezzed: true,
      counters: { bit: 2 },
    };
    putCorpIceOnServer(state, "rd", "onr_v1_241_fang-2-0");
    state.corp.credits = 10;
    state.runner.credits = 10;

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
        sourceDefinition(state, action) === "onr_v1_241_fang-2-0",
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    state = applyChoice(state, "corp", "bid_6");
    expect(state.corp.credits).toBe(0);
    expect(cardCounterAmount(state, hackerTrackerId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      corpBid: 6,
      corpCreditBid: 4,
      hackerTrackerCountersSpent: 2,
      traceStrength: 11,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(0);
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.fangRunLockCreditCost).toBe(2);
    expect(cardCounterAmount(state, hackerTrackerId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 0,
      fangRunEnded: true,
      fangRunLockCreditCost: 2,
      hackerTrackerCountersAdded: 1,
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);

    const creditsBeforeClearingFangLock = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1920RunnerRunLockAbility === "fang_2_0_pay_to_run",
    );
    expect(state.runner.credits).toBe(creditsBeforeClearingFangLock - 2);
    expect(state.runnerTurnFlags?.fangRunLockCreditCost).toBe(0);
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(true);
  });

  it("installs V1.9.14 Runner cards, counts installed link, and keeps Resource trash legal-action gated", () => {
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.traceTagRunner) {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.traceTags(`v1914-install-${definitionId}`),
      );
      state.runner.credits = 12;
      state.runner.memoryLimit = 8;
      state.runner.tags = 1;
      moveRunnerCardToGrip(state, definitionId);

      const definition = DEMO_CARDS_BY_ID[definitionId];
      const actionType =
        definition?.type === "event" ? "play_event" : "install_card";
      state = apply(
        state,
        "runner",
        (action) =>
          action.type === actionType &&
          sourceDefinition(state, action) === definitionId,
      );

      const installed =
        definition?.type === "event"
          ? state.runner.heap.some(
              (cardId) =>
                state.cardInstances[cardId]?.definitionId === definitionId,
            )
          : [
              ...state.runner.rig.programs,
              ...state.runner.rig.hardware,
              ...state.runner.rig.resources,
            ].some(
              (cardId) =>
                state.cardInstances[cardId]?.definitionId === definitionId,
            );
      expect(installed, definitionId).toBe(true);
      if (definition?.type === "event")
        expect(state.runner.tags, definitionId).toBe(0);
      if (definition?.type === "program")
        expect(state.runner.memoryUsed, definitionId).toBeGreaterThan(0);
    }

    let shortTermState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-short-term-contract"),
    );
    shortTermState.runner.credits = 20;
    shortTermState.runner.clicks = 10;
    const shortTermId = moveRunnerCardToGrip(
      shortTermState,
      "onr_v1_178_short-term-contract",
    );
    const initial = structuredClone(shortTermState);
    const replayStart = shortTermState.eventLog.length;
    shortTermState = apply(
      shortTermState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        String(action.payload?.cardId) === shortTermId,
    );
    expect(cardCounterAmount(shortTermState, shortTermId, "bit")).toBe(12);
    expect(
      getPlayerView(shortTermState, "runner").own.rig?.find(
        (card) => card.instanceId === shortTermId,
      )?.counters?.bit,
    ).toBe(12);

    for (let use = 1; use <= 6; use += 1) {
      const creditsBefore = shortTermState.runner.credits;
      shortTermState = apply(
        shortTermState,
        "runner",
        (action) =>
          action.type === "activated_card_ability" &&
          String(action.payload?.cardId) === shortTermId,
      );
      expect(shortTermState.runner.credits).toBe(creditsBefore + 2);
      expect(cardCounterAmount(shortTermState, shortTermId, "bit")).toBe(
        Math.max(0, 12 - use * 2),
      );
    }

    expect(shortTermState.runner.rig.resources).not.toContain(shortTermId);
    expect(shortTermState.runner.heap).toContain(shortTermId);
    expect(shortTermState.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardImplementationAbility: "activated",
      gainedCredits: 2,
      remainingCounters: 0,
      hostedCreditsTaken: 2,
      hostedCreditsAfter: 0,
      sourceTrashed: true,
    });
    const shortTermReplay = replayEvents(
      initial,
      shortTermState.eventLog.slice(replayStart),
    );
    expect(shortTermReplay.ok).toBe(true);
    expect(hashState(shortTermReplay.state)).toBe(hashState(shortTermState));

    let linkState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-installed-link"),
    );
    linkState.runner.credits = 12;
    linkState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(linkState, "onr_v1_132_microtech-trode-set");
    linkState = apply(
      linkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(linkState, action) ===
          "onr_v1_132_microtech-trode-set",
    );
    putCorpIceOnServer(linkState, "rd", "onr_v1_221_asp");
    linkState.corp.credits = 9;
    linkState = apply(
      linkState,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );
    linkState = apply(
      linkState,
      "corp",
      (action) =>
        action.type === "rez_ice" &&
        sourceDefinition(linkState, action) === "onr_v1_221_asp",
    );
    linkState = apply(
      linkState,
      "runner",
      (action) => action.type === "continue_run",
    );
    linkState = applyChoice(linkState, "corp", "bid_0");
    expect(linkState.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 1,
    });

    let resourceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-resource-trash"),
    );
    resourceState.runner.credits = 12;
    resourceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(resourceState, "onr_v1_154_broker");
    resourceState = apply(
      resourceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(resourceState, action) === "onr_v1_154_broker",
    );
    const brokerId = resourceState.runner.rig.resources.find(
      (cardId) =>
        resourceState.cardInstances[cardId]?.definitionId ===
        "onr_v1_154_broker",
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Broker was not installed.");
    resourceState = apply(
      resourceState,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 0 &&
        action.payload?.cardId === brokerId,
    );
    expect(cardCounterAmount(resourceState, brokerId, "bit")).toBe(3);
    resourceState.runner.tags = 1;
    resourceState = apply(
      resourceState,
      "runner",
      (action) => action.type === "end_turn",
    );
    resourceState = apply(
      resourceState,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    resourceState.corp.credits = 6;
    resourceState = apply(
      resourceState,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.resourceId === brokerId,
    );
    expect(resourceState.runner.rig.resources).not.toContain(brokerId);
    expect(resourceState.runner.heap).toContain(brokerId);
    expect(resourceState.cardInstances[brokerId]?.counters).toBeUndefined();
  });

  it("restores Broker load and take-credit resource actions with one use per Broker each Runner turn", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-broker-resource-actions"),
    );
    state.runner.credits = 12;
    moveRunnerCardToGrip(state, "onr_v1_154_broker");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === "onr_v1_154_broker",
    );
    const brokerId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === "onr_v1_154_broker",
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Broker was not installed.");

    let brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbilityIndex === 0,
      ),
    ).toBe(true);
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbilityIndex === 1,
      ),
    ).toBe(false);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 0 &&
        action.payload?.cardId === brokerId,
    );
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(3);
    expect(
      getPlayerView(state, "runner").own.rig?.find(
        (card) => card.instanceId === brokerId,
      )?.counterDisplays,
    ).toContainEqual({
      id: "stored_credits",
      amount: 3,
      displayKind: "stored_credits",
      label: "Credits",
      ariaLabel: "3 gespeicherte Credits",
      counterType: "bit",
      usageHint: "spendable",
      creditPool: { kind: "stored_credit" },
    });
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          (action.payload?.cardImplementationAbilityIndex === 0 ||
            action.payload?.cardImplementationAbilityIndex === 1),
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state = toRunnerTurnFromCorpMain(state);
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbilityIndex === 0,
      ),
    ).toBe(true);
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          action.payload?.cardImplementationAbilityIndex === 1,
      ),
    ).toBe(true);

    const loadAgain = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 0 &&
        action.payload?.cardId === brokerId,
    );
    const staleTakeAll = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 1 &&
        action.payload?.cardId === brokerId,
    );
    const creditsBeforeSecondLoad = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) => action.actionId === loadAgain.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeSecondLoad);
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(6);
    const staleSecondUse = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: staleTakeAll.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "p317-broker-second-use-same-turn",
    });
    expect(staleSecondUse.ok).toBe(false);
    expect(state.runner.credits).toBe(creditsBeforeSecondLoad);
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(6);
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          (action.payload?.cardImplementationAbilityIndex === 0 ||
            action.payload?.cardImplementationAbilityIndex === 1),
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    state = toRunnerTurnFromCorpMain(state);
    const creditsBeforeTake = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardImplementationAbilityIndex === 1 &&
        action.payload?.cardId === brokerId,
    );
    expect(state.runner.credits).toBe(creditsBeforeTake + 6);
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(0);
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          action.type === "activated_card_ability" &&
          (action.payload?.cardImplementationAbilityIndex === 0 ||
            action.payload?.cardImplementationAbilityIndex === 1),
      ),
    ).toBe(false);
  });

  it("clears counters when installed Runner cards leave the rig for grip or stack", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-rig-exit-clears-counters"),
    );
    state.runner.credits = 12;
    const brokerId = installRunnerResourceForTest(
      state,
      "onr_v1_154_broker",
    );
    setCardCounterForTest(state, brokerId, "power", 3);
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: brokerId,
      setAside: {
        visibility: "public",
        reason: "v1914_rig_to_grip_counter_cleanup",
        allowReturn: true,
        returnZone: { side: "runner", zone: "grip" },
      },
    };

    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );
    expect(state.cardInstances[brokerId]?.counters).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) => action.type === "return_from_set_aside",
    );
    expect(state.runner.grip).toContain(brokerId);
    expect(state.cardInstances[brokerId]?.counters).toBeUndefined();

    const programId = installRunnerProgramForTest(state, "simple_decoder");
    setCardCounterForTest(state, programId, "power", 2);
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: programId,
      setAside: {
        visibility: "public",
        reason: "v1914_rig_to_stack_counter_cleanup",
        allowReturn: true,
        returnZone: { side: "runner", zone: "stack" },
      },
    };
    state = apply(
      state,
      "runner",
      (action) => action.type === "move_to_set_aside",
    );
    expect(state.cardInstances[programId]?.counters).toBeUndefined();
    state = apply(
      state,
      "runner",
      (action) => action.type === "return_from_set_aside",
    );
    expect(state.runner.stack).toContain(programId);
    expect(state.cardInstances[programId]?.counters).toBeUndefined();
  });

  it("gates Power Grid Overload on visible tags and installed Runner hardware", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-power-grid-overload"),
    );
    state.runner.credits = 12;
    state.runner.memoryLimit = 8;
    moveRunnerCardToGrip(state, "onr_v1_120_armadillo-armored-road-home");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_120_armadillo-armored-road-home",
    );
    const hardwareId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_120_armadillo-armored-road-home",
    );
    expect(hardwareId).toBeDefined();
    const operationId = moveCorpCardToHq(
      state,
      "onr_v1_299_power-grid-overload",
    );

    let untagged = apply(
      state,
      "runner",
      (action) => action.type === "end_turn",
    );
    untagged = apply(
      untagged,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    untagged.corp.credits = 6;
    expect(
      getLegalActions(untagged, "corp").some(
        (action) =>
          action.type === "play_operation" &&
          action.payload?.cardId === operationId,
      ),
    ).toBe(false);

    let tagged = structuredClone(state);
    tagged.runner.tags = 1;
    tagged = apply(tagged, "runner", (action) => action.type === "end_turn");
    tagged = apply(
      tagged,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    tagged.corp.credits = 6;
    tagged = apply(
      tagged,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(tagged, action) === "onr_v1_299_power-grid-overload" &&
        action.payload?.powerGridOverloadTrashCount === 1,
    );
    expect(tagged.runner.rig.hardware).not.toContain(hardwareId);
    expect(tagged.runner.heap).toContain(hardwareId);
    expect(tagged.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      powerGridOverloadTrashCount: 1,
      trashedHardwareCount: 1,
    });
  });

  it("offers Power Grid Overload X actions for non-Cybernetics hardware and choices exact targets", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "v1914_power_grid_overload_rd_interface_runner",
      cards: [
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards,
        { id: "onr_v1_127_full-body-conversion", quantity: 1 },
        { id: "onr_v1_139_r-and-d-interface", quantity: 1 },
        { id: "simple_setup_hardware", quantity: 1 },
      ],
    };
    const makeState = (seed: string) =>
      toRunnerTurn(
        createGameAfterSetup({
          seed,
          baseline: CURRENT_RULES_BASELINE,
          runnerDeck,
          corpDeck: MECHANIC_SMOKE_DECKS.traceTags.corp,
          agendaPointsToWin: 7,
        }),
      );

    let rdOnly = makeState("v1914-power-grid-overload-rd-only");
    const rdOnlyInterfaceId = installRunnerHardwareForTest(
      rdOnly,
      "onr_v1_139_r-and-d-interface",
    );
    const rdOnlyCyberneticsId = installRunnerHardwareForTest(
      rdOnly,
      "onr_v1_127_full-body-conversion",
    );
    const rdOnlyOperationId = moveCorpCardToHq(
      rdOnly,
      "onr_v1_299_power-grid-overload",
    );
    rdOnly.runner.tags = 25;
    rdOnly = apply(rdOnly, "runner", (action) => action.type === "end_turn");
    rdOnly = apply(
      rdOnly,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    rdOnly.corp.credits = 1;
    const rdOnlyAction = mustAction(
      rdOnly,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(rdOnly, action) === "onr_v1_299_power-grid-overload" &&
        action.payload?.cardId === rdOnlyOperationId &&
        action.payload?.powerGridOverloadTrashCount === 1,
    );
    expect(rdOnlyAction.costs).toEqual([{ clicks: 1, credits: 1 }]);
    rdOnly = apply(
      rdOnly,
      "corp",
      (action) => action.actionId === rdOnlyAction.actionId,
    );
    expect(rdOnly.pendingChoice).toBeUndefined();
    expect(rdOnly.runner.heap).toContain(rdOnlyInterfaceId);
    expect(rdOnly.runner.rig.hardware).toContain(rdOnlyCyberneticsId);

    let state = makeState(
      "v1914-power-grid-overload-rd-interface-choice",
    );
    const rdInterfaceId = installRunnerHardwareForTest(
      state,
      "onr_v1_139_r-and-d-interface",
    );
    const simpleHardwareId = installRunnerHardwareForTest(
      state,
      "simple_setup_hardware",
    );
    const cyberneticsId = installRunnerHardwareForTest(
      state,
      "onr_v1_127_full-body-conversion",
    );
    const operationId = moveCorpCardToHq(
      state,
      "onr_v1_299_power-grid-overload",
    );
    state.runner.tags = 25;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 3;

    const powerGridActions = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(state, action) === "onr_v1_299_power-grid-overload" &&
          action.payload?.cardId === operationId,
      )
      .sort(
        (left, right) =>
          Number(left.payload?.powerGridOverloadTrashCount ?? 0) -
          Number(right.payload?.powerGridOverloadTrashCount ?? 0),
      );
    expect(
      powerGridActions.map(
        (action) => action.payload?.powerGridOverloadTrashCount,
      ),
    ).toEqual([1, 2]);
    expect(powerGridActions.map((action) => action.costs)).toEqual([
      [{ clicks: 1, credits: 1 }],
      [{ clicks: 1, credits: 2 }],
    ]);

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const trashOne = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_299_power-grid-overload" &&
        action.payload?.cardId === operationId &&
        action.payload?.powerGridOverloadTrashCount === 1,
    );
    state = apply(
      state,
      "corp",
      (action) => action.actionId === trashOne.actionId,
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "public",
    });
    expect(
      state.pendingChoice?.options.map((option) => option.value).sort(),
    ).toEqual([rdInterfaceId, simpleHardwareId].sort());
    expect(
      state.pendingChoice?.options.map((option) => option.value),
    ).not.toContain(cyberneticsId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      powerGridOverloadChoiceOpened: true,
      eligibleHardwareCount: 2,
      powerGridOverloadTrashCount: 1,
    });

    const rdOptionId =
      state.pendingChoice?.options.find(
        (option) => option.value === rdInterfaceId,
      )?.id ?? "";
    state = applyChoice(state, "corp", rdOptionId);
    expect(state.runner.heap).toContain(rdInterfaceId);
    expect(state.runner.rig.hardware).not.toContain(rdInterfaceId);
    expect(state.runner.rig.hardware).toContain(simpleHardwareId);
    expect(state.runner.rig.hardware).toContain(cyberneticsId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      powerGridOverloadTrashCount: 1,
      trashedHardwareCount: 1,
      trashedHardwareDefinitionIds: "onr_v1_139_r-and-d-interface",
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("loads Armadillo bits for tag removal and refreshes them at Runner turn start", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-armadillo-tag-bits"),
    );
    state.runner.credits = 2;
    state.runner.clicks = 5;
    moveRunnerCardToGrip(state, "onr_v1_120_armadillo-armored-road-home");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_120_armadillo-armored-road-home",
    );
    const armadilloId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_120_armadillo-armored-road-home",
    );
    expect(armadilloId).toBeDefined();
    if (!armadilloId) throw new Error("Missing Armadillo");
    expect(cardCounterAmount(state, armadilloId, "bit")).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) =>
          card.definitionId ===
          "onr_v1_120_armadillo-armored-road-home",
      )?.counters?.bit,
    ).toBe(2);

    state.runner.tags = 1;
    state.runner.credits = 0;
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "remove_tag",
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "remove_tag");
    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, armadilloId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "remove_tag",
      amount: 1,
      armadilloRecurringCreditsSpent: 2,
      tagRemovalRecurringCreditsSpent: 2,
      runnerCreditsSpent: 0,
      tagRemovalCreditSourceDefinitionIds:
        "onr_v1_120_armadillo-armored-road-home",
    });

    state = apply(state, "runner", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "runner"
    ) {
      state = applyChoice(
        state,
        "runner",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    expect(cardCounterAmount(state, armadilloId, "bit")).toBe(2);
  });

  it("loads Drifter bits for tag removal and refreshes them at Runner turn start", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-drifter-tag-bits"),
    );
    state.runner.credits = 0;
    state.runner.clicks = 5;
    moveRunnerCardToGrip(state, "onr_v1_126_drifter-mobile-environment");
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          "onr_v1_126_drifter-mobile-environment",
    );
    const drifterId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        "onr_v1_126_drifter-mobile-environment",
    );
    expect(drifterId).toBeDefined();
    if (!drifterId) throw new Error("Missing Drifter");
    expect(cardCounterAmount(state, drifterId, "bit")).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) =>
          card.definitionId === "onr_v1_126_drifter-mobile-environment",
      )?.counters?.bit,
    ).toBe(2);

    state.runner.tags = 1;
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "remove_tag",
      ),
    ).toBe(true);
    state = apply(state, "runner", (action) => action.type === "remove_tag");
    expect(state.runner.tags).toBe(0);
    expect(state.runner.credits).toBe(0);
    expect(cardCounterAmount(state, drifterId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "remove_tag",
      amount: 1,
      tagRemovalRecurringCreditsSpent: 2,
      runnerCreditsSpent: 0,
      tagRemovalCreditSourceDefinitionIds:
        "onr_v1_126_drifter-mobile-environment",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "armadilloRecurringCreditsSpent",
    );

    state = apply(state, "runner", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "runner"
    ) {
      state = applyChoice(
        state,
        "runner",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = apply(state, "corp", (action) => action.type === "end_turn");
    if (
      state.pendingChoice?.source === "discard_phase" &&
      state.pendingChoice.side === "corp"
    ) {
      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice.options[0]?.id),
      );
    }
    expect(cardCounterAmount(state, drifterId, "bit")).toBe(2);
  });
});
