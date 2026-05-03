import { chooseCorpAction } from "@netrunner/ai";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netrunner/engine";
import type { EngineResult, GameState, PlayerAction } from "@netrunner/shared";
import { pathToFileURL } from "node:url";
import { startNetrunnerServer } from "./http-server";

export * from "./http-server";
export * from "./multiplayer";

export type LocalDemoMatch = {
  state: GameState;
  runnerView: ReturnType<typeof getPlayerView>;
  corpView: ReturnType<typeof getPlayerView>;
};

export function createLocalDemoMatch(seed = "local-demo"): LocalDemoMatch {
  const state = createGame({ seed, matchId: "local-demo-match" });
  return views(state);
}

export function submitLocalAction(state: GameState, action: PlayerAction): EngineResult {
  return applyAction(state, action);
}

export function runCorpAiStep(state: GameState): EngineResult | null {
  const legalActions = getLegalActions(state, "corp");
  if (legalActions.length === 0) return null;
  const decision = chooseCorpAction({
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    publicEventLog: state.eventLog,
    legalActions,
    difficulty: "easy",
    seed: state.seed
  });
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
  const started = await startNetrunnerServer();
  console.log(`Netrunner multiplayer server listening on ${started.url}`);
}
