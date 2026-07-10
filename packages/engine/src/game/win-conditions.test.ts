import { CARD_DEFINITIONS_BY_ID, type CardInstanceId, type GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { createGame } from "./create-game";
import {
  BAD_PUBLICITY_LOSS_THRESHOLD,
  checkWinConditions,
} from "./win-conditions";

describe("win conditions", () => {
  it("leaves the game unchanged when no winner condition is met", () => {
    const state = createGame({
      seed: "arch-62-win-none",
      setupMode: "completed",
    });
    const before = JSON.stringify(state);

    expect(checkWinConditions(state)).toBeNull();
    expect(JSON.stringify(state)).toBe(before);
  });

  it("keeps Corp agenda win semantics stable", () => {
    const state = createGame({
      seed: "arch-62-win-corp-agenda",
      setupMode: "completed",
    });
    scoreAgendaFor(state, "corp", firstAgendaId(state));

    expect(checkWinConditions(state)).toBe("corp");
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("agenda_points");
    expect(state.phase).toBe("game_over");
    expect(state.timingPoint).toBe("game.checkpoint");
  });

  it("keeps Runner agenda win semantics stable", () => {
    const state = createGame({
      seed: "arch-62-win-runner-agenda",
      setupMode: "completed",
    });
    scoreAgendaFor(state, "runner", firstAgendaId(state));

    expect(checkWinConditions(state)).toBe("runner");
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("agenda_points");
    expect(state.phase).toBe("game_over");
  });

  it("keeps pre-existing flatline winner semantics stable", () => {
    const state = createGame({
      seed: "arch-62-win-flatline",
      setupMode: "completed",
    });
    state.winner = "corp";
    state.gameEndReason = "flatline";

    expect(checkWinConditions(state)).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
    expect(state.phase).toBe("game_over");
    expect(state.timingPoint).toBe("game.checkpoint");
  });

  it("keeps bad-publicity loss threshold precedence stable", () => {
    const state = createGame({
      seed: "arch-62-win-bad-publicity",
      setupMode: "completed",
    });
    state.corp.badPublicity = BAD_PUBLICITY_LOSS_THRESHOLD;
    state.pendingChoice = {
      choiceId: "arch_62_bad_publicity_choice",
      side: "corp",
      source: "arch_62.choice",
      kind: "confirm",
      prompt: "Confirm",
      options: [{ id: "ok", label: "OK" }],
      minSelections: 1,
      maxSelections: 1,
      stateVersion: state.stateVersion,
      visibility: "public",
    };
    state.run = {
      runId: "arch_62_run",
      attackedServerId: "hq",
      phase: "approach_ice",
      position: { kind: "server", serverId: "hq" },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
    };

    expect(checkWinConditions(state)).toBe("runner");
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(state.phase).toBe("game_over");
    expect(state.pendingChoice).toBeUndefined();
    expect(state.run).toBeUndefined();
  });
});

function firstAgendaId(state: GameState): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(
    ([, instance]) => CARD_DEFINITIONS_BY_ID[instance.definitionId]?.type === "agenda",
  );
  if (!entry) throw new Error("No agenda card found in test state.");
  return entry[0];
}

function scoreAgendaFor(
  state: GameState,
  side: "corp" | "runner",
  cardId: CardInstanceId,
): void {
  state.agendaPointsToWin = 1;
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  if (side === "corp") state.corp.scoreArea.push(cardId);
  else state.runner.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side, zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
}
