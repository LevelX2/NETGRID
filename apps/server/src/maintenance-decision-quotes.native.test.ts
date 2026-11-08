import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import {
  buildAiDecisionInput,
  chooseAiAction,
  exportAiRuntimeCheckpoint,
  releaseAiMatchRuntime,
  type AiDecisionInputWithDeckCapabilities,
} from "@netgrid/ai";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashState,
  quoteCorpPunishRoute,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type CorpPunishRouteQuoteSet,
} from "@netgrid/shared";
import { decisionCheckpointReplayArtifact } from "./multiplayer";
import type { StorageMaintenanceDecisionAnalysisSource } from "./storage-sqlite";

const fixture = JSON.parse(
  readFileSync(
    new URL(
      "../../../data/scenarios/ai-decision-checkpoints/cp-deep647-corp-punish-deck.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as { ownDeckSnapshot: DeckSnapshot };
let matchId: string | undefined;
afterEach(() => {
  if (matchId) releaseAiMatchRuntime(matchId);
});

function nativeCheckpoint() {
  let state = createGameAfterSetup({
    seed: "native-maintenance-punish-service",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: buildEngineDeck(fixture.ownDeckSnapshot),
  });
  matchId = state.matchId;
  const draw = getLegalActions(state, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const drawn = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "native-draw",
  });
  if (!drawn.ok) throw new Error(drawn.error.message);
  state = drawn.state;
  const damage = Object.values(state.cardInstances).find(
    (c) => c.definitionId === "onr_v1_302_scorched-earth",
  )!;
  for (const zone of [state.corp.hq, state.corp.rd, state.corp.archives]) {
    const i = zone.indexOf(damage.instanceId);
    if (i >= 0) zone.splice(i, 1);
  }
  state.corp.hq.push(damage.instanceId);
  damage.zone = { side: "corp", zone: "hq" };
  while (state.runner.grip.length > 3) {
    const id = state.runner.grip.pop()!;
    state.runner.heap.push(id);
    state.cardInstances[id]!.zone = { side: "runner", zone: "heap" };
  }
  state.runner.tags = 1;
  state.corp.credits = 4;
  state.corp.clicks = 2;
  const input = buildAiDecisionInput(state, "corp", {
    ownDeckSnapshot: fixture.ownDeckSnapshot,
    decisionId: "native-maintenance-service-context",
    actionNumber: state.stateVersion,
  });
  const {
    legalActions: _actions,
    publicEvents: _events,
    ...actorState
  } = input.playerView;
  const stateHash = hashState(state);
  const runtime = exportAiRuntimeCheckpoint(
    input,
    fixture.ownDeckSnapshot.deckSnapshotId,
  );
  const audit = {
    analysisSnapshot: { actorState },
    legalActions: {
      actions: input.legalActions.map((a) => ({ actionId: a.actionId })),
    },
    checkpointCapture: {
      actor: "corp",
      stateVersion: state.stateVersion,
      stateHash,
      runtime,
      inputProjection: {
        actionNumber: input.actionNumber,
        timingPoint: input.playerView.timingPoint,
        deckConsumers: {
          deckCapabilities: input.ownDeckCapabilities,
          deckStrategyProfile: input.ownDeckStrategyProfile,
          deckDoctrineDiagnostic: input.ownDeckDoctrineV2Diagnostic,
        },
      },
    },
  } as NonNullable<Parameters<typeof decisionCheckpointReplayArtifact>[2]>;
  const source = {
    trace: { side: "corp" },
    snapshot: { stateHash },
    checkpointReplayContext: {
      state,
      ownDeckSnapshot: fixture.ownDeckSnapshot,
      difficulty: input.difficulty,
      profileId: input.profileId,
      decisionId: input.decisionId,
      actionNumber: input.actionNumber,
    },
  } as StorageMaintenanceDecisionAnalysisSource;
  return { state, input, source, audit, damage };
}

it("reconstructs the same terminal Punish owner as the real Engine-backed runtime", () => {
  const { state, input, source, audit, damage } = nativeCheckpoint();
  const live = chooseAiAction(input, {
    quoteCorpPunishRoute: (request) => quoteCorpPunishRoute(state, request),
  });
  expect(live.actionId).toContain(damage.instanceId);
  const replay = decisionCheckpointReplayArtifact(state.matchId, source, audit);
  expect(replay.provenance).toBe(
    "reconstructed_from_persisted_decision_sources",
  );
  if (replay.provenance !== "reconstructed_from_persisted_decision_sources")
    throw Error("native binding failed");
  const context = (
    replay as typeof replay & {
      decisionLocalEngineQuotes?: {
        corpPunishRouteQuoteSet?: CorpPunishRouteQuoteSet;
      };
    }
  ).decisionLocalEngineQuotes;
  const reconstructed: AiDecisionInputWithDeckCapabilities = {
    ...replay.input,
    playerView: {
      ...replay.input.playerView,
      ...(context?.corpPunishRouteQuoteSet
        ? { corpPunishRouteQuoteSet: context.corpPunishRouteQuoteSet }
        : {}),
    },
  };
  releaseAiMatchRuntime(state.matchId);
  const selected = chooseAiAction(reconstructed);
  expect(selected.actionId).toBe(live.actionId);
  expect(selected.fallbackUsed).toBe(false);
  expect(selected.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId:
      "plan:corp.punish_campaign:corp-punish%3Aengine-certified-payoff",
    route: { actionId: live.actionId, stateVersion: state.stateVersion },
  });
});

it("keeps native state and persisted actor input intact and exports no private GameState", () => {
  const { state, source, audit } = nativeCheckpoint();
  const before = hashState(state),
    actorBefore = JSON.stringify(audit.analysisSnapshot.actorState);
  const one = decisionCheckpointReplayArtifact(state.matchId, source, audit);
  const two = decisionCheckpointReplayArtifact(state.matchId, source, audit);
  expect(one).toEqual(two);
  expect(hashState(state)).toBe(before);
  expect(JSON.stringify(audit.analysisSnapshot.actorState)).toBe(actorBefore);
  expect(JSON.stringify(one)).not.toMatch(
    /cardInstances|privatePayload|testOnlyGameState|sessionToken/,
  );
  for (const id of state.runner.grip)
    expect(JSON.stringify(one)).not.toContain(id);
  if (one.provenance !== "reconstructed_from_persisted_decision_sources")
    throw Error("native binding failed");
  expect(Object.values(one.validation)).toEqual(Array(9).fill(true));
});
