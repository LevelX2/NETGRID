import standardDeckCatalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { assertSemanticObjectSideSafe } from "../diagnostics/semantic-redaction";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";
import {
  createGameAfterSetup,
  applyAction,
  getLegalActions,
} from "@netgrid/engine";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

const RUNNER_DECK_ID = "standard_runner_last_call_at_rd";
const RUNNER_DECK_HASH = "standard-deck:76a00e66";

describe("Last Call at R&D exact choice-window regressions", () => {
  it("keeps the current MPH465DV run-start order window bound to its remote-run route", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "meta-334-postfix-final-028",
      corpDeckId: "standard_corp_mph465dv",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "runner_run_start.order:",
        ) === true,
    });
    assertRegularReplay(summary);
    expect(captures).toHaveLength(1);
    const choiceCapture = captures[0]!;
    const source = summary.actionSequence.find(
      (entry) =>
        entry.stateVersionBefore === choiceCapture.state.stateVersion - 1,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === choiceCapture.state.stateVersion,
    );
    expect(source).toMatchObject({
      side: "runner",
      selectedActionId: "runner.start_run.remote_1",
      actionType: "start_run",
      planKind: "runner.contest_remote",
      fallbackUsed: false,
    });
    expect(choice).toMatchObject({
      side: "runner",
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "runner.contest_remote",
      fallbackUsed: false,
    });
    expect(choice?.evidence).toEqual(
      expect.arrayContaining([
        source?.evidence.find((entry) => entry.startsWith("plan_first_root:")),
        source?.evidence.find((entry) =>
          entry.startsWith("plan_first_executor:"),
        ),
        "plan_scheduler:window:plan_bound_runner_run_start_order_choice:none",
      ]),
    );
  }, 90_000);

  it("retains an event-run origin through the Engine's simultaneous run-start cleanup", () => {
    let state = createGameAfterSetup({
      seed: "last-call-event-run-order-fixture",
      runnerDeck: deckDefinition(standardDeck(RUNNER_DECK_ID)),
      corpDeck: deckDefinition(standardDeck("standard_corp_mph465dv")),
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.turnSerial = 4;
    state.stateVersion = 10;
    state.runner.clicks = 4;
    state.runner.credits = 10;
    for (const agenda of Object.values(state.cardInstances)
      .filter(
        (c) =>
          c.definitionId === "onr_v1_209_political-coup" ||
          c.definitionId === "onr_v1_193_corporate-coup",
      )
      .slice(0, 3)) {
      state.corp.hq = state.corp.hq.filter((id) => id !== agenda.instanceId);
      state.corp.rd = state.corp.rd.filter((id) => id !== agenda.instanceId);
      state.corp.scoreArea.push(agenda.instanceId);
      Object.assign(agenda, {
        zone: { side: "corp", zone: "score" },
        faceup: true,
        rezzed: false,
      });
    }
    for (const id of [
      "onr_v1_211_polymer-breakthrough",
      "onr_v1_219_superior-net-barriers",
    ]) {
      const agenda = Object.values(state.cardInstances).find(
        (c) => c.definitionId === id,
      )!;
      state.corp.hq = state.corp.hq.filter(
        (cardId) => cardId !== agenda.instanceId,
      );
      state.corp.rd = state.corp.rd.filter(
        (cardId) => cardId !== agenda.instanceId,
      );
      state.runner.scoreArea.push(agenda.instanceId);
      Object.assign(agenda, {
        zone: { side: "runner", zone: "score" },
        faceup: true,
        rezzed: false,
      });
    }
    // Two independently mandatory self-trash triggers create a real Engine
    // ordering choice. An installed ETR makes the event's bypass material.
    const conferences = Object.values(state.cardInstances)
      .filter((c) => c.definitionId === "onr_v1_184_top-runners-conference")
      .slice(0, 2);
    const inside = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_v1_094_inside-job",
    )!;
    for (const c of [...conferences, inside]) {
      state.runner.grip = state.runner.grip.filter((id) => id !== c.instanceId);
      state.runner.stack = state.runner.stack.filter(
        (id) => id !== c.instanceId,
      );
    }
    state.runner.grip.push(inside.instanceId);
    Object.assign(inside, {
      zone: { side: "runner", zone: "grip" },
      faceup: false,
      rezzed: false,
    });
    for (const c of conferences) {
      state.runner.rig.resources.push(c.instanceId);
      Object.assign(c, {
        zone: { side: "runner", zone: "rig" },
        faceup: true,
        rezzed: true,
      });
    }
    const blocker = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_v1_223_banpei",
    )!;
    state.corp.hq = state.corp.hq.filter((id) => id !== blocker.instanceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== blocker.instanceId);
    state.corp.servers.find((s) => s.id === "hq")!.ice.push(blocker.instanceId);
    Object.assign(blocker, {
      zone: { side: "corp", zone: "server", serverId: "hq", area: "ice" },
      faceup: true,
      rezzed: true,
    });
    const rdBlocker = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_v1_244_filter",
    )!;
    state.corp.hq = state.corp.hq.filter((id) => id !== rdBlocker.instanceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== rdBlocker.instanceId);
    state.corp.servers
      .find((s) => s.id === "rd")!
      .ice.push(rdBlocker.instanceId);
    Object.assign(rdBlocker, {
      zone: { side: "corp", zone: "server", serverId: "rd", area: "ice" },
      faceup: true,
      rezzed: true,
    });
    const knownAgenda = Object.values(state.cardInstances).find(
      (c) => c.definitionId === "onr_v1_200_encryption-breakthrough",
    )!;
    state.corp.hq = state.corp.hq.filter((id) => id !== knownAgenda.instanceId);
    state.corp.rd = state.corp.rd.filter((id) => id !== knownAgenda.instanceId);
    state.corp.rd.push(...state.corp.hq);
    for (const id of state.corp.hq)
      state.cardInstances[id]!.zone = { side: "corp", zone: "rd" };
    state.corp.hq = [knownAgenda.instanceId];
    Object.assign(knownAgenda, {
      zone: { side: "corp", zone: "hq" },
      faceup: false,
      rezzed: false,
    });
    state.eventLog.push({
      eventId: "fixture-known-hq-agenda",
      type: "access_card",
      turnSerial: 2,
      stateVersionBefore: state.stateVersion - 1,
      stateVersionAfter: state.stateVersion,
      stateHashAfter: "fnv1a:fixture",
      visibilityClass: "public",
      publicPayload: {
        actor: "runner",
        actionType: "access_card",
        serverId: "hq",
        cardDefinitionId: knownAgenda.definitionId,
        title: "Encryption Breakthrough",
      },
    });
    resetResidentPlanPortfolioMemory();
    const options = {
      ownDeckSnapshot: {
        deckSnapshotId: "last-call-event-run-order-fixture",
        side: "runner" as const,
        cards: standardDeck(RUNNER_DECK_ID).cards,
      },
    };
    const input = buildAiDecisionInput(state, "runner", options);
    expect(input.playerView.own.agendaPoints).toBe(6);
    assertSemanticObjectSideSafe(input, "eventRunInput");
    const source = chooseAiAction(input);
    const action = getLegalActions(state, "runner").find(
      (a) => a.actionId === source.actionId,
    )!;
    expect(
      action,
      JSON.stringify(
        source.decisionDebug?.actionAlternatives?.filter(
          (a) => a.actionType === "play_event",
        ),
      ),
    ).toMatchObject({ type: "play_event", source: inside.instanceId });
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      ...(source.selectedChoices
        ? { selectedChoices: source.selectedChoices }
        : {}),
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) throw Error(applied.error.message);
    state = applied.state;
    const choiceInput = buildAiDecisionInput(state, "runner", options);
    expect(choiceInput.playerView.pendingChoice?.source).toMatch(
      /^runner_run_start\.order:/,
    );
    const choice = chooseAiAction(choiceInput);
    expect(choice.actionId).toBe("runner.resolve_choice");
    expect(choice.fallbackUsed).toBe(false);
    expect(choice.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      source.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    );
    const resolved = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: choice.actionId!,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: choice.selectedChoices!,
    });
    expect(resolved.ok).toBe(true);
  });

  it("does not materialize the historical Jack 'n' Joe window in the current Cheap Bag Seed 2 sequence", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-cheap-bag-batch-01-game-02",
      corpDeckId: "standard_corp_cheap_bag_tricks",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.stateVersion === 153 &&
        snapshot.input.legalActions.some(
          (action) =>
            action.type === "play_event" &&
            snapshot.input.playerView.own.gripOrHq.some(
              (card) =>
                card.instanceId === action.source &&
                card.definitionId === "onr_v1_095_jack-n-joe",
            ),
        ),
    });

    assertRegularReplay(summary);
    expect(captures).toEqual([]);
  }, 90_000);

  it("keeps consecutive Fast Advance Seed 9 run-start ordering bound to its exact remote-contest route", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-09",
      corpDeckId: "standard_corp_universal_fast_advance",
      captures,
      capturePredicate: () => true,
    });

    assertRegularReplay(summary);
    const choiceCapture = captures.find((entry) =>
      entry.input.playerView.pendingChoice?.source.startsWith(
        "runner_run_start.order:",
      ),
    );
    const sourceCapture = captures.find(
      (entry) =>
        entry.input.playerView.stateVersion ===
        choiceCapture!.state.stateVersion - 1,
    );
    expect(sourceCapture).toBeDefined();
    expect(choiceCapture).toBeDefined();
    assertSemanticObjectSideSafe(sourceCapture?.input, "runStartSourceInput");
    assertSemanticObjectSideSafe(choiceCapture?.input, "runStartChoiceInput");

    const source = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === sourceCapture!.state.stateVersion,
    );
    const choice = summary.actionSequence.find(
      (entry) => entry.stateVersionBefore === choiceCapture!.state.stateVersion,
    );
    const sourceExecutor = source?.evidence.find((entry) =>
      entry.startsWith("plan_first_executor:"),
    );
    const sourceRoot = source?.evidence.find((entry) =>
      entry.startsWith("plan_first_root:"),
    );

    expect(source).toMatchObject({
      side: "runner",
      selectedActionId: "runner.start_run.remote_1",
      actionType: "start_run",
      planKind: "runner.contest_remote",
      fallbackUsed: false,
    });
    expect(source?.evidence).toContain(
      "plan_step_id:plan:runner.contest_remote:remote%3Aremote_1:contest",
    );
    expect(choiceCapture?.input.playerView.pendingChoice).toMatchObject({
      choiceId: `runner_run_start_order_${choiceCapture!.state.stateVersion}`,
      side: "runner",
      source: `runner_run_start.order:run_${choiceCapture!.state.stateVersion}`,
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      stateVersion: choiceCapture!.state.stateVersion,
      visibility: "hidden_info_barrier",
    });
    expect(
      choiceCapture?.input.playerView.pendingChoice?.options.map(
        (option) => option.value,
      ),
    ).toEqual(
      expect.arrayContaining([
        "card_implementation:runner_onr_v1_184_top-runners-conference_1",
        "card_implementation:runner_onr_v1_184_top-runners-conference_3",
      ]),
    );
    expect(choice).toMatchObject({
      side: "runner",
      selectedActionId: "runner.resolve_choice",
      actionType: "resolve_choice",
      planKind: "runner.contest_remote",
      fallbackUsed: false,
    });
    expect(sourceExecutor).toBeDefined();
    expect(sourceRoot).toBeDefined();
    expect(choice?.evidence).toContain(sourceExecutor);
    expect(choice?.evidence).toContain(sourceRoot);
    expect(choice?.evidence).toContain(
      "plan_scheduler:window:plan_bound_runner_run_start_order_choice:none",
    );
  }, 90_000);

  it("replays the frozen singleton-variant Seed 1 deterministically without a run-start order window", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const first = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
      runnerCards: singletonKeyCardRegressionCards(),
      runnerDeckHash: "standard-deck:a71c0dcc",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "runner_start.order:",
        ) === true,
    });
    const second = simulateStandardGame({
      seed: "last-call-panel-fast-advance-batch-01-game-01",
      corpDeckId: "standard_corp_universal_fast_advance",
      runnerCards: singletonKeyCardRegressionCards(),
      runnerDeckHash: "standard-deck:a71c0dcc",
    });

    assertRegularReplay(first);
    assertRegularReplay(second);
    expect(first.finalStateHash).toBe(second.finalStateHash);
    expect(first.actionSequence).toEqual(second.actionSequence);

    const capture = captures.find((entry) =>
      entry.input.playerView.pendingChoice?.source.startsWith(
        "runner_start.order:",
      ),
    );
    expect(capture).toBeUndefined();
  }, 90_000);

  it("does not materialize the historical Siren Seed 6 Archives-to-HQ window", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateStandardGame({
      seed: "last-call-panel-siren-batch-01-game-06",
      corpDeckId: "standard_corp_siren_fortress",
      captures,
      capturePredicate: (snapshot) =>
        snapshot.input.legalActions.some(
          (action) =>
            action.type === "play_operation" &&
            String(action.source).includes("onr_v1_296_off-site-backups"),
        ) ||
        snapshot.input.playerView.pendingChoice?.source.startsWith(
          "v1922.corp_archives_to_hq:",
        ) === true,
    });

    if (!summary) throw new Error("Missing Siren simulation summary");
    assertRegularReplay(summary);
    const actionSequence = summary.actionSequence ?? [];
    expect(captures.length).toBeGreaterThan(0);
    expect(
      captures.some((capture) =>
        capture.input.legalActions.some(
          (action) =>
            action.type === "play_operation" &&
            String(action.source).includes("onr_v1_296_off-site-backups"),
        ),
      ),
    ).toBe(true);
    expect(
      captures.find((capture) =>
        actionSequence
          .find(
            (entry) => entry.stateVersionBefore === capture.state.stateVersion,
          )
          ?.selectedActionId?.includes("onr_v1_296_off-site-backups"),
      ),
    ).toBeUndefined();
    expect(
      captures.find((capture) =>
        capture.input.playerView.pendingChoice?.source.startsWith(
          "v1922.corp_archives_to_hq:",
        ),
      ),
    ).toBeUndefined();
    captures.forEach((capture, index) =>
      assertSemanticObjectSideSafe(capture.input, `sirenInput${index}`),
    );
  }, 90_000);
});

type StandardDeck = {
  standardDeckId: string;
  version: string;
  name: string;
  side: "runner" | "corp";
  identityCardId: string;
  cards: Array<{ cardId: string; quantity: number }>;
  cardPoolSnapshotId: string;
  cardPoolVersion: string;
  formatProfileId: string;
  formatProfileVersion: string;
  deckHash?: string;
};

function simulateStandardGame(params: {
  seed: string;
  corpDeckId: string;
  captures?: AiSimulationDecisionCheckpointCapture[];
  runnerCards?: StandardDeck["cards"];
  runnerDeckHash?: string;
  capturePredicate?: (
    snapshot: AiSimulationDecisionCheckpointCapture,
  ) => boolean;
  onCapture?: (snapshot: AiSimulationDecisionCheckpointCapture) => void;
}) {
  const runner = standardDeck(RUNNER_DECK_ID);
  const runnerForSimulation =
    params.runnerCards === undefined
      ? runner
      : { ...runner, cards: params.runnerCards };
  const corp = standardDeck(params.corpDeckId);
  return simulateAiGame({
    seed: params.seed,
    maxActions: 480,
    runnerDeck: deckDefinition(runnerForSimulation),
    corpDeck: deckDefinition(corp),
    runnerDeckMetadata: deckMetadata(
      runnerForSimulation,
      params.runnerDeckHash ?? RUNNER_DECK_HASH,
    ),
    corpDeckMetadata: deckMetadata(
      corp,
      corp.deckHash ?? `standard-deck:${corp.standardDeckId}`,
    ),
    runnerControllerMode: "current_candidate",
    corpControllerMode: "current_candidate",
    runnerDifficulty: "hard",
    corpDifficulty: "hard",
    ...(params.captures && params.capturePredicate
      ? {
          testOnlyDecisionCheckpointCapture: {
            actionIndices: Array.from({ length: 480 }, (_, index) => index),
            capture: (snapshot: AiSimulationDecisionCheckpointCapture) => {
              params.onCapture?.(snapshot);
              if (params.capturePredicate!(snapshot))
                params.captures!.push(snapshot);
            },
          },
        }
      : {}),
  });
}

function singletonKeyCardRegressionCards(): StandardDeck["cards"] {
  const quantities = new Map([
    ["onr_v1_076_all-nighter", 2],
    ["onr_v1_086_forged-activation-orders", 2],
    ["onr_v1_123_bodyweight-data-creche", 1],
    ["onr_v1_179_silicon-saloon-franchise", 1],
  ]);
  return standardDeck(RUNNER_DECK_ID).cards.map((card) => ({
    ...card,
    quantity: quantities.get(card.cardId) ?? card.quantity,
  }));
}

function standardDeck(standardDeckId: string): StandardDeck {
  const deck = (standardDeckCatalog as { decks: StandardDeck[] }).decks.find(
    (candidate) => candidate.standardDeckId === standardDeckId,
  );
  if (!deck) throw new Error(`Missing standard deck ${standardDeckId}.`);
  return deck;
}

function deckDefinition(deck: StandardDeck): DeckDefinition {
  return {
    id: `${deck.standardDeckId}_${deck.version}`,
    name: deck.name,
    side: deck.side,
    identity: deck.identityCardId,
    cards: deck.cards.map((card) => ({
      id: card.cardId,
      quantity: card.quantity,
    })),
  };
}

function deckMetadata(deck: StandardDeck, deckHash: string) {
  return {
    side: deck.side,
    identityCardId: deck.identityCardId,
    deckName: deck.name,
    cardPoolSnapshotId: deck.cardPoolSnapshotId,
    cardPoolVersion: deck.cardPoolVersion,
    formatProfileId: deck.formatProfileId,
    formatProfileVersion: deck.formatProfileVersion,
    deckHash,
  };
}

function assertRegularReplay(summary: ReturnType<typeof simulateAiGame>): void {
  expect(summary.terminationKind).toBe("game_result");
  expect(summary.errors).toEqual([]);
  expect(summary.runtimeFailures).toEqual([]);
  expect(summary.metrics.illegalActions).toBe(0);
  expect(summary.replayOk).toBe(true);
  expect(summary.replayErrors).toEqual([]);
}
