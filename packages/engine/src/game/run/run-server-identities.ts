import type { GameState, ServerId } from "@netgrid/shared";

type ActiveRun = NonNullable<GameState["run"]>;

export function successfulRunServerId(
  run: Pick<
    ActiveRun,
    | "attackedServerId"
    | "successfulRunServerOverride"
    | "successfulRunEffectTargetServerId"
  >,
): Exclude<ServerId, "new_remote"> {
  return successfulRunEffectTargetMatches(run)
    ? (run.successfulRunServerOverride ?? run.attackedServerId)
    : run.attackedServerId;
}

export function successfulRunEffectTargetMatches(
  run: Pick<
    ActiveRun,
    "attackedServerId" | "successfulRunEffectTargetServerId"
  >,
): boolean {
  return (
    run.successfulRunEffectTargetServerId === undefined ||
    run.successfulRunEffectTargetServerId === run.attackedServerId
  );
}
