import { NextResponse } from "next/server";
import { buildAiDecisionInput, chooseCorpAction, isAiDeckSnapshotRuntimeError } from "@netgrid/ai";
import { buildEngineDeck, type DeckSnapshot } from "@netgrid/decks";
import { applyAction, createGame, getLegalActions, getPlayerView } from "@netgrid/engine";
import type { GameState } from "@netgrid/shared";
import snapshotsData08 from "../../../../../data/decks/deck-snapshots-0.8.json";

const WEB_LOCAL_RUNNER_SNAPSHOT = snapshotById("demo_runner_008_snapshot_v0_8");
const WEB_LOCAL_CORP_SNAPSHOT = snapshotById("demo_corp_008_snapshot_v0_8");

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
    let decision: ReturnType<typeof chooseCorpAction>;
    try {
      decision = chooseCorpAction(buildAiDecisionInput(gameState, "corp", {
        difficulty: "easy",
        ownDeckSnapshot: WEB_LOCAL_CORP_SNAPSHOT,
        expectedDeckSnapshot: {
          deckSnapshotId: WEB_LOCAL_CORP_SNAPSHOT.deckSnapshotId,
          cardPoolSnapshotId: gameState.deckMetadata?.corp.cardPoolSnapshotId ?? WEB_LOCAL_CORP_SNAPSHOT.cardPoolSnapshotId,
          formatProfileId: gameState.deckMetadata?.corp.formatProfileId ?? WEB_LOCAL_CORP_SNAPSHOT.formatProfileId,
          deckHash: gameState.deckMetadata?.corp.deckHash ?? WEB_LOCAL_CORP_SNAPSHOT.deckHash
        }
      }));
    } catch (error) {
      if (isAiDeckSnapshotRuntimeError(error)) {
        return NextResponse.json({ ...toClientPayload(gameState), error: error.code }, { status: 500 });
      }
      throw error;
    }
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
  let state = createGame({
    seed,
    matchId: "web-local-demo",
    runnerDeck: buildEngineDeck(WEB_LOCAL_RUNNER_SNAPSHOT),
    corpDeck: buildEngineDeck(WEB_LOCAL_CORP_SNAPSHOT),
    runnerDeckMetadata: WEB_LOCAL_RUNNER_SNAPSHOT.publicMetadata,
    corpDeckMetadata: WEB_LOCAL_CORP_SNAPSHOT.publicMetadata
  });
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

function snapshotById(snapshotId: string): DeckSnapshot {
  const snapshot = (snapshotsData08.snapshots as DeckSnapshot[]).find(
    (candidate) => candidate.deckSnapshotId === snapshotId,
  );
  if (!snapshot) throw new Error(`Missing deck snapshot ${snapshotId}`);
  return snapshot;
}

function toClientPayload(state: GameState) {
  return {
    view: getPlayerView(state, "runner"),
    canRunCorp: state.activeSide === "corp" && !state.winner
  };
}
