import type { GameState, ServerId } from "@netgrid/shared";
import {
  assertRunnerCanStartRun,
  runnerRunStartLockReason,
  type RunnerRunStartLockReason,
} from "./run-start-lock";
import {
  serverRunStartRestrictions,
  type ServerRunStartRestrictionSource,
} from "./server-run-start-restrictions";

export type RunStartEligibility = {
  allowed: boolean;
  globalLockReason?: RunnerRunStartLockReason;
  serverRestrictions: ReturnType<typeof serverRunStartRestrictions>;
};

export function evaluateRunStartEligibility(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): RunStartEligibility {
  const globalLockReason = runnerRunStartLockReason(state);
  const serverRestrictions = serverRunStartRestrictions(state, serverId);
  return {
    allowed: globalLockReason === undefined && serverRestrictions.length === 0,
    ...(globalLockReason ? { globalLockReason } : {}),
    serverRestrictions,
  };
}

export function assertRunStartEligible(
  state: GameState,
  serverId: Exclude<ServerId, "new_remote">,
): void {
  assertRunnerCanStartRun(state);
  const restriction = serverRunStartRestrictions(state, serverId)[0];
  if (!restriction) return;
  throw new Error(
    `Der Run auf ${serverId} ist durch ${restriction.sourceTitle} gesperrt: Im maßgeblichen Korpzug fehlt die erforderliche Aktivität auf diesem Server.`,
  );
}

export type { ServerRunStartRestrictionSource };
