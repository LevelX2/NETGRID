import { buildAiDecisionInput, chooseCorpAction } from "@netgrid/ai";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netgrid/engine";
import type { EngineResult, GameState, PlayerAction } from "@netgrid/shared";
import { pathToFileURL } from "node:url";
import { resolveDeckSetup } from "./deck-setup";
import { startNetgridServer } from "./http-server";

export * from "./http-server";
export * from "./account-session";
export * from "./connection-audit";
export * from "./internet-hardening";
export * from "./moderation-rbac";
export * from "./multiplayer";
export * from "./storage-sqlite";

export type LocalDemoMatch = {
  state: GameState;
  runnerView: ReturnType<typeof getPlayerView>;
  corpView: ReturnType<typeof getPlayerView>;
};

const LOCAL_DEMO_DECK_SETUP = resolveDeckSetup();

export function createLocalDemoMatch(seed = "local-demo"): LocalDemoMatch {
  const state = createGame({
    seed,
    matchId: "local-demo-match",
    runnerDeck: LOCAL_DEMO_DECK_SETUP.runnerDeck,
    corpDeck: LOCAL_DEMO_DECK_SETUP.corpDeck,
    runnerDeckMetadata: LOCAL_DEMO_DECK_SETUP.runnerSnapshot.publicMetadata,
    corpDeckMetadata: LOCAL_DEMO_DECK_SETUP.corpSnapshot.publicMetadata
  });
  return views(state);
}

export function submitLocalAction(state: GameState, action: PlayerAction): EngineResult {
  return applyAction(state, action);
}

export function runCorpAiStep(state: GameState): EngineResult | null {
  const legalActions = getLegalActions(state, "corp");
  if (legalActions.length === 0) return null;
  const decision = chooseCorpAction(buildAiDecisionInput(state, "corp", {
    difficulty: "easy",
    eventTail: state.eventLog.map((event) => event),
    ownDeckSnapshot: LOCAL_DEMO_DECK_SETUP.corpSnapshot,
    expectedDeckSnapshot: {
      deckSnapshotId: LOCAL_DEMO_DECK_SETUP.corpSnapshot.deckSnapshotId,
      cardPoolSnapshotId: state.deckMetadata?.corp.cardPoolSnapshotId ?? LOCAL_DEMO_DECK_SETUP.corpSnapshot.cardPoolSnapshotId,
      formatProfileId: state.deckMetadata?.corp.formatProfileId ?? LOCAL_DEMO_DECK_SETUP.corpSnapshot.formatProfileId,
      deckHash: state.deckMetadata?.corp.deckHash ?? LOCAL_DEMO_DECK_SETUP.corpSnapshot.deckHash
    }
  }));
  if (!decision.actionId) return null;
  return applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: decision.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `ai-${state.stateVersion}`
  });
}

function views(state: GameState): LocalDemoMatch {
  return {
    state,
    runnerView: getPlayerView(state, "runner"),
    corpView: getPlayerView(state, "corp")
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const started = await startNetgridServer();
  console.log(`NETGRID multiplayer server listening on ${started.url}`);
  if (started.bindUrl !== started.url) console.log(`NETGRID bind address ${started.bindUrl}`);
}
