import type { GameState, PlayerAction } from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  getLegalActions,
  getPlayerView,
  hashGameState,
  replayEvents,
  validateGameState,
} from "../../index";

function originalAccess() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../test-fixtures/meta586/bizarre-unrezzed-g15-d354.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    provenance: { hash: string };
    state: GameState;
    commands: Pick<PlayerAction, "side" | "actionId">[];
  };
}

describe("Bizarre Encryption Scheme activation (SP-745)", () => {
  it.each([false, true])(
    "requires rez for activation and preserves an activated effect after trash (rezzed %s)",
    (rezzed) => {
      const fixture = originalAccess();
      expect(hashGameState(fixture.state)).toBe(fixture.provenance.hash);
      const source = Object.values(fixture.state.cardInstances).find(
        (card) => card.definitionId === "onr_v1_351_bizarre-encryption-scheme",
      )!;
      expect(source.rezzed).toBe(false);
      source.rezzed = rezzed;
      source.faceup = rezzed;
      const initial = structuredClone(fixture.state);
      const replayStart = initial.eventLog.length;
      let state = initial;
      for (const [index, command] of fixture.commands.entries()) {
        expect(
          getLegalActions(state, command.side).some(
            (action) => action.actionId === command.actionId,
          ),
        ).toBe(true);
        const result = applyAction(state, {
          ...command,
          matchId: state.matchId,
          clientKnownStateVersion: state.stateVersion,
        });
        expect(result.ok).toBe(true);
        if (!result.ok) throw new Error(JSON.stringify(result.error));
        state = result.state;
        expect(validateGameState(state).ok).toBe(true);
        if (index === 0) {
          expect(state.run?.runDurationEffects?.length ?? 0).toBe(
            rezzed ? 1 : 0,
          );
        }
        if (index === 1) {
          expect(state.corp.archives).toContain(source.instanceId);
          expect(state.run?.runDurationEffects?.length ?? 0).toBe(
            rezzed ? 1 : 0,
          );
        }
        if (index === 3) {
          if (!rezzed) {
            expect(getPlayerView(state, "runner").own.agendaPoints).toBe(8);
            expect(state.winner).toBe("runner");
            expect(state.delayedAccessEffects?.length ?? 0).toBe(0);
            break;
          }
          expect(getPlayerView(state, "runner").own.agendaPoints).toBe(6);
          expect(state.winner).toBeNull();
          expect(state.delayedAccessEffects).toHaveLength(1);
        }
      }
      expect(state.winner).toBe("runner");
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashGameState(replay.state)).toBe(hashGameState(state));
    },
  );
});
