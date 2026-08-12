import type { GameState, ServerId } from "@netgrid/shared";

type ActiveRun = NonNullable<GameState["run"]>;

export function successfulRunServerId(
  run: Pick<ActiveRun, "attackedServerId" | "successfulRunServerOverride">,
): Exclude<ServerId, "new_remote"> {
  return run.successfulRunServerOverride ?? run.attackedServerId;
}
