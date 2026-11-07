import { describe, expect, it } from "vitest";
import {
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  MECHANIC_SMOKE_GAMES,
  apply,
  applyChoice,
  keepOnlyCorpHqCards,
  moveCorpCardToHq,
  putCorpCardOnTopOfRd,
  putCorpRootInRemote,
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const TRACE_UPGRADE = "onr_v1_372_turbeau-delacroix";

describe("installed access source zones (SP-781, P637 D10 regression)", () => {
  it.each(["hq", "rd", "remote_1"] as const)(
    "executes the canonical installed trace from the %s root",
    (serverId) => {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.assetNodeEffects(`deep637-root-${serverId}`),
      );
      const id = putCorpRootInRemote(state, TRACE_UPGRADE);
      removeEverywhere(state, id);
      const server = state.corp.servers.find((s) => s.id === serverId)!;
      server.root.push(id);
      state.cardInstances[id] = {
        ...state.cardInstances[id]!,
        zone: { side: "corp", zone: "serverRoot", serverId },
        rezzed: true,
        faceup: true,
      };
      expect(validateGameState(state).ok).toBe(true);
      const initial = structuredClone(state);
      const replayStart = state.eventLog.length;

      state = apply(state, "runner", (a) =>
        a.type === "start_run" && a.payload?.serverId === serverId,
      );
      state = apply(state, "runner", (a) => a.type === "access_card");

      expect(state.trace).toMatchObject({
        traceLimit: 10,
        sourceDefinitionId: TRACE_UPGRADE,
        status: "corp_bid",
      });
      expect(state.pendingChoice?.side).toBe("corp");
      expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
      expect(state.run?.turbeauAccessTraceConsumedByServer?.[serverId]).toEqual([
        id,
      ]);
      state = applyChoice(state, "corp", "bid_0");
      state = applyChoice(state, "runner", "bid_0");
      expect(state.runner.tags).toBe(1);
      expect(state.trace).toBeUndefined();
      expect(validateGameState(state).ok).toBe(true);
      const replay = replayEvents(initial, state.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it.each(["hq", "rd"] as const)(
    "does not activate the installed-only trace from an uninstalled %s card",
    (serverId) => {
      let state = toRunnerTurn(
        MECHANIC_SMOKE_GAMES.assetNodeEffects(`deep637-uninstalled-${serverId}`),
      );
      if (serverId === "hq") {
        const id = moveCorpCardToHq(state, TRACE_UPGRADE);
        keepOnlyCorpHqCards(state, [id]);
      } else {
        putCorpCardOnTopOfRd(state, TRACE_UPGRADE);
      }
      state = apply(state, "runner", (a) =>
        a.type === "start_run" && a.payload?.serverId === serverId,
      );
      state = apply(state, "runner", (a) => a.type === "access_card");
      expect(state.trace).toBeUndefined();
      expect(state.runner.tags).toBe(0);
      expect(state.run?.turbeauAccessTraceConsumedByServer).toBeUndefined();
      expect(validateGameState(state).ok).toBe(true);
    },
  );
});
