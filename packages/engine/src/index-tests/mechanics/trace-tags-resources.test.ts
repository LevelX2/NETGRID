import {
  canonicalCapabilityId,
  capabilityKey as cardSpecCapabilityKey,
} from "@netgrid/cards/engine";
import { serializedDefinitionReferences } from "../../test-fixtures/serialized-definition-references";
import { describe, expect, it } from "vitest";
import {
  applyAction,
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
  validateGameState,
} from "../../index";
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

const BROKER_DEFINITION_ID = 366;

function isBrokerCapabilityAction(
  action: LegalAction,
  brokerId: string,
  capabilityKey: "store_credits" | "withdraw_credits",
): boolean {
  return (
    action.type === "activated_card_ability" &&
    action.payload?.cardId === brokerId &&
    action.payload?.cardImplementationCapabilityBindingKind ===
      "card_spec_capability_key" &&
    action.payload?.cardImplementationAbilityKey === capabilityKey &&
    action.payload?.cardImplementationAbilityId ===
      canonicalCapabilityId(
        BROKER_DEFINITION_ID,
        cardSpecCapabilityKey(capabilityKey),
      ) &&
    action.payload?.cardImplementationAbilityIndex === undefined &&
    action.payload?.cardImplementationLifecycleIndex === undefined
  );
}

function expectCanonicalBrokerCapability(
  action: LegalAction,
  brokerId: string,
  capabilityKey: "store_credits" | "withdraw_credits",
): void {
  expect(action.payload).toMatchObject({
    cardId: brokerId,
    cardImplementationCapabilityBindingKind: "card_spec_capability_key",
    cardImplementationAbilityKey: capabilityKey,
    cardImplementationAbilityId: canonicalCapabilityId(
      BROKER_DEFINITION_ID,
      cardSpecCapabilityKey(capabilityKey),
    ),
  });
  expect(action.payload).not.toHaveProperty("cardImplementationAbilityIndex");
  expect(action.payload).not.toHaveProperty("cardImplementationLifecycleIndex");
}

describe("V1.9.14 Trace/Tag/Resource Longtail", () => {
  it("adds all V1.9.14 WIP runtime definitions without pulling in V1.9.15 cards", () => {
    expect(MECHANIC_SMOKE_CARD_IDS.traceTags).toHaveLength(25);
    for (const definitionId of MECHANIC_SMOKE_CARD_IDS.traceTags) {
      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
      expect(definition?.implementationStatus, String(definitionId)).toBe(
        "playable_mvp",
      );
      expect(definition?.rulesText, String(definitionId)).not.toContain("WIP");
    }
    expect(
      CARD_DEFINITIONS_BY_ID[488]?.implementationStatus,
    ).toBe("playable_mvp");
  });

  it("starts an unpromoted V1.9.14 Corp ICE trace through the existing side-safe bid window", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-asp-trace-wip"),
    );
    const aspInstanceId = "v1914_asp_instance" as CardInstanceId;
    const rd = state.corp.servers.find((server) => server.id === "rd");
    expect(rd).toBeDefined();
    if (!rd) throw new Error("Missing R&D server");
    rd.ice.push(aspInstanceId);
    state.cardInstances[aspInstanceId] = {
      instanceId: aspInstanceId,
      definitionId: 433,
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
        sourceDefinition(state, action) === 433,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");

    expect(state.pendingChoice?.side).toBe("corp");
    expect(state.pendingChoice?.kind).toBe("bid_amount");
    expect(state.trace).toMatchObject({
      status: "corp_bid",
      traceLimit: 5,
    });
    expect(getPlayerView(state, "corp").pendingChoice?.choiceId).toBe(
      state.pendingChoice?.choiceId,
    );
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

    state = applyChoice(state, "corp", "bid_1");
    expect(state.trace).toMatchObject({
      status: "runner_bid",
      corpBid: 1,
      traceValue: 6,
      runnerLink: 0,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(0);
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(1);
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
      [433, 5],
      [440, 6],
      [452, 4],
      [453, 5],
      [460, 5],
      [472, 6],
      [476, 3],
    ] as const;

    for (const [definitionId, traceLimit] of traceIce) {
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

      expect(state.pendingChoice?.side, String(definitionId)).toBe("corp");
      expect(state.pendingChoice?.kind, String(definitionId)).toBe("bid_amount");
      expect(
        getPlayerView(state, "runner").pendingChoice,
        String(definitionId),
      ).toBeUndefined();
      expect(state.trace, String(definitionId)).toMatchObject({
        status: "corp_bid",
        traceLimit,
      });
    }
  });

  it("uses Hacker Tracker counters in traces and applies Fang 2.0's pay-to-run lock", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-fang-htc-lock"),
    );
    const hackerTrackerId = putCorpRootInRemote(
      state,
      537,
    );
    const hackerTrackerServer = state.corp.servers.find(
      (server) => server.id === "r1",
    );
    if (!hackerTrackerServer) throw new Error("Missing Hacker Tracker server.");
    hackerTrackerServer.id = "r2";
    hackerTrackerServer.label = "Remote 2";
    state.cardInstances[hackerTrackerId] = {
      ...state.cardInstances[hackerTrackerId]!,
      zone: { side: "corp", zone: "serverRoot", serverId: "r2" },
      counters: { bit: 2 },
    };
    state.corp.servers.push({
      id: "r1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    const fangId = putCorpIceOnServer(state, "r1", 453);
    state.corp.credits = 10;
    state.runner.credits = 10;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "r1",
    );
    expect(serializedDefinitionReferences(JSON.stringify(getPlayerView(state, "runner")))).not.toContain(
      537,
    );
    const hackerTrackerRezAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "rez_card" &&
        action.payload?.cardId === hackerTrackerId &&
        action.payload?.rootRez === true,
    );
    expect(hackerTrackerRezAction).toMatchObject({
      costs: [{ credits: 0 }],
      payload: {
        cardId: hackerTrackerId,
        rootRez: true,
        serverId: "r2",
      },
    });
    state = apply(
      state,
      "corp",
      (action) => action.actionId === hackerTrackerRezAction.actionId,
    );
    expect(state.cardInstances[hackerTrackerId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "serverRoot", serverId: "r2" },
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "rez_card",
      cardDefinitionId: 537,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      537,
    );
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "rez_ice" && action.payload?.cardId === fangId,
    );
    state = apply(state, "runner", (action) => action.type === "continue_run");
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.type === "rez_ice",
      ),
    ).toBe(false);
    state = applyChoice(state, "corp", "bid_6");
    expect(state.corp.credits).toBe(0);
    expect(cardCounterAmount(state, hackerTrackerId, "bit")).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "corp_bid",
      corpBid: 6,
      corpCreditBid: 4,
      hackerTrackerCountersSpent: 2,
      effectiveTraceLimit: 7,
      traceValue: 11,
    });

    state = applyChoice(state, "runner", "bid_0");
    expect(state.runner.tags).toBe(0);
    expect(state.run).toBeUndefined();
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(2);
    expect(cardCounterAmount(state, hackerTrackerId, "bit")).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 0,
      fangRunEnded: true,
      runnerRunLockCreditCost: 2,
      hackerTrackerCountersAdded: 1,
    });
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "start_run",
      ),
    ).toBe(false);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));

    const creditsBeforeClearingRunLock = state.runner.credits;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.v1920RunnerRunLockAbility === "pay_to_remove_run_lock",
    );
    expect(state.runner.credits).toBe(creditsBeforeClearingRunLock - 2);
    expect(state.runnerTurnFlags?.runnerRunLockCreditCost).toBe(0);
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

      const definition = CARD_DEFINITIONS_BY_ID[definitionId];
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
      expect(installed, String(definitionId)).toBe(true);
      if (definition?.type === "event")
        expect(state.runner.tags, String(definitionId)).toBe(0);
      if (definition?.type === "program")
        expect(state.runner.memoryUsed, String(definitionId)).toBeGreaterThan(0);
    }

    let shortTermState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-short-term-contract"),
    );
    shortTermState.runner.credits = 20;
    shortTermState.runner.clicks = 10;
    const shortTermId = moveRunnerCardToGrip(
      shortTermState,
      390,
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
    moveRunnerCardToGrip(linkState, 344);
    linkState = apply(
      linkState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(linkState, action) ===
          344,
    );
    putCorpIceOnServer(linkState, "rd", 433);
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
        sourceDefinition(linkState, action) === 433,
    );
    linkState = apply(
      linkState,
      "runner",
      (action) => action.type === "continue_run",
    );
    linkState = applyChoice(linkState, "corp", "bid_0");
    expect(linkState.trace).toMatchObject({
      status: "runner_bid",
      runnerLink: 0,
    });

    let resourceState = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-resource-trash"),
    );
    resourceState.runner.credits = 12;
    resourceState.runner.memoryLimit = 8;
    moveRunnerCardToGrip(resourceState, 366);
    resourceState = apply(
      resourceState,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(resourceState, action) === 366,
    );
    const brokerId = resourceState.runner.rig.resources.find(
      (cardId) =>
        resourceState.cardInstances[cardId]?.definitionId ===
        366,
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Broker was not installed.");
    resourceState = apply(resourceState, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "store_credits"),
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
    moveRunnerCardToGrip(state, 366);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === 366,
    );
    const brokerId = state.runner.rig.resources.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId === 366,
    );
    expect(brokerId).toBeDefined();
    if (!brokerId) throw new Error("Broker was not installed.");

    let brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some((action) =>
        isBrokerCapabilityAction(action, brokerId, "store_credits"),
      ),
    ).toBe(true);
    expect(
      brokerActions.some((action) =>
        isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(false);

    const initialLoad = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "store_credits"),
    );
    expectCanonicalBrokerCapability(initialLoad, brokerId, "store_credits");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === initialLoad.actionId,
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
          isBrokerCapabilityAction(action, brokerId, "store_credits") ||
          isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some((action) =>
        isBrokerCapabilityAction(action, brokerId, "store_credits"),
      ),
    ).toBe(true);
    expect(
      brokerActions.some((action) =>
        isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(true);

    const loadAgain = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "store_credits"),
    );
    expectCanonicalBrokerCapability(loadAgain, brokerId, "store_credits");
    const staleTakeAll = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
    );
    expectCanonicalBrokerCapability(staleTakeAll, brokerId, "withdraw_credits");
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
          isBrokerCapabilityAction(action, brokerId, "store_credits") ||
          isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(false);

    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state = toRunnerTurnFromCorpMain(state);
    const creditsBeforeTake = state.runner.credits;
    const take = mustAction(state, "runner", (action) =>
      isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
    );
    expectCanonicalBrokerCapability(take, brokerId, "withdraw_credits");
    state = apply(
      state,
      "runner",
      (action) => action.actionId === take.actionId,
    );
    expect(state.runner.credits).toBe(creditsBeforeTake + 6);
    expect(cardCounterAmount(state, brokerId, "bit")).toBe(0);
    brokerActions = getLegalActions(state, "runner").filter(
      (action) => action.payload?.cardId === brokerId,
    );
    expect(
      brokerActions.some(
        (action) =>
          isBrokerCapabilityAction(action, brokerId, "store_credits") ||
          isBrokerCapabilityAction(action, brokerId, "withdraw_credits"),
      ),
    ).toBe(false);
  });

  it("clears counters when installed Runner cards leave the rig for grip or stack", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-rig-exit-clears-counters"),
    );
    state.runner.credits = 12;
    const brokerId = installRunnerResourceForTest(state, 366);
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

    const programId = installRunnerProgramForTest(state, 591);
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

  it("gates Hardware-Trash-by-Counter on visible tags and installed Runner hardware", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.traceTags("v1914-power-grid-overload"),
    );
    state.runner.credits = 12;
    state.runner.memoryLimit = 8;
    moveRunnerCardToGrip(state, 332);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          332,
    );
    const hardwareId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        332,
    );
    expect(hardwareId).toBeDefined();
    const operationId = moveCorpCardToHq(
      state,
      511,
    );
    const corpPowerGridView = getPlayerView(state, "corp").own.gripOrHq.find(
      (card) => card.instanceId === operationId,
    );
    expect(corpPowerGridView).toMatchObject({
      known: true,
      definitionId: 511,
      playCost: {
        kind: "variable_x",
        minimumX: 0,
        creditsPerX: 1,
        maximumX: { kind: "context" },
      },
    });
    expect(corpPowerGridView).not.toHaveProperty("cost");
    expect(serializedDefinitionReferences(JSON.stringify(getPlayerView(state, "runner")))).not.toContain(
      511,
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
        sourceDefinition(tagged, action) === 511 &&
        action.payload?.hardwareTrashByCounterTrashCount === 1,
    );
    const taggedTargetOption = tagged.pendingChoice?.options.find(
      (option) => option.value === hardwareId,
    );
    if (!taggedTargetOption) throw new Error("Missing hardware trash option");
    tagged = applyChoices(tagged, "corp", [taggedTargetOption.id]);
    expect(tagged.runner.rig.hardware).not.toContain(hardwareId);
    expect(tagged.runner.heap).toContain(hardwareId);
    expect(tagged.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      hardwareTrashByCounterTrashCount: 1,
      trashedHardwareCount: 1,
    });
  });

  it("offers Hardware-Trash-by-Counter X actions for non-Cybernetics hardware and choices exact targets", () => {
    const runnerDeck: DeckDefinition = {
      ...MECHANIC_SMOKE_DECKS.traceTags.runner,
      id: "installed_hardware_trash_by_counter_rd_interface_runner",
      cards: [
        ...MECHANIC_SMOKE_DECKS.traceTags.runner.cards,
        { id: 339, quantity: 1 },
        { id: 351, quantity: 1 },
        { id: 602, quantity: 1 },
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

    let zeroOnly = makeState("v1914-power-grid-overload-zero");
    const zeroOnlyOperationId = moveCorpCardToHq(
      zeroOnly,
      511,
    );
    zeroOnly.runner.tags = 1;
    zeroOnly = apply(
      zeroOnly,
      "runner",
      (action) => action.type === "end_turn",
    );
    zeroOnly = apply(
      zeroOnly,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    zeroOnly.corp.credits = 0;
    zeroOnly = apply(
      zeroOnly,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        action.payload?.cardId === zeroOnlyOperationId &&
        action.payload?.hardwareTrashByCounterTrashCount === 0,
    );
    expect(zeroOnly.pendingChoice).toBeUndefined();
    expect(zeroOnly.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      hardwareTrashByCounterTrashCount: 0,
      trashedHardwareCount: 0,
    });

    let rdOnly = makeState("v1914-power-grid-overload-rd-only");
    const rdOnlyInterfaceId = installRunnerHardwareForTest(
      rdOnly,
      351,
    );
    const rdOnlyCyberneticsId = installRunnerHardwareForTest(
      rdOnly,
      339,
    );
    const rdOnlyOperationId = moveCorpCardToHq(
      rdOnly,
      511,
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
        sourceDefinition(rdOnly, action) === 511 &&
        action.payload?.cardId === rdOnlyOperationId &&
        action.payload?.hardwareTrashByCounterTrashCount === 1,
    );
    expect(rdOnlyAction.costs).toEqual([{ clicks: 1, credits: 1 }]);
    rdOnly = apply(
      rdOnly,
      "corp",
      (action) => action.actionId === rdOnlyAction.actionId,
    );
    expect(rdOnly.pendingChoice).toMatchObject({
      side: "corp",
      minSelections: 1,
      maxSelections: 1,
      selectionOrdering: "ordered",
    });
    const rdOnlyTargetOption = rdOnly.pendingChoice?.options.find(
      (option) => option.value === rdOnlyInterfaceId,
    );
    if (!rdOnlyTargetOption) throw new Error("Missing hardware trash option");
    rdOnly = applyChoices(rdOnly, "corp", [rdOnlyTargetOption.id]);
    expect(rdOnly.runner.heap).toContain(rdOnlyInterfaceId);
    expect(rdOnly.runner.rig.hardware).toContain(rdOnlyCyberneticsId);

    let state = makeState("v1914-power-grid-overload-rd-interface-choice");
    const rdInterfaceId = installRunnerHardwareForTest(
      state,
      351,
    );
    const simpleHardwareId = installRunnerHardwareForTest(
      state,
      602,
    );
    const cyberneticsId = installRunnerHardwareForTest(
      state,
      339,
    );
    const operationId = moveCorpCardToHq(
      state,
      511,
    );
    state.runner.tags = 25;
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.corp.credits = 3;

    const powerGridActions = getLegalActions(state, "corp")
      .filter(
        (action) =>
          action.type === "play_operation" &&
          sourceDefinition(state, action) ===
            511 &&
          action.payload?.cardId === operationId,
      )
      .sort(
        (left, right) =>
          Number(left.payload?.hardwareTrashByCounterTrashCount ?? 0) -
          Number(right.payload?.hardwareTrashByCounterTrashCount ?? 0),
      );
    expect(
      powerGridActions.map(
        (action) => action.payload?.hardwareTrashByCounterTrashCount,
      ),
    ).toEqual([0, 1, 2]);
    expect(powerGridActions.map((action) => action.costs)).toEqual([
      [{ clicks: 1, credits: 0 }],
      [{ clicks: 1, credits: 1 }],
      [{ clicks: 1, credits: 2 }],
    ]);
    expect(
      powerGridActions.map((action) => ({
        xValue: action.payload?.xValue,
        xMinimum: action.payload?.xMinimum,
        xMaximum: action.payload?.xMaximum,
        xUpperBound: action.payload?.xUpperBound,
        xCreditsPerUnit: action.payload?.xCreditsPerUnit,
        variableCostKind: action.payload?.variableCostKind,
      })),
    ).toEqual([
      {
        xValue: 0,
        xMinimum: 0,
        xMaximum: 2,
        xUpperBound: 2,
        xCreditsPerUnit: 1,
        variableCostKind: "printed_play_cost",
      },
      {
        xValue: 1,
        xMinimum: 0,
        xMaximum: 2,
        xUpperBound: 2,
        xCreditsPerUnit: 1,
        variableCostKind: "printed_play_cost",
      },
      {
        xValue: 2,
        xMinimum: 0,
        xMaximum: 2,
        xUpperBound: 2,
        xCreditsPerUnit: 1,
        variableCostKind: "printed_play_cost",
      },
    ]);
    expect(
      new Set(powerGridActions.map((action) => action.actionId)).size,
    ).toBe(3);

    const trashTwo = powerGridActions[2]!;
    const staleHash = hashState(state);
    expect(
      applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: trashTwo.actionId,
        clientKnownStateVersion: state.stateVersion - 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_STALE_STATE" } });
    expect(hashState(state)).toBe(staleHash);

    const underfunded = structuredClone(state);
    underfunded.corp.credits = 1;
    const underfundedHash = hashState(underfunded);
    expect(
      applyAction(underfunded, {
        matchId: underfunded.matchId,
        side: "corp",
        actionId: trashTwo.actionId,
        clientKnownStateVersion: underfunded.stateVersion,
      }),
    ).toMatchObject({ ok: false, error: { code: "ERR_UNKNOWN_ACTION" } });
    expect(hashState(underfunded)).toBe(underfundedHash);

    const xTwoInitial = structuredClone(state);
    const xTwoReplayStart = state.eventLog.length;
    const creditsBeforeXTwo = state.corp.credits;
    const xTwoResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: trashTwo.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(xTwoResult.ok).toBe(true);
    if (!xTwoResult.ok) throw new Error(xTwoResult.error.message);
    let xTwoState = xTwoResult.state;
    expect(xTwoState.corp.credits).toBe(creditsBeforeXTwo - 2);
    expect(xTwoState.pendingChoice).toMatchObject({
      minSelections: 2,
      maxSelections: 2,
      selectionOrdering: "ordered",
    });
    const xTwoOptions = xTwoState.pendingChoice?.options;
    if (!xTwoOptions || xTwoOptions.length !== 2)
      throw new Error("Missing ordered hardware trash options");
    xTwoState = applyChoices(
      xTwoState,
      "corp",
      xTwoOptions.map((option) => option.id).reverse(),
    );
    expect(xTwoState.runner.heap).toEqual(
      expect.arrayContaining([rdInterfaceId, simpleHardwareId]),
    );
    expect(xTwoState.runner.heap.slice(-2)).toEqual([
      simpleHardwareId,
      rdInterfaceId,
    ]);
    const xTwoReplay = replayEvents(
      xTwoInitial,
      xTwoState.eventLog.slice(xTwoReplayStart),
    );
    expect(xTwoReplay.ok).toBe(true);
    expect(hashState(xTwoReplay.state)).toBe(hashState(xTwoState));

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const trashOne = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === 511 &&
        action.payload?.cardId === operationId &&
        action.payload?.hardwareTrashByCounterTrashCount === 1,
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
      selectionOrdering: "ordered",
    });
    expect(
      state.pendingChoice?.options.map((option) => option.value).sort(),
    ).toEqual([rdInterfaceId, simpleHardwareId].sort());
    expect(
      state.pendingChoice?.options.map((option) => option.value),
    ).not.toContain(cyberneticsId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "play_operation",
      hardwareTrashByCounterChoiceOpened: true,
      eligibleHardwareCount: 2,
      hardwareTrashByCounterTrashCount: 1,
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
      hardwareTrashByCounterTrashCount: 1,
      trashedHardwareCount: 1,
      trashedHardwareDefinitionIds: "351",
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
    moveRunnerCardToGrip(state, 332);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          332,
    );
    const armadilloId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        332,
    );
    expect(armadilloId).toBeDefined();
    if (!armadilloId) throw new Error("Missing Armadillo");
    expect(cardCounterAmount(state, armadilloId, "bit")).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) =>
          card.definitionId === 332,
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
      tagRemovalRecurringCreditsSpent: 2,
      runnerCreditsSpent: 0,
      tagRemovalCreditSourceDefinitionIds:
        "332",
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
    moveRunnerCardToGrip(state, 338);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) ===
          338,
    );
    const drifterId = state.runner.rig.hardware.find(
      (cardId) =>
        state.cardInstances[cardId]?.definitionId ===
        338,
    );
    expect(drifterId).toBeDefined();
    if (!drifterId) throw new Error("Missing Drifter");
    expect(cardCounterAmount(state, drifterId, "bit")).toBe(2);
    expect(
      getPlayerView(state, "corp").opponent.rig?.find(
        (card) => card.definitionId === 338,
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
        "338",
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
