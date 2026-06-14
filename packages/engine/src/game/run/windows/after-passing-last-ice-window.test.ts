import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  afterPassingLastIceWindowContext,
  isAfterPassingLastIceWindowOpen,
  runIsAtServerAfterPassingLastIce,
  stateIsAtServerAfterPassingLastIceWindow,
} from "./after-passing-last-ice-window";

function stateAtServer(
  input: {
    position?: NonNullable<GameState["run"]>["position"];
    lastPassedIceId?: CardInstanceId;
    serverIce?: CardInstanceId[];
    attackedServerId?: "remote_1" | "remote_2";
    timingPoint?: GameState["timingPoint"];
  } = {},
): GameState {
  const attackedServerId = input.attackedServerId ?? "remote_1";
  return {
    matchId: "match_1",
    stateVersion: 1,
    activeSide: "corp",
    phase: "run",
    timingPoint: input.timingPoint ?? "run.jack_out_window",
    corp: {
      clicks: 3,
      credits: 5,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          kind: "remote",
          ice:
            input.serverIce ?? (["ice_outer", "ice_inner"] as CardInstanceId[]),
          root: [],
        },
      ],
    },
    runner: {
      clicks: 4,
      credits: 5,
      grip: [],
      stack: [],
      heap: [],
      scoreArea: [],
      rig: { programs: [], resources: [], hardware: [] },
    },
    cardInstances: {},
    run: {
      runId: "run_1",
      attackedServerId,
      phase: "approach_server",
      position: input.position ?? {
        kind: "server",
        serverId: attackedServerId,
      },
      lastPassedIceId: input.lastPassedIceId ?? ("ice_outer" as CardInstanceId),
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    },
    random: { seed: "seed", counter: 0, history: [] },
  } as unknown as GameState;
}

describe("after passing last ice window", () => {
  it("opens only after a fort ice was passed and runner is at server", () => {
    const state = stateAtServer();

    expect(isAfterPassingLastIceWindowOpen(state)).toBe(true);
    expect(
      stateIsAtServerAfterPassingLastIceWindow(state, state.corp.servers[0]!),
    ).toBe(true);
    expect(afterPassingLastIceWindowContext(state)).toMatchObject({
      passedIceId: "ice_outer",
      server: { id: "remote_1" },
    });
  });

  it("stays closed before server position, on wrong server, or with stale passed ice", () => {
    expect(
      isAfterPassingLastIceWindowOpen(
        stateAtServer({
          position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
        }),
      ),
    ).toBe(false);
    expect(
      isAfterPassingLastIceWindowOpen(
        stateAtServer({ attackedServerId: "remote_2" }),
      ),
    ).toBe(false);
    expect(
      isAfterPassingLastIceWindowOpen(
        stateAtServer({ lastPassedIceId: "ice_unknown" as CardInstanceId }),
      ),
    ).toBe(false);
    expect(
      isAfterPassingLastIceWindowOpen(
        stateAtServer({ timingPoint: "run.approach_ice" }),
      ),
    ).toBe(false);
    expect(
      stateIsAtServerAfterPassingLastIceWindow(
        stateAtServer({ timingPoint: "run.approach_ice" }),
        stateAtServer().corp.servers[0]!,
      ),
    ).toBe(false);
  });

  it("checks explicit run/server contexts without reading global state", () => {
    const state = stateAtServer();
    const run = state.run!;
    const server = state.corp.servers[0]!;

    expect(runIsAtServerAfterPassingLastIce(run, server)).toBe(true);
    expect(
      runIsAtServerAfterPassingLastIce(
        { ...run, lastPassedIceId: "ice_unknown" as CardInstanceId },
        server,
      ),
    ).toBe(false);
  });
});
