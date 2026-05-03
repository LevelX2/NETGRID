import { NextResponse } from "next/server";
import { chooseCorpAction } from "@netrunner/ai";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netrunner/engine";
import type { GameState } from "@netrunner/shared";

let gameState = startGame("mvp-0.1-web-demo");

type GameRequest =
  | { kind: "new"; seed: string }
  | { kind: "runner_action"; actionId: string; stateVersion: number }
  | { kind: "corp_step" };

export async function GET() {
  return NextResponse.json(toClientPayload(gameState));
}

export async function POST(request: Request) {
  const body = (await request.json()) as GameRequest;

  if (body.kind === "new") {
    gameState = startGame(body.seed || "mvp-0.1-web-demo");
    return NextResponse.json(toClientPayload(gameState));
  }

  if (body.kind === "runner_action") {
    const result = applyAction(gameState, {
      matchId: gameState.matchId,
      side: "runner",
      actionId: body.actionId,
      clientKnownStateVersion: body.stateVersion,
      idempotencyKey: `web-runner-${body.stateVersion}-${body.actionId}`
    });
    if (!result.ok) {
      return NextResponse.json({ ...toClientPayload(gameState), error: result.error.message }, { status: 409 });
    }
    gameState = result.state;
    return NextResponse.json(toClientPayload(gameState));
  }

  if (body.kind === "corp_step") {
    const legalActions = getLegalActions(gameState, "corp");
    const decision = chooseCorpAction({
      side: "corp",
      playerView: getPlayerView(gameState, "corp"),
      publicEventLog: gameState.eventLog,
      legalActions,
      difficulty: "easy",
      seed: gameState.seed
    });
    const selected = legalActions.find((action) => action.actionId === decision.actionId);
    if (!selected) return NextResponse.json(toClientPayload(gameState));
    const result = applyAction(gameState, {
      matchId: gameState.matchId,
      side: "corp",
      actionId: selected.actionId,
      clientKnownStateVersion: gameState.stateVersion,
      idempotencyKey: `web-corp-${gameState.stateVersion}-${selected.actionId}`
    });
    if (result.ok) gameState = result.state;
    return NextResponse.json(toClientPayload(gameState));
  }

  return NextResponse.json({ ...toClientPayload(gameState), error: "Unbekannte Aktion." }, { status: 400 });
}

function startGame(seed: string): GameState {
  let state = createGame({ seed, matchId: "web-local-demo" });
  const mandatory = getLegalActions(state, "corp").find((action) => action.type === "mandatory_draw");
  if (!mandatory) return state;
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: mandatory.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "web-start-mandatory-draw"
  });
  if (result.ok) state = result.state;
  return state;
}

function toClientPayload(state: GameState) {
  return {
    view: getPlayerView(state, "runner"),
    canRunCorp: state.activeSide === "corp" && !state.winner
  };
}
