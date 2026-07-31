import { describe, expect, it } from "vitest";
import type { CardInstanceId } from "@netgrid/shared";

import {
  DEMO_DECKS,
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  applyChoice,
  installRunnerHardwareForTest,
  installRunnerProgramForTest,
  moveCorpCardToHq,
  putCorpIceOnServer,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import { passRootRezWindowBeforeAccessIfOpen } from "../../test-fixtures/index-test-helpers";

const SCHEMATICS = "onr_classic_032_schematics-search-engine";
const HQ_INTERFACE = "onr_v1_129_hq-interface";
const REVIEW = "schematics_search_engine_expose_installed_cards_review";
const FINISH = "schematics_search_engine_expose_installed_cards_finish";

describe("Schematics Search Engine HQ breach", () => {
  it("opens one review at breach start and never retriggers during root-first multiaccess", () => {
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "schematics-single-hq-breach-trigger",
        runnerDeck: {
          ...DEMO_DECKS.demo_runner_004,
          id: "schematics_multiaccess_runner",
          cards: [
            { id: SCHEMATICS, quantity: 1 },
            { id: HQ_INTERFACE, quantity: 1 },
            ...DEMO_DECKS.demo_runner_004.cards.filter(
              (entry) => entry.id !== SCHEMATICS && entry.id !== HQ_INTERFACE,
            ),
          ],
        },
        corpDeck: {
          ...DEMO_DECKS.demo_corp_004,
          id: "schematics_multiaccess_corp",
          cards: [
            { id: "simple_upgrade", quantity: 1 },
            { id: "simple_economy_asset", quantity: 1 },
            { id: "simple_barrier_ice", quantity: 1 },
            ...DEMO_DECKS.demo_corp_004.cards.filter(
              (entry) =>
                entry.id !== "simple_upgrade" &&
                entry.id !== "simple_economy_asset" &&
                entry.id !== "simple_barrier_ice",
            ),
          ],
        },
      }),
    );
    installRunnerProgramForTest(state, SCHEMATICS);
    installRunnerHardwareForTest(state, HQ_INTERFACE);
    const hqRootId = installCorpRootOnHq(state, "simple_upgrade");
    const remoteAssetId = putCorpRootInRemote(state, "simple_economy_asset");
    const remoteIceId = putCorpIceOnServer(
      state,
      "remote_1",
      "simple_barrier_ice",
    );
    state.runner.credits = 20;

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);

    expect(state.run?.breach?.queue.map((entry) => entry.zone)).toEqual([
      "remote_root",
      "hq",
      "hq",
    ]);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      prompt: "Installierte Korp-Karten ansehen",
      visibility: "hidden_info_barrier",
    });
    const exposedIds = [hqRootId, remoteAssetId, remoteIceId].sort();
    expect(state.pendingChoice?.source).toContain(exposedIds.join("|"));
    expect(reviewEvents(state)).toHaveLength(1);
    expect(finishEvents(state)).toHaveLength(0);

    const runnerViewDuringReview = getPlayerView(state, "runner");
    for (const cardId of exposedIds) {
      expect(
        visibleInstalledCard(runnerViewDuringReview, cardId),
      ).toMatchObject({ known: true });
    }
    const reviewPayload = reviewEvents(state)[0]!.publicPayload;
    expect(reviewPayload.effectSide).toBe("runner");
    expect(reviewPayload.sourceDefinitionId).toBe(SCHEMATICS);
    const hiddenHqCardIds =
      state.run?.breach?.queue
        .filter((entry) => entry.zone === "hq")
        .map((entry) => entry.cardInstanceId) ?? [];
    for (const hiddenHqCardId of hiddenHqCardIds) {
      expect(JSON.stringify(reviewPayload)).not.toContain(hiddenHqCardId);
    }

    const finishAction = getLegalActions(state, "runner").find(
      (action) => action.type === "resolve_choice",
    );
    expect(finishAction).toBeDefined();
    if (!finishAction) throw new Error("Missing Schematics finish action");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: finishAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "schematics-wrong-side",
      selectedChoices: { selectedOptionIds: ["done"] },
    });
    expect(wrongSide.ok).toBe(false);
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: finishAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "schematics-stale",
      selectedChoices: { selectedOptionIds: ["done"] },
    });
    expect(stale.ok).toBe(false);

    state = applyChoice(state, "runner", "done");
    expect(reviewEvents(state)).toHaveLength(1);
    expect(finishEvents(state)).toHaveLength(1);
    expect(finishEvents(state)[0]?.publicPayload).toMatchObject({
      serverId: "hq",
      breachId: state.run?.breach?.breachId,
      sourceDefinitionId: SCHEMATICS,
    });
    const runnerViewAfterReview = getPlayerView(state, "runner");
    const remoteAfterReview = runnerViewAfterReview.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(remoteAfterReview?.root[0]).toMatchObject({ known: false });
    expect(remoteAfterReview?.ice[0]).toMatchObject({ known: false });

    let accessCount = 0;
    for (let guard = 0; state.run && guard < 12; guard += 1) {
      expect(state.pendingChoice).toBeUndefined();
      const actions = getLegalActions(state, "runner");
      const access = actions.find((action) => action.type === "access_card");
      const decline = actions.find((action) => action.type === "decline_trash");
      const steal = actions.find((action) => action.type === "steal_agenda");
      if (access) {
        state = apply(
          state,
          "runner",
          (action) => action.actionId === access.actionId,
        );
        accessCount += 1;
      } else if (decline) {
        state = apply(
          state,
          "runner",
          (action) => action.actionId === decline.actionId,
        );
      } else if (steal) {
        state = apply(
          state,
          "runner",
          (action) => action.actionId === steal.actionId,
        );
      } else {
        throw new Error("Unexpected Schematics multiaccess continuation");
      }
      expect(reviewEvents(state)).toHaveLength(1);
      expect(finishEvents(state)).toHaveLength(1);
    }

    expect(state.run).toBeUndefined();
    expect(accessCount).toBe(3);
    expect(validateGameState(state).ok).toBe(true);
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("does not retrigger when an HQ hand candidate is resolved before the root candidate", () => {
    let state = createSchematicsMultiaccessState(
      "schematics-hq-card-first-no-retrigger",
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    expect(reviewEvents(state)).toHaveLength(1);
    state = applyChoice(state, "runner", "done");

    const run = state.run;
    const breach = run?.breach;
    if (!run || !breach) throw new Error("Missing HQ breach");
    const hqEntries = breach.queue.filter((entry) => entry.zone === "hq");
    const rootEntries = breach.queue.filter(
      (entry) => entry.zone === "remote_root",
    );
    state.run = {
      ...run,
      breach: {
        ...breach,
        queue: [...hqEntries, ...rootEntries],
        currentIndex: 0,
      },
    };

    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(reviewEvents(state)).toHaveLength(1);
    expect(finishEvents(state)).toHaveLength(1);
    expect(state.pendingChoice?.source ?? "").not.toContain(
      "p3_36.expose_installed_cards_review",
    );
  });
});

function createSchematicsMultiaccessState(seed: string) {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      runnerDeck: {
        ...DEMO_DECKS.demo_runner_004,
        id: `${seed}_runner`,
        cards: [
          { id: SCHEMATICS, quantity: 1 },
          { id: HQ_INTERFACE, quantity: 1 },
          ...DEMO_DECKS.demo_runner_004.cards.filter(
            (entry) => entry.id !== SCHEMATICS && entry.id !== HQ_INTERFACE,
          ),
        ],
      },
      corpDeck: {
        ...DEMO_DECKS.demo_corp_004,
        id: `${seed}_corp`,
        cards: [
          { id: "simple_upgrade", quantity: 1 },
          { id: "simple_economy_asset", quantity: 1 },
          { id: "simple_barrier_ice", quantity: 1 },
          ...DEMO_DECKS.demo_corp_004.cards.filter(
            (entry) =>
              entry.id !== "simple_upgrade" &&
              entry.id !== "simple_economy_asset" &&
              entry.id !== "simple_barrier_ice",
          ),
        ],
      },
    }),
  );
  installRunnerProgramForTest(state, SCHEMATICS);
  installRunnerHardwareForTest(state, HQ_INTERFACE);
  installCorpRootOnHq(state, "simple_upgrade");
  putCorpRootInRemote(state, "simple_economy_asset");
  putCorpIceOnServer(state, "remote_1", "simple_barrier_ice");
  state.runner.credits = 20;
  return state;
}

function installCorpRootOnHq(
  state: Parameters<typeof moveCorpCardToHq>[0],
  definitionId: string,
): CardInstanceId {
  const cardId = moveCorpCardToHq(state, definitionId);
  const hq = state.corp.servers.find((server) => server.id === "hq");
  if (!hq) throw new Error("Missing HQ server");
  removeEverywhere(state, cardId);
  hq.root.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "serverRoot", serverId: "hq" },
    faceup: false,
    rezzed: false,
  };
  return cardId;
}

function reviewEvents(state: Parameters<typeof getPlayerView>[0]) {
  return state.eventLog.filter(
    (event) => event.publicPayload.hiddenZoneAction === REVIEW,
  );
}

function finishEvents(state: Parameters<typeof getPlayerView>[0]) {
  return state.eventLog.filter(
    (event) => event.publicPayload.hiddenZoneAction === FINISH,
  );
}

function visibleInstalledCard(
  view: ReturnType<typeof getPlayerView>,
  cardId: CardInstanceId,
) {
  return view.servers
    .flatMap((server) => [...server.root, ...server.ice])
    .find((card) => card.instanceId === cardId);
}
