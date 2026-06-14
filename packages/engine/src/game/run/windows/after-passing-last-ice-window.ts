import type { CorpServer, GameState } from "@netgrid/shared";
import type { ActiveRun, RunWindowTimingContext } from "./run-window-host";

export type AfterPassingLastIceWindowContext = RunWindowTimingContext & {
  passedIceId: string;
};

export function afterPassingLastIceWindowContext(
  state: GameState,
): AfterPassingLastIceWindowContext | undefined {
  const run = state.run;
  if (
    state.timingPoint !== "run.jack_out_window" ||
    !run ||
    run.position.kind !== "server" ||
    !run.lastPassedIceId
  )
    return undefined;
  const passedIceId = run.lastPassedIceId;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === run.position.serverId,
  );
  if (!server || !server.ice.includes(passedIceId)) return undefined;
  return {
    run,
    server,
    passedIceId,
  };
}

export function isAfterPassingLastIceWindowOpen(state: GameState): boolean {
  return afterPassingLastIceWindowContext(state) !== undefined;
}

export function stateIsAtServerAfterPassingLastIceWindow(
  state: GameState,
  server: CorpServer,
): boolean {
  return afterPassingLastIceWindowContext(state)?.server.id === server.id;
}

export function runIsAtServerAfterPassingLastIce(
  run: ActiveRun,
  server: CorpServer,
): boolean {
  const passedIceId = run.lastPassedIceId;
  return (
    run.position.kind === "server" &&
    run.position.serverId === server.id &&
    run.attackedServerId === server.id &&
    typeof passedIceId === "string" &&
    server.ice.includes(passedIceId)
  );
}
