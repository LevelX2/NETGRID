import type { GameState } from "@netgrid/shared";

/** The install/rez reserve is included in the displayed Corp pool, not extra money. */
export function corpGeneralCreditAvailability(state: GameState): number {
  const total = state.corp.credits;
  const pool = state.corpTemporaryInstallRezCredits;
  const reserved = pool === undefined ? 0 : pool.remaining;
  if (
    !Number.isSafeInteger(total) ||
    total < 0 ||
    !Number.isSafeInteger(reserved) ||
    reserved < 0 ||
    reserved > total ||
    (pool !== undefined &&
      (pool.usableFor !== "corp_install_or_rez" ||
        pool.returnUnusedAtTurnEnd !== true))
  ) {
    throw new Error("Der Corp-Installations-/Rez-Creditpool ist ungültig.");
  }
  return total - reserved;
}
